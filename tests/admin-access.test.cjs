const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { NextRequest } = require('next/server');

const crypto = require('node:crypto');
const { createMemoryPrisma } = require('./memory-prisma.cjs');
const isolatedUrl = process.env.STAFF_TEST_DATABASE_URL;
if (isolatedUrl) {
  const parsed = new URL(isolatedUrl);
  if (parsed.hostname !== '127.0.0.1' || parsed.port !== '55439' || parsed.pathname !== '/staff_auth_test') throw Error('Unsafe test database');
}
const db = isolatedUrl ? new (require('@prisma/client').PrismaClient)({ datasourceUrl: isolatedUrl, log: [] }) : createMemoryPrisma();
require('node:test').after(async () => { if (isolatedUrl) await db.$disconnect(); });
const modules = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === '@/lib/db') return { prisma: db };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  }, module, module.exports);
  return module.exports;
}
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
delete process.env.ADMIN_LOGIN_PATH;
const auth = load('src/lib/auth.ts');
const store = load('src/lib/staff-store.ts');
const { middleware, config } = load('src/middleware.ts');
const request = (route, method = 'GET', cookie) => new NextRequest(`https://dog-rescue-one.vercel.app${route}`, {
  method, headers: cookie ? { cookie } : {},
});
const run = (route, method, cookie) => middleware(request(route, method, cookie));

