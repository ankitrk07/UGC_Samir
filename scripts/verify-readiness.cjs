// Records actual command results. Never promotes a missing prerequisite to PASS.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const net = require('node:net');
process.chdir(path.resolve(__dirname, '..'));
const runDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const outputDir = path.join('artifacts', 'verification', runDate, 'run-' + Date.now());
fs.mkdirSync(outputDir, { recursive: true });
const report = { startedAt: new Date().toISOString(), node: process.version, productionReady: false, checks: [] };
function run(id, command, args, timeout = 60000) {
  const startedAt = new Date().toISOString();
  const result = cp.spawnSync(command, args, { encoding: 'utf8', timeout, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  const log = path.join(outputDir, id + '.log');
  fs.writeFileSync(log, (result.stdout || '') + (result.stderr || '') + (result.error ? '\n' + result.error.message : ''));
  const entry = { id, command: [command, ...args], startedAt, endedAt: new Date().toISOString(), exitCode: result.status, status: result.status === 0 && !result.error ? 'PASS' : 'FAIL', error: result.error?.code, log };
  report.checks.push(entry); console.log(id + ': ' + entry.status + ' (exit ' + entry.exitCode + ')');
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
}
function blocked(id, reason) { report.checks.push({ id, status: 'BLOCKED', reason }); console.log(id + ': BLOCKED (' + reason + ')'); }
function isolatedServicesConfigured() {
  try {
    const database = new URL(process.env.DATABASE_URL), redis = new URL(process.env.REDIS_URL);
    return database.pathname.endsWith('_test') && redis.pathname === '/15';
  } catch { return false; }
}
async function tcp(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    let done = false;
    const finish = (status, reason) => { if (done) return; done = true; socket.destroy(); resolve({ id: 'tcp-' + port, host: '127.0.0.1', port, status, reason }); };
    socket.setTimeout(2000); socket.on('connect', () => finish('REACHABLE', 'TCP only; authentication and database queries not tested'));
    socket.on('error', error => finish('UNAVAILABLE', error.code)); socket.on('timeout', () => finish('UNAVAILABLE', 'TIMEOUT'));
  });
}
async function main() {
  report.prerequisites = {
    databaseUrlConfiguredInProcess: Boolean(process.env.DATABASE_URL),
    redisUrlConfiguredInProcess: Boolean(process.env.REDIS_URL),
    backendEnvFilePresent: fs.existsSync('backend/.env'),
    frontendEnvFilePresent: fs.existsSync('frontend/.env.local'),
    services: await Promise.all([tcp(5432), tcp(6379)]),
  };
  const localTests = [...fs.readdirSync('tests').filter(f => f.endsWith('.test.cjs')).map(f => 'tests/' + f), ...fs.readdirSync('frontend/tests').filter(f => f.endsWith('.test.mjs')).map(f => 'frontend/tests/' + f)];
  run('offline-tests', process.execPath, ['--test', ...localTests]);
  run('backend-source', process.execPath, ['scripts/verify-source.cjs']);
  run('schema-source-audit', process.execPath, ['scripts/audit-schema.cjs']);
  run('backend-strict-typecheck', process.execPath, ['node_modules/typescript/bin/tsc', '--project', 'backend/tsconfig.json', '--noEmit']);
  const npm = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'npm.cmd']] : ['npm', []];
  const npmRun = (id, args, timeout) => run(id, npm[0], [...npm[1], ...args], timeout);
  if (isolatedServicesConfigured()) {
    npmRun('backend-migrate', ['run', 'db:migrate', '-w', 'backend']);
    run('authenticated-services', process.execPath, ['scripts/check-services.cjs'], 35000);
    npmRun('backend-coverage', ['run', 'test:coverage', '-w', 'backend']);
  } else {
    blocked('backend-migrate', 'Set process DATABASE_URL to a dedicated *_test database and REDIS_URL to Redis DB 15.');
    blocked('backend-coverage', 'Test-service isolation guard rejected missing or unsafe test connections.');
    run('authenticated-services', process.execPath, ['scripts/check-services.cjs'], 35000);
  }
  npmRun('dependency-audit', ['audit', '--audit-level=high', '--cache', '.npm-verification-cache', '--fetch-retries=0', '--fetch-timeout=10000']);
  // A full frontend build is optional because it can take several minutes.
  if (process.argv.includes('--frontend-build')) npmRun('frontend-build', ['run', 'build', '-w', 'frontend'], 300000);
  const spec = JSON.parse(fs.readFileSync('backend/openapi.json', 'utf8'));
  const executedBackend = report.checks.some(c => c.id === 'backend-coverage' && c.status === 'PASS');
  const operationStatus = executedBackend ? 'NOT_TRACKED' : 'NOT_RUN';
  report.apiOperations = Object.entries(spec.paths).flatMap(([url, methods]) => Object.entries(methods).filter(([method]) => ['get', 'post', 'patch', 'delete', 'put'].includes(method)).map(([method, operation]) => ({ method: method.toUpperCase(), path: url, auth: operation['x-roles']?.join(', ') || (operation.security ? 'Authenticated' : 'Public / provider signature'), success: operationStatus, authentication: operationStatus, authorization: operationStatus, validation: operationStatus, ownership: operationStatus })));
  fs.writeFileSync('docs/API-OPERATION-VERIFICATION.md', '# API operation execution status\n\nPer-operation real API execution evidence is not available. These are execution statuses, not route-declaration checks. There are 139 registered routes plus 2 raw-body provider webhook operations (141 total). All success, auth, validation and ownership checks below remain open. NOT_RUN means the backend suite did not execute; NOT_TRACKED means a suite ran but no per-operation evidence was collected.\n\n| Method | Path | Access | Success | Auth / RBAC | Validation / ownership |\n|---|---|---|---|---|---|\n' + report.apiOperations.map(o => '| ' + o.method + ' | ' + o.path + ' | ' + o.auth + ' | ' + o.success + ' | ' + o.authentication + ' | ' + o.validation + ' |').join('\n') + '\n');
  report.finishedAt = new Date().toISOString();
  report.serviceCoverage = { status: 'NOT_MEASURED', requiredPercent: 70, observedPercent: null };
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  fs.mkdirSync('artifacts/verification/current', { recursive: true });
  fs.writeFileSync('artifacts/verification/current/results.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Recorded ' + report.apiOperations.length + ' API operations without per-operation verification; no production approval.');
  process.exitCode = report.checks.some(c => c.status !== 'PASS') ? 1 : 0;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
