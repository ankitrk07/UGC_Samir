const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const { setupLocal } = require('./setup-local.cjs');
const children = new Set();
let stopping = false;

function npmProcess(script) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd run ' + script] : ['run', script];
  return spawn(command, args, { cwd: root, env: {...process.env,...(script==='dev'?{PORT:'3000'}:{})}, stdio: 'inherit', windowsHide: true, detached: process.platform !== 'win32' });
}
function stop(exitCode) {
  if (stopping) return; stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === 'win32') execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      else process.kill(-child.pid, 'SIGTERM');
    } catch { /* The owned process tree may have already exited. */ }
  }
  process.exitCode = exitCode;
}
function start(script) {
  const child = npmProcess(script); children.add(child);
  child.once('error', () => { console.error('Could not start ' + script); stop(1); });
  child.once('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) { console.error(script + ' stopped (' + (signal || code) + '); stopping the other owned services.'); stop(code || 1); }
  });
  return child;
}
async function waitForApi(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (!stopping && Date.now() < deadline) {
    try { const response = await fetch('http://127.0.0.1:' + port + '/ready', { signal: AbortSignal.timeout(1500) }); if (response.ok) return; } catch { /* API may still be starting. */ }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('The API did not become ready; inspect the API output above.');
}
async function assertPortFree(port) {
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Configure a valid API port.');
  await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('Port '+port+' is already in use or unavailable. Stop its existing process before dev:all.')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
}
async function main() {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') throw new Error('dev:all is for development only. Use separate production process services for deployment.');
  for (const result of setupLocal()) console.log(result.file + ': ' + result.result);
  // Doctor runs in a child: backend/.env must never contaminate Next's API_URL.
  let doctor;
  try { doctor = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'check-services.cjs')], { cwd: root, encoding: 'utf8', timeout: 35000, windowsHide: true })); }
  catch (error) {
    if (error.stdout) process.stdout.write(String(error.stdout));
    throw new Error('Service preflight failed. Complete manual dependencies and configure real PostgreSQL/Redis; no services were launched.');
  }
  if(doctor.mode!=='development'||doctor.livePaymentKeys)throw new Error('Use development configuration and test payment keys with dev:all.');
  if (!doctor.readyToStart) throw new Error('Service preflight did not pass.');
  await assertPortFree(doctor.apiPort); await assertPortFree(3000);
  console.log('PostgreSQL and Redis authenticated checks passed. Starting the existing API.');
  start('dev:api'); await waitForApi(doctor.apiPort);
  if (stopping) return;
  start('dev:worker'); start('dev');
  console.log('API is ready. Worker and frontend started. This does not certify production readiness.');
}
process.once('SIGINT', () => stop(0)); process.once('SIGTERM', () => stop(0));
main().catch(error => { if(!stopping){console.error(error.message); stop(1);} });
