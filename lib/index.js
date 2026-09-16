import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { command, cmdVersion, git, gitEnv, loadRegistry, saveRegistry, detectStableHome, normalizePluginSpec, preparePnpm, safeId, sandboxDir, dshHomeDir, profileDir } from './core.js'
import { startRuntime, stopRuntime } from './runtime.js'
import { classifyLocaleState } from './locale-state.js'
import { childEnvironment, copyWebProfile, promoteWebProfile, resolveRuntime, validateRuntime, vendorLocalDependencies, verifyRuntime } from './profile.js'
import { redactDiagnostic } from './secrets.js'

export const name = 'dsh-plugin-sandbox'
export const inject = ['webServer']

const ROOT = resolve(process.env.DSH_PLUGIN_SANDBOX_ROOT || join(tmpdir(), 'dsh-safe-test-sandbox'))
const REGISTRY = join(ROOT, 'sandboxes.json')
const runtimes = new Map()
const LOCALES_DIR = join(ROOT, 'locales')
const EN_LOCALE_PATH = new URL('../locales/en.json', import.meta.url)
const EN_METADATA_PATH = new URL('../locales/metadata/en.json', import.meta.url)
const RU_METADATA_PATH = new URL('../locales/metadata/ru.json', import.meta.url)

const LOCALE_CODE_RE = /^[a-z]{2}$/

function localeCodeValid(code) {
  return LOCALE_CODE_RE.test(String(code || ''))
}

function englishLocale() {
  return JSON.parse(readFileSync(EN_LOCALE_PATH, 'utf8'))
}

function validateLocalePayload(code, values) {
  if (!localeCodeValid(code)) throw new Error('Invalid locale code.')
  if (!values || Array.isArray(values) || typeof values !== 'object') throw new Error('Locale must be a JSON object.')
  const base = englishLocale()
  const baseKeys = Object.keys(base).sort()
  const candidateKeys = Object.keys(values).sort()
  const missing = baseKeys.filter(key => !(key in values))
  const extra = candidateKeys.filter(key => !(key in base))
  const invalid = Object.entries(values).filter(([, value]) => typeof value !== 'string').map(([key]) => key)
  if (missing.length) throw new Error(`Missing translation keys: ${missing.join(', ')}`)
  if (extra.length) throw new Error(`Unknown translation keys: ${extra.join(', ')}`)
  if (invalid.length) throw new Error(`Translation values must be strings: ${invalid.join(', ')}`)
  return { code: String(code), values }
}

function validateLocaleMetadata(code, metadata) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') throw new Error('Locale metadata must be a JSON object.')
  const normalized = String(code || '').trim().toLowerCase()
  if (String(metadata.code || '').trim().toLowerCase() !== normalized) throw new Error('Locale metadata code does not match locale code.')
  const nativeName = String(metadata.nativeName || '').trim()
  const flag = String(metadata.flag || '').trim()
  if (!nativeName) throw new Error('Locale metadata nativeName is required.')
  if (!flag) throw new Error('Locale metadata flag is required.')
  const keys = Object.keys(metadata).sort()
  if (keys.join('\0') !== ['code', 'flag', 'nativeName'].join('\0')) throw new Error('Locale metadata may only contain code, nativeName and flag.')
  return { code: normalized, nativeName, flag }
}

function loadCustomLocales() {
  ensureRoot()
  mkdirSync(LOCALES_DIR, { recursive: true })
  const result = {}
  for (const file of readdirSync(LOCALES_DIR)) {
    if (!file.endsWith('.json')) continue
    const code = file.slice(0, -5)
    try {
      const values = JSON.parse(readFileSync(join(LOCALES_DIR, file), 'utf8'))
      validateLocalePayload(code, values)
      result[code] = values
    } catch {}
  }
  return result
}

function loadCustomLocaleMetadata() {
  ensureRoot()
  const dir = join(LOCALES_DIR, 'metadata')
  mkdirSync(dir, { recursive: true })
  const result = {}
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const code = file.slice(0, -5)
    try {
      const metadata = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      result[code] = validateLocaleMetadata(code, metadata)
    } catch {}
  }
  return result
}

