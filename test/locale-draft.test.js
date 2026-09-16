import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const draftHelpers = source.match(/function sameLocaleValues[\s\S]*?(?=\nfunction missingLocaleKeys)/)?.[0]
const inspectLocaleDraft = draftHelpers ? Function(`${draftHelpers}\nreturn inspectLocaleDraft`)() : undefined

const base = { title: 'Title', complete: 'Complete' }

test('missing locale keys block an existing locale submission', () => {
  assert.equal(typeof inspectLocaleDraft, 'function')
  if (typeof inspectLocaleDraft !== 'function') return

  const result = inspectLocaleDraft({
    base,
    draft: { title: 'Titel' },
    existing: true,
    storedValues: { title: 'Titel', complete: 'Fertig' },
  })

  assert.deepEqual(result.missingKeys, ['complete'])
  assert.deepEqual(result.untranslatedKeys, ['complete'])
  assert.equal(result.hasValidationError, true)
  assert.equal(result.hasSubmissionBlock, true)
})

test('English template values block a new locale submission', () => {
  assert.equal(typeof inspectLocaleDraft, 'function')
  if (typeof inspectLocaleDraft !== 'function') return

  const result = inspectLocaleDraft({ base, draft: { ...base }, existing: false })

  assert.deepEqual(result.untranslatedKeys, ['title', 'complete'])
  assert.equal(result.hasValidationError, false)
  assert.equal(result.hasSubmissionBlock, true)
})

test('an unsaved valid locale draft blocks stale submission', () => {
  assert.equal(typeof inspectLocaleDraft, 'function')
  if (typeof inspectLocaleDraft !== 'function') return

  const result = inspectLocaleDraft({
    base,
    draft: { title: 'Anderer Titel', complete: 'Fertig' },
    existing: true,
    storedValues: { title: 'Titel', complete: 'Fertig' },
  })

  assert.equal(result.hasValidationError, false)
  assert.deepEqual(result.untranslatedKeys, [])
  assert.equal(result.hasUnsavedChanges, true)
  assert.equal(result.hasSubmissionBlock, true)
})

test('an unsaved locale identity change blocks stale submission', () => {
  assert.equal(typeof inspectLocaleDraft, 'function')
  if (typeof inspectLocaleDraft !== 'function') return

  const result = inspectLocaleDraft({
    base,
    draft: { title: 'Titel', complete: 'Fertig' },
    existing: true,
    storedValues: { title: 'Titel', complete: 'Fertig' },
    metadata: { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
    storedMetadata: { code: 'de', nativeName: 'Deutsch', flag: '🇦🇹' },
  })

  assert.equal(result.hasValidationError, false)
  assert.equal(result.hasUnsavedChanges, true)
  assert.equal(result.hasSubmissionBlock, true)
})

test('locale value comparison is independent of JSON key order', () => {
  assert.equal(typeof inspectLocaleDraft, 'function')
  if (typeof inspectLocaleDraft !== 'function') return

  const result = inspectLocaleDraft({
    base,
    draft: { complete: 'Fertig', title: 'Titel' },
    existing: true,
    storedValues: { title: 'Titel', complete: 'Fertig' },
    metadata: { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
    storedMetadata: { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  })

  assert.equal(result.hasUnsavedChanges, false)
  assert.equal(result.hasSubmissionBlock, false)
})

test('valid complete translations still show their live progress', () => {
  assert.match(source, /hasValidCommunityCode && draftStatus\.validObject && React\.createElement\('div', \{ style: \{ marginTop: 8, fontSize: 12, opacity: \.92 \} \},\s+`🟡 \$\{formatMessage\(t\('messages\.translationProgress'\)/)
})
