import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tagWorkflow = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8')
const weeklyWorkflow = readFileSync(new URL('../.github/workflows/weekly-locale-release.yml', import.meta.url), 'utf8')

test('tag releases verify the package version, test, pack and attach a checksum', () => {
  assert.match(tagWorkflow, /push:\s*\n\s*tags:/)
  assert.match(tagWorkflow, /npm test/)
  assert.match(tagWorkflow, /npm pack/)
  assert.match(tagWorkflow, /sha256sum/)
  assert.match(tagWorkflow, /softprops\/action-gh-release/)
})

test('weekly release is Sunday 09:00 UTC and refuses code changes', () => {
  assert.match(weeklyWorkflow, /'0 9 \* \* 0'/)
  assert.match(weeklyWorkflow, /git diff --name-only/)
  assert.match(weeklyWorkflow, /\^locales\/.*\\\.json\$/)
  assert.match(weeklyWorkflow, /No locale-only changes; no release created/)
})
