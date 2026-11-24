const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setupLocal } = require('../scripts/setup-local.cjs');

test('local setup generates independent secrets and preserves existing configuration on rerun', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trendhive-setup-'));
  try {
    fs.mkdirSync(path.join(root, 'backend')); fs.mkdirSync(path.join(root, 'frontend'));
    fs.writeFileSync(path.join(root, 'backend/.env.example'), 'JWT_SECRET=placeholder\nENCRYPTION_KEY=placeholder\n');
    fs.writeFileSync(path.join(root, 'frontend/.env.example'), 'API_URL=http://localhost:4000/api/v1\n');
    assert.equal(setupLocal(root).filter(x => x.result === 'created').length, 2);
    const content = fs.readFileSync(path.join(root, 'backend/.env'), 'utf8');
    assert.match(content, /JWT_SECRET=[a-f0-9]{96}/); assert.match(content, /ENCRYPTION_KEY=[a-f0-9]{64}/);
    fs.appendFileSync(path.join(root, 'frontend/.env.local'), 'USER_OVERRIDE=preserve\n');
    assert.equal(setupLocal(root).filter(x => x.result === 'preserved existing file').length, 2);
    assert.equal(fs.readFileSync(path.join(root, 'backend/.env'), 'utf8'), content);
    assert.match(fs.readFileSync(path.join(root, 'frontend/.env.local'), 'utf8'), /USER_OVERRIDE=preserve/);
  } finally {
    assert.equal(path.dirname(root), os.tmpdir()); assert.ok(path.basename(root).startsWith('trendhive-setup-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
