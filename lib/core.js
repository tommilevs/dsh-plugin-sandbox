import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
export const SCHEMA_VERSION = 2

export function safeId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(id)) throw new Error('Invalid sandbox id')
  return id
}
export function sandboxDir(root, id) { return join(root, 'sandboxes', safeId(id)) }
export function dshHomeDir(root, id) { return join(sandboxDir(root, id), 'dsh-home') }
export function profileDir(root, id) { return join(dshHomeDir(root, id), 'profiles', 'web') }

export async function command(bin, args, cwd, options = {}) {
  return execFileAsync(bin, args, { cwd, windowsHide: true, maxBuffer: 16 * 1024 * 1024, ...options })
}
export async function cmdVersion(bin) {
  try { return String((await command(bin, ['--version'])).stdout).trim() } catch { return null }
}
export async function git(dir, args, options = {}) {
  return command(process.platform === 'win32' ? 'git.exe' : 'git', args, dir, options)
}
export function gitEnv() {
  return { ...process.env, GIT_AUTHOR_NAME: 'DSH Plugin Sandbox', GIT_AUTHOR_EMAIL: 'sandbox@localhost', GIT_COMMITTER_NAME: 'DSH Plugin Sandbox', GIT_COMMITTER_EMAIL: 'sandbox@localhost' }
}
export function loadRegistry(root, file) {
  mkdirSync(root, { recursive: true })
  if (!existsSync(file)) return { schemaVersion: SCHEMA_VERSION, sandboxes: {} }
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'))
    if (!data.sandboxes || typeof data.sandboxes !== 'object') data.sandboxes = {}
    data.schemaVersion ||= SCHEMA_VERSION
    return data
  } catch { return { schemaVersion: SCHEMA_VERSION, sandboxes: {} } }
}
export function saveRegistry(root, file, data) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}
export async function copyTree(src, dst, exclude = new Set()) {
  mkdirSync(dst, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue
    const from = join(src, entry.name), to = join(dst, entry.name)
    if (entry.isDirectory()) await copyTree(from, to, exclude)
    else if (entry.isFile()) writeFileSync(to, readFileSync(from))
  }
}
export function detectStableHome(env = process.env) {
  if (env.DSH_PLUGIN_SANDBOX_STABLE_HOME) return resolve(env.DSH_PLUGIN_SANDBOX_STABLE_HOME)
  const current = env.DSH_HOME
  if (!current) return null
  const n = basename(current).toLowerCase()
  if (n === 'home-test') return join(dirname(current), 'home')
  if (n === 'home') return current
  return null
}
export function normalizePluginSpec(spec, sourceCwd) {
  if (!spec || typeof spec !== 'string') throw new Error('Plugin spec is required')
  if (spec.startsWith('.') || spec.startsWith('..') || spec.startsWith('/') || /^[A-Za-z]:[\\/]/.test(spec)) {
    return resolve(sourceCwd, spec)
  }
  return spec
}
export function preparePnpm(profile) {
  mkdirSync(profile, { recursive: true })
  writeFileSync(join(profile, 'pnpm-workspace.yaml'), 'autoInstallPeers: false\nonlyBuiltDependencies:\n  - node-pty\n')
}
