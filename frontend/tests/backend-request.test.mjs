import test from 'node:test';
import assert from 'node:assert/strict';
import { backendTarget, boundedJsonBody } from '../src/lib/backend-request.mjs';

test('API target preserves the versioned path for both configured base forms', () => {
  for (const base of ['http://localhost:4000/api/v1', 'http://localhost:4000/api/v1/'])
    assert.equal(backendTarget(base, 'media/showcase').href, 'http://localhost:4000/api/v1/media/showcase');
});
test('misconfigured base URLs produce controlled configuration failures', () => {
  for (const base of ['invalid', 'http://localhost:4000', 'file:///api/v1', 'http://user:password@localhost/api/v1', 'http://localhost/api/v1?x=1', 'http://localhost/api/v1#fragment'])
    assert.throws(() => backendTarget(base, 'pricing'), { status: 503 });
});
const json = (body, headers = {}) => new Request('http://localhost/api/backend/contact', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
test('ordinary JSON, empty body and malformed JSON have distinct behavior', async () => {
  assert.deepEqual(await boundedJsonBody(json('{"name":"Jordan"}')), { name: 'Jordan' });
  assert.deepEqual(await boundedJsonBody(new Request('http://localhost', { method: 'POST' })), {});
  await assert.rejects(boundedJsonBody(json('{')), { status: 400 });
});
test('wrong content type and oversized declared bodies are rejected', async () => {
  await assert.rejects(boundedJsonBody(json('{}', { 'content-type': 'text/plain' })), { status: 415 });
  await assert.rejects(boundedJsonBody(json('{}', { 'content-length': '32001' })), { status: 413 });
});
test('streamed bodies are cancelled at the byte limit without buffering the rest', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(20000)); controller.enqueue(new Uint8Array(20000)); }, cancel() { cancelled = true; } });
  const request = new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' });
  await assert.rejects(boundedJsonBody(request), { status: 413 }); assert.equal(cancelled, true);
});
test('UTF-8 byte count and malformed UTF-8 are checked', async () => {
  await assert.rejects(boundedJsonBody(json(JSON.stringify('é'.repeat(17000)))), { status: 413 });
  await assert.rejects(boundedJsonBody(json(new Uint8Array([0xff]))), { status: 400 });
});
