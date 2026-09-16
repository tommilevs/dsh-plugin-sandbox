import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync, chmodSync, copyFileSync, readlinkSync, symlinkSync, unlinkSync } from 'node:fs'
import { basename, dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
export const SCHEMA_VERSION = 2

export function safeId(id) {
  if (typeof id !== 'string' || id === '.' || id === '..' || !/^[a-zA-Z0-9._-]{1,80}$/.test(id)) throw new Error('Invalid sandbox id')
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
  const sourceRoot = resolve(src), targetRoot = resolve(dst)
  const skipped = new Set(['node_modules', ...exclude])
  const outside = path => path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)
  if (sourceRoot === targetRoot || !outside(relative(sourceRoot, targetRoot))) throw new Error('Snapshot destination must be outside its source')
  const copy = (from, to) => {
    const source = lstatSync(from)
    let target
    try { target = lstatSync(to) } catch (error) { if (error.code !== 'ENOENT') throw error }
    // Never follow a destination link into another profile while copying.
    if (target?.isSymbolicLink()) unlinkSync(to)
    if (source.isSymbolicLink()) {
      const link = readlinkSync(from)
      const linkTarget = resolve(dirname(from), link)
      const location = relative(sourceRoot, linkTarget)
      if (outside(location)) throw new Error(`Cannot copy symlink outside the snapshot: ${from}`)
      const relocated = relative(dirname(to), join(targetRoot, location)) || '.'
      if (target && !target.isSymbolicLink()) throw new Error(`Cannot replace file with symlink: ${to}`)
      symlinkSync(relocated, to)
    } else if (source.isDirectory()) {
      mkdirSync(to, { recursive: true })
      for (const entry of readdirSync(from, { withFileTypes: true })) {
        if (!skipped.has(entry.name)) copy(join(from, entry.name), join(to, entry.name))
      }
      chmodSync(to, source.mode & 0o777)
    } else if (source.isFile()) {
      copyFileSync(from, to)
      chmodSync(to, source.mode & 0o777)
    }
  }
  copy(sourceRoot, targetRoot)
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
  const file = join(profile, 'pnpm-workspace.yaml')
  const current = existsSync(file) ? readFileSync(file, 'utf8') : ''
  if (/^(?:autoInstallPeers|'autoInstallPeers'|"autoInstallPeers")\s*:/m.test(current)) return
  const newline = current.includes('\r\n') ? '\r\n' : '\n'
  const separator = current && !current.endsWith('\n') ? newline : ''
  writeFileSync(file, `${current}${separator}autoInstallPeers: false${newline}`)
}
