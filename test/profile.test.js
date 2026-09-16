import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, renameSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, delimiter, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { command } from '../lib/core.js'

const profile = await import('../lib/profile.js').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
  return {}
})
function temporary(t) {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-profile-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
function json(file, value) { mkdirSync(resolve(file, '..'), { recursive: true }); writeFileSync(file, JSON.stringify(value)) }
function requireHelper(name) { assert.equal(typeof profile[name], 'function', `${name} must implement the lifecycle behavior`); return profile[name] }

test('copied profile vendors local dependency source and keeps its installed package valid after relocation', async t => {
  const copyProfile = requireHelper('copyWebProfile')
  const dir = temporary(t), source = join(dir, 'main/profiles/web'), dest = join(dir, 'deep/child/profiles/web')
  const plugin = join(dir, 'local-plugin')
  json(join(plugin, 'package.json'), { name: 'fixture-local-plugin', version: '1.0.0', main: 'index.js' })
  writeFileSync(join(plugin, 'index.js'), 'module.exports = "original"\n')
  json(join(source, 'package.json'), { name: 'fixture-profile', private: true, dependencies: { 'fixture-local-plugin': `link:${plugin}` }, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'fixture-local-plugin'] } } })
  writeFileSync(join(source, 'pnpm-workspace.yaml'), 'autoInstallPeers: false\n')
  await copyProfile(source, dest)
  const pkg = JSON.parse(readFileSync(join(dest, 'package.json')))
  assert.match(pkg.dependencies['fixture-local-plugin'], /^file:\./)
  const copied = resolve(dest, pkg.dependencies['fixture-local-plugin'].slice(5))
  assert.equal(readFileSync(join(copied, 'index.js'), 'utf8'), 'module.exports = "original"\n')
  writeFileSync(join(plugin, 'index.js'), 'module.exports = "changed"\n')
  assert.equal(readFileSync(join(copied, 'index.js'), 'utf8'), 'module.exports = "original"\n')
  const pnpm = process.env.TEST_PNPM_BIN || 'pnpm'
  await command(pnpm, ['install', '--no-frozen-lockfile', '--ignore-scripts'], dest, { env: { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ''}` } })
  const moved = join(dir, 'promoted-profile')
  renameSync(dest, moved)
  assert.equal(createRequire(join(moved, 'package.json'))('fixture-local-plugin'), 'original')
})

test('profile copy excludes auth, environment and session files and preserves explicit build approvals', async t => {
  const copyProfile = requireHelper('copyWebProfile')
  const dir = temporary(t), source = join(dir, 'source'), target = join(dir, 'copy')
  json(join(source, 'package.json'), { name: 'profile', dependencies: {}, dsh: { profile: { bundles: ['builtin', 'custom'] } } })
  writeFileSync(join(source, 'cordis.patch.yml'), '- id: custom\n  disabled: true\n')
  const workspace = 'nodeLinker: hoisted\nallowBuilds:\n  reviewed-package: true\n'
  writeFileSync(join(source, 'pnpm-workspace.yaml'), workspace)
  for (const name of ['.env', 'auth.json', 'sessions.json']) writeFileSync(join(source, name), 'private')
  await copyProfile(source, target)
  assert.equal(readFileSync(join(target, 'pnpm-workspace.yaml'), 'utf8'), workspace)
  assert.equal(readFileSync(join(target, 'cordis.patch.yml'), 'utf8'), '- id: custom\n  disabled: true\n')
  for (const name of ['.env', 'auth.json', 'sessions.json']) assert.equal(existsSync(join(target, name)), false)
  const clean = join(dir, 'clean')
  await copyProfile(source, clean, { copyPlugins: false })
  assert.equal(existsSync(join(clean, 'package.json')), false, 'the pinned DSH runtime initializes its own shipped manifest')
  assert.equal(existsSync(join(clean, 'cordis.patch.yml')), false)
})

test('profile copy redacts credentials while retaining package, pnpm, and Cordis configuration', async t => {
  const copyProfile = requireHelper('copyWebProfile')
  const dir = temporary(t), source = join(dir, 'source'), target = join(dir, 'copy')
  json(join(source, 'package.json'), {
    name: 'profile',
    dependencies: {
      'private-plugin': 'git+https://git-user:git-password@git.example.test/acme/plugin.git?ref=v1&token=git-token',
    },
    dsh: {
      profile: { bundles: ['builtin', 'private-plugin'] },
      settings: {
        region: 'eu',
        apiKey: 'package-api-key',
        credentials: { username: 'person', password: 'package-password' },
        endpoint: 'https://api-user:api-password@api.example.test/v1?region=eu&access_token=package-url-token',
      },
    },
  })
  writeFileSync(join(source, 'pnpm-workspace.yaml'), [
    'nodeLinker: hoisted',
    'allowBuilds:',
    '  reviewed-package: true',
    'npmAuthToken: workspace-token',
    'registry: https://registry-user:registry-password@registry.example.test/npm?project=alpha&token=registry-token',
    '',
  ].join('\n'))
  writeFileSync(join(source, 'pnpm-lock.yaml'), [
    'lockfileVersion: "9.0"',
    'settings:',
    '  autoInstallPeers: false',
    'packages:',
    '  private-plugin@1.0.0:',
    '    resolution:',
    '      tarball: https://lock-user:lock-password@registry.example.test/plugin.tgz?download=1&apiKey=lock-url-key',
    '      token: lock-token',
    '',
  ].join('\n'))
  writeFileSync(join(source, 'cordis.patch.yml'), [
    '- id: private-plugin',
    '  config:',
    '    enabled: true',
    '    authorization: Bearer cordis-token',
    '    clientSecret: cordis-secret',
    '    endpoint: https://cordis-user:cordis-password@cordis.example.test/api?locale=ru&secret=cordis-url-secret',
    '',
  ].join('\n'))

  await copyProfile(source, target)

  const copiedPackage = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'))
  assert.equal(copiedPackage.name, 'profile')
  assert.deepEqual(copiedPackage.dsh.profile.bundles, ['builtin', 'private-plugin'])
  assert.equal(copiedPackage.dsh.settings.region, 'eu')
  assert.equal(copiedPackage.dsh.settings.apiKey, '[redacted]')
  assert.equal(copiedPackage.dsh.settings.credentials, '[redacted]')
  assert.equal(copiedPackage.dependencies['private-plugin'], 'git+https://git.example.test/acme/plugin.git?ref=v1')
  assert.equal(copiedPackage.dsh.settings.endpoint, 'https://api.example.test/v1?region=eu')

  for (const name of ['pnpm-workspace.yaml', 'pnpm-lock.yaml', 'cordis.patch.yml']) {
    const copied = readFileSync(join(target, name), 'utf8')
    assert.equal(copied.includes('workspace-token'), false)
    assert.equal(copied.includes('lock-token'), false)
    assert.equal(copied.includes('cordis-token'), false)
    assert.equal(copied.includes('cordis-secret'), false)
    assert.equal(copied.includes('password'), false)
    assert.equal(copied.includes('url-key'), false)
    assert.equal(copied.includes('url-secret'), false)
  }
  const workspace = readFileSync(join(target, 'pnpm-workspace.yaml'), 'utf8')
  assert.match(workspace, /reviewed-package: true/)
  assert.match(workspace, /project=alpha/)
  const lock = readFileSync(join(target, 'pnpm-lock.yaml'), 'utf8')
  assert.match(lock, /autoInstallPeers: false/)
  assert.match(lock, /download=1/)
  const cordis = readFileSync(join(target, 'cordis.patch.yml'), 'utf8')
  assert.match(cordis, /enabled: true/)
  assert.match(cordis, /locale=ru/)
})

test('refreshing a vendored profile keeps the existing local package path stable', async t => {
  const copyProfile = requireHelper('copyWebProfile'), vendor = requireHelper('vendorLocalDependencies')
  const dir = temporary(t), source = join(dir, 'source'), target = join(dir, 'target'), plugin = join(dir, 'plugin')
  json(join(plugin, 'package.json'), { name: 'local-plugin', version: '1.0.0' })
  json(join(source, 'package.json'), { name: 'profile', dependencies: { 'local-plugin': `file:${plugin}` } })
  await copyProfile(source, target)
  const before = JSON.parse(readFileSync(join(target, 'package.json'))).dependencies['local-plugin']
  await vendor(target)
  assert.equal(JSON.parse(readFileSync(join(target, 'package.json'))).dependencies['local-plugin'], before)
})

test('promotion dependency failure leaves the main profile in place', async t => {
  const promoteProfile = requireHelper('promoteWebProfile')
  const dir = temporary(t), source = join(dir, 'source'), home = join(dir, 'main'), target = join(home, 'profiles/web')
  json(join(source, 'package.json'), { name: 'new-profile', dependencies: {} })
  json(join(target, 'package.json'), { name: 'old-profile', dependencies: {} })
  await assert.rejects(promoteProfile({ sourceProfile: source, targetHome: home,
    install: async () => { throw new Error('installation refused') },
    verify: async () => { throw new Error('must not boot') },
  }), /before activation: installation refused/)
  assert.equal(JSON.parse(readFileSync(join(target, 'package.json'))).name, 'old-profile')
})

test('child environment has independent Sandbox management and ignores parent profile overrides', () => {
  const childEnvironment = requireHelper('childEnvironment')
  const env = childEnvironment('/child/home', { DSH_HOME: '/main/home', DSH_PROFILE: 'other', DSH_PROFILE_DIR: '/main/profile', DSH_PLUGIN_SANDBOX_ROOT: '/parent/root', DSH_PLUGIN_SANDBOX_STABLE_HOME: '/main/home', PATH: '/bin' })
  assert.equal(env.DSH_HOME, '/child/home')
  assert.equal(env.DSH_PLUGIN_SANDBOX_STABLE_HOME, '/child/home')
  assert.equal(env.DSH_PLUGIN_SANDBOX_ROOT, '/child/home/.sandbox')
  assert.equal(env.DSH_PROFILE, undefined)
  assert.equal(env.DSH_PROFILE_DIR, undefined)
  assert.equal(env.PATH, '/bin')
})

test('runtime verification rejects a DSH version changed since image creation', async () => {
  const verifyRuntime = requireHelper('verifyRuntime')
  const runtime = { command: process.execPath, args: ['-e', 'console.log("0.1.5-rc.1")', '--'], version: '0.1.5-rc.1' }
  await verifyRuntime(runtime)
  await assert.rejects(verifyRuntime({ ...runtime, version: '0.1.4' }), /version.*changed|version.*match/i)
})

test('runtime selection uses the current DSH installation and records its exact version', async t => {
  const resolveRuntime = requireHelper('resolveRuntime')
  const dir = temporary(t), entry = join(dir, 'lib/bin.js')
  json(join(dir, 'package.json'), { name: '@deepseek-ai/dsh', version: '0.1.5-rc.1' })
  mkdirSync(join(dir, 'lib'))
  writeFileSync(entry, 'console.log("0.1.5-rc.1")\n')
  const runtime = await resolveRuntime({ env: {}, argv: [process.execPath, entry], execPath: process.execPath })
  assert.equal(runtime.command, process.execPath)
  assert.deepEqual(runtime.args, [entry])
  assert.equal(runtime.version, '0.1.5-rc.1')
})

test('promotion keeps main user state and restores original plugin profile after final boot failure', async t => {
  const promoteProfile = requireHelper('promoteWebProfile')
  const dir = temporary(t), source = join(dir, 'source'), home = join(dir, 'main'), target = join(home, 'profiles/web')
  json(join(source, 'package.json'), { name: 'new-profile', dependencies: {} })
  json(join(target, 'package.json'), { name: 'old-profile', dependencies: {} })
  json(join(home, 'auth.json'), { token: 'preserve-me' })
  json(join(home, 'sessions/chat.json'), { message: 'preserve-chat' })
  let boots = 0
  await assert.rejects(promoteProfile({ sourceProfile: source, targetHome: home,
    install: async () => {},
    verify: async () => { if (++boots === 2) throw new Error('simulated final boot failure') },
  }), /restored.*simulated final boot failure/i)
  assert.equal(JSON.parse(readFileSync(join(target, 'package.json'))).name, 'old-profile')
  assert.deepEqual(JSON.parse(readFileSync(join(home, 'auth.json'))), { token: 'preserve-me' })
  assert.deepEqual(JSON.parse(readFileSync(join(home, 'sessions/chat.json'))), { message: 'preserve-chat' })
})

test('promotion preserves backup and activates a fully installed profile', async t => {
  const promoteProfile = requireHelper('promoteWebProfile')
  const dir = temporary(t), source = join(dir, 'source'), home = join(dir, 'main'), target = join(home, 'profiles/web')
  json(join(source, 'package.json'), { name: 'new-profile', dependencies: {} })
  json(join(target, 'package.json'), { name: 'old-profile', dependencies: {} })
  const result = await promoteProfile({ sourceProfile: source, targetHome: home,
    install: async profileDir => json(join(profileDir, 'node_modules/installed.json'), { ready: true }),
    verify: async profileHome => assert.deepEqual(JSON.parse(readFileSync(join(profileHome, 'profiles/web/node_modules/installed.json'))), { ready: true }),
  })
  assert.equal(JSON.parse(readFileSync(join(target, 'package.json'))).name, 'new-profile')
  assert.equal(JSON.parse(readFileSync(join(result.backup, 'package.json'))).name, 'old-profile')
})

test('validation preserves a preexisting runtime and stops only one it started', async () => {
  const validateRuntime = requireHelper('validateRuntime')
  let starts = 0, stops = 0, probes = 0
  const start = async () => { starts++; return { url: 'http://127.0.0.1:1234' } }
  const stop = async () => { stops++ }
  const probe = async () => { probes++; return true }
  await validateRuntime({ running: true, start, stop, probe })
  assert.equal(stops, 0)
  await validateRuntime({ running: false, start, stop, probe })
  assert.equal(stops, 1)
  assert.equal(starts, 2)
  assert.equal(probes, 2)
})

test('validation rejects an unresponsive tracked runtime without stopping it', async () => {
  const validateRuntime = requireHelper('validateRuntime')
  let stops = 0
  await assert.rejects(validateRuntime({
    running: true,
    start: async () => ({ url: 'http://127.0.0.1:1234/?token=secret' }),
    stop: async () => { stops++ },
    probe: async () => false,
  }), /not responding/i)
  assert.equal(stops, 0)
})
