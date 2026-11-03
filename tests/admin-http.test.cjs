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
    assert.equal((await call('/api/notifications', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ id: event.id }) })).status, 200);
    assert.equal((await db.notification.findUnique({ where: { id: event.id } })).read, true);
    assert.equal((await call(`/api/notifications?id=${event.id}`, { method: 'DELETE', headers })).status, 200);
    assert.ok(!JSON.parse((await call('/api/notifications', { headers })).body).some(n => n.id === event.id));
    const patch = { mottoPart1: 'HTTP persisted motto', highlightColor: 'gradient-gold', fontFamily: 'fredoka' };
    assert.equal((await call('/api/home-settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(patch) })).status, 200);
    const publicSettings = await call('/api/home-settings');
    assert.equal(publicSettings.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.parse(publicSettings.body).mottoPart1, patch.mottoPart1);
    await new Promise(resolve => { server.once('exit', resolve); server.kill(); });
    server = launch();
    let restarted = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await call('/')).status === 200) { restarted = true; break; } } catch { /* startup */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(restarted, true);
    assert.equal(JSON.parse((await call('/api/home-settings')).body).mottoPart1, patch.mottoPart1);
    assert.ok(!JSON.parse((await call('/api/notifications', { headers })).body).some(n => n.id === event.id));
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'editor' } });
    assert.equal((await call('/api/team', { headers })).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'voluntario' } });
    assert.equal((await call('/api/dogs', { method: 'POST', headers, body: '{}' })).status, 403);
    assert.equal((await call('/api/home-settings', { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(patch) })).status, 403);
    assert.equal((await call('/api/notifications', { method: 'DELETE', headers })).status, 403);
    const logout = await call('/api/auth/logout', { method: 'POST', headers });
    assert.equal(logout.status, 200);
    assert.ok(/Max-Age=0/i.test(logout.headers.get('set-cookie')), 'cookie flag present');
    assert.equal((await call('/admin')).status, 307);
  } finally {
    server.kill();
    await db.$disconnect();
  }
});
