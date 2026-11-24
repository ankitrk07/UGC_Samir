// Process/timer doubles exercise supervisor behavior without starting fake services.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

async function launch({ healthy = true, live = false } = {}) {
  const state = { children: [], killed: [], logs: [], handlers: {}, readyCalled: false };
  const processDouble = { platform: 'win32', execPath: 'node-fixture', env: {}, once: (name, fn) => { state.handlers[name] = fn; }, stdout: { write() {} } };
  const dependencies = {
    'node:path': path,
    'node:net': { createServer: () => ({ once() {}, listen(_port, _host, callback) { callback(); }, close(callback) { callback(); } }) },
    './setup-local.cjs': { setupLocal: () => [] },
    'node:child_process': {
      execFileSync: (command, args) => {
        if (command === 'taskkill.exe') { state.killed.push(args); return ''; }
        if (!healthy) { const error = new Error('preflight failed'); error.stdout = JSON.stringify({ readyToStart: false }); throw error; }
        return JSON.stringify({ readyToStart: true, mode: 'development', apiPort: 4000, livePaymentKeys: live });
      },
      spawn: (command, args, options) => {
        const child = new EventEmitter(); child.pid = 8000 + state.children.length;
        state.children.push({ command, args, options, child, readyChecked: state.readyCalled }); return child;
      },
    },
  };
  const filename = path.resolve(__dirname, '../scripts/dev-all.cjs');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    __dirname: path.dirname(filename), process: processDouble, require: name => dependencies[name],
    console: { log: message => state.logs.push(message), error: message => state.logs.push(message) }, Date, setTimeout,
    AbortSignal: { timeout: () => ({}) }, fetch: async () => { state.readyCalled = true; return { ok: true }; },
  }, { filename });
  await new Promise(setImmediate); state.process = processDouble; return state;
}
test('combined launcher waits for API readiness and stops only its owned remaining process trees', async () => {
  const state = await launch();
  assert.equal(state.children.length, 3);
  assert.match(state.children[0].args.join(' '), /dev:api/); assert.equal(state.children[0].readyChecked, false);
  assert.equal(state.children[1].readyChecked, true); assert.equal(state.children[2].readyChecked, true);
  assert.equal(state.children[2].options.env.PORT, '3000');
  state.children[1].child.emit('exit', 1, null);
  assert.equal(state.process.exitCode, 1);
  const killed = state.killed.map(args => Number(args[1])).sort();
  assert.deepEqual(killed, [8000, 8002]);
});
test('failed preflight starts no API, worker or frontend process', async () => {
  const state = await launch({ healthy: false }); assert.equal(state.children.length, 0); assert.equal(state.process.exitCode, 1); assert.equal(state.killed.length, 0);
});
test('development launcher refuses live payment keys before starting processes', async () => {
  const state = await launch({ live: true }); assert.equal(state.children.length, 0); assert.equal(state.process.exitCode, 1);
});