function now() { return new Date().toISOString() }
function ensureRoot() { mkdirSync(ROOT, { recursive: true }) }
function registry() { return loadRegistry(ROOT, REGISTRY) }
function getSandbox(id) {
  const s = registry().sandboxes[safeId(id)]
  if (!s) throw new Error(`Sandbox not found: ${id}`)
  return s
}
function save(data) { ensureRoot(); saveRegistry(ROOT, REGISTRY, data) }
function runtimeInfo(id) {
  const r = runtimes.get(id)
  if (!r) return { running: false, url: null, pid: null }
  return { running: Boolean(r.process && r.process.exitCode === null), url: r.url, pid: r.process?.pid || null }
}
async function snapshot(id, message) {
  const s = getSandbox(id)
  await git(s.path, ['add', '-A'])
  let changed = true
  try { await git(s.path, ['diff', '--cached', '--quiet']); changed = false } catch {}
  if (changed) await git(s.path, ['commit', '-m', message], { env: gitEnv() })
  const head = String((await git(s.path, ['rev-parse', 'HEAD'])).stdout).trim()
  const data = registry(); data.sandboxes[id].updatedAt = now(); save(data)
  return head
}
async function pluginSummary(id) {
  const file = join(profileDir(ROOT, id), 'package.json')
  if (!existsSync(file)) return []
  try {
    const pkg = JSON.parse(readFileSync(file, 'utf8'))
    return Object.entries(pkg.dependencies || {}).map(([name, version]) => ({ name, version }))
  } catch { return [] }
}
function bundledLocales() {
  return { en: englishLocale(), ru: JSON.parse(readFileSync(new URL('../locales/ru.json', import.meta.url), 'utf8')) }
}

function bundledLocaleMetadata() {
  return {
    en: JSON.parse(readFileSync(EN_METADATA_PATH, 'utf8')),
    ru: JSON.parse(readFileSync(RU_METADATA_PATH, 'utf8')),
  }
}

function localeManifest() {
  return { ...bundledLocales(), ...loadCustomLocales() }
}

function localeMetadataManifest() {
  return { ...bundledLocaleMetadata(), ...loadCustomLocaleMetadata() }
}

async function installLocale(args = {}) {
  const code = String(args.code || '').trim().toLowerCase()
  const values = typeof args.values === 'string' ? JSON.parse(args.values) : args.values
  validateLocalePayload(code, values)
  if (['en', 'ru'].includes(code)) throw new Error('Built-in languages cannot be added as community locales.')
  const translationPath = join(LOCALES_DIR, `${code}.json`)
  const metadataPath = join(LOCALES_DIR, 'metadata', `${code}.json`)
  if (!args.replace && (existsSync(translationPath) || existsSync(metadataPath))) throw new Error(`Locale ${code} is already installed locally. Use replace=true to update it.`)
  const metadata = validateLocaleMetadata(code, {
    code,
    nativeName: args.nativeName || args.name || code,
    flag: args.flag || '🌐',
  })
  ensureRoot(); mkdirSync(join(LOCALES_DIR, 'metadata'), { recursive: true })
  writeFileSync(translationPath, JSON.stringify(values, null, 2) + '\n')
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n')
  return { code, metadata, values }
}

async function remoteLocaleState(code, source) {
  const normalized = String(code || '').trim().toLowerCase()
  validateLocalePayload(normalized, {})
  const root = String((await git(source, ['rev-parse', '--show-toplevel'])).stdout).trim()
  await git(root, ['fetch', 'origin', 'main', '--quiet'])
  const localePath = `locales/${normalized}.json`
  const metadataPath = `locales/metadata/${normalized}.json`
  const exists = async (path) => { try { await git(root, ['cat-file', '-e', `origin/main:${path}`]); return true } catch { return false } }
  const remoteTranslation = await exists(localePath)
  const remoteMetadata = await exists(metadataPath)
  const remoteExists = remoteTranslation || remoteMetadata
  let localEqualsRemote = false
  if (remoteTranslation && remoteMetadata) {
    const local = loadStoredLocalePair(normalized)
    const remoteValues = String((await git(root, ['show', `origin/main:${localePath}`])).stdout)
    const remoteMeta = String((await git(root, ['show', `origin/main:${metadataPath}`])).stdout)
    localEqualsRemote = remoteValues.trim() === JSON.stringify(local.values, null, 2).trim() && remoteMeta.trim() === JSON.stringify(local.metadata, null, 2).trim()
  }
  return { code: normalized, remoteTranslation, remoteMetadata, remoteExists, localEqualsRemote, state: classifyLocaleState({ localInstalled: true, remoteExists, localEqualsRemote }) }
}

