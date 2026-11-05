const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const { createMemoryPrisma } = require('./memory-prisma.cjs');

// Solo el clúster reservado de pruebas; nunca usa DATABASE_URL ni Neon.
const url = process.env.STAFF_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (parsed.hostname !== '127.0.0.1' || parsed.port !== '55439' || parsed.pathname !== '/staff_auth_test') throw Error('Unsafe test database');
}
const db = url ? new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] }) : createMemoryPrisma();
after(async () => { if (url) await db.$disconnect(); });
let fault;
function instrument(client) {
  return new Proxy(client, { get(target, name) {
    if (name === '$transaction') return (fn, ...args) => target.$transaction(tx => fn(instrument(tx)), ...args);
    const value = target[name];
    if (['notification', 'homeSettings'].includes(name)) return new Proxy(value, { get(delegate, method) {
      return (...args) => { if (fault === `${name}.${method}`) throw Error('Simulated database failure'); return delegate[method](...args); };
    } });
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
const client = instrument(db);
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === '@/lib/db') return { prisma: client };
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
    return require(name);
  }, module, module.exports);
  return module.exports;
}
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
const auth = load('src/lib/auth.ts');
const notifications = load('src/lib/notifications.ts');
const settings = load('src/lib/home-settings.ts');
const { normalizeRefugeName } = load('src/lib/refuge-name.ts');
const notificationsApi = load('src/app/api/notifications/route.ts');
const homeApi = load('src/app/api/home-settings/route.ts');
const makeNotification = (type = 'system') => ({ type, title: 'Synthetic activity', message: 'Synthetic message', targetTab: 'notifications', metadata: { source: type, count: 1, nested: { ok: true } } });
const request = (route, method = 'GET', body, cookie) => new NextRequest(`https://example.invalid${route}`, { method, headers: { ...(cookie ? { cookie } : {}), 'content-type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });

test('notifications and home settings persist with correct failures and permissions', async t => {
  await db.notification.deleteMany({});
  await db.homeSettings.deleteMany({});
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(crypto.randomBytes(24), salt, 64);
  const user = { id: 'content-test-staff', name: 'Test', email: 'content@example.invalid', passwordHash: `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`, role: 'superadmin', active: true, mustChangePassword: false, sessionVersion: 1, createdAt: new Date(), lastLoginAt: null };
  await db.staffUser.upsert({ where: { id: user.id }, create: user, update: user });
  const cookie = `${auth.SESSION_COOKIE}=${await auth.createSessionToken(user.id, 1)}`;

  await t.test('every existing producer type and metadata keeps its API contract', async () => {
    for (const type of ['adoption', 'order', 'volunteer', 'case_report', 'system']) {
      const created = await notifications.addNotification(makeNotification(type));
      assert.equal(created.type, type);
      assert.equal(created.read, false);
      assert.equal(typeof created.createdAt, 'string');
      assert.deepEqual(created.metadata, makeNotification(type).metadata);
    }
    assert.equal((await notifications.getNotifications()).length, 5);
  });
  await t.test('parallel inserts do not replace or lose other notifications', async () => {
    await Promise.all(Array.from({ length: 12 }, () => notifications.addNotification(makeNotification())));
    assert.equal((await notifications.getNotifications()).length, 17);
  });
  await t.test('mark one, mark all, delete one, and reload preserve changes', async () => {
    const first = (await notifications.getNotifications())[0];
    assert.equal((await notificationsApi.PUT(request('/api/notifications', 'PUT', { id: first.id }, cookie))).status, 200);
    assert.equal((await notifications.getNotifications()).filter(n => n.read).length, 1);
    await notificationsApi.PUT(request('/api/notifications', 'PUT', { markAllRead: true }, cookie));
    assert.ok((await notifications.getNotifications()).every(n => n.read));
    const deletion = await notificationsApi.DELETE(request(`/api/notifications?id=${first.id}`, 'DELETE', undefined, cookie));
    assert.equal(deletion.status, 200);
    cache.clear();
    const reloaded = load('src/lib/notifications.ts');
    assert.equal((await reloaded.getNotifications()).some(n => n.id === first.id), false);
    if (url) {
      const fresh = new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] });
      try { assert.equal(await fresh.notification.findUnique({ where: { id: first.id } }), null); }
      finally { await fresh.$disconnect(); }
    }
  });
  await t.test('deletion concurrent with creation preserves the new event', async () => {
    const first = (await notifications.getNotifications())[0];
    const [, created] = await Promise.all([notifications.deleteNotifications(first.id), notifications.addNotification(makeNotification('adoption'))]);
    const list = await notifications.getNotifications();
    assert.ok(list.some(n => n.id === created.id));
    assert.ok(!list.some(n => n.id === first.id));
  });
  await t.test('clear history stays empty after a fresh read; empty ID never clears it', async () => {
    assert.equal((await notificationsApi.DELETE(request('/api/notifications?id=', 'DELETE', undefined, cookie))).status, 400);
    assert.ok((await notifications.getNotifications()).length > 0);
    assert.equal((await notificationsApi.DELETE(request('/api/notifications', 'DELETE', undefined, cookie))).status, 200);
    assert.deepEqual(await notifications.getNotifications(), []);
    assert.equal((await notificationsApi.DELETE(request('/api/notifications?id=missing', 'DELETE', undefined, cookie))).status, 404);
  });
  const saved = { badgeText: 'Community', mottoPart1: 'Persistent main text', mottoHighlight: 'Highlighted text', description: 'Description', button1Text: 'Adopt', button2Text: 'Report', fontFamily: 'fredoka', fontWeight: 'semibold', fontStyle: 'italic', textTransform: 'uppercase', fontSize: 'giant', highlightColor: 'gradient-gold', textAlignment: 'center' };
  await t.test('all content, buttons, fonts, sizes and colors survive saving and a new connection', async () => {
    assert.deepEqual(await settings.getHomeHeroSettings(), settings.DEFAULT_HOME_HERO_SETTINGS);
    const response = await homeApi.PUT(request('/api/home-settings', 'PUT', saved, cookie));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), saved);
    assert.deepEqual(await settings.getHomeHeroSettings(), saved);
    const publicGet = await homeApi.GET();
    assert.equal(publicGet.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await publicGet.json(), saved);
    if (url) {
      const fresh = new (require('@prisma/client').PrismaClient)({ datasourceUrl: url, log: [] });
      try { assert.equal((await fresh.homeSettings.findUnique({ where: { id: 'home' } })).mottoPart1, saved.mottoPart1); }
      finally { await fresh.$disconnect(); }
    }
    assert.equal((await notifications.getNotifications()).filter(n => n.title === 'Lema de inicio actualizado').length, 1);
  });
  await t.test('partial concurrent updates retain both fields and reject invalid configuration', async () => {
    const responses = await Promise.all([
      homeApi.PUT(request('/api/home-settings', 'PUT', { mottoPart1: 'Changed main' }, cookie)),
      homeApi.PUT(request('/api/home-settings', 'PUT', { highlightColor: 'emerald' }, cookie)),
    ]);
    assert.ok(responses.every(r => r.status === 200));
    const row = await settings.getHomeHeroSettings();
    assert.equal(row.mottoPart1, 'Changed main');
    assert.equal(row.highlightColor, 'emerald');
    for (const bad of [{ fontFamily: 'unsupported' }, { highlightColor: '#bad' }, { id: 'other' }, { button1Text: '' }, { description: 12 }, [], null]) {
      assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', bad, cookie))).status, 400);
    }
  });
  await t.test('anonymous, read-only, password-change and editor permissions remain enforced', async () => {
    assert.equal((await notificationsApi.GET(request('/api/notifications'))).status, 401);
    assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', saved))).status, 401);
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'voluntario' } });
    assert.equal((await notificationsApi.GET(request('/api/notifications', 'GET', undefined, cookie))).status, 200);
    assert.equal((await notificationsApi.DELETE(request('/api/notifications', 'DELETE', undefined, cookie))).status, 403);
    assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', saved, cookie))).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { role: 'editor', mustChangePassword: true } });
    assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', saved, cookie))).status, 403);
    await db.staffUser.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', saved, cookie))).status, 200);
  });
  await t.test('database read/write failures return 503, never success or fake empty data', async () => {
    const before = await notifications.getNotifications();
    try {
      fault = 'notification.deleteMany';
      assert.equal((await notificationsApi.DELETE(request('/api/notifications', 'DELETE', undefined, cookie))).status, 503);
      fault = 'notification.findMany';
      assert.equal((await notificationsApi.GET(request('/api/notifications', 'GET', undefined, cookie))).status, 503);
      fault = 'homeSettings.findUnique';
      assert.equal((await homeApi.GET()).status, 503);
    } finally { fault = undefined; }
    assert.deepEqual(await notifications.getNotifications(), before);
  });
  await t.test('failure to create the notification rolls back the home settings transaction', async () => {
    const before = await settings.getHomeHeroSettings();
    const beforeEvents = (await notifications.getNotifications()).length;
    try {
      fault = 'notification.create';
      assert.equal((await homeApi.PUT(request('/api/home-settings', 'PUT', { mottoPart1: 'Must roll back' }, cookie))).status, 503);
    } finally { fault = undefined; }
    assert.deepEqual(await settings.getHomeHeroSettings(), before);
    assert.equal((await notifications.getNotifications()).length, beforeEvents);
  });
  await t.test('explicit legacy import is idempotent, preserves IDs/read state and never overwrites conflicts', async () => {
    const importer = load('src/lib/site-content-import.ts');
    await db.notification.deleteMany({});
    await db.homeSettings.deleteMany({});
    const legacy = [{ ...makeNotification('order'), id: 'synthetic-legacy', createdAt: new Date().toISOString(), read: true }];
    const dry = await importer.importSiteContent(db, saved, legacy);
    assert.equal(dry.notificationsPending, 1);
    assert.deepEqual(await notifications.getNotifications(), []);
    assert.equal((await importer.importSiteContent(db, saved, legacy, true)).inserted, 1);
    assert.equal((await importer.importSiteContent(db, saved, legacy, true)).inserted, 0);
    assert.equal((await notifications.getNotifications())[0].id, legacy[0].id);
    assert.equal((await notifications.getNotifications())[0].read, true);
    await assert.rejects(importer.importSiteContent(db, { ...saved, mottoPart1: 'Conflict' }, legacy, true));
    await assert.rejects(importer.importSiteContent(db, saved, [{ ...legacy[0], read: false }], true));
    assert.equal((await settings.getHomeHeroSettings()).mottoPart1, saved.mottoPart1);
  });
  await t.test('official name normalizes legacy settings and persists on save without changing styles or URLs', async () => {
    const official = load('src/config/site.ts').SITE.name;
    const variants = ['DOG', 'Dog', 'dog'].flatMap(dog => ['Rescue', 'RESCUE', 'rescue'].map(rescue => `${dog} ${rescue} guatemala`));
    const link = 'https://example.invalid/DOG%20Rescue%20Guatemala';
    for (const name of variants) {
      assert.equal(normalizeRefugeName(`Hola ${name}! ${link}`), `Hola ${official}! ${link}`);
    }
    const original = await db.homeSettings.findUnique({ where: { id: 'home' } });
    await db.homeSettings.update({ where: { id: 'home' }, data: { description: variants[0], badgeText: variants[1] } });
    const visible = await (await homeApi.GET()).json();
    assert.equal(visible.description, official);
    assert.equal(visible.badgeText, official);
    assert.equal(visible.fontFamily, original.fontFamily);
    const response = await homeApi.PUT(request('/api/home-settings', 'PUT', { description: variants[2] }, cookie));
    assert.equal(response.status, 200);
    assert.equal((await db.homeSettings.findUnique({ where: { id: 'home' } })).description, official);
  });
});