test('shared domain, authentication and authorization regression', async t => {
  const password = crypto.randomBytes(24).toString('hex');
  await db.staffUser.deleteMany({});
  await db.auditLog.deleteMany({});
  await db.loginAttempt.deleteMany({});
  const user = { id: 'test-user', email: 'test@example.invalid', name: 'Test', role: 'superadmin', active: true,
    mustChangePassword: false, sessionVersion: 2, createdAt: new Date().toISOString(), passwordHash: await store.hashPassword(password) };
  const save = async () => { const data = { ...user, createdAt: new Date(user.createdAt), lastLoginAt: null }; await db.staffUser.upsert({ where: { id: user.id }, create: data, update: data }); };
  await save();
  const cookie = `${auth.SESSION_COOKIE}=${await auth.createSessionToken(user.id, 2)}`;
  await t.test('public pages remain public with and without session and legacy host configuration', async () => {
    for (const host of ['', 'dog-rescue-one.vercel.app']) {
      process.env.ADMIN_ALLOWED_HOSTS = host;
      for (const route of ['/', '/catalogo', '/adopciones', '/conocenos', '/tienda']) {
        for (const session of [undefined, cookie]) assert.equal((await run(route, 'GET', session)).headers.get('x-middleware-next'), '1');
      }
    }
  });
  await t.test('login alias renders directly; internal form stays hidden; admin redirects once', async () => {
    assert.equal((await run('/portal-interno')).headers.get('x-middleware-next'), '1');
    assert.equal((await run('/acceso')).status, 404);
    const redirect = await run('/admin');
    assert.equal(redirect.status, 307);
    assert.equal(new URL(redirect.headers.get('location')).pathname, '/portal-interno');
    assert.equal((await run('/admin', 'GET', cookie)).headers.get('x-middleware-next'), '1');
    assert.equal(new URL((await run('/portal-interno', 'GET', cookie)).headers.get('location')).pathname, '/admin');
  });
  await t.test('exact public methods; private endpoints deny anonymous requests', async () => {
    for (const [route, method] of [['/api/dogs', 'GET'], ['/api/products', 'GET'], ['/api/orders', 'POST'], ['/api/applications', 'POST'], ['/api/volunteers', 'POST'], ['/api/case-reports/upload', 'POST']]) {
      assert.equal((await run(route, method)).headers.get('x-middleware-next'), '1');
    }
    for (const [route, method] of [['/api/dogs', 'POST'], ['/api/dogs?deletedOnly=true', 'GET'], ['/api/inventory', 'GET'], ['/api/orders', 'GET'], ['/api/team', 'POST'], ['/api/auth/change-password', 'POST'], ['/api/dogs/file.json', 'DELETE']]) {
      assert.equal((await run(route, method)).status, 401);
    }
    assert.ok(config.matcher.includes('/api/:path*'));
    assert.ok(config.matcher.includes('/admin/:path*'));
  });
  await t.test('roles and mandatory password change remain enforced', async () => {
    user.role = 'voluntario'; await save();
    assert.equal((await run('/api/dogs', 'POST', cookie)).status, 403);
    assert.equal((await run('/api/team', 'GET', cookie)).status, 403);
    assert.equal((await run('/api/inventory', 'GET', cookie)).status, 200);
    user.role = 'editor'; await save();
    assert.equal((await run('/api/audit', 'GET', cookie)).status, 403);
    user.mustChangePassword = true; await save();
    assert.equal((await run('/api/inventory', 'GET', cookie)).status, 403);
    assert.equal((await run('/api/auth/change-password', 'POST', cookie)).status, 200);
    user.mustChangePassword = false; user.role = 'superadmin'; await save();
  });
  await t.test('invalid, expired, revoked and inactive sessions deny access', async () => {
    assert.equal((await run('/api/inventory', 'GET', cookie + 'tampered')).status, 401);
    const now = Date.now;
    Date.now = () => now() - 9 * 60 * 60 * 1000;
    let expired;
    try { expired = await auth.createSessionToken(user.id, 1); } finally { Date.now = now; }
    assert.equal((await run('/api/inventory', 'GET', `${auth.SESSION_COOKIE}=${expired}`)).status, 401);
    user.sessionVersion = 3; await save();
    assert.equal((await run('/api/inventory', 'GET', cookie)).status, 401);
    user.sessionVersion = 2; user.active = false; await save();
    assert.equal((await run('/api/inventory', 'GET', cookie)).status, 401);
    user.active = true; await save();
  });
  await t.test('real login, session and logout handlers with isolated credentials and audit', async () => {
    const login = load('src/app/api/auth/login/route.ts');
    const response = await login.POST(new Request('https://dog-rescue-one.vercel.app/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password }),
    }));
    assert.equal(response.status, 200);
    const sessionCookie = response.headers.get('set-cookie').split(';')[0];
    assert.ok(/HttpOnly/i.test(response.headers.get('set-cookie')), 'cookie flag present');
    assert.ok(/SameSite=strict/i.test(response.headers.get('set-cookie')), 'cookie flag present');
    assert.equal((await run('/admin', 'GET', sessionCookie)).status, 200);
    assert.equal((await run('/', 'GET', sessionCookie)).headers.get('location'), null);
    const session = load('src/app/api/auth/session/route.ts');
    assert.equal((await (await session.GET(request('/api/auth/session', 'GET', sessionCookie))).json()).admin, true);
    assert.equal((await (await session.GET(request('/api/auth/session'))).json()).admin, false);
    const logout = load('src/app/api/auth/logout/route.ts');
    const out = await logout.POST(request('/api/auth/logout', 'POST', sessionCookie));
    assert.equal(out.status, 200);
    assert.ok(/Max-Age=0/i.test(out.headers.get('set-cookie')), 'cookie flag present');
    assert.equal((await out.json()).loginPath, '/portal-interno');
    assert.equal((await run('/admin')).status, 307);
    assert.ok((await store.readAudit()).some(entry => entry.action === 'Cierre de sesión'));
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    assert.equal(auth.sessionCookieOptions().secure, true);
    process.env.NODE_ENV = previous;
  });

  await t.test('password change increments version, revokes previous token and records audit atomically', async () => {
    const changed = crypto.randomBytes(24).toString('hex');
    const response = await load('src/app/api/auth/change-password/route.ts').POST(new Request('https://dog-rescue-one.vercel.app/api/auth/change-password', {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ current: password, next: changed }),
    }));
    assert.equal(response.status, 200);
    const freshCookie = response.headers.get('set-cookie').split(';')[0];
    assert.equal((await run('/api/inventory', 'GET', cookie)).status, 401);
    assert.equal((await run('/api/inventory', 'GET', freshCookie)).status, 200);
    const updated = await store.findUserById(user.id);
    assert.equal(updated.sessionVersion, 3);
    assert.equal(await store.verifyPassword(changed, updated.passwordHash), true);
    assert.equal(updated.mustChangePassword, false);
    assert.ok((await store.readAudit()).some(row => row.action === 'Cambio de contraseña propia'));
    await save();
  });
  await t.test('staff API hides hashes, rejects unauthorized roles and protects self/last administrator', async () => {
    const team = load('src/app/api/team/route.ts');
    const listing = await team.GET(request('/api/team', 'GET', cookie));
    const data = await listing.json();
    assert.equal(listing.status, 200);
    assert.ok(data.every(row => !Object.hasOwn(row, 'passwordHash')));
    const target = load('src/app/api/team/[id]/route.ts');
    const result = await target.PATCH(new Request('https://dog-rescue-one.vercel.app/api/team/test-user', {
      method: 'PATCH', headers: { cookie }, body: JSON.stringify({ active: false }),
    }), { params: Promise.resolve({ id: user.id }) });
    assert.equal(result.status, 400);
    user.role = 'editor'; await save();
    assert.equal((await team.GET(request('/api/team', 'GET', cookie))).status, 403);
    user.role = 'superadmin'; await save();
  });
  await t.test('concurrent administrators cannot remove the last active superadmin', async () => {
    const second = { ...user, id: 'second-synthetic-admin', email: 'second@example.invalid', createdAt: new Date(user.createdAt), lastLoginAt: null };
    await db.staffUser.create({ data: second });
    const secondCookie = auth.SESSION_COOKIE + '=' + await auth.createSessionToken(second.id, second.sessionVersion);
    const route = load('src/app/api/team/[id]/route.ts');
    const demote = (id, session) => route.PATCH(new Request('https://dog-rescue-one.vercel.app/api/team/' + id, { method: 'PATCH', headers: { cookie: session }, body: JSON.stringify({ role: 'editor' }) }), { params: Promise.resolve({ id }) });
    const results = await Promise.all([demote(second.id, cookie), demote(user.id, secondCookie)]);
    assert.equal(results.filter(response => response.status === 200).length, 1);
    assert.equal(store.countActiveSuperadmins(await store.listUsers()), 1);
    await save();
    await db.staffUser.deleteMany({ where: { id: second.id } });
  });
  await t.test('failed audit rolls back account mutation; concurrent updates keep exact version increments', async () => {
    const before = await store.findUserById(user.id);
    await assert.rejects(store.mutateUsers(users => { users.find(row => row.id === user.id).sessionVersion += 1; }, {
      audit: () => { throw Error('simulated audit failure'); },
    }));
    assert.equal((await store.findUserById(user.id)).sessionVersion, before.sessionVersion);
    await Promise.all(Array.from({ length: 4 }, () => store.mutateUsers(users => { users.find(row => row.id === user.id).sessionVersion += 1; })));
    assert.equal((await store.findUserById(user.id)).sessionVersion, before.sessionVersion + 4);
    await save();
  });
  await t.test('import validates and preserves hashes and version; dry run and second run never duplicate', async () => {
    const importer = load('src/lib/staff-import.ts');
    const original = { ...user, id: 'import-test', email: 'import@example.invalid', sessionVersion: 2 };
    const input = { users: [original] };
    const dry = await importer.importStaffUsers(db, input);
    assert.equal(dry.pending, 1);
    assert.ok((await db.staffUser.findUnique({ where: { id: original.id } })) === null, 'dry-run never inserts');
    const first = await importer.importStaffUsers(db, input, true);
    assert.equal(first.inserted, 1);
    const row = await store.findUserById(original.id);
    assert.ok(row.passwordHash === original.passwordHash, 'hash preserved without disclosure');
    assert.equal(row.sessionVersion, 2);
    assert.equal((await importer.importStaffUsers(db, input, true)).inserted, 0);
    assert.equal((await importer.importStaffUsers(db, input, true)).unchanged, 1);
    await assert.rejects(importer.importStaffUsers(db, { users: [{ ...original, sessionVersion: 1 }] }, true));
    assert.equal((await store.findUserById(original.id)).sessionVersion, 2);
    for (const bad of [{ users: [original, original] }, { users: [{ ...original, role: 'owner' }] }, { users: [{ ...original, passwordHash: 'invalid' }] }, { users: [{ ...original, sessionVersion: -1 }] }, { users: [{ ...original, extra: true }] }, { users: [{ ...original, createdAt: 'invalid' }] }]) {
      assert.throws(() => importer.validateStaffImport(bad));
    }
  });
  await t.test('distributed limiter reserves concurrent attempts, expires windows, clears after success', async () => {
    const limiter = load('src/lib/login-attempts.ts');
    await db.loginAttempt.deleteMany({});
    const outcomes = await Promise.all(Array.from({ length: 8 }, () => limiter.reserveLoginAttempt('test-ip', 'limit@example.invalid')));
    assert.equal(outcomes.filter(Boolean).length, 5);
    await limiter.clearLoginAttempts('test-ip', 'limit@example.invalid');
    assert.equal(await limiter.reserveLoginAttempt('test-ip', 'limit@example.invalid'), true);
    await db.loginAttempt.updateMany({ data: { resetAt: new Date(0) } });
    assert.equal(await limiter.reserveLoginAttempt('test-ip', 'limit@example.invalid'), true);
    const rows = await db.loginAttempt.findMany({});
    assert.ok(rows.every(row => /^[a-f0-9]{64}$/.test(row.key)));
  });
  await t.test('database failures abort login; no automatic account creation or file fallback', async () => {
    const original = db.staffUser.findUnique;
    db.staffUser.findUnique = async () => { throw Error('database unavailable'); };
    try {
      await assert.rejects(store.findUserByEmail(user.email));
      const result = await load('src/app/api/auth/login/route.ts').POST(new Request('https://dog-rescue-one.vercel.app/api/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password }) }));
      assert.equal(result.status, 503);
      assert.equal(result.headers.get('set-cookie'), null);
      assert.equal((await run('/admin', 'GET', cookie)).status, 503);
      const session = await load('src/app/api/auth/session/route.ts').GET(request('/api/auth/session', 'GET', cookie));
      assert.equal(session.status, 503);
      const logout = await load('src/app/api/auth/logout/route.ts').POST(request('/api/auth/logout', 'POST', cookie));
      assert.equal(logout.status, 503);
      assert.ok(/Max-Age=0/i.test(logout.headers.get('set-cookie')), 'cookie flag present');
    } finally { db.staffUser.findUnique = original; }
  });

});
