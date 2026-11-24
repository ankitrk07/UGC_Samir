const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const { z } = require('zod');

function configuration() {
  const valid = { DATABASE_URL: 'postgresql://local:local@localhost:5432/local_test', REDIS_URL: 'redis://localhost:6379/15', JWT_SECRET: crypto.randomBytes(48).toString('hex'), ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex') };
  const state = {}, module = { exports: {} };
  const filename = path.resolve(__dirname, '../backend/src/config.ts');
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, __dirname: path.dirname(filename), URL, process: { env: valid }, require: name => {
    if (name === 'dotenv') return { config: options => { state.loaded = options.path; } };
    if (name === 'node:path') return path;
    if (name === 'zod') return { z };
    throw new Error(name);
  } });
  return { parse: module.exports.parseEnv, valid, state };
}
test('blank SMTP disables delivery; partial settings are rejected', () => {
  const { parse, valid } = configuration();
  const blank = { SMTP_HOST: '', SMTP_PORT: '', SMTP_USER: '', SMTP_PASSWORD: '', EMAIL_FROM: '' };
  const parsed = parse({ ...valid, ...blank });
  assert.equal(parsed.SMTP_HOST, undefined); assert.equal(parsed.SMTP_PORT, undefined);
  for (const partial of [{ SMTP_HOST: 'localhost' }, { SMTP_PORT: '1025' }, { SMTP_USER: 'user' }]) assert.throws(() => parse({ ...valid, ...blank, ...partial }));
  assert.equal(parse({ ...valid, SMTP_HOST: 'localhost', SMTP_PORT: '1025', EMAIL_FROM: 'test@example.com' }).SMTP_PORT, 1025);
});
test('backend env path resolves within its workspace and valid development defaults parse', () => {
  const { parse, valid, state } = configuration();
  assert.equal(state.loaded, path.resolve(__dirname, '../backend/.env'));
  assert.equal(parse(valid).PORT, 4000); assert.equal(parse(valid).SITE_URL, 'http://localhost:3000');
});
test('wrong database/Redis protocols and invalid SMTP ports are rejected', () => {
  const { parse, valid } = configuration();
  for (const invalid of [{ DATABASE_URL: 'https://example.com/db' }, { REDIS_URL: 'https://example.com/cache' }, { SMTP_PORT: '0' }, { SMTP_PORT: '65536' }, { TERMS_VERSION: '' }]) assert.throws(() => parse({ ...valid, ...invalid }));
});
test('origins reject paths, trailing slash, user credentials and wildcard CORS', () => {
  const { parse, valid } = configuration();
  for (const invalid of [{ API_URL: 'http://localhost:4000/api/v1' }, { SITE_URL: 'http://localhost:3000/' }, { CORS_ORIGINS: '*' }, { SITE_URL: 'https://user:secret@example.com' }, { CORS_ORIGINS: 'http://localhost:3000,' }]) assert.throws(() => parse({ ...valid, ...invalid }));
});
test('production requires HTTPS, live social mode and non-placeholder encryption secrets', () => {
  const { parse, valid } = configuration();
  const production = { ...valid, NODE_ENV: 'production', SOCIAL_MODE: 'live', SITE_URL: 'https://trendhive.example', API_URL: 'https://api.trendhive.example', CORS_ORIGINS: 'https://trendhive.example' };
  assert.equal(parse(production).NODE_ENV, 'production');
  for (const invalid of [{ SOCIAL_MODE: 'mock' }, { SITE_URL: 'http://trendhive.example' }, { ENCRYPTION_KEY: 'a'.repeat(64) }, { JWT_SECRET: 'development-only-replace-with-at-least-32-random-characters' }]) assert.throws(() => parse({ ...production, ...invalid }));
});
