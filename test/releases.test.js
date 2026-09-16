import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compareVersions, fetchLatestRelease, installVerifiedRelease, parseRelease, releaseStatus, selectAssets, verifyChecksum } from '../lib/releases.js'

const repo = 'tommilevs/dsh-plugin-sandbox'
const base = 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/download/v0.5.1/'

test('compares stable semantic versions', () => {
  assert.equal(compareVersions('0.5.1', '0.5.0'), 1)
  assert.equal(compareVersions('0.5.0', '0.5.0'), 0)
  assert.equal(compareVersions('0.5.0', '0.5.1'), -1)
})

test('selects a matching archive and checksum from the configured GitHub repository', () => {
  const release = selectAssets({ tag_name: 'v0.5.1', html_url: 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/tag/v0.5.1', assets: [
    { name: 'dsh-plugin-sandbox-0.5.1.tgz', browser_download_url: `${base}dsh-plugin-sandbox-0.5.1.tgz` },
    { name: 'dsh-plugin-sandbox-0.5.1.tgz.sha256', browser_download_url: `${base}dsh-plugin-sandbox-0.5.1.tgz.sha256` },
  ] }, repo)
  assert.deepEqual(release, { version: '0.5.1', archiveUrl: `${base}dsh-plugin-sandbox-0.5.1.tgz`, checksumUrl: `${base}dsh-plugin-sandbox-0.5.1.tgz.sha256`, notesUrl: 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/tag/v0.5.1' })
})

test('rejects an asset URL outside the configured GitHub repository', () => {
  assert.throws(() => selectAssets({ tag_name: 'v0.5.1', assets: [
    { name: 'dsh-plugin-sandbox-0.5.1.tgz', browser_download_url: 'https://example.test/plugin.tgz' },
    { name: 'dsh-plugin-sandbox-0.5.1.tgz.sha256', browser_download_url: `${base}dsh-plugin-sandbox-0.5.1.tgz.sha256` },
  ] }, repo), /GitHub release asset/)
})

test('verifies the archive checksum before installation', () => {
  const archive = Buffer.from('verified package')
  const digest = createHash('sha256').update(archive).digest('hex')
  assert.equal(verifyChecksum(archive, `${digest}  dsh-plugin-sandbox-0.5.1.tgz`), digest)
  assert.throws(() => verifyChecksum(archive, `${'0'.repeat(64)}  archive.tgz`), /checksum/i)
})

test('parses only published stable releases', () => {
  assert.equal(parseRelease({ tag_name: 'v0.5.1', draft: false, prerelease: false }).version, '0.5.1')
  assert.throws(() => parseRelease({ tag_name: 'v0.5.1-beta.1', draft: false, prerelease: true }), /stable/i)
})

test('does not offer an update for a linked development installation', async () => {
  const result = await releaseStatus({ installedSpec: 'link:../../../dsh-plugin-sandbox-working', installedVersion: '0.5.0', fetchRelease: async () => { throw new Error('must not fetch') } })
  assert.deepEqual(result, { state: 'development-link', installedVersion: '0.5.0' })
})

test('reports an available release only when it is newer than the installed version', async () => {
  const result = await releaseStatus({ installedSpec: '^0.5.0', installedVersion: '0.5.0', fetchRelease: async () => ({ tag_name: 'v0.5.1', html_url: 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/tag/v0.5.1', assets: [
    { name: 'dsh-plugin-sandbox-0.5.1.tgz', browser_download_url: `${base}dsh-plugin-sandbox-0.5.1.tgz` },
    { name: 'dsh-plugin-sandbox-0.5.1.tgz.sha256', browser_download_url: `${base}dsh-plugin-sandbox-0.5.1.tgz.sha256` },
  ] }) })
  assert.equal(result.state, 'update-available')
  assert.equal(result.release.version, '0.5.1')
})

test('fetchLatestRelease uses the public releases endpoint', async () => {
  let requested = ''
  await fetchLatestRelease(async url => { requested = url; return { ok: true, json: async () => ({ tag_name: 'v0.5.1' }) } }, repo)
  assert.equal(requested, `https://api.github.com/repos/${repo}/releases/latest`)
})

test('restores the profile manifest if verified release installation fails', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'release-rollback-'))
  mkdirSync(join(profile, 'node_modules', 'dsh-plugin-sandbox'), { recursive: true })
  writeFileSync(join(profile, 'package.json'), JSON.stringify({ dependencies: { 'dsh-plugin-sandbox': '^0.5.0' } }))
  writeFileSync(join(profile, 'node_modules', 'dsh-plugin-sandbox', 'package.json'), JSON.stringify({ name: 'dsh-plugin-sandbox', version: '0.5.0' }))
  await assert.rejects(() => installVerifiedRelease({ profile, archivePath: '/tmp/release.tgz', version: '0.5.1', install: async () => { throw new Error('install failed') } }), /install failed/)
  assert.equal(JSON.parse(readFileSync(join(profile, 'package.json'))).dependencies['dsh-plugin-sandbox'], '^0.5.0')
})

test('backs up the manifest and verifies the installed release version', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'release-success-'))
  mkdirSync(join(profile, 'node_modules', 'dsh-plugin-sandbox'), { recursive: true })
  writeFileSync(join(profile, 'package.json'), JSON.stringify({ dependencies: { 'dsh-plugin-sandbox': '^0.5.0' } }))
  writeFileSync(join(profile, 'node_modules', 'dsh-plugin-sandbox', 'package.json'), JSON.stringify({ name: 'dsh-plugin-sandbox', version: '0.5.0' }))
  const result = await installVerifiedRelease({ profile, archivePath: '/tmp/release.tgz', version: '0.5.1', install: async () => writeFileSync(join(profile, 'node_modules', 'dsh-plugin-sandbox', 'package.json'), JSON.stringify({ name: 'dsh-plugin-sandbox', version: '0.5.1' })) })
  assert.equal(result.restartRequired, true)
  assert.equal(JSON.parse(readFileSync(join(profile, 'package.json'))).dependencies['dsh-plugin-sandbox'], 'file:/tmp/release.tgz')
  assert.ok(result.backupPath.endsWith('.json'))
})
