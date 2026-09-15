import test from 'node:test'
import assert from 'node:assert/strict'
import { startRuntime, stopRuntime } from '../lib/runtime.js'

test('startRuntime captures the first authenticated URL and stopRuntime terminates', async () => {
  const result = await startRuntime({ command: process.execPath, args: ['-e', "console.log('dsh web: http://127.0.0.1:9999/?token=test-token'); setInterval(() => {}, 1000)"], cwd: process.cwd(), timeoutMs: 5000 })
  assert.match(result.url, /token=test-token/)
  await stopRuntime(result.process)
  assert.ok(result.process.exitCode !== null || result.process.signalCode !== null || result.process.killed)
})