function loadStoredLocalePair(code) {
  const translationPath = join(LOCALES_DIR, `${code}.json`)
  const metadataPath = join(LOCALES_DIR, 'metadata', `${code}.json`)
  if (!existsSync(translationPath) || !existsSync(metadataPath)) {
    throw new Error(`Locale ${code} is not installed locally.`)
  }
  const values = JSON.parse(readFileSync(translationPath, 'utf8'))
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  validateLocalePayload(code, values)
  return { values, metadata: validateLocaleMetadata(code, metadata) }
}

async function submitLocale(args = {}) {
  const code = String(args.code || '').trim().toLowerCase()
  let values = typeof args.values === 'string' ? JSON.parse(args.values) : args.values
  let metadataInput = {
    code,
    nativeName: args.nativeName || args.name || '',
    flag: args.flag || '',
  }
  if (values === undefined || values === null) {
    const stored = loadStoredLocalePair(code)
    values = stored.values
    metadataInput = stored.metadata
  }
  validateLocalePayload(code, values)
  const metadata = validateLocaleMetadata(code, metadataInput)
  const source = process.env.DSH_PLUGIN_SANDBOX_GITHUB_CHECKOUT || resolve(new URL('..', import.meta.url).pathname)
  let root
  try { root = String((await git(source, ['rev-parse', '--show-toplevel'])).stdout).trim() } catch { throw new Error('GitHub submission is unavailable because this installation is not a Git checkout. Set DSH_PLUGIN_SANDBOX_GITHUB_CHECKOUT to a checkout.') }
  const appGateway = process.env.DSH_PLUGIN_SANDBOX_GITHUB_APP_URL
  if (appGateway) {
    let url
    try { url = new URL(appGateway) } catch { throw new Error('GitHub App gateway URL is invalid.') }
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') throw new Error('GitHub App gateway must use HTTPS.')
    const response = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, metadata, values }),
    })
    if (!response.ok) throw new Error(`GitHub App gateway failed: HTTP ${response.status}`)
    const data = await response.json()
    return { ok: true, code, metadata, pullRequest: data.pullRequest || data.url || '', gateway: true }
  }
  const gh = process.platform === 'win32' ? 'gh.exe' : 'gh'
  try { await command(gh, ['--version'], root); await command(gh, ['auth', 'status'], root) } catch { throw new Error('GitHub submission is unavailable: GitHub CLI is not installed or not authenticated.') }
  const localInstalled = existsSync(join(LOCALES_DIR, `${code}.json`)) && existsSync(join(LOCALES_DIR, 'metadata', `${code}.json`))
  await git(root, ['fetch', 'origin', 'main', '--quiet'])
  const remoteTranslation = await (async () => { try { await git(root, ['cat-file', '-e', `origin/main:locales/${code}.json`]); return true } catch { return false } })()
  const remoteMetadata = await (async () => { try { await git(root, ['cat-file', '-e', `origin/main:locales/metadata/${code}.json`]); return true } catch { return false } })()
  const remoteExists = remoteTranslation || remoteMetadata
  let localEqualsRemote = false
  if (localInstalled && remoteTranslation && remoteMetadata) {
    const local = loadStoredLocalePair(code)
    const remoteValues = String((await git(root, ['show', `origin/main:locales/${code}.json`])).stdout).trim()
    const remoteMeta = String((await git(root, ['show', `origin/main:locales/metadata/${code}.json`])).stdout).trim()
    localEqualsRemote = remoteValues === JSON.stringify(local.values, null, 2).trim() && remoteMeta === JSON.stringify(local.metadata, null, 2).trim()
  }
  if (remoteExists && localEqualsRemote) return { ok: true, code, metadata, alreadyPublished: true, state: 'published', pullRequest: '' }
  const mode = remoteExists ? 'update' : 'add'
  const branch = `locale/${mode}-${code}-${Date.now()}`
  const worktree = join(ROOT, 'github-worktrees', branch.replace(/[^A-Za-z0-9._-]/g, '-'))
  mkdirSync(dirname(worktree), { recursive: true })
  try {
    await git(root, ['fetch', 'origin', 'main', '--quiet'])
    await git(root, ['worktree', 'add', '-b', branch, worktree, 'origin/main'])
    const localeTarget = join(worktree, 'locales', `${code}.json`)
    const metadataTarget = join(worktree, 'locales', 'metadata', `${code}.json`)
    mkdirSync(dirname(localeTarget), { recursive: true })
    mkdirSync(dirname(metadataTarget), { recursive: true })
    writeFileSync(localeTarget, JSON.stringify(values, null, 2) + '\n')
    writeFileSync(metadataTarget, JSON.stringify(metadata, null, 2) + '\n')
    await git(worktree, ['add', '--', `locales/${code}.json`, `locales/metadata/${code}.json`])
    const commitPrefix = remoteExists ? 'fix(i18n): update' : 'feat(i18n): add'
    await git(worktree, ['commit', '-m', `${commitPrefix} ${metadata.nativeName} locale`], { env: gitEnv() })
    await git(worktree, ['push', '-u', 'origin', branch])
    const title = `${remoteExists ? 'fix' : 'feat'}(i18n): ${remoteExists ? 'update' : 'add'} ${metadata.nativeName} locale`
    const body = `Community locale ${remoteExists ? 'update' : 'contribution'} for \`${code}\`. Generated and validated by DSH Plugin Sandbox.`
    const pr = await command(gh, ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body], worktree)
    return { ok: true, code, metadata, branch, pullRequest: String(pr.stdout).trim() }
  } finally {
    await git(root, ['worktree', 'remove', '--force', worktree]).catch(() => {})
  }
}

