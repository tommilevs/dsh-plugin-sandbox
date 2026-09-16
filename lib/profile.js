import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { command, copyTree } from './core.js'
import { redactJsonSecrets, redactYamlSecrets } from './secrets.js'
import { probeRuntime } from './runtime.js'

const PROFILE_FILES = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'cordis.yml', 'cordis.patch.yml']
const SOURCE_EXCLUDES = new Set(['node_modules', '.git', '.env', '.npmrc', '.sandbox-packages', '.dsh-module-fallback'])
const DEPENDENCY_GROUPS = ['dependencies', 'optionalDependencies', 'devDependencies']
const localPath = spec => typeof spec === 'string' && /^(?:file:|link:|\.\.?[/\\]|[/\\]|[A-Za-z]:[/\\])/.test(spec)
const readJson = file => JSON.parse(readFileSync(file, 'utf8'))
const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')

export function childEnvironment(home, inherited = process.env) {
  const env = { ...inherited }
  for (const key of Object.keys(env)) {
    if (key.startsWith('DSH_PLUGIN_SANDBOX_') || /^DSH_(?:PROFILE|PROFILE_DIR|CONFIG|CONFIG_PATH|PATCH)$/.test(key)) delete env[key]
  }
  return { ...env, DSH_HOME: resolve(home), DSH_PLUGIN_SANDBOX_ROOT: join(resolve(home), '.sandbox'), DSH_PLUGIN_SANDBOX_STABLE_HOME: resolve(home) }
}

