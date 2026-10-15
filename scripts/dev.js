import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [
  spawn(
    process.execPath,
    [resolve(root, 'client/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'],
    { cwd: resolve(root, 'client'), stdio: 'inherit' }
  ),
  spawn(process.execPath, ['src/index.js'], {
    cwd: resolve(root, 'server'),
    stdio: 'inherit',
  }),
];

let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('[dev] Failed to start a service:', error);
    stopAll(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.log(`[dev] Service stopped${signal ? ` (${signal})` : ` (exit ${code})`}. Stopping the other service.`);
      stopAll(code || 0);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