async function localeState(args = {}) {
  const code = String(args.code || '').trim().toLowerCase()
  if (!LOCALE_CODE_RE.test(code)) throw new Error('Invalid locale code.')
  const localInstalled = existsSync(join(LOCALES_DIR, `${code}.json`)) && existsSync(join(LOCALES_DIR, 'metadata', `${code}.json`))
  const source = process.env.DSH_PLUGIN_SANDBOX_GITHUB_CHECKOUT || resolve(new URL('..', import.meta.url).pathname)
  try {
    const root = String((await git(source, ['rev-parse', '--show-toplevel'])).stdout).trim()
    await git(root, ['fetch', 'origin', 'main', '--quiet'])
    const exists = async (path) => { try { await git(root, ['cat-file', '-e', `origin/main:${path}`]); return true } catch { return false } }
    const remoteTranslation = await exists(`locales/${code}.json`)
    const remoteMetadata = await exists(`locales/metadata/${code}.json`)
    const remoteExists = remoteTranslation || remoteMetadata
    let localEqualsRemote = false
    if (localInstalled && remoteTranslation && remoteMetadata) {
      const local = loadStoredLocalePair(code)
      localEqualsRemote = String((await git(root, ['show', `origin/main:locales/${code}.json`])).stdout).trim() === JSON.stringify(local.values, null, 2).trim() && String((await git(root, ['show', `origin/main:locales/metadata/${code}.json`])).stdout).trim() === JSON.stringify(local.metadata, null, 2).trim()
    }
    return { code, localInstalled, remoteTranslation, remoteMetadata, remoteExists, localEqualsRemote, state: classifyLocaleState({ localInstalled, remoteExists, localEqualsRemote }) }
  } catch {
    return { code, localInstalled, remoteExists: false, localEqualsRemote: false, state: classifyLocaleState({ localInstalled, remoteExists: false, localEqualsRemote: false }), remoteUnknown: true }
  }
}

