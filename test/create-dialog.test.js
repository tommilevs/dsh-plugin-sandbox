import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

function loadClientInternals() {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
    .replace(
      'module.exports = { name, inject, apply }',
      'module.exports = { name, inject, apply, NewSandboxDialog, Button }',
    )
  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children } }
    },
  }
  let exported
  const window = {
    __ModuleLoader__: {
      load(definition) { exported = definition.factory(() => React) },
    },
  }
  vm.runInNewContext(source, { window, console, setTimeout, clearTimeout })
  return { React, exported }
}

function allNodes(node, result = []) {
  if (!node || typeof node !== 'object') return result
  result.push(node)
  for (const child of node.props?.children || []) {
    if (Array.isArray(child)) child.forEach(item => allNodes(item, result))
    else allNodes(child, result)
  }
  return result
}

test('new sandbox dialog offers copying main plugins and defaults it on', () => {
  const { exported } = loadClientInternals()
  const changes = []
  const tree = exported.NewSandboxDialog({
    open: true,
    id: 'video-tools',
    onIdChange() {},
    onCopyPluginsChange(value) { changes.push(value) },
    onSubmit() {},
    onClose() {},
  })
  const nodes = allNodes(tree)
  const checkbox = nodes.find(node => node.type === 'input' && node.props.type === 'checkbox')

  assert.ok(checkbox, 'copy-plugins checkbox should be rendered')
  assert.equal(checkbox.props.checked, true)
  checkbox.props.onChange({ target: { checked: false } })
  assert.deepEqual(changes, [false])
  assert.match(nodes.flatMap(node => node.props?.children || []).filter(x => typeof x === 'string').join(' '), /plugins.*settings/i)
})

test('button preserves submit type so the create form can submit', () => {
  const { exported } = loadClientInternals()
  const button = exported.Button({ children: 'Create', type: 'submit' })
  assert.equal(button.props.type, 'submit')
})
