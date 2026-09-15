import { spawn } from 'node:child_process'

const DEFAULT_TIMEOUT_MS = 45_000
const URL_RE = /https?:\/\/[^\s]+/

export function startRuntime({ command, args, cwd, env, timeoutMs = DEFAULT_TIMEOUT_MS, onLine } = {}) {
  if (!command) throw new Error('Runtime command is required')
  if (!cwd) throw new Error('Runtime cwd is required')
  const child = spawn(command, args || [], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let output = ''
  let resolved = false
  let timer
  let resolveStart
  let rejectStart
  const startPromise = new Promise((resolve, reject) => { resolveStart = resolve; rejectStart = reject })

  const fail = (error) => {
    if (resolved) return
    resolved = true
    clearTimeout(timer)
    rejectStart(error instanceof Error ? error : new Error(String(error)))
  }
  const consume = (chunk) => {
    output += String(chunk)
    if (output.length > 64 * 1024) output = output.slice(-64 * 1024)
    for (const line of String(chunk).split(/\r?\n/)) if (line && onLine) onLine(line)
    const match = output.match(URL_RE)
    if (match && !resolved) {
      resolved = true
      clearTimeout(timer)
      resolveStart({ process: child, url: match[0], output })
    }
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
  child.on('error', fail)
  child.on('exit', (code, signal) => {
    if (!resolved) fail(new Error(`DSH sandbox exited before becoming ready (code=${code}, signal=${signal}).\n${output.slice(-8000)}`))
  })
  timer = setTimeout(() => {
    try { child.kill('SIGTERM') } catch {}
    fail(new Error(`Timed out waiting for DSH sandbox URL.\n${output.slice(-8000)}`))
  }, timeoutMs)

  return startPromise
}

export function stopRuntime(proc) {
  if (!proc || proc.killed || proc.exitCode !== null) return Promise.resolve()
  return new Promise(resolve => {
    let done = false
    const finish = () => { if (!done) { done = true; clearTimeout(timer); setTimeout(resolve, 0) } }
    const timer = setTimeout(() => { try { proc.kill('SIGKILL') } catch {}; finish() }, 3000)
    proc.once('exit', finish)
    try { proc.kill('SIGTERM') } catch { finish() }
  })
}
