import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/locale-guard.yml', import.meta.url), 'utf8')

test('Locale Guard validates exactly locale translation and metadata files without checking out PR code', () => {
  assert.match(workflow, /pull_request_target/)
  assert.match(workflow, /!locales\/en\.json/)
  assert.match(workflow, /!locales\/ru\.json/)
  assert.match(workflow, /work\/locales\/en\.json/)
  assert.match(workflow, /locales\/metadata\//)
  assert.doesNotMatch(workflow, /git checkout|actions\/checkout/)
})

test('Locale Guard accepts a translation-only update and retrieves unchanged metadata from the base', () => {
  assert.match(workflow, /Locale PR must change one translation file, with an optional matching metadata file/)
  assert.match(workflow, /metadata_ref="\$HEAD_SHA"/)
  assert.match(workflow, /metadata_ref="\$BASE_SHA"/)
  assert.match(workflow, /contents\/locales\/metadata\/\$metadata\?ref=\$metadata_ref/)
})
