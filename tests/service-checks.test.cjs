const test = require('node:test');
const assert = require('node:assert/strict');
const { checkPostgres, checkRedis, checkProxy, connectionUrl, missingPackages, safeCode, expectedMigrations } = require('../scripts/check-services.cjs');
test('blank SMTP is explicitly disabled without a network probe; partial config fails', async () => {
  const { checkSmtp } = require('../scripts/check-services.cjs');
  assert.equal((await checkSmtp('', '', '', '', '')).status, 'DISABLED');
  assert.equal((await checkSmtp('localhost', '', '')).status, 'FAIL');
  assert.equal((await checkSmtp('localhost', '1025', 'test@example.com', 'user', '')).status, 'FAIL');
});

test('service checker rejects REST/malformed connection URLs', async () => {
  assert.equal(connectionUrl('https://redis.example/rest', ['redis:', 'rediss:']), null);
  assert.equal((await checkPostgres('invalid')).status, 'BLOCKED');
  assert.equal((await checkRedis('https://redis.example')).status, 'BLOCKED');
});
test('missing packages are blocked rather than reported as connected', async () => {
  const absent = () => { throw new Error('not installed'); };
  assert.equal((await checkPostgres('postgresql://localhost/test', absent)).status, 'BLOCKED');
  assert.equal((await checkRedis('redis://localhost', absent)).status, 'BLOCKED');
  assert.ok(missingPackages(absent).includes('express'));
});
test('PostgreSQL success requires the actual query result and closes the client', async () => {
  let queried = false, closed = false;
  class Client { async $queryRaw(parts) { queried = true; return parts[0].includes('_prisma_migrations') ? expectedMigrations().map(name => ({ migration_name: name, finished_at: new Date(), rolled_back_at: null })) : [{ ok: 1 }]; } async $disconnect() { closed = true; } }
  const result = await checkPostgres('postgresql://user:secret@localhost/test', () => ({ PrismaClient: Client }));
  assert.equal(result.status, 'PASS'); assert.equal(queried, true); assert.equal(closed, true); assert.equal(result.migrationHistoryVerified, true); assert.equal(result.constraintsVerified, false);
});
test('a reachable database with missing migration history cannot pass startup', async () => {
  class Client { async $queryRaw(parts) { return parts[0].includes('_prisma_migrations') ? [] : [{ ok: 1 }]; } async $disconnect() {} }
  assert.equal((await checkPostgres('postgresql://localhost/test', () => ({ PrismaClient: Client }))).status, 'FAIL');
});
test('database errors never print connection credentials', async () => {
  let closed = false;
  class Client { async $queryRaw() { const e = new Error('password=TOP_SECRET'); e.code = 'P1000'; throw e; } async $disconnect() { closed = true; } }
  const result = await checkPostgres('postgresql://user:TOP_SECRET@localhost/test', () => ({ PrismaClient: Client }));
  assert.equal(result.status, 'FAIL'); assert.equal(closed, true); assert.equal(result.code, 'P1000'); assert.equal(JSON.stringify(result).includes('TOP_SECRET'), false);
  assert.equal(safeCode({ code: 'secret value' }), 'SERVICE_CHECK_FAILED');
});
function redisDriver({ pong = 'PONG', version = '7.2.0', lua = 1, error = false } = {}) {
  const state = { disconnected: false };
  class Redis { on() {} async connect() { if (error) throw new Error('password=TOP_SECRET'); } async ping() { return pong; } async info() { return 'redis_version:' + version + '\r\n'; } async eval() { return lua; } disconnect() { state.disconnected = true; } }
  return { require: () => Redis, state };
}
test('Redis success checks protocol, version and Lua rather than only a TCP port', async () => {
  const driver = redisDriver(); const result = await checkRedis('redis://localhost', driver.require);
  assert.equal(result.status, 'PASS'); assert.equal(result.version, '7.2.0'); assert.equal(result.queuesVerified, false); assert.equal(driver.state.disconnected, true);
});
test('old or incompatible Redis responses fail and disconnect', async () => {
  for (const options of [{ version: '6.0.0' }, { pong: 'OK' }, { lua: 0 }, { version: 'invalid' }]) {
    const driver = redisDriver(options); assert.equal((await checkRedis('redis://localhost', driver.require)).status, 'FAIL'); assert.equal(driver.state.disconnected, true);
  }
});
test('Redis failures redact secret error messages', async () => {
  const driver = redisDriver({ error: true }); const result = await checkRedis('rediss://user:TOP_SECRET@redis.example', driver.require);
  assert.equal(result.status, 'FAIL'); assert.equal(JSON.stringify(result).includes('TOP_SECRET'), false); assert.equal(driver.state.disconnected, true);
});
test('combined startup accepts the actual versioned local proxy', async () => {
  assert.equal((await checkProxy({ API_URL: 'http://localhost:4000/api/v1' }, 4000)).status, 'PASS');
});
test('combined startup rejects mismatched ports and external API targets', async () => {
  for (const base of ['http://localhost:5000/api/v1', 'https://api.example.com/api/v1'])
    assert.equal((await checkProxy({ API_URL: base }, 4000)).status, 'FAIL');
});
test('combined startup rejects missing or malformed API bases', async () => {
  assert.equal((await checkProxy({}, 4000)).status, 'FAIL');
  assert.equal((await checkProxy({ API_URL: 'http://localhost:4000' }, 4000)).status, 'FAIL');
});