async function status() {
  const data = registry()
  const sandboxes = await Promise.all(Object.values(data.sandboxes).map(async s => ({ ...s, plugins: await pluginSummary(s.id), head: existsSync(join(s.path, '.git')) ? String((await git(s.path, ['rev-parse', '--short', 'HEAD'])).stdout).trim() : null, runtime: runtimeInfo(s.id) })))
  const dsh = await resolveRuntime().catch(error => ({ error: error.message }))
  return { root: ROOT, stableHome: detectStableHome(), dshVersion: dsh.version || null, locales: localeManifest(), localeMetadata: localeMetadataManifest(), git: await cmdVersion(process.platform === 'win32' ? 'git.exe' : 'git'), sandboxes }
}
async function ensureGit() {
  const version = await cmdVersion(process.platform === 'win32' ? 'git.exe' : 'git')
  if (!version) throw new Error('Git is required by DSH Plugin Sandbox but was not found on PATH.')
  return version
}
async function createSandbox({ id, copyPlugins = true } = {}) {
  await ensureGit()
  if (typeof copyPlugins !== 'boolean') throw new Error('copyPlugins must be a boolean.')
  const sandboxId = safeId(id || `sandbox-${Date.now()}`)
  const dir = sandboxDir(ROOT, sandboxId)
  if (existsSync(dir)) throw new Error(`Sandbox already exists: ${sandboxId}`)
  const stableHome = detectStableHome()
  const stableProfile = stableHome ? join(stableHome, 'profiles', 'web') : ''
  if (copyPlugins && (!stableHome || !existsSync(stableProfile))) throw new Error('STABLE DSH_HOME was not found. Set DSH_PLUGIN_SANDBOX_STABLE_HOME or use the standard ~/dsh-env/{home,home-test} layout.')
  const runtimeSpec = await resolveRuntime()
  mkdirSync(dir, { recursive: true })
  try {
    await copyWebProfile(stableProfile, profileDir(ROOT, sandboxId), { copyPlugins })
    await installProfile(runtimeSpec, profileDir(ROOT, sandboxId), dshHomeDir(ROOT, sandboxId), false)
    writeFileSync(join(dir, '.gitignore'), [
      '**/node_modules/', '**/.dsh-module-fallback/', 'logs/',
      'dsh-home/*', '!dsh-home/profiles/', 'dsh-home/profiles/*', '!dsh-home/profiles/web/',
      'dsh-home/profiles/web/*', '!dsh-home/profiles/web/package.json', '!dsh-home/profiles/web/pnpm-lock.yaml',
      '!dsh-home/profiles/web/pnpm-workspace.yaml', '!dsh-home/profiles/web/cordis.yml',
      '!dsh-home/profiles/web/cordis.patch.yml', '!dsh-home/profiles/web/.sandbox-packages/', '**/.env', '**/.npmrc', '',
    ].join('\n'))
    await git(dir, ['init'])
    await git(dir, ['config', 'user.name', 'DSH Plugin Sandbox'])
    await git(dir, ['config', 'user.email', 'sandbox@localhost'])
    const data = registry()
    data.sandboxes[sandboxId] = { id: sandboxId, path: dir, dshHome: dshHomeDir(ROOT, sandboxId), profilePath: profileDir(ROOT, sandboxId), createdAt: now(), updatedAt: now(), source: copyPlugins ? 'stable' : 'clean', sourceHome: stableHome, copyPlugins, runtimeSpec }
    save(data)
    await snapshot(sandboxId, copyPlugins ? 'Create sandbox from main plugins' : 'Create clean sandbox')
    return getSandbox(sandboxId)
  } catch (error) {
    rmSync(dir, { recursive: true, force: true })
    const data = registry(); delete data.sandboxes[sandboxId]; save(data)
    throw error
  }
}
async function installProfile(runtimeSpec, profile, home, frozen = true) {
  await verifyRuntime(runtimeSpec)
  preparePnpm(profile)
  const env = childEnvironment(home)
  try {
    await command(runtimeSpec.command, [...runtimeSpec.args, 'plugin', '--profile', 'web', 'install', frozen ? '--frozen-lockfile' : '--no-frozen-lockfile'], profile, { env })
  } catch (error) {
    throw new Error(`Profile dependency installation failed. Review the package error and any required build approval in pnpm-workspace.yaml: ${redactDiagnostic(error.stderr || error.stdout || error.message)}`)
  }
}
async function installPlugin(id, spec, sourceCwd = process.cwd()) {
  const s = getSandbox(id)
  const cwd = s.profilePath
  const normalized = normalizePluginSpec(spec, sourceCwd)
  preparePnpm(cwd)
  await verifyRuntime(s.runtimeSpec)
  const env = childEnvironment(s.dshHome)
  const args = [...s.runtimeSpec.args, 'plugin', '--profile', 'web', 'add', normalized]
  try { await command(s.runtimeSpec.command, args, cwd, { env }) }
  catch (error) { throw new Error(`Plugin installation failed. Review the package error and any required build approval in pnpm-workspace.yaml: ${redactDiagnostic(error.stderr || error.stdout || error.message)}`) }
  await vendorLocalDependencies(cwd)
  await installProfile(s.runtimeSpec, cwd, s.dshHome, false)
  await snapshot(id, `Install plugin: ${normalized}`)
  return { ok: true, plugins: await pluginSummary(id), sandbox: getSandbox(id) }
}
async function startSandbox(id) {
  const s = getSandbox(id)
  const existing = runtimes.get(id)
  if (existing?.process?.exitCode === null) return { ...runtimeInfo(id), sandbox: s }
  await verifyRuntime(s.runtimeSpec)
  const env = childEnvironment(s.dshHome)
  const result = await startRuntime({ command: s.runtimeSpec.command, args: [...s.runtimeSpec.args, 'web', '--host', '127.0.0.1', '--port', '0', '--no-open'], cwd: s.path, env, logPath: join(s.path, 'logs', 'runtime.log') })
  const record = { process: result.process, url: result.url }
  runtimes.set(id, record)
  result.process.once('exit', () => { if (runtimes.get(id)?.process === result.process) runtimes.delete(id) })
  return { ...runtimeInfo(id), sandbox: s }
}
async function stopSandbox(id) {
  const record = runtimes.get(id)
  if (record) await stopRuntime(record.process)
  runtimes.delete(id)
  return { ...runtimeInfo(id) }
}
async function validateSandbox(id) {
  const s = getSandbox(id), checks = []
  const add = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail })
  add('Git repository', existsSync(join(s.path, '.git')))
  add('DSH home', existsSync(s.dshHome), s.dshHome)
  add('Web profile', existsSync(s.profilePath), s.profilePath)
  const packageFile = join(s.profilePath, 'package.json')
  add('package.json', existsSync(packageFile))
  if (existsSync(packageFile)) { try { JSON.parse(readFileSync(packageFile, 'utf8')); add('package.json JSON', true) } catch (e) { add('package.json JSON', false, String(e.message)) } }
  add('pnpm-lock.yaml', existsSync(join(s.profilePath, 'pnpm-lock.yaml')))
  try { add('Recorded DSH version', true, await verifyRuntime(s.runtimeSpec)) } catch (e) { add('Recorded DSH version', false, e.message) }
  try { await installProfile(s.runtimeSpec, s.profilePath, s.dshHome, true); add('Frozen pnpm install', true) } catch (e) { add('Frozen pnpm install', false, String(e.stderr || e.message)) }
  if (checks.every(c => c.ok)) {
    try { const r = await validateRuntime({ running: runtimeInfo(id).running, start: () => startSandbox(id), stop: () => stopSandbox(id) }); add('DSH sandbox boot', true, r.url) }
    catch (e) { add('DSH sandbox boot', false, String(e.message)) }
  }
  const ok = checks.every(c => c.ok)
  if (ok) await snapshot(id, 'Validation passed')
  return { ok, checks, plugins: await pluginSummary(id) }
}
async function gitDiff(id, ref = 'HEAD') { const s = getSandbox(id); const { stdout: stat } = await git(s.path, ['diff', '--stat', ref, '--']); const { stdout: patch } = await git(s.path, ['diff', ref, '--']); return { stat: String(stat), patch: String(patch) } }
async function gitHistory(id) { const s = getSandbox(id); const { stdout } = await git(s.path, ['log', '--pretty=format:%h%x09%ad%x09%s', '--date=iso', '-30']); return String(stdout).split('\n').filter(Boolean) }
async function resetSandbox(id) { const s = getSandbox(id); await git(s.path, ['reset', '--hard', 'HEAD']); await git(s.path, ['clean', '-fd', '--exclude=node_modules']); return { ok: true } }
async function rollbackSandbox(id, commit = 'HEAD~1') { const s = getSandbox(id); await git(s.path, ['reset', '--hard', commit]); return { ok: true, head: String((await git(s.path, ['rev-parse', 'HEAD'])).stdout).trim() } }
async function promote(id) {
  const s = getSandbox(id), stable = detectStableHome()
  if (!stable) throw new Error('STABLE DSH_HOME is unknown. Set DSH_PLUGIN_SANDBOX_STABLE_HOME before launching DSH.')
  const validation = await validateSandbox(id)
  if (!validation.ok) throw new Error('Promotion blocked: validation failed.')
  const mainRuntime = await resolveRuntime()
  if (mainRuntime.version !== s.runtimeSpec.version) throw new Error(`Promotion blocked: main DSH ${mainRuntime.version} differs from sandbox DSH ${s.runtimeSpec.version}.`)
  return promoteWebProfile({ sourceProfile: s.profilePath, targetHome: stable,
    install: (profile, home, frozen) => installProfile(mainRuntime, profile, home, frozen),
    verify: async home => {
      const boot = await startRuntime({ command: mainRuntime.command, args: [...mainRuntime.args, 'web', '--host', '127.0.0.1', '--port', '0', '--no-open'], cwd: home, env: childEnvironment(home), logPath: join(s.path, 'logs', 'promotion.log') })
      await stopRuntime(boot.process)
    },
  })
}
async function destroySandbox(id) { await stopSandbox(id); const s = getSandbox(id); rmSync(s.path, { recursive: true, force: true }); const data = registry(); delete data.sandboxes[id]; save(data); return { ok: true } }

