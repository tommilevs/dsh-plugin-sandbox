import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/

function stableVersion(value) {
  const version = String(value || '').replace(/^v/, '')
  if (!VERSION.test(version)) throw new Error('Release must use a stable semantic version.')
  return version
}

export function compareVersions(a, b) {
  const left = stableVersion(a).split('.').map(Number)
  const right = stableVersion(b).split('.').map(Number)
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1
  }
  return 0
}

export function parseRelease(payload) {
  if (!payload || payload.draft || payload.prerelease) throw new Error('Release must be published and stable.')
  return { ...payload, version: stableVersion(payload.tag_name) }
}

function trustedAssetUrl(value, repo) {
  const url = new URL(String(value || ''))
  const expected = `/${repo}/releases/download/`
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith(expected)) throw new Error('GitHub release asset URL is not trusted.')
  return url.toString()
}

export function selectAssets(payload, repo) {
  const release = parseRelease(payload)
  const archiveName = `dsh-plugin-sandbox-${release.version}.tgz`
  const assets = Array.isArray(release.assets) ? release.assets : []
  const archive = assets.find(asset => asset?.name === archiveName)
  const checksum = assets.find(asset => asset?.name === `${archiveName}.sha256`)
  if (!archive || !checksum) throw new Error(`Release ${release.version} is missing its package archive or checksum.`)
  return {
    version: release.version,
    archiveUrl: trustedAssetUrl(archive.browser_download_url, repo),
    checksumUrl: trustedAssetUrl(checksum.browser_download_url, repo),
    notesUrl: new URL(String(release.html_url || `https://github.com/${repo}/releases/tag/v${release.version}`)).toString(),
  }
}

export function verifyChecksum(archive, checksumText) {
  const expected = String(checksumText || '').match(/\b[a-fA-F0-9]{64}\b/)?.[0]?.toLowerCase()
  if (!expected) throw new Error('Release checksum is invalid.')
  const actual = createHash('sha256').update(archive).digest('hex')
  if (actual !== expected) throw new Error('Release checksum does not match the downloaded archive.')
  return actual
}

export async function fetchLatestRelease(fetcher, repo) {
  const response = await fetcher(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { accept: 'application/vnd.github+json' } })
  if (!response?.ok) throw new Error(`GitHub Releases is unavailable${response?.status ? ` (HTTP ${response.status})` : ''}.`)
  return response.json()
}

export async function releaseStatus({ installedSpec, installedVersion, fetchRelease, repo = 'tommilevs/dsh-plugin-sandbox' }) {
  if (/^(?:link:|file:)/.test(String(installedSpec || ''))) return { state: 'development-link', installedVersion }
  const release = selectAssets(await fetchRelease(), repo)
  return compareVersions(release.version, installedVersion) > 0
    ? { state: 'update-available', installedVersion, release }
    : { state: 'up-to-date', installedVersion, release }
}

export async function installVerifiedRelease({ profile, archivePath, version, install }) {
  const manifestPath = join(profile, 'package.json')
  const lockPath = join(profile, 'pnpm-lock.yaml')
  if (!existsSync(manifestPath)) throw new Error('DSH web profile is missing package.json.')
  const backupDir = join(profile, '.dsh-plugin-sandbox-backups')
  mkdirSync(backupDir, { recursive: true })
  const stamp = Date.now()
  const backupPath = join(backupDir, `dsh-plugin-sandbox-${stamp}.json`)
  const backupLock = join(backupDir, `dsh-plugin-sandbox-${stamp}.pnpm-lock.yaml`)
  copyFileSync(manifestPath, backupPath)
  if (existsSync(lockPath)) copyFileSync(lockPath, backupLock)
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.dependencies ||= {}
    manifest.dependencies['dsh-plugin-sandbox'] = `file:${archivePath}`
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    await install()
    const installedPath = join(profile, 'node_modules', 'dsh-plugin-sandbox', 'package.json')
    const installed = JSON.parse(readFileSync(installedPath, 'utf8'))
    if (installed.name !== 'dsh-plugin-sandbox' || installed.version !== version) throw new Error(`Installed release verification failed: expected dsh-plugin-sandbox@${version}.`)
    return { version, backupPath, restartRequired: true }
  } catch (error) {
    copyFileSync(backupPath, manifestPath)
    if (existsSync(backupLock)) copyFileSync(backupLock, lockPath)
    throw error
  }
}