function installationFor(entry) {
  if (!entry || !existsSync(entry)) return null
  let dir = dirname(realpathSync(entry))
  while (true) {
    const manifest = join(dir, 'package.json')
    if (existsSync(manifest)) {
      try { if (readJson(manifest).name === '@deepseek-ai/dsh') return manifest } catch {}
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export async function resolveRuntime({ env = process.env, argv = process.argv, execPath = process.execPath } = {}) {
  const runningEntry = argv[1] && installationFor(argv[1]) ? realpathSync(argv[1]) : null
  const override = env.DSH_PLUGIN_SANDBOX_DSH_BIN
  const entry = override || runningEntry
  if (!entry || !existsSync(entry)) throw new Error('The running DSH executable could not be identified. Set DSH_PLUGIN_SANDBOX_DSH_BIN to this DSH installation.')
  const resolvedEntry = realpathSync(entry)
  const runtime = /\.[cm]?js$/.test(resolvedEntry)
    ? { command: execPath, args: [resolvedEntry] }
    : { command: resolvedEntry, args: [] }
  runtime.version = String((await command(runtime.command, [...runtime.args, '--version'])).stdout).trim()
  if (!runtime.version) throw new Error('The DSH executable did not report a version.')
  if (runningEntry && override) {
    const runningVersion = String((await command(execPath, [runningEntry, '--version'])).stdout).trim()
    if (runningVersion !== runtime.version) throw new Error(`DSH version mismatch: current ${runningVersion}, selected ${runtime.version}.`)
  }
  return runtime
}

export async function verifyRuntime(runtime) {
  if (!runtime?.command || !runtime.version) throw new Error('Sandbox has no recorded DSH version. Create a new sandbox from the current DSH.')
  const version = String((await command(runtime.command, [...(runtime.args || []), '--version'])).stdout).trim()
  if (version !== runtime.version) throw new Error(`DSH version changed: expected ${runtime.version}, found ${version}.`)
  return version
}

// Local checkouts become package copies in the profile. Relative file specs survive
// both sandbox creation and promotion; editing the original checkout cannot alter them.
export async function vendorLocalDependencies(profile, sourceProfile = profile) {
  const vendorRoot = join(profile, '.sandbox-packages'), copied = new Map()
  async function vendor(source) {
    const canonical = realpathSync(source)
    if (copied.has(canonical)) return copied.get(canonical)
    const ownedPath = relative(resolve(vendorRoot), canonical)
    if (resolve(profile) === resolve(sourceProfile) && ownedPath && !ownedPath.startsWith('..') && !isAbsolute(ownedPath)) {
      copied.set(canonical, canonical)
      if (statSync(canonical).isDirectory()) await rewriteManifest(join(canonical, 'package.json'), canonical)
      return canonical
    }
    const hash = createHash('sha256').update(canonical).digest('hex').slice(0, 12)
    const target = join(vendorRoot, `${basename(canonical).replace(/[^a-zA-Z0-9._-]/g, '-')}-${hash}`)
    copied.set(canonical, target)
    mkdirSync(vendorRoot, { recursive: true })
    if (statSync(canonical).isDirectory()) {
      await copyTree(canonical, target, SOURCE_EXCLUDES)
      if (!existsSync(join(target, 'package.json'))) throw new Error(`Local plugin has no package.json: ${canonical}`)
      await rewriteManifest(join(target, 'package.json'), canonical)
    } else copyFileSync(canonical, target)
    return target
  }
  async function rewriteManifest(file, originalDirectory) {
    const pkg = readJson(file)
    for (const group of DEPENDENCY_GROUPS) {
      for (const [name, spec] of Object.entries(pkg[group] || {})) {
        if (!localPath(spec)) continue
        const raw = spec.replace(/^(?:file|link):/, '')
        const source = isAbsolute(raw) ? raw : resolve(originalDirectory, raw)
        const target = await vendor(source)
        const path = relative(dirname(file), target).split('\\').join('/')
        pkg[group][name] = `file:${path.startsWith('.') ? path : `./${path}`}`
      }
    }
    writeJson(file, pkg)
  }
  await rewriteManifest(join(profile, 'package.json'), sourceProfile)
}

export async function copyWebProfile(source, target, { copyPlugins = true } = {}) {
  mkdirSync(target, { recursive: true })
  if (!copyPlugins) return
  if (!existsSync(join(source, 'package.json'))) throw new Error(`Main DSH web profile is missing: ${source}`)
  for (const name of PROFILE_FILES) {
    const from = join(source, name), to = join(target, name)
    if (!existsSync(from)) continue
    if (name === 'package.json') writeJson(to, redactJsonSecrets(readJson(from)))
    else writeFileSync(to, redactYamlSecrets(readFileSync(from, 'utf8')))
  }
  await vendorLocalDependencies(target, source)
}

export async function validateRuntime({ running, start, stop, probe = probeRuntime }) {
  try {
    const result = await start()
    if (!result?.url || !await probe(result.url)) throw new Error('DSH sandbox runtime is not responding.')
    return result
  }
  finally { if (!running) await stop() }
}

export async function promoteWebProfile({ sourceProfile, targetHome, install, verify }) {
  const target = join(targetHome, 'profiles', 'web')
  if (resolve(sourceProfile) === resolve(target)) throw new Error('Cannot promote a profile into itself.')
  const id = randomUUID()
  const stagingHome = join(targetHome, '.sandbox-promotions', id)
  const staging = join(stagingHome, 'profiles', 'web')
  const backup = join(targetHome, 'profiles', `web.dsh-plugin-sandbox-backup-${id}`)
  const failed = join(targetHome, 'profiles', `web.dsh-plugin-sandbox-failed-${id}`)
  let backedUp = false, activated = false
  try {
    await copyWebProfile(sourceProfile, staging)
    await install(staging, stagingHome, false)
    await verify(stagingHome)
    if (existsSync(target)) { renameSync(target, backup); backedUp = true }
    renameSync(staging, target)
    activated = true
    // Build the package tree again at its final path: pnpm and DSH may have
    // written absolute links during staging. The old tree remains in backup.
    rmSync(join(target, 'node_modules'), { recursive: true, force: true })
    rmSync(join(target, '.dsh-module-fallback'), { recursive: true, force: true })
    await install(target, targetHome, true)
    await verify(targetHome)
    return { ok: true, stable: targetHome, backup: backedUp ? backup : null, restartRequired: true }
  } catch (error) {
    if (activated && existsSync(target)) renameSync(target, failed)
    if (backedUp) {
      try { renameSync(backup, target) }
      catch (restoreError) { throw new Error(`Promotion failed and automatic recovery failed. Original profile is at ${backup}: ${restoreError.message}; ${error.message}`) }
    }
    throw new Error(`Promotion failed${backedUp ? '; original profile restored' : ' before activation'}: ${error.message}`)
  } finally {
    rmSync(stagingHome, { recursive: true, force: true })
  }
}
