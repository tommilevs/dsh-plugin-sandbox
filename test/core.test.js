import test from 'node:test'
import assert from 'node:assert/strict'
import { safeId, sandboxDir, normalizePluginSpec } from '../lib/core.js'

test('safeId accepts sandbox ids and rejects traversal', () => {
  assert.equal(safeId('demo'), 'demo')
  assert.throws(() => safeId('../demo'))
  assert.equal(sandboxDir('/tmp/root', 'demo'), '/tmp/root/sandboxes/demo')
})

test('normalizePluginSpec resolves local paths from explicit source cwd', () => {
  assert.equal(normalizePluginSpec('.', '/tmp/plugins'), '/tmp/plugins')
  assert.equal(normalizePluginSpec('../plugin', '/tmp/plugins/sub'), '/tmp/plugins/plugin')
  assert.equal(normalizePluginSpec('dshmarket@1', '/tmp/plugins'), 'dshmarket@1')
})
