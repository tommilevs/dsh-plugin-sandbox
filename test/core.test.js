import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync, statSync, lstatSync, readlinkSync, symlinkSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { safeId, sandboxDir, normalizePluginSpec, copyTree, preparePnpm } from '../lib/core.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-core-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('safeId accepts sandbox ids and rejects traversal', () => {
  assert.equal(safeId('demo'), 'demo')
  assert.throws(() => safeId('../demo'))
  assert.throws(() => safeId('.'))
  assert.throws(() => safeId('..'))
  assert.equal(sandboxDir('/tmp/root', 'demo'), '/tmp/root/sandboxes/demo')
})

test('copyTree preserves executable files and internal links without copying node_modules', async t => {
  const root = tempDir(t), source = join(root, 'source'), target = join(root, 'target')
  mkdirSync(join(source, 'bin'), { recursive: true })
  writeFileSync(join(source, 'bin', 'run'), '#!/bin/sh\nexit 0\n')
  chmodSync(join(source, 'bin', 'run'), 0o751)
  symlinkSync('bin/run', join(source, 'run'))
  symlinkSync(join(source, 'bin', 'run'), join(source, 'absolute-run'))
  symlinkSync('.', join(source, 'loop'))
  mkdirSync(join(source, 'node_modules'))
  writeFileSync(join(source, 'node_modules', 'ignored'), 'dependency')
  mkdirSync(join(source, 'skip'))
  await copyTree(source, target, new Set(['skip']))
  assert.equal(statSync(join(target, 'bin', 'run')).mode & 0o777, 0o751)
  assert.equal(readFileSync(join(target, 'run'), 'utf8'), '#!/bin/sh\nexit 0\n')
  assert.equal(readlinkSync(join(target, 'absolute-run')), 'bin/run')
  assert.equal(lstatSync(join(target, 'loop')).isSymbolicLink(), true)
  assert.equal(existsSync(join(target, 'node_modules')), false)
  assert.equal(existsSync(join(target, 'skip')), false)
})

test('copyTree refuses links outside the snapshot to avoid sharing writable source files', async t => {
  const root = tempDir(t), source = join(root, 'source')
  mkdirSync(source)
  writeFileSync(join(root, 'private'), 'untouched')
  symlinkSync('../private', join(source, 'external'))
  await assert.rejects(copyTree(source, join(root, 'target')), /symlink.*outside/i)
  assert.equal(readFileSync(join(root, 'private'), 'utf8'), 'untouched')
})

test('preparePnpm preserves explicit install and native build policy exactly', t => {
  const dir = tempDir(t)
  const policy = '# workspace policy\r\nautoInstallPeers: true\r\nallowBuilds:\r\n  node-pty: false\r\n  esbuild: true\r\noverrides:\r\n  react: 18.2.0\r\n'
  writeFileSync(join(dir, 'pnpm-workspace.yaml'), policy)
  preparePnpm(dir)
  assert.equal(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), policy)
})

test('preparePnpm adds only the peer default without granting build scripts', t => {
  const dir = tempDir(t)
  writeFileSync(join(dir, 'pnpm-workspace.yaml'), '# keep this\nallowBuilds:\n  node-pty: false\n')
  preparePnpm(dir)
  assert.equal(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), '# keep this\nallowBuilds:\n  node-pty: false\nautoInstallPeers: false\n')
  const empty = join(dir, 'empty')
  preparePnpm(empty)
  assert.equal(readFileSync(join(empty, 'pnpm-workspace.yaml'), 'utf8'), 'autoInstallPeers: false\n')
})

test('normalizePluginSpec resolves local paths from explicit source cwd', () => {
  assert.equal(normalizePluginSpec('.', '/tmp/plugins'), '/tmp/plugins')
  assert.equal(normalizePluginSpec('../plugin', '/tmp/plugins/sub'), '/tmp/plugins/plugin')
  assert.equal(normalizePluginSpec('dshmarket@1', '/tmp/plugins'), 'dshmarket@1')
})
