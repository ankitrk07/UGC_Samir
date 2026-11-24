// Runs the actual dispatcher with fake BullMQ/SMTP/database I/O, not a real worker.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { z } = require('zod');

async function harness(events = []) {
  const state = { added: [], schedules: [], events, handlers: {} };
  class UnrecoverableError extends Error {}
  class DelayedError extends Error {}
  class Worker { constructor(_name, handler) { state.dispatch = handler; } on() {} async close() {} }
  const db = {
    outboxEvent: { findUnique: async ({ where }) => events.find(e => e.id === where.id), findMany: async ({ where, take }) => events.filter(e => !e.processedAt && (!where.type || e.type !== where.type.not) && (!where.attempts || e.attempts < where.attempts.lt)).slice(0, take) },
    $disconnect: async () => {},
  };
  const dependencies = {
    bullmq: { Worker, UnrecoverableError, DelayedError }, nodemailer: { createTransport: () => ({ close() {} }) },
    './config': { env: { SMTP_PORT: 1025 } }, './core/db': { db, redis: { quit: async () => {} }, transaction: fn => fn(db) },
    './core/http': { AppError: class extends Error {}, log: { error() {}, fatal() {} } },
    './jobs': { jobs: { upsertJobScheduler: async (...args) => state.schedules.push(args), add: async (...args) => state.added.push(args), close: async () => {} }, queueConnection: { quit: async () => {} } },
    './modules/social/jobs': { syncPost: async () => {} }, './modules/media/jobs': { processMedia: async () => {}, purgeMedia: async () => {} },
    './modules/payments/refunds': { processRefund: async () => {} }, './modules/chat/service': { notify: async () => {} }, zod: { z },
  };
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../backend/src/worker.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext('(function(require,module,exports,process){' + source + '\n})', { filename: 'worker.ts' })(name => {
    assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name];
  }, module, module.exports, { once: (name, fn) => { state.handlers[name] = fn; }, exit() {} });
  await module.exports.startWorker(); return state;
}
test('exhausted outbox events cannot starve later deliverable events', async () => {
  const events = [...Array.from({ length: 200 }, (_, i) => ({ id: 'exhausted-' + i, attempts: 5 })), { id: 'new-event', attempts: 0 }];
  const state = await harness(events); await state.dispatch({ name: 'outbox' });
  assert.equal(state.added.length, 1); assert.equal(state.added[0][1].id, 'new-event');
  assert.equal(state.added[0][2].jobId, 'outbox-new-event');
});
test('outbox dispatch uses stable job IDs across scheduler ticks', async () => {
  const state = await harness([{ id: 'retry-event', attempts: 2 }]);
  await state.dispatch({ name: 'outbox' }); await state.dispatch({ name: 'outbox' });
  assert.equal(state.added[0][2].jobId, state.added[1][2].jobId);
  assert.equal(new Set(state.schedules.map(s => s[0])).size, 3);
});
test('unknown job types fail instead of being silently acknowledged', async () => {
  const state = await harness(); await assert.rejects(state.dispatch({ name: 'unknown-job' }), /Unsupported job type/);
});
test('blank SMTP does not starve other events or consume email attempts', async () => {
  const events = [...Array.from({ length: 200 }, (_, i) => ({ id: 'mail-' + i, type: 'email', attempts: 0 })), { id: 'notification', type: 'notification', attempts: 0 }];
  const state = await harness(events); await state.dispatch({ name: 'outbox' });
  assert.deepEqual(state.added.map(args => args[1].id), ['notification']);
  assert.equal(events[0].attempts, 0); assert.equal(events[0].processedAt, undefined);
});
test('already queued email is delayed with its lock token while SMTP is blank', async () => {
  const event = { id: 'paused-mail', type: 'email', attempts: 0 };
  const state = await harness([event]); let delayed;
  await assert.rejects(state.dispatch({ name: 'process-outbox', data: { id: event.id }, moveToDelayed: async (time, token) => { delayed = { time, token }; } }, 'lock-token'), e => e.constructor.name === 'DelayedError');
  assert.equal(delayed.token, 'lock-token'); assert.ok(delayed.time > Date.now());
  assert.equal(event.attempts, 0); assert.equal(event.processedAt, undefined);
});
