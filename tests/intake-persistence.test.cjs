const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const { createMemoryPrisma } = require('./memory-prisma.cjs');
const url = process.env.STAFF_TEST_DATABASE_URL;
if (url) { const u = new URL(url); if (u.hostname !== '127.0.0.1' || u.port !== '55439' || u.pathname !== '/staff_auth_test') throw Error('Unsafe test database'); }
const db = url ? new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] }) : createMemoryPrisma();
after(async () => { if (url) await db.$disconnect(); });
let fault;
const delegates = ['storeOrder', 'adoptionApplication', 'volunteer', 'caseReport', 'reportImage', 'notification'];
function instrument(client) {
  return new Proxy(client, { get(target, key) {
    if (key === '$transaction') return (fn, ...args) => target.$transaction(tx => fn(instrument(tx)), ...args);
    const value = target[key];
    if (delegates.includes(key)) return new Proxy(value, { get(delegate, method) { return (...args) => { if (fault === `${key}.${method}`) throw Error('Simulated database error'); return delegate[method](...args); }; } });
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
const cache = new Map();
function load(file) {
  const filename = path.resolve(file);
  if (cache.has(filename)) return cache.get(filename).exports;
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const module = { exports: {} }; cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === '@/lib/db') return { prisma: instrument(db) };
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + (name.endsWith('.json') ? '' : '.ts'));
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
    return require(name);
  }, module, module.exports);
  return module.exports;
}
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
const auth = load('src/lib/auth.ts');
const apis = Object.fromEntries(['orders', 'applications', 'volunteers', 'case-reports'].map(name => [name, load(`src/app/api/${name}/route.ts`)]));
const store = load('src/lib/intake-store.ts');
const request = (name, method, data, cookie) => new NextRequest(`https://example.invalid/api/${name}`, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
const order = { customerName: 'Synthetic customer', customerPhone: '55551234', items: [{ id: 'shirt', name: 'Shirt', price: 25.5, qty: 2, size: 'M' }], deliveryMethod: 'Cargo Expreso', department: 'Guatemala', shippingAddress: 'Synthetic address', paymentMethod: 'Transferencia / Depósito', paymentReference: 'TEST', note: 'Synthetic note' };
const application = { dogId: 'intake-test-dog', applicantName: 'Synthetic applicant', applicantPhone: '55551234', applicantAge: 30, petsAllowed: true, safeHome: true, enoughSpace: true, petAccess: 'Todos', knowsFiveFreedoms: true, commitsToWelfare: true, commitsToSterilize: true };
const volunteer = { name: 'Synthetic volunteer', phone: '55551234', age: 28, availableDays: ['Sábado'], interestAreas: ['Cuidados en Refugio'], commitmentDuration: 'Al menos 3 meses', animalExperience: 'Experience', motivation: 'Motivation', acceptsSafetyRules: true, authorizesDataUse: true };
const report = { reporterName: 'Synthetic reporter', reporterPhone: '55551234', locationAddress: 'Synthetic location', description: 'Synthetic report', urgencyLevel: 'Alta', photos: ['https://example.invalid/photo.png', 'https://example.invalid/photo2.png'] };
const payloads = { orders: order, applications: application, volunteers: volunteer, 'case-reports': report };

test('all four intake modules use durable records and atomic notifications', async t => {
  for (const name of ['notification', 'adoptionApplication', 'volunteer', 'caseReport', 'storeOrder', 'reportImage']) await db[name].deleteMany({});
  await db.dog.upsert({ where: { id: application.dogId }, create: { id: application.dogId, name: 'Synthetic dog', breed: 'Mestizo', ageCategory: 'Adulto', ageYears: 3, gender: 'Hembra', size: 'Mediano', temperament: 'Tranquilo', status: 'En Adopción', rescueHistory: 'Test', healthNotes: 'Test', photoUrl: 'https://example.invalid/dog.png' }, update: { isDeleted: false } });
  const salt = crypto.randomBytes(16), hash = crypto.scryptSync(crypto.randomBytes(24), salt, 64);
  const user = { id: 'intake-staff', email: 'intake@example.invalid', name: 'Test', role: 'superadmin', active: true, mustChangePassword: false, sessionVersion: 1, createdAt: new Date(), passwordHash: `scrypt$${salt.toString('hex')}$${hash.toString('hex')}` };
  await db.staffUser.upsert({ where: { id: user.id }, create: user, update: user });
  const cookie = `${auth.SESSION_COOKIE}=${await auth.createSessionToken(user.id, 1)}`;
  const created = {};
  await t.test('anonymous public creation succeeds and each notification references the committed ID', async () => {
    const metadataIds = { orders: 'orderId', applications: 'applicationId', volunteers: 'volunteerId', 'case-reports': 'reportId' };
    for (const [name, data] of Object.entries(payloads)) {
      const response = await apis[name].POST(request(name, 'POST', data));
      assert.equal(response.status, 201, name);
      created[name] = await response.json();
      assert.ok(created[name].id);
      const events = await db.notification.findMany({});
      assert.ok(events.some(n => n.metadata?.[metadataIds[name]] === created[name].id));
    }
    assert.equal(created.orders.subtotal, 51);
    assert.equal(created.orders.total, 86);
    assert.equal(created.orders.paymentReference, 'TEST');
    assert.deepEqual(created['case-reports'].photos, report.photos);
  });
  await t.test('administrative reads return persisted data; public and read-only permissions remain intact', async () => {
    for (const [name, api] of Object.entries(apis)) {
      assert.equal((await api.GET(request(name, 'GET'))).status, 401);
      const response = await api.GET(request(name, 'GET', undefined, cookie));
      assert.equal(response.status, 200);
      assert.ok((await response.json()).some(r => r.id === created[name].id));
    }
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'voluntario' } });
    for (const [name, api] of Object.entries(apis)) {
      assert.equal((await api.PUT(request(name, 'PUT', { id: created[name].id, status: 'Aprobado' }, cookie))).status, 403);
      assert.equal((await api.DELETE(request(`${name}?id=${created[name].id}`, 'DELETE', undefined, cookie))).status, 403);
    }
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'editor' } });
  });
  await t.test('evaluation, shipment tracking, states, notes and photo lists remain available', async () => {
    assert.equal((await apis.orders.PUT(request('orders', 'PUT', { id: created.orders.id, status: 'Enviado (Cargo Expreso)', paymentStatus: 'Verificado', trackingNumber: 'TEST-GUIDE', adminNotes: 'Test notes' }, cookie))).status, 200);
    assert.equal((await store.getOrders())[0].trackingNumber, 'TEST-GUIDE');
    assert.equal((await apis.applications.PUT(request('applications', 'PUT', { id: created.applications.id, status: 'Aprobado', evaluatorNotes: 'Evaluation' }, cookie))).status, 200);
    assert.equal((await store.getApplication(created.applications.id)).evaluatorNotes, 'Evaluation');
    assert.equal((await apis.volunteers.PUT(request('volunteers', 'PUT', { id: created.volunteers.id, status: 'Rechazado', evaluatorNotes: 'Evaluation' }, cookie))).status, 200);
    assert.equal((await store.getVolunteer(created.volunteers.id)).status, 'Rechazado');
    assert.equal((await apis['case-reports'].PUT(request('case-reports', 'PUT', { id: created['case-reports'].id, status: 'Rescatado', adminNotes: 'Rescue notes' }, cookie))).status, 200);
    assert.equal((await store.getReports())[0].adminNotes, 'Rescue notes');
  });
  await t.test('static catalogue IDs cannot accept applications after deletion or when absent from PostgreSQL', async () => {
    const before = (await db.adoptionApplication.findMany()).length;
    const response = await apis.applications.POST(request('applications', 'POST', { ...application, dogId: 'demo-dog-1' }));
    assert.equal(response.status, 404);
    assert.equal((await db.adoptionApplication.findMany()).length, before);
  });
  await t.test('malformed input is rejected and database failures never return fake success', async () => {
    for (const [name, api] of Object.entries(apis)) assert.equal((await api.POST(request(name, 'POST', {}))).status, 400);
    assert.equal((await apis.orders.POST(request('orders', 'POST', { ...order, items: [{ price: -1, qty: 2 }] }))).status, 400);
    assert.equal((await apis.volunteers.POST(request('volunteers', 'POST', { ...volunteer, authorizesDataUse: false }))).status, 400);
    try { fault = 'storeOrder.findMany'; assert.equal((await apis.orders.GET(request('orders', 'GET', undefined, cookie))).status, 503); }
    finally { fault = undefined; }
  });
  await t.test('a failed notification rolls back each public submission', async () => {
    const models = { orders: 'storeOrder', applications: 'adoptionApplication', volunteers: 'volunteer', 'case-reports': 'caseReport' };
    for (const [name, api] of Object.entries(apis)) {
      const before = (await db[models[name]].findMany({})).length;
      try { fault = 'notification.create'; assert.equal((await api.POST(request(name, 'POST', payloads[name]))).status, 503); }
      finally { fault = undefined; }
      assert.equal((await db[models[name]].findMany({})).length, before);
    }
  });
  await t.test('deletion is durable, missing IDs are 404, and failed writes do not report success', async () => {
    try { fault = 'storeOrder.deleteMany'; assert.equal((await apis.orders.DELETE(request(`orders?id=${created.orders.id}`, 'DELETE', undefined, cookie))).status, 503); }
    finally { fault = undefined; }
    assert.ok((await store.getOrders()).some(o => o.id === created.orders.id));
    for (const [name, api] of Object.entries(apis)) {
      assert.equal((await api.DELETE(request(`${name}?id=${created[name].id}`, 'DELETE', undefined, cookie))).status, 200);
      assert.ok(!(await (await api.GET(request(name, 'GET', undefined, cookie))).json()).some(r => r.id === created[name].id));
      assert.equal((await api.DELETE(request(`${name}?id=${created[name].id}`, 'DELETE', undefined, cookie))).status, 404);
    }
  });
  await t.test('report photos upload in bounded chunks, persist bytes, and reject invalid or incomplete uploads', async () => {
    const upload = load('src/app/api/case-reports/upload/route.ts');
    const images = load('src/app/api/case-reports/images/[id]/route.ts');
    const bytes = new Uint8Array(2 * 1024 * 1024 + 100);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const form = (chunk, offset, extra = {}) => { const f = new FormData(); f.set('file', new File([chunk], 'test.png')); f.set('totalSize', String(bytes.length)); f.set('offset', String(offset)); for (const [k, v] of Object.entries(extra)) f.set(k, v); return new Request('https://example.invalid/api/case-reports/upload', { method: 'POST', body: f }); };
    const firstResponse = await upload.POST(form(bytes.slice(0, 2 * 1024 * 1024), 0));
    assert.equal(firstResponse.status, 201);
    const first = await firstResponse.json();
    assert.ok(first.uploadId && first.uploadToken);
    assert.equal((await images.GET(request('unused', 'GET'), { params: Promise.resolve({ id: first.uploadId }) })).status, 404);
    const tampered = await upload.POST(form(bytes.slice(2 * 1024 * 1024), 2 * 1024 * 1024, { uploadId: first.uploadId, uploadToken: '0'.repeat(64) }));
    assert.equal(tampered.status, 409);
    const complete = await upload.POST(form(bytes.slice(2 * 1024 * 1024), 2 * 1024 * 1024, { uploadId: first.uploadId, uploadToken: first.uploadToken }));
    assert.equal(complete.status, 201);
    assert.ok((await complete.json()).url);
    const image = await images.GET(request('unused', 'GET'), { params: Promise.resolve({ id: first.uploadId }) });
    assert.equal(image.status, 200);
    assert.ok(Buffer.from(await image.arrayBuffer()).equals(Buffer.from(bytes)), 'stored photo bytes preserved');
    const invalid = new FormData(); invalid.set('file', new File(['not an image'], 'fake.png'));
    assert.equal((await upload.POST(new Request('https://example.invalid/api/case-reports/upload', { method: 'POST', body: invalid }))).status, 400);
  });
  await t.test('legacy order import preserves IDs and totals without duplicates or overwrites', async () => {
    const importer = load('src/lib/order-import.ts');
    const legacy = [{ ...created.orders, id: 'synthetic-legacy-order' }];
    assert.equal((await importer.importOrders(db, legacy)).inserted, 0);
    assert.equal((await importer.importOrders(db, legacy, true)).inserted, 1);
    assert.equal((await importer.importOrders(db, legacy, true)).inserted, 0);
    assert.equal((await store.getOrders()).find(o => o.id === legacy[0].id).total, legacy[0].total);
    await assert.rejects(importer.importOrders(db, [{ ...legacy[0], adminNotes: 'Conflict' }], true));
  });
});
