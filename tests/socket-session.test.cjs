// Actual socket lifecycle code with fake transport, timers and database I/O.
// Redis fan-out, network transport and real DB session checks remain integration gates.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { z } = require('zod');

async function harness() {
  const user = { id: 'user-1', role: 'BRAND', bannedAt: null, deletedAt: null };
  const state = { session: { id: 'session-1', userId: user.id, user, family: 'normal', revokedAt: null, expiresAt: new Date(Date.now() + 604800000) }, disconnected: false, checksFail: false, presence: 0, events: {} };
  class Server {
    adapter() {} use(fn) { state.authenticate = fn; }
    on(name, fn) { if (name === 'connection') state.connect = fn; }
  }
  class Redis { duplicate() { return new Redis(); } async subscribe() {} on() {} async quit() {} }
  const dependencies = {
    'socket.io': { Server }, '@socket.io/redis-adapter': { createAdapter: () => ({}) }, ioredis: Redis,
    '../../core/db': {
      db: { refreshToken: { findUnique: async () => { if (state.checksFail) throw new Error('DB unavailable'); return state.session; } }, user: { findFirst: async () => user } },
      redis: { zadd: async () => { state.presence++; }, expire: async () => {}, zrem: async () => {} },
    },
    '../../core/security': { verifyAccess: () => ({ sub: user.id, sid: 'session-1', exp: Math.floor(Date.now() / 1000) + 60 }) },
    '../../config': { env: { REDIS_URL: 'redis://test', CORS_ORIGINS: 'https://test.invalid' } },
    '../../core/http': { assert: (ok, _status, _code, message) => { if (!ok) throw new Error(message); }, log: { warn() {} } },
    './service': { participant: async () => {}, message: async () => {}, markRead: async () => {}, setRealtime() {} },
    './routes': { messageSchema: z.object({}) }, zod: { z },
  };
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../backend/src/modules/chat/socket.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const context = { module, exports: module.exports, require: name => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; }, Date,
    setTimeout: (fn, delay) => { state.expiry = { fn, delay }; return { unref() {} }; },
    setInterval: (fn, delay) => { state.interval = { fn, delay }; return { unref() {} }; },
    clearTimeout: () => { state.timeoutCleared = true; }, clearInterval: () => { state.intervalCleared = true; },
  };
  vm.runInNewContext(source, context, { filename: 'socket.ts' });
  await module.exports.socketServer({});
  const socket = { id: 'socket-1', data: {}, handshake: { headers: {}, auth: { token: 'fixture' } },
    join: async () => {}, use: fn => { state.packetGuard = fn; }, on: (name, fn) => { state.events[name] = fn; },
    disconnect: () => { state.disconnected = true; state.events.disconnect?.(); },
  };
  state.socket = socket;
  state.start = async () => { await state.authenticate(socket, error => { if (error) throw error; }); state.connect(socket); await new Promise(setImmediate); };
  state.tick = async () => { state.interval.fn(); await new Promise(setImmediate); };
  return state;
}
test('idle valid socket publishes presence and schedules token expiry', async () => {
  const state = await harness(); await state.start();
  assert.equal(state.disconnected, false); assert.equal(state.presence, 1);
  assert.equal(state.interval.delay, 30000); assert.ok(state.expiry.delay > 0 && state.expiry.delay <= 60000);
});
for (const reason of ['revoked', 'banned', 'deleted', 'expired']) {
  test('idle socket disconnects after session becomes ' + reason, async () => {
    const state = await harness(); await state.start();
    if (reason === 'revoked') state.session.revokedAt = new Date();
    if (reason === 'banned') state.session.user.bannedAt = new Date();
    if (reason === 'deleted') state.session.user.deletedAt = new Date();
    if (reason === 'expired') state.session.expiresAt = new Date(0);
    await state.tick(); assert.equal(state.disconnected, true); assert.equal(state.presence, 1);
    assert.equal(state.timeoutCleared, true); assert.equal(state.intervalCleared, true);
  });
}
test('token expiry disconnects without requiring an incoming packet', async () => {
  const state = await harness(); await state.start(); state.expiry.fn(); assert.equal(state.disconnected, true);
});
test('session recheck failure disconnects an idle socket', async () => {
  const state = await harness(); await state.start(); state.checksFail = true; await state.tick(); assert.equal(state.disconnected, true);
});
test('read-only impersonation cannot open an interactive socket', async () => {
  const state = await harness(); state.session.family = 'impersonation:admin';
  await assert.rejects(state.start(), /Authentication failed/);
});
