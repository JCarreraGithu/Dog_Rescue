const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const url = process.env.STAFF_TEST_DATABASE_URL;
if (url) { const u = new URL(url); if (u.hostname !== '127.0.0.1' || u.port !== '55439' || u.pathname !== '/staff_auth_test') throw Error('Unsafe test database'); }

test('remaining administrative modules use only PostgreSQL', { skip: !url }, async t => {
  const db = new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] });
  let fault;
  function instrument(target) {
    return new Proxy(target, { get(client, key) {
      if (key === '$transaction') return (fn, ...args) => client.$transaction(tx => fn(instrument(tx)), ...args);
      const value = client[key];
      if (['storeProduct', 'dog', 'medicalRecord', 'aboutSettings', 'inventoryItem', 'transparencyStat', 'notification'].includes(key)) return new Proxy(value, { get(delegate, method) { return (...args) => { if (fault === `${key}.${method}`) throw Error('Simulated database outage'); return delegate[method](...args); }; } });
      return typeof value === 'function' ? value.bind(client) : value;
    } });
  }
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (name === '@/lib/db') return { prisma: instrument(db) };
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
      return require(name);
    }, module, module.exports);
    return module.exports;
  }
  process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
  const auth = load('src/lib/auth.ts');
  const salt = crypto.randomBytes(16);
  const passwordHash = ['scrypt', salt.toString('hex'), crypto.scryptSync(crypto.randomBytes(32), salt, 64).toString('hex')].join('$');
  const user = { id: 'persistence-staff', name: 'Synthetic', email: 'persistence@example.invalid', passwordHash, role: 'superadmin', active: true, mustChangePassword: false, sessionVersion: 1, createdAt: new Date() };
  await db.staffUser.upsert({ where: { id: user.id }, create: user, update: user });
  const cookie = `${auth.SESSION_COOKIE}=${await auth.createSessionToken(user.id, 1)}`;
  const request = (route, method = 'GET', payload, authenticated = true) => new NextRequest('https://example.invalid/api/' + route, { method, headers: { ...(authenticated ? { cookie } : {}), 'content-type': 'application/json' }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
  const context = id => ({ params: Promise.resolve({ id }) });
  const products = load('src/app/api/products/route.ts'), productApi = load('src/app/api/products/[id]/route.ts');
  const dogs = load('src/app/api/dogs/route.ts'), dogApi = load('src/app/api/dogs/[id]/route.ts');
  const docs = load('src/app/api/dogs/[id]/documentation/route.ts'), medical = load('src/app/api/dogs/[id]/medical/route.ts'), medicalApi = load('src/app/api/medical-records/[id]/route.ts');
  const about = load('src/app/api/about-settings/route.ts'), stats = load('src/app/api/transparency/route.ts'), inventory = load('src/app/api/inventory/route.ts');
  let product, dog, record, item;
  try {
    await t.test('products create, edit, concurrent stock, delete and reload without resurrection', async () => {
      const created = await products.POST(request('products', 'POST', { name: 'Synthetic product', price: 25, stock: 10, category: 'Accesorios', variants: ['A'], image: 'https://example.invalid/product.png' }));
      assert.equal(created.status, 201); product = await created.json();
      const deltas = await Promise.all(Array.from({ length: 6 }, () => productApi.PUT(request('products/' + product.id, 'PUT', { stockChange: 1 }), context(product.id))));
      assert.ok(deltas.every(r => r.status === 200));
      assert.equal((await db.storeProduct.findUnique({ where: { id: product.id } })).stock, 16);
      assert.equal((await productApi.PUT(request('products/x', 'PUT', { price: 35, category: 'Playeras', variantLabel: 'Talla', variants: ['S', 'M'] }), context(product.id))).status, 200);
      assert.equal((await productApi.PUT(request('products/x', 'PUT', { price: -1 }), context(product.id))).status, 400);
      assert.equal((await productApi.DELETE(request('products/x', 'DELETE'), context(product.id))).status, 200);
      assert.ok(!(await (await products.GET()).json()).some(p => p.id === product.id));
      assert.equal((await productApi.PUT(request('products/x', 'PUT', { name: 'Resurrect' }), context(product.id))).status, 404);
      assert.equal((await db.storeProduct.findUnique({ where: { id: product.id } })).isDeleted, true);
    });
    await t.test('dog and medical records CRUD use existing tables and preserve relationships', async () => {
      const response = await dogs.POST(request('dogs', 'POST', { name: 'Synthetic dog', photoUrl: 'https://example.invalid/dog.png', ageYears: 0 }));
      assert.equal(response.status, 201); dog = await response.json();
      assert.equal(dog.ageYears, 0);
      assert.equal((await dogApi.PUT(request('dogs/x', 'PUT', { name: 'Edited synthetic dog' }), context(dog.id))).status, 200);
      const appointment = await medical.POST(request('dogs/x/medical', 'POST', { title: 'Check', date: '2026-11-04', nextDueDate: '2026-12-04' }), context(dog.id));
      assert.equal(appointment.status, 201); record = await appointment.json();
      assert.equal((await medicalApi.PATCH(request('medical-records/x', 'PATCH', { status: 'Completado', nextDueDate: null }), context(record.id))).status, 200);
      assert.equal((await medicalApi.PATCH(request('medical-records/x', 'PATCH', { date: 'not a date' }), context(record.id))).status, 400);
      const current = await (await dogApi.GET(request('dogs/x'), context(dog.id))).json();
      assert.equal(current.medicalRecords[0].id, record.id);
      const anonymous = await (await dogApi.GET(request('dogs/x', 'GET', undefined, false), context(dog.id))).json();
      assert.equal(anonymous.documentation, undefined); assert.equal(anonymous.applications, undefined); assert.deepEqual(anonymous.medicalRecords, []);
    });
    await t.test('documentation, status and notifications commit together and rollback together', async () => {
      const before = await db.notification.count();
      const doc = (await (await docs.GET(request('dogs/x/documentation'), context(dog.id))).json()).documentation;
      doc.adoption.adopterName = 'Synthetic adopter'; doc.rehabilitation.rehabCompleted = true;
      assert.equal((await docs.PUT(request('dogs/x/documentation', 'PUT', { documentation: doc }), context(dog.id))).status, 200);
      assert.equal((await db.dog.findUnique({ where: { id: dog.id } })).documentation.adoption.adopterName, 'Synthetic adopter');
      assert.equal(await db.notification.count(), before + 1);
      fault = 'notification.create'; doc.adoption.adopterName = 'Must roll back';
      try { assert.equal((await docs.PUT(request('dogs/x/documentation', 'PUT', { documentation: doc }), context(dog.id))).status, 503); } finally { fault = undefined; }
      assert.equal((await db.dog.findUnique({ where: { id: dog.id } })).documentation.adoption.adopterName, 'Synthetic adopter');
      assert.equal((await docs.PUT(request('dogs/x/documentation', 'PUT', { documentation: { arrival: { intakeCompleted: 'true' } } }), context(dog.id))).status, 400);
    });
    await t.test('trash, restore and permanent removal never discard history or revive defaults', async () => {
      assert.equal((await dogApi.DELETE(request('dogs/x', 'DELETE'), context(dog.id))).status, 200);
      assert.ok(!(await (await dogs.GET(request('dogs', 'GET', undefined, false))).json()).some(row => row.id === dog.id));
      assert.equal((await dogApi.GET(request('dogs/x', 'GET', undefined, false), context(dog.id))).status, 404);
      assert.equal((await dogApi.PUT(request('dogs/x', 'PUT', { action: 'restore' }), context(dog.id))).status, 200);
      assert.equal((await dogApi.DELETE(request('dogs/x?permanent=true', 'DELETE'), context(dog.id))).status, 200);
      assert.ok(!(await (await dogs.GET(request('dogs?deletedOnly=true'))).json()).some(row => row.id === dog.id));
      assert.equal(await db.medicalRecord.count({ where: { dogId: dog.id } }), 1);
      assert.equal((await db.dog.findUnique({ where: { id: dog.id } })).documentation.adoption.adopterName, 'Synthetic adopter');
      assert.equal((await dogApi.PUT(request('dogs/x', 'PUT', { action: 'restore' }), context(dog.id))).status, 404);
    });
    await t.test('inventory increments serialize and invalid or missing rows fail explicitly', async () => {
      const response = await inventory.POST(request('inventory', 'POST', { name: 'Synthetic supply', quantity: 10 }));
      assert.equal(response.status, 201); item = await response.json();
      const results = await Promise.all(Array.from({ length: 8 }, () => inventory.PUT(request('inventory', 'PUT', { id: item.id, quantityChange: 1 }))));
      assert.ok(results.every(r => r.status === 200));
      assert.equal((await db.inventoryItem.findUnique({ where: { id: item.id } })).quantity, 18);
      assert.equal((await inventory.PUT(request('inventory', 'PUT', { id: item.id, setQuantity: -1 }))).status, 400);
      assert.equal((await inventory.DELETE(request('inventory', 'DELETE', { id: item.id }))).status, 200);
      assert.equal((await inventory.DELETE(request('inventory', 'DELETE', { id: item.id }))).status, 404);
    });
    await t.test('About settings and impact figures persist partial concurrent updates', async () => {
      assert.equal((await about.PUT(request('about-settings', 'PUT', { heroCaptionTitle: 'Synthetic caption' }))).status, 200);
      assert.equal((await about.GET()).headers.get('cache-control'), 'no-store');
      assert.equal((await (await about.GET()).json()).heroCaptionTitle, 'Synthetic caption');
      assert.ok((await Promise.all([about.PUT(request('about-settings', 'PUT', { heroBadgeText: 'Badge' })), about.PUT(request('about-settings', 'PUT', { heroCaptionSubtitle: 'Subtitle' }))])).every(r => r.status === 200));
      const current = await (await about.GET()).json(); assert.equal(current.heroBadgeText, 'Badge'); assert.equal(current.heroCaptionSubtitle, 'Subtitle');
      assert.equal((await stats.PUT(request('transparency', 'PUT', { rescues_count: 600, adoptions_count: 300 }))).status, 200);
      assert.equal((await stats.PUT(request('transparency', 'PUT', { key: 'rescues_count', value: 'x' }))).status, 400);
      assert.equal((await db.transparencyStat.findUnique({ where: { key: 'rescues_count' } })).value, 600);
    });
    await t.test('About carousel and exactly three founders preserve legacy settings, ordering and deletions', async () => {
      const before = await (await about.GET()).json();
      assert.equal(before.carousel[0].url, before.heroImage);
      const first = { id: 'test-first', url: 'https://example.invalid/first.jpg', title: 'First', subtitle: 'Caption', badge: '' };
      const second = { ...first, id: 'test-second', title: 'Second', url: 'https://example.invalid/second.jpg' };
      assert.equal((await about.PUT(request('about-settings', 'PUT', { carousel: [first, second] }))).status, 200);
      assert.equal((await about.PUT(request('about-settings', 'PUT', { carousel: [{ ...second, title: 'Edited' }, first] }))).status, 200);
      let result = await (await about.GET()).json(); assert.deepEqual(result.carousel.map(s => s.id), [second.id, first.id]); assert.equal(result.carousel[0].title, 'Edited');
      assert.equal((await about.PUT(request('about-settings', 'PUT', { carousel: [first] }))).status, 200);
      const family = ['Odra test', 'Hijo uno test', 'Hijo dos test'].map(name => ({ name, image: first.url }));
      assert.equal((await about.PUT(request('about-settings', 'PUT', { family }))).status, 200);
      result = await (await about.GET()).json(); assert.deepEqual(result.family, family); assert.equal(result.heroImage, before.heroImage); assert.equal(result.carousel.length, 1);
      for (const invalid of [{ family: [] }, { family: [...family, family[0]] }, { carousel: [first, first] }, { carousel: [{ ...first, url: '/uploads/nonexistent.jpg' }] }, { carousel: [{ ...first, url: 'javascript:alert(1)' }] }]) assert.equal((await about.PUT(request('about-settings', 'PUT', invalid))).status, 400);
      assert.equal((await about.PUT(request('about-settings', 'PUT', { carousel: [] }))).status, 200);
      assert.deepEqual((await (await about.GET()).json()).carousel, []);
      const fresh = new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] });
      try { const row = await fresh.aboutSettings.findUnique({ where: { id: 'about' } }); assert.deepEqual(row.carousel, []); assert.deepEqual(row.family, family); } finally { await fresh.$disconnect(); }
    });
    await t.test('legacy import preserves documents, medical IDs and photos, is idempotent and refuses conflicts', async () => {
      const { importLegacyDogs, validateLegacyDogs } = await import('../scripts/import-admin-content.mjs');
      const directory = fs.mkdtempSync(path.join(path.resolve('.private-tools'), 'legacy-assets-'));
      fs.mkdirSync(path.join(directory, 'uploads'));
      fs.writeFileSync(path.join(directory, 'uploads', 'synthetic.png'), Buffer.from([137,80,78,71,13,10,26,10,0,0]));
      try {
        const stored = await db.dog.findUnique({ where: { id: dog.id } });
        const source = { ...dog, id: 'legacy-import-synthetic', name: 'Legacy synthetic', photoUrl: '/uploads/synthetic.png', isDeleted: false, deletedAt: null, documentation: stored.documentation, medicalRecords: [{ ...record, id: 'legacy-medical-synthetic', dogId: 'legacy-import-synthetic' }] };
        source.documentation.arrival.beforePhotos = ['/uploads/synthetic.png'];
        source.documentation.adoption.contractPhotoUrl = '/uploads/synthetic.png';
        assert.equal(validateLegacyDogs([source]).length, 1);
        const dry = await importLegacyDogs(db, [source], false, directory);
        assert.equal(dry.pendingDogs, 1); assert.equal(dry.pendingImages, 2);
        assert.equal(await db.dog.findUnique({ where: { id: source.id } }), null);
        const applied = await importLegacyDogs(db, [source], true, directory);
        assert.equal(applied.pendingDogs, 1); assert.equal(applied.pendingMedical, 1);
        const again = await importLegacyDogs(db, [source], true, directory);
        assert.equal(again.pendingDogs + again.pendingDocuments + again.pendingMedical + again.pendingImages, 0);
        const row = await db.dog.findUnique({ where: { id: source.id } });
        assert.ok(row.photoUrl.startsWith('/api/case-reports/images/'));
        assert.notEqual(row.photoUrl, row.documentation.adoption.contractPhotoUrl);
        const asset = await db.reportImage.findUnique({ where: { id: row.documentation.adoption.contractPhotoUrl.split('/').pop() } });
        assert.equal(asset.isPrivate, true);
        assert.equal((await db.medicalRecord.findUnique({ where: { id: source.medicalRecords[0].id } })).dogId, source.id);
        await assert.rejects(importLegacyDogs(db, [{ ...source, name: 'Conflicting name' }], true, directory));
        assert.equal((await db.dog.findUnique({ where: { id: source.id } })).name, source.name);
        assert.throws(() => validateLegacyDogs([{ ...source, documentation: { arrival: [] } }]));
      } finally {
        fs.unlinkSync(path.join(directory, 'uploads', 'synthetic.png')); fs.rmdirSync(path.join(directory, 'uploads')); fs.rmdirSync(directory);
      }
    });
    await t.test('anonymous, read-only and forced-password-change accounts cannot mutate any affected module', async () => {
      const actions = () => [products.POST(request('products', 'POST', { name: 'Denied', price: 10 })), dogApi.DELETE(request('dogs/x', 'DELETE'), context(dog.id)), inventory.POST(request('inventory', 'POST', { name: 'Denied' })), about.PUT(request('about-settings', 'PUT', { heroCaptionTitle: 'Denied' })), stats.PUT(request('transparency', 'PUT', { rescues_count: 1 })), docs.PUT(request('dogs/x/documentation', 'PUT', {}), context(dog.id)), medicalApi.PATCH(request('medical-records/x', 'PATCH', { status: 'Completado' }), context(record.id))];
      assert.equal((await products.POST(request('products', 'POST', {}, false))).status, 401);
      assert.equal((await inventory.GET(request('inventory', 'GET', undefined, false))).status, 401);
      await db.staffUser.update({ where: { id: user.id }, data: { role: 'voluntario' } });
      assert.ok((await Promise.all(actions())).every(r => r.status === 403));
      await db.staffUser.update({ where: { id: user.id }, data: { role: 'superadmin', mustChangePassword: true } });
      assert.ok((await Promise.all(actions())).every(r => r.status === 403));
      await db.staffUser.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    });
    await t.test('database outages return 503 instead of JSON fallback or false success', async () => {
      for (const [failure, action] of [['storeProduct.findMany', () => products.GET()], ['dog.findMany', () => dogs.GET(request('dogs'))], ['aboutSettings.findUnique', () => about.GET()], ['transparencyStat.findMany', () => stats.GET()], ['inventoryItem.findMany', () => inventory.GET(request('inventory'))], ['medicalRecord.update', () => medicalApi.PATCH(request('medical-records/x', 'PATCH', { status: 'Completado' }), context(record.id))]]) {
        fault = failure; try { assert.equal((await action()).status, 503, failure); } finally { fault = undefined; }
      }
      assert.equal((await dogApi.GET(request('dogs/missing'), context('missing'))).status, 404);
      assert.equal((await products.POST(new NextRequest('https://example.invalid/api/products', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{invalid' }))).status, 400);
    });
  } finally { await db.$disconnect(); }
});
