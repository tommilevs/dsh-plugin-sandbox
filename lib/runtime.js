import { spawn } from 'node:child_process'
import { appendFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'
import { setTimeout as delay } from 'node:timers/promises'

const DEFAULT_TIMEOUT_MS = 45_000
const processGroups = new WeakSet()
const stopping = new WeakMap()

function cleanLine(line) {
  return line.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
}

function sanitize(line) {
  return cleanLine(line)
    .replace(/([?&](?:token|access_token|auth|api_key|key)=)[^&#\s]+/gi, '$1[redacted]')
    .replace(/(\bBearer\s+)[^\s]+/gi, '$1[redacted]')
    .replace(/((?:["']?)(?:token|password|api[_-]?key|secret)(?:["']?)\s*[:=]\s*["']?)[^\s,"']+/gi, '$1[redacted]')
}

function readyUrl(line) {
  const match = cleanLine(line).match(/\bdsh web:\s*(https?:\/\/\S+)\s*$/i)
  if (!match) return null
  try {
    const url = new URL(match[1])
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || !url.searchParams.get('token')) return null
    return url.href
  } catch { return null }
}

export function probeRuntime(url) {
  return new Promise(resolve => {
    const get = url.startsWith('https:') ? httpsGet : httpGet
    const request = get(url, { timeout: 1000 }, response => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 400)
    })
    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve(false))
  })
}

export function startRuntime({ command, args, cwd, env, timeoutMs = DEFAULT_TIMEOUT_MS, onLine, logPath } = {}) {
  if (!command) throw new Error('Runtime command is required')
  if (!cwd) throw new Error('Runtime cwd is required')
  if (logPath) {
    mkdirSync(dirname(logPath), { recursive: true })
    if (existsSync(logPath)) chmodSync(logPath, 0o600)
  }
  const child = spawn(command, args || [], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    detached: process.platform !== 'win32',
  })
  if (process.platform !== 'win32') processGroups.add(child)

  let output = ''
  let settled = false
  let probing = false
  let timer
  let resolveStart
  let rejectStart
  const startPromise = new Promise((resolve, reject) => { resolveStart = resolve; rejectStart = reject })

  const fail = async (error) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    await stopRuntime(child)
    rejectStart(error instanceof Error ? error : new Error(String(error)))
  }
  const probe = async url => {
    if (settled || probing) return
    probing = true
    while (!settled) {
      if (await probeRuntime(url) && !settled) {
        settled = true
        clearTimeout(timer)
        resolveStart({ process: child, url, output, logPath })
        return
      }
      await delay(100)
    }
  }
  const consumeLine = (line, complete = true) => {
    if (!line) return
    const safe = sanitize(line)
    output += safe + '\n'
    if (output.length > 64 * 1024) output = output.slice(-64 * 1024)
    if (logPath) appendFileSync(logPath, safe + '\n', { mode: 0o600 })
    if (onLine) onLine(safe)
    const url = complete && readyUrl(line)
    if (url) void probe(url)
  }
  for (const stream of [child.stdout, child.stderr]) {
    let pending = ''
    stream.setEncoding('utf8')
    stream.on('data', chunk => {
      pending += chunk
      let end
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end).replace(/\r$/, '')
        pending = pending.slice(end + 1)
        consumeLine(line)
      }
    })
    stream.on('end', () => {
      consumeLine(pending, false)
      pending = ''
    })
  }
  child.on('error', error => { void fail(error) })
  child.on('exit', (code, signal) => {
    if (!settled) void fail(new Error(`DSH sandbox exited before becoming ready (code=${code}, signal=${signal}).\n${output.slice(-8000)}`))
  })
  timer = setTimeout(() => {
    void fail(new Error(`Timed out waiting for DSH sandbox URL.\n${output.slice(-8000)}`))
  }, timeoutMs)

  return startPromise
}

export function stopRuntime(proc, { graceMs = 3000 } = {}) {
  if (!proc) return Promise.resolve()
  if (stopping.has(proc)) return stopping.get(proc)
  const stop = (async () => {
    if (!proc.pid) return
    const grouped = processGroups.has(proc)
    const exited = () => proc.exitCode !== null || proc.signalCode !== null
    const alive = () => {
      if (!grouped) return !exited()
      try { process.kill(-proc.pid, 0); return true } catch (error) { return error.code !== 'ESRCH' }
    }
    const signal = kind => {
      try {
        if (grouped) process.kill(-proc.pid, kind)
        else if (!exited()) proc.kill(kind)
      } catch (error) { if (error.code !== 'ESRCH') throw error }
    }
    if (!alive()) return
    if (process.platform === 'win32') {
      await new Promise(resolve => {
        const task = spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
        task.once('error', () => { signal('SIGKILL'); resolve() })
        task.once('exit', resolve)
      })
    } else {
      signal('SIGTERM')
      const deadline = Date.now() + graceMs
      while (alive() && Date.now() < deadline) await delay(25)
      if (alive()) signal('SIGKILL')
    }
    // An exited parent can leave descendants holding inherited pipes. Killing
    // the whole group first releases those listeners, including SIGTERM resisters.
    const exitDeadline = Date.now() + 1000
    while (!exited() && Date.now() < exitDeadline) await delay(25)
    if (grouped) await delay(50)
  })()
  stopping.set(proc, stop)
  return stop
}
