import test from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, rmSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { startRuntime, stopRuntime } from '../lib/runtime.js'

function launch(script, options = {}) {
  return startRuntime({ command: process.execPath, args: ['-e', script], cwd: process.cwd(), timeoutMs: 3000, ...options })
}

const serverScript = `
  const http = require('node:http');
  const server = http.createServer((req, res) => res.end('ready'));
  server.listen(0, '127.0.0.1', () => console.log('dsh web: http://127.0.0.1:' + server.address().port + '/?token=test-token'));
`

test('startRuntime ignores warning links and captures the complete fragmented authenticated URL', async t => {
  const lines = []
  const result = await launch(`
    console.error('Warning: see https://docs.example.invalid/fix');
    const http = require('node:http');
    const server = http.createServer((req, res) => res.end('ready'));
    server.listen(0, '127.0.0.1', () => {
      process.stdout.write('dsh web: http://127.0.0.1:' + server.address().port + '/?token=first');
      setTimeout(() => process.stdout.write('-second\\n'), 80);
    });
  `, { onLine: line => lines.push(line) })
  t.after(() => stopRuntime(result.process))
  assert.match(result.url, /^http:\/\/127\.0\.0\.1:\d+\/\?token=first-second$/)
  assert.equal(lines.length, 2)
  assert.equal(lines.some(line => line.includes('first-second')), false)
})

test('startRuntime probes the local URL and does not report a dead port as ready', async () => {
  await assert.rejects(launch("console.log('dsh web: http://127.0.0.1:1/?token=secret'); setTimeout(() => process.exit(0), 100)", { timeoutMs: 500 }), /before becoming ready|Timed out/)
})

test('runtime output and durable logs redact credentials even after readiness', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-runtime-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const logPath = join(dir, 'logs', 'runtime.log'), lines = []
  const result = await launch(serverScript + "setTimeout(() => console.error('Authorization: Bearer late-secret'), 180)", { logPath, onLine: line => lines.push(line) })
  t.after(() => stopRuntime(result.process))
  await delay(260)
  assert.equal(existsSync(logPath), true)
  const saved = readFileSync(logPath, 'utf8')
  assert.match(saved, /Authorization/)
  assert.equal(saved.includes('test-token'), false)
  assert.equal(saved.includes('late-secret'), false)
  assert.equal(result.output.includes('test-token'), false)
  assert.equal(lines.some(line => line.includes('late-secret')), false)
})

test('runtime restricts an existing log file to the current user', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-runtime-mode-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const logPath = join(dir, 'runtime.log')
  writeFileSync(logPath, 'old output\n')
  chmodSync(logPath, 0o644)
  const result = await launch(serverScript, { logPath })
  t.after(() => stopRuntime(result.process))
  assert.equal(statSync(logPath).mode & 0o777, 0o600)
})

test('stopRuntime kills descendants that ignore SIGTERM and releases their listener', { skip: process.platform === 'win32' }, async t => {
  let descendantPid
  const result = await launch(`
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', ${JSON.stringify(serverScript + "process.on('SIGTERM', () => {})")}], { stdio: ['ignore', 'inherit', 'inherit'] });
    console.log('descendant pid=' + child.pid);
    setInterval(() => {}, 1000);
  `, { onLine: line => { if (line.startsWith('descendant pid=')) descendantPid = Number(line.split('=')[1]) } })
  t.after(async () => {
    if (descendantPid) { try { process.kill(descendantPid, 'SIGKILL') } catch {} }
    await stopRuntime(result.process)
  })
  assert.equal((await fetch(result.url)).status, 200)
  await stopRuntime(result.process, { graceMs: 150 })
  await assert.rejects(fetch(result.url, { signal: AbortSignal.timeout(500) }))
  assert.ok(result.process.exitCode !== null || result.process.signalCode !== null)
})

test('stopRuntime still waits for a child after SIGTERM was already sent', async t => {
  const result = await launch(serverScript + "process.on('SIGTERM', () => setTimeout(() => process.exit(0), 120))")
  t.after(() => stopRuntime(result.process))
  result.process.kill('SIGTERM')
  await stopRuntime(result.process, { graceMs: 500 })
  assert.ok(result.process.exitCode !== null || result.process.signalCode !== null)
})
