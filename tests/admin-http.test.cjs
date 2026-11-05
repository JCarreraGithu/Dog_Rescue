const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

test('HTTP production server: public pages, private APIs, login, roles and logout', { skip: !process.env.STAFF_TEST_DATABASE_URL, timeout: 90000 }, async () => {
  const url = process.env.STAFF_TEST_DATABASE_URL;
  const target = new URL(url);
  if (target.hostname !== '127.0.0.1' || target.port !== '55439' || target.pathname !== '/staff_auth_test') throw Error('Unsafe test database');
  const db = new PrismaClient({ datasourceUrl: url, log: [] });
  const password = crypto.randomBytes(24).toString('hex');
  const salt = crypto.randomBytes(16);
  const passwordHash = `scrypt$${salt.toString('hex')}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  const user = { id: 'http-synthetic-only', name: 'Test', email: 'http@example.invalid', role: 'superadmin', passwordHash, active: true, mustChangePassword: false, sessionVersion: 2, createdAt: new Date() };
  await db.staffUser.upsert({ where: { id: user.id }, create: user, update: user });
  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url, AUTH_SECRET: crypto.randomBytes(32).toString('hex'), ADMIN_LOGIN_PATH: '/portal-interno' };
  delete env.ADMIN_EMAIL; delete env.ADMIN_PASSWORD;
  const launch = () => {
    const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--port', '3109', '--hostname', '127.0.0.1'], { env, windowsHide: true, stdio: 'ignore' });
    child.on('error', () => {});
    return child;
  };
  let server = launch();
  const call = async (route, options = {}) => {
    const response = await fetch(`http://127.0.0.1:3109${route}`, { redirect: 'manual', signal: AbortSignal.timeout(10000), ...options });
    const body = await response.text();
    return { status: response.status, headers: response.headers, body };
  };
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await call('/')).status === 200) { ready = true; break; } }
      catch { /* startup */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(ready, true, 'local production server starts');
    for (const route of ['/', '/catalogo', '/conocenos', '/tienda', '/portal-interno']) {
      const response = await call(route);
      console.log(JSON.stringify({ route, status: response.status, rewrite: response.headers.get('x-middleware-rewrite') }));
      assert.equal(response.status, 200, route);
    }
    const alias = await call('/adopciones');
    assert.equal(alias.status, 307);
    assert.equal(alias.headers.get('location'), '/catalogo');
    assert.equal((await call('/acceso')).status, 404);
    assert.equal((await call('/admin')).status, 307);
    assert.equal((await call('/api/dogs')).status, 200);
    assert.equal((await call('/api/dogs', { method: 'POST', body: '{}' })).status, 401);
    assert.equal((await call('/api/inventory')).status, 401);
    assert.equal((await call('/api/notifications')).status, 401);
    assert.equal((await call('/api/home-settings', { method: 'PUT', body: '{}' })).status, 401);
    const login = await call('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password }) });
    assert.equal(login.status, 200);
    const cookieHeader = login.headers.get('set-cookie');
    assert.ok(/HttpOnly/i.test(cookieHeader), 'cookie flag present');
    assert.ok(/Secure/i.test(cookieHeader), 'cookie flag present');
    assert.ok(/SameSite=strict/i.test(cookieHeader), 'cookie flag present');
    const cookie = cookieHeader.split(';')[0];
    const headers = { cookie };
    assert.equal((await call('/admin', { headers })).status, 200);
    const home = await call('/', { headers });
    assert.equal(home.status, 200);
    assert.equal(home.headers.get('location'), null);
    assert.equal(JSON.parse((await call('/api/auth/session', { headers })).body).user.role, 'superadmin');
    const event = await db.notification.create({ data: { type: 'adoption', title: 'HTTP synthetic', message: 'Test', targetTab: 'applications' } });
    const jsonHeaders = { ...headers, 'content-type': 'application/json' };
    const publicHeaders = { 'content-type': 'application/json' };
    const dogId = 'http-intake-dog';
    await db.dog.upsert({ where: { id: dogId }, create: { id: dogId, name: 'HTTP synthetic dog', breed: 'Mestizo', ageCategory: 'Adulto', ageYears: 3, gender: 'Hembra', size: 'Mediano', temperament: 'Tranquilo', status: 'En Adopción', rescueHistory: 'Test', healthNotes: 'Test', photoUrl: 'https://example.invalid/dog.png' }, update: {} });
    const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
    const form = new FormData(); form.set('file', new File([imageBytes], 'test.png'));
    const uploaded = await call('/api/case-reports/upload', { method: 'POST', body: form });
    assert.equal(uploaded.status, 201);
    const imageUrl = JSON.parse(uploaded.body).url;
    assert.ok(imageUrl);
    assert.equal((await call(imageUrl)).status, 200);
    const submissions = {
      orders: { customerName: 'HTTP customer', customerPhone: '55551234', items: [{ id: 'shirt', name: 'Shirt', price: 25, qty: 2 }], deliveryMethod: 'Recoger en Sede' },
      applications: { dogId, applicantName: 'HTTP applicant', applicantPhone: '55551234', applicantAge: 30, petsAllowed: true, safeHome: true, enoughSpace: true, petAccess: 'Todos', knowsFiveFreedoms: true, commitsToWelfare: true, commitsToSterilize: true },
      volunteers: { name: 'HTTP volunteer', phone: '55551234', age: 30, availableDays: ['Sábado'], interestAreas: ['Cuidados en Refugio'], commitmentDuration: 'Al menos 3 meses', acceptsSafetyRules: true, authorizesDataUse: true },
      'case-reports': { reporterName: 'HTTP reporter', reporterPhone: '55551234', locationAddress: 'Synthetic location', description: 'Synthetic report', urgencyLevel: 'Alta', photos: [imageUrl] },
    };
    const intakeIds = {};
    for (const [name, payload] of Object.entries(submissions)) {
      assert.equal((await call('/api/' + name)).status, 401);
      const response = await call('/api/' + name, { method: 'POST', headers: publicHeaders, body: JSON.stringify(payload) });
      assert.equal(response.status, 201, name);
      intakeIds[name] = JSON.parse(response.body).id;
      assert.ok(JSON.parse((await call('/api/' + name, { headers })).body).some(row => row.id === intakeIds[name]));
    }
    const deletedOrder = await call('/api/orders', { method: 'POST', headers: publicHeaders, body: JSON.stringify(submissions.orders) });
    const deletedOrderId = JSON.parse(deletedOrder.body).id;
    assert.equal((await call('/api/orders?id=' + deletedOrderId, { method: 'DELETE', headers })).status, 200);
    assert.ok(!JSON.parse((await call('/api/orders', { headers })).body).some(row => row.id === deletedOrderId));
    assert.equal((await call('/api/notifications', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ id: event.id }) })).status, 200);
    assert.equal((await db.notification.findUnique({ where: { id: event.id } })).read, true);
    assert.equal((await call(`/api/notifications?id=${event.id}`, { method: 'DELETE', headers })).status, 200);
    assert.ok(!JSON.parse((await call('/api/notifications', { headers })).body).some(n => n.id === event.id));
    const patch = { mottoPart1: 'HTTP persisted motto', highlightColor: 'gradient-gold', fontFamily: 'fredoka' };
    assert.equal((await call('/api/home-settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(patch) })).status, 200);
    const publicSettings = await call('/api/home-settings');
    assert.equal(publicSettings.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.parse(publicSettings.body).mottoPart1, patch.mottoPart1);
    assert.equal((await call('/api/special-cases?all=1')).status, 401);
    const initialCases = JSON.parse((await call('/api/special-cases?all=1', { headers })).body);
    assert.equal(initialCases.length, 5, 'initial migration preserves the five existing cases');
    for (const special of initialCases) assert.equal((await call('/api/special-cases/' + special.id, { method: 'DELETE', headers })).status, 200);
    assert.deepEqual(JSON.parse((await call('/api/special-cases')).body), []);
    assert.deepEqual(JSON.parse((await call('/api/special-cases?all=1', { headers })).body), []);
    const specialUpload = await call('/api/special-cases/upload', { method: 'POST', headers, body: form });
    assert.equal(specialUpload.status, 201);
    const specialPhoto = JSON.parse(specialUpload.body).url;
    const specialResponse = await call('/api/special-cases', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ title: 'Synthetic special case', story: 'Story', image: specialPhoto, featured: true, published: true }) });
    assert.equal(specialResponse.status, 201);
    const specialId = JSON.parse(specialResponse.body).id;
    assert.equal((await call('/api/special-cases/' + specialId, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ title: 'Edited case', featured: false }) })).status, 200);
    assert.equal(JSON.parse((await call('/api/special-cases')).body)[0].featured, false);
    // Remaining admin modules must survive a fresh production-server process.
    const persistProduct = JSON.parse((await call('/api/products', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'HTTP persistent product', price: 19, category: 'Paletas', stock: 8, variants: ['Mango'], image: imageUrl }) })).body);
    assert.ok(persistProduct.id);
    assert.equal((await call('/api/products/' + persistProduct.id, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ price: 21, stockChange: 2 }) })).status, 200);
    const removedProduct = JSON.parse((await call('/api/products', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'HTTP removed product', price: 1 }) })).body);
    assert.equal((await call('/api/products/' + removedProduct.id, { method: 'DELETE', headers })).status, 200);
    const dogPhotoResponse = await call('/api/dogs/upload', { method: 'POST', headers, body: form });
    assert.equal(dogPhotoResponse.status, 201);
    const dogPhoto = JSON.parse(dogPhotoResponse.body).url;
    const persistDogResponse = await call('/api/dogs', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'HTTP persistent dog', photoUrl: dogPhoto }) });
    assert.equal(persistDogResponse.status, 201);
    const persistDog = JSON.parse(persistDogResponse.body);
    const removedDogResponse = await call('/api/dogs', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'HTTP archived dog', photoUrl: dogPhoto }) });
    assert.equal(removedDogResponse.status, 201);
    const removedDogId = JSON.parse(removedDogResponse.body).id;
    assert.equal((await call('/api/dogs/' + removedDogId + '?permanent=true', { method: 'DELETE', headers })).status, 200);
    const privateForm = new FormData(); privateForm.set('file', new File([imageBytes], 'contract.png')); privateForm.set('private', 'true');
    const privateUpload = await call('/api/dogs/upload', { method: 'POST', headers, body: privateForm });
    assert.equal(privateUpload.status, 201);
    const privatePhoto = JSON.parse(privateUpload.body).url;
    assert.equal((await call(privatePhoto)).status, 401);
    assert.equal((await call(privatePhoto, { headers })).headers.get('cache-control'), 'private, no-store');
    const document = JSON.parse((await call('/api/dogs/' + persistDog.id + '/documentation', { headers })).body).documentation;
    document.adoption.adopterName = 'HTTP synthetic adopter'; document.adoption.contractPhotoUrl = privatePhoto;
    assert.equal((await call('/api/dogs/' + persistDog.id + '/documentation', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ documentation: document }) })).status, 200);
    const medResponse = await call('/api/dogs/' + persistDog.id + '/medical', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ title: 'HTTP followup', date: '2026-11-04', status: 'Programado' }) });
    assert.equal(medResponse.status, 201);
    const persistMedical = JSON.parse(medResponse.body);
    assert.equal((await call('/api/medical-records/' + persistMedical.id, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ status: 'Completado' }) })).status, 200);
    const persistInventory = JSON.parse((await call('/api/inventory', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'HTTP persistent inventory', quantity: 4 }) })).body);
    assert.ok(persistInventory.id);
    assert.equal((await call('/api/inventory', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ id: persistInventory.id, quantityChange: 3 }) })).status, 200);
    assert.equal((await call('/api/transparency', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ rescues_count: 654 }) })).status, 200);
    assert.equal((await call('/api/about-settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ heroCaptionTitle: 'HTTP persistent caption', heroImage: dogPhoto }) })).status, 200);
    await new Promise(resolve => { server.once('exit', resolve); server.kill(); });
    server = launch();
    let restarted = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await call('/')).status === 200) { restarted = true; break; } } catch { /* startup */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(restarted, true);
    const redeploy = require('node:child_process').spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { env, encoding: 'utf8', windowsHide: true });
    assert.equal(redeploy.status, 0, 'repeated migration deploy succeeds without reseeding');
    assert.ok(!JSON.parse((await call('/api/dogs')).body).some(row => row.id === removedDogId));
    assert.ok(!JSON.parse((await call('/api/dogs?deletedOnly=true', { headers })).body).some(row => row.id === removedDogId));
    assert.equal((await db.dog.findUnique({ where: { id: removedDogId } })).isArchived, true);
    const persistedProducts = JSON.parse((await call('/api/products')).body);
    assert.equal(persistedProducts.find(p => p.id === persistProduct.id).stock, 10);
    assert.equal(persistedProducts.find(p => p.id === persistProduct.id).price, 21);
    assert.ok(!persistedProducts.some(p => p.id === removedProduct.id));
    assert.equal(JSON.parse((await call('/api/dogs/' + persistDog.id, { headers })).body).medicalRecords[0].status, 'Completado');
    assert.equal(JSON.parse((await call('/api/dogs/' + persistDog.id + '/documentation', { headers })).body).documentation.adoption.contractPhotoUrl, privatePhoto);
    assert.equal((await call(dogPhoto)).status, 200);
    assert.equal((await call(privatePhoto)).status, 401);
    assert.equal((await call(privatePhoto, { headers })).status, 200);
    assert.equal(JSON.parse((await call('/api/inventory', { headers })).body).find(row => row.id === persistInventory.id).quantity, 7);
    assert.equal(JSON.parse((await call('/api/transparency')).body).find(row => row.key === 'rescues_count').value, 654);
    assert.equal(JSON.parse((await call('/api/about-settings')).body).heroCaptionTitle, 'HTTP persistent caption');
    const currentCases = JSON.parse((await call('/api/special-cases?all=1', { headers })).body);
    assert.equal(currentCases.length, 1);
    assert.equal(currentCases[0].id, specialId);
    assert.equal(currentCases[0].title, 'Edited case');
    assert.equal(currentCases[0].image, specialPhoto);
    assert.equal((await call(specialPhoto)).status, 200);
    for (const special of initialCases) assert.equal((await db.specialCase.findUnique({ where: { id: special.id } })).isDeleted, true);
    for (const [name, recordId] of Object.entries(intakeIds)) {
      assert.ok(JSON.parse((await call('/api/' + name, { headers })).body).some(row => row.id === recordId), name + ' survives restart');
    }
    assert.ok(!JSON.parse((await call('/api/orders', { headers })).body).some(row => row.id === deletedOrderId), 'deleted order remains deleted');
    assert.equal((await call(imageUrl)).status, 200);
    assert.equal((await call('/api/applications/' + intakeIds.applications + '/word', { headers })).status, 200);
    assert.equal((await call('/api/volunteers/' + intakeIds.volunteers + '/word', { headers })).status, 200);
    assert.equal(JSON.parse((await call('/api/home-settings')).body).mottoPart1, patch.mottoPart1);
    assert.ok(!JSON.parse((await call('/api/notifications', { headers })).body).some(n => n.id === event.id));
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'editor' } });
    assert.equal((await call('/api/team', { headers })).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'voluntario' } });
    assert.equal((await call('/api/dogs', { method: 'POST', headers, body: '{}' })).status, 403);
    assert.equal((await call('/api/home-settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(patch) })).status, 403);
    assert.equal((await call('/api/notifications', { method: 'DELETE', headers })).status, 403);
    assert.equal((await call('/api/special-cases/' + specialId, { method: 'DELETE', headers })).status, 403);
    for (const [name, recordId] of Object.entries(intakeIds)) assert.equal((await call('/api/' + name + '?id=' + recordId, { method: 'DELETE', headers })).status, 403);
    assert.equal((await call('/api/products', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Denied', price: 1 }) })).status, 403);
    assert.equal((await call('/api/inventory', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: 'Denied' }) })).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { mustChangePassword: true } });
    assert.equal((await call('/api/applications/' + intakeIds.applications + '/word', { headers })).status, 403);
    assert.equal((await call('/api/volunteers/' + intakeIds.volunteers + '/word', { headers })).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    const logout = await call('/api/auth/logout', { method: 'POST', headers });
    assert.equal(logout.status, 200);
    assert.ok(/Max-Age=0/i.test(logout.headers.get('set-cookie')), 'cookie flag present');
    assert.equal((await call('/admin')).status, 307);
  } finally {
    server.kill();
    await db.$disconnect();
  }
});
