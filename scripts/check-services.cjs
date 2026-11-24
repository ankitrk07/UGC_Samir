const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const backendRequire = createRequire(path.join(root, 'backend/package.json'));

function safeCode(error) {
  const code = error?.code || error?.errorCode;
  return typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code) ? code : 'SERVICE_CHECK_FAILED';
}
function loadEnvironment() {
  const filename = path.join(root, 'backend/.env');
  if (!fs.existsSync(filename)) return;
  try { backendRequire('dotenv').config({ path: filename }); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    if (typeof process.loadEnvFile === 'function') process.loadEnvFile(filename);
  }
}
function missingPackages(resolvePackage = name => backendRequire.resolve(name)) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
  return [...Object.keys(manifest.dependencies), 'tsx'].filter(name => {
    try { resolvePackage(name); return false; } catch { return true; }
  });
}
function connectionUrl(value, protocols) {
  try { const url = new URL(value); return protocols.includes(url.protocol) ? url : null; } catch { return null; }
}
async function deadline(promise, ms = 8000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => { const error = new Error('Service check timeout'); error.code = 'CHECK_TIMEOUT'; reject(error); }, ms); })]);
  } finally { clearTimeout(timer); }
}
async function checkPostgres(value, requirePackage = backendRequire) {
  const url = connectionUrl(value, ['postgres:', 'postgresql:']);
  if (!url) return { status: 'BLOCKED', reason: 'Set DATABASE_URL to a PostgreSQL connection URL in backend/.env.' };
  let PrismaClient;
  try { ({ PrismaClient } = requirePackage('@prisma/client')); }
  catch { return { status: 'BLOCKED', reason: 'Install backend packages manually and run npm run db:generate -w backend.' }; }
  let client;
  try {
    for (const [key, setting] of [['connect_timeout', '5'], ['pool_timeout', '5'], ['connection_limit', '1']]) url.searchParams.set(key, setting);
    client = new PrismaClient({ datasources: { db: { url: url.href } }, log: [], errorFormat: 'minimal' });
    const rows = await deadline(client.$queryRaw`SELECT 1 AS ok`);
    if (!Array.isArray(rows) || rows[0]?.ok !== 1) return { status: 'FAIL', reason: 'PostgreSQL did not return the expected SELECT 1 result.' };
    const history = await deadline(client.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`);
    const expected = expectedMigrations();
    const applied = new Set(history.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name));
    if (history.some(row => !row.finished_at && !row.rolled_back_at) || expected.some(name => !applied.has(name)) || [...applied].some(name => !expected.includes(name)))
      return { status: 'FAIL', reason: 'Database migration history does not match this checkout. Resolve failed/pending migrations against the intended development database.' };
    return { status: 'PASS', check: 'Authenticated PostgreSQL SELECT 1 and migration history', migrationHistoryVerified: true, constraintsVerified: false };
  } catch (error) {
    return { status: 'FAIL', code: safeCode(error), reason: 'PostgreSQL query/history check failed. Check server, credentials, TLS, generated Prisma Client and development migrations.' };
  } finally { if (client) await deadline(client.$disconnect(), 2000).catch(() => {}); }
}
function expectedMigrations() { return fs.readdirSync(path.join(root, 'backend/prisma/migrations'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort(); }
async function checkRedis(value, requirePackage = backendRequire) {
  if (!connectionUrl(value, ['redis:', 'rediss:'])) return { status: 'BLOCKED', reason: 'Set REDIS_URL to a Redis TCP/TLS URL, not a REST endpoint.' };
  let Redis;
  try { const pkg = requirePackage('ioredis'); Redis = pkg.default || pkg; }
  catch { return { status: 'BLOCKED', reason: 'Install the backend ioredis dependency manually.' }; }
  let client;
  try {
    client = new Redis(value, { lazyConnect: true, connectTimeout: 4000, commandTimeout: 4000, maxRetriesPerRequest: 1, retryStrategy: () => null });
    client.on('error', () => {});
    await deadline(client.connect(), 5000);
    const pong = await deadline(client.ping(), 5000);
    const info = await deadline(client.info('server'), 5000);
    const match = info.match(/^redis_version:(\d+)\.(\d+)\.(\d+)/m);
    if (pong !== 'PONG' || !match || Number(match[1]) < 6 || (Number(match[1]) === 6 && Number(match[2]) < 2))
      return { status: 'FAIL', reason: 'Redis must return PONG and report version 6.2+; Redis 7 is the project target.' };
    if (Number(await deadline(client.eval('return 1', 0), 5000)) !== 1)
      return { status: 'FAIL', reason: 'Redis Lua execution is required for queues and rate limits.' };
    return { status: 'PASS', check: 'Authenticated Redis PING, INFO and read-only Lua', version: match.slice(1).join('.'), queuesVerified: false };
  } catch (error) {
    return { status: 'FAIL', code: safeCode(error), reason: 'Redis protocol check failed. Check credentials, TLS, supported commands and server availability.' };
  } finally { client?.disconnect(); }
}
function checkSmtp(host, port, from, user, password) {
  const values = [host, port, from, user, password].map(value => typeof value === 'string' ? value.trim() : value);
  if (values.every(value => !value)) return Promise.resolve({ status: 'DISABLED', reason: 'SMTP is blank. Email delivery is paused; verification is not bypassed.' });
  if (!values.slice(0, 3).every(Boolean) || !Number.isInteger(Number(port)) || Number(port) < 1 || Number(port) > 65535 || Boolean(user) !== Boolean(password))
    return Promise.resolve({ status: 'FAIL', reason: 'Configure SMTP host, port and sender together, and either both credentials or neither.' });
  return new Promise(resolve => {
    const socket = net.connect({ host, port }); let finished = false;
    const finish = result => { if (finished) return; finished = true; socket.destroy(); resolve(result); };
    socket.setTimeout(1500);
    socket.once('connect', () => finish({ status: 'WARN', reachable: true, reason: 'SMTP TCP reachable; authentication/delivery not verified.' }));
    socket.once('error', () => finish({ status: 'WARN', reachable: false, reason: 'Email is unavailable until a native SMTP catcher or real SMTP provider is configured.' }));
    socket.once('timeout', () => finish({ status: 'WARN', reachable: false, reason: 'SMTP TCP check timed out.' }));
  });
}
async function checkProxy(settings, port) {
  try {
    const { backendTarget } = await import(pathToFileURL(path.join(root, 'frontend/src/lib/backend-request.mjs')).href);
    const target = backendTarget(settings.API_URL || settings.NEXT_PUBLIC_API_URL || '', 'auth/me');
    const targetPort = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || target.protocol !== 'http:' || targetPort !== port)
      return { status: 'FAIL', reason: 'Combined local startup requires frontend API_URL=http://localhost:<backend PORT>/api/v1. Use separate processes for an external API target.' };
    return { status: 'PASS', check: 'Frontend versioned proxy matches the local API port', port: targetPort };
  } catch { return { status: 'FAIL', reason: 'Set a valid frontend API_URL ending in /api/v1; restart Next after changes.' }; }
}
async function main() {
  // Capture external overrides before loading the backend workspace's API_URL.
  const frontendOverrides = { API_URL: process.env.API_URL, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL };
  loadEnvironment();
  const missing = missingPackages();
  let proxy;
  try {
    const front = backendRequire('dotenv').parse(fs.readFileSync(path.join(root, 'frontend/.env.local')));
    const base = frontendOverrides.API_URL || frontendOverrides.NEXT_PUBLIC_API_URL;
    proxy = await checkProxy(base ? { API_URL: base } : front, Number(process.env.PORT || 4000));
  } catch { proxy = { status: 'BLOCKED', reason: 'Create frontend/.env.local and install dotenv to validate the proxy target.' }; }
  const [postgres, redis, smtp] = await Promise.all([checkPostgres(process.env.DATABASE_URL), checkRedis(process.env.REDIS_URL), checkSmtp(process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.EMAIL_FROM, process.env.SMTP_USER, process.env.SMTP_PASSWORD)]);
  const report = { checkedAt: new Date().toISOString(), containerRuntimeRequired: false, mode:process.env.NODE_ENV||'development',livePaymentKeys: Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')||process.env.STRIPE_SECRET_KEY?.startsWith('rk_live_')||process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')), apiPort: Number(process.env.PORT || 4000), missingPackages: missing, postgres, redis, smtp, proxy, readyToStart: !missing.length && postgres.status === 'PASS' && redis.status === 'PASS' && proxy.status === 'PASS' && smtp.status !== 'FAIL', productionReady: false };
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.readyToStart ? 0 : 1;
}
if (require.main === module) main().catch(() => { process.stderr.write('Service configuration could not be loaded. Check backend/.env without sharing secrets.\n'); process.exitCode = 1; });
module.exports = { checkSmtp, checkPostgres, checkRedis, checkProxy, connectionUrl, missingPackages, safeCode, expectedMigrations };
