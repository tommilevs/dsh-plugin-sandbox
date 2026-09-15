import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/locale-guard.yml', import.meta.url), 'utf8')

test('Locale Guard validates exactly locale translation and metadata files without checking out PR code', () => {
  assert.match(workflow, /pull_request_target/)
  assert.match(workflow, /work\/locales\/en\.json/)
  assert.match(workflow, /locales\/metadata\//)
  assert.doesNotMatch(workflow, /git checkout|actions\/checkout/)
})
