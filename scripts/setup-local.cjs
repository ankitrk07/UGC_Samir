const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');

function setupLocal(directory = root) {
  const results = [];
  for (const [example, destination] of [['backend/.env.example', 'backend/.env'], ['frontend/.env.example', 'frontend/.env.local']]) {
    const target = path.resolve(directory, destination);
    let content = fs.readFileSync(path.resolve(directory, example), 'utf8');
    if (destination === 'backend/.env') {
      content = content.replace(/^JWT_SECRET=.*$/m, () => 'JWT_SECRET=' + randomBytes(48).toString('hex'));
      content = content.replace(/^ENCRYPTION_KEY=.*$/m, () => 'ENCRYPTION_KEY=' + randomBytes(32).toString('hex'));
    }
    try {
      fs.writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
      results.push({ file: destination, result: 'created' });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      results.push({ file: destination, result: 'preserved existing file' });
    }
  }
  return results;
}
if (require.main === module) {
  for (const result of setupLocal()) console.log(result.file + ': ' + result.result);
  console.log('Local configuration only. Start PostgreSQL/Redis and the API separately. Restart Next.js to load frontend/.env.local.');
}
module.exports = { setupLocal };