export function apply(ctx) {
  ctx.effect(() => {
    const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    const handler = async (req, res) => {
      try {
        if (req.method !== 'POST') {
          res.writeHead(405, headers)
          res.end(JSON.stringify({ ok: false, error: 'POST required' }))
          return
        }
        let raw = ''
        for await (const chunk of req) raw += chunk
        const { method, args = {} } = JSON.parse(raw || '{}')
        let result
        switch (method) {
          case 'status': result = await status(); break
          case 'install-locale': result = await installLocale(args); break
          case 'submit-locale': result = await submitLocale(args); break
          case 'locale-state': result = await localeState(args); break
          case 'create': result = await createSandbox(args); break
          case 'install': result = await installPlugin(args.id, args.spec, args.sourceCwd || process.cwd()); break
          case 'start': result = await startSandbox(args.id); break
          case 'stop': result = await stopSandbox(args.id); break
          case 'snapshot': result = { commit: await snapshot(args.id, args.message || 'Manual snapshot') }; break
          case 'diff': result = await gitDiff(args.id, args.ref || 'HEAD'); break
          case 'history': result = await gitHistory(args.id); break
          case 'validate': result = await validateSandbox(args.id); break
          case 'reset': result = await resetSandbox(args.id); break
          case 'rollback': result = await rollbackSandbox(args.id, args.commit || 'HEAD~1'); break
          case 'promote': result = await promote(args.id); break
          case 'destroy': result = await destroySandbox(args.id); break
          default: throw new Error(`Unknown method: ${method}`)
        }
        res.writeHead(200, headers)
        res.end(JSON.stringify({ ok: true, result }))
      } catch (error) {
        res.writeHead(400, headers)
        res.end(JSON.stringify({ ok: false, error: redactDiagnostic(error instanceof Error ? error.message : error) }))
      }
    }
    const disposeRoute = ctx.webServer.register({ kind: 'exact', path: '/api/dsh-plugin-sandbox', handler })
    return () => {
      disposeRoute()
      for (const record of runtimes.values()) void stopRuntime(record.process)
      runtimes.clear()
    }
  }, 'dsh-plugin-sandbox: api')
}
