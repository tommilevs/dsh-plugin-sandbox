import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { compareVersions, parseRelease, selectAssets, verifyChecksum } from '../lib/releases.js'

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
