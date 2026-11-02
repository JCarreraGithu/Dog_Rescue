const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

test('private-file CLI validates offline, never leaks hashes and rejects unsafe invocation', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dog-rescue-import-test-'));
  const file = path.join(directory, 'synthetic-users.json');
  const salt = crypto.randomBytes(16);
  const password = crypto.randomBytes(24);
  const hash = `scrypt$${salt.toString('hex')}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  const input = { users: [{ id: 'synthetic-only', name: 'Test', email: 'synthetic@example.invalid', role: 'superadmin', passwordHash: hash, active: true, mustChangePassword: false, sessionVersion: 2, createdAt: new Date().toISOString() }] };
  const env = { ...process.env };
  delete env.STAFF_IMPORT_DATABASE_URL;
  delete env.STAFF_IMPORT_EXPECT_HOST;
  const run = args => spawnSync(process.execPath, ['.private-tools/scripts/import-staff.js', ...args], { env, encoding: 'utf8', windowsHide: true });
  try {
    fs.writeFileSync(file, JSON.stringify(input), { mode: 0o600 });
    const offline = run([file]);
    assert.equal(offline.status, 0);
    assert.deepEqual(JSON.parse(offline.stdout), { validated: 1, databaseAccess: false });
    for (const result of [offline, run([file, '--apply']), run(['src/data/admin-users.json']), run([file, '--unknown'])]) {
      assert.ok(!`${result.stdout}${result.stderr}`.includes(hash), 'no hash in output');
    }
    assert.equal(run([file, '--apply']).status, 1);
    assert.equal(run([file, '--check-db', '--apply']).status, 1);
    assert.equal(run([path.resolve('package.json')]).status, 1);
    fs.writeFileSync(file, '{"users": [invalid-json', { mode: 0o600 });
    const broken = run([file]);
    assert.equal(broken.status, 1);
    assert.ok(!broken.stderr.includes('invalid-json'));
  } finally {
    // Solo archivos sintéticos creados por este test, nunca el original recuperado.
    fs.unlinkSync(file);
    fs.rmdirSync(directory);
  }
});
