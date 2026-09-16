import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

test('create RPC builds clean or copied profiles with pinned runtime and without main account data', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'sandbox-lifecycle-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const main = join(dir, 'main'), root = join(dir, 'registry'), entry = join(dir, 'fixture-dsh.js')
  mkdirSync(main, { recursive: true })
  writeFileSync(join(main, 'auth.json'), '{"token":"do-not-copy"}')
  writeFileSync(entry, `const fs=require('node:fs'),path=require('node:path');
if(process.argv.includes('--version')) { console.log('0.1.5-rc.1'); process.exit(0) }
if(process.argv[2]!=='plugin'||!process.argv.includes('install')) throw Error('Unexpected command');
const dir=path.join(process.env.DSH_HOME,'profiles/web'); fs.mkdirSync(dir,{recursive:true});
if(!fs.existsSync(path.join(dir,'package.json'))) fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({name:'clean-profile',private:true,dependencies:{},dsh:{profile:{bundles:['shipped-base','shipped-web']}}}));
fs.writeFileSync(path.join(dir,'pnpm-lock.yaml'),'lockfileVersion: 9.0\\n');
`)
  const saved = { ...process.env }
  process.env.DSH_PLUGIN_SANDBOX_ROOT = root
  process.env.DSH_PLUGIN_SANDBOX_STABLE_HOME = main
  process.env.DSH_PLUGIN_SANDBOX_DSH_BIN = entry
  t.after(() => { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved) })
  const module = await import(`../lib/index.js?lifecycle=${Date.now()}`)
  let handler, dispose
  module.apply({ effect: fn => { dispose = fn() }, webServer: { register: route => { handler = route.handler; return () => {} } } })
  t.after(() => dispose?.())
  async function rpc(args) {
    let response
    await handler({ method: 'POST', async *[Symbol.asyncIterator]() { yield JSON.stringify({ method: 'create', args }) } }, { writeHead() {}, end: body => { response = JSON.parse(body) } })
    assert.equal(response.ok, true, response.error)
    return response.result
  }
  const clean = await rpc({ id: 'clean', copyPlugins: false })
  const cleanPkg = JSON.parse(readFileSync(join(clean.profilePath, 'package.json')))
  assert.deepEqual(cleanPkg.dsh.profile.bundles, ['shipped-base', 'shipped-web'])
  assert.equal(existsSync(join(clean.dshHome, 'auth.json')), false)
  assert.equal(existsSync(join(clean.profilePath, 'cordis.patch.yml')), false)
  assert.equal(clean.runtimeSpec.version, '0.1.5-rc.1')
  assert.equal(clean.copyPlugins, false)
  mkdirSync(join(main, 'profiles/web'), { recursive: true })
  writeFileSync(join(main, 'profiles/web/package.json'), JSON.stringify({ name: 'fixture-profile', private: true, dependencies: {}, dsh: { profile: { bundles: ['shipped-base', 'custom-main'] } } }))
  writeFileSync(join(main, 'profiles/web/cordis.patch.yml'), '- id: custom-main\n  disabled: true\n')
  const copy = await rpc({ id: 'copy', copyPlugins: true })
  assert.deepEqual(JSON.parse(readFileSync(join(copy.profilePath, 'package.json'))).dsh.profile.bundles, ['shipped-base', 'custom-main'])
  assert.equal(copy.runtimeSpec.version, clean.runtimeSpec.version)
  assert.equal(existsSync(join(copy.dshHome, 'auth.json')), false)
})
