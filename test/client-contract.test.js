import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

test('language picker has universal Auto mode and metadata-driven locale labels', () => {
  assert.match(client, /value: 'auto'/)
  assert.match(client, /'🌐 Auto'/)
  assert.match(client, /meta\.nativeName/)
  assert.match(client, /meta\.flag/)
  assert.doesNotMatch(client, /t\('language\.russian'\)/)
  assert.doesNotMatch(client, /t\('language\.english'\)/)
})

test('Add Language captures locale identity separately from translation JSON', () => {
  assert.match(client, /dialogs\.localeFlag/)
  assert.match(client, /metadata: \{ code: normalizedCode, nativeName, flag: flag\.trim\(\) \}/)
  assert.match(client, /rpc\('install-locale', \{ code: normalizedCode, nativeName, flag: metadata\.flag, values, replace: Boolean\(localMatch\) \}\)/)
  assert.match(client, /rpc\('submit-locale'/)
  assert.match(client, /localMatch \? \{ code: normalizedCode \} : \{ code: normalizedCode, nativeName, flag: metadata\.flag, values \}/)
})

test('client supports submitting an already-installed locale without re-pasting JSON', () => {
  assert.match(client, /localLocale\(code\)/)
  assert.match(client, /messages\.submitInstalledLocale/)
  assert.match(client, /const result = await rpc\('submit-locale', localMatch \? \{ code: normalizedCode \} : \{ code: normalizedCode, nativeName, flag: metadata\.flag, values \}\)/)
})

test('client rechecks an existing draft before submitting the stored server locale', () => {
  assert.ok(client.includes('const submissionStatus = inspectLocaleDraft({'))
  assert.ok(client.includes('if (submissionStatus.untranslatedKeys.length)'))
  assert.ok(client.includes('if (submissionStatus.hasUnsavedChanges)'))
})

test('client enforces exactly two lowercase ASCII locale letters', () => {
  assert.match(client, /\^\[a-z\]\{2\}\$/)
})

test('language picker opens Add Language outside the native select lifecycle', () => {
  assert.ok(client.includes('window.setTimeout(() => onAddLanguage?.(), 0)'))
  assert.ok(client.includes('event?.preventDefault?.()'))
  assert.ok(client.includes('event?.stopPropagation?.()'))
  assert.ok(client.includes('onPointerDown: event => event.stopPropagation()'))
})


test('translation progress derives from the current JSON draft, not stale locale state', () => {
  assert.ok(client.includes("const draftValues = (() => {"))
  assert.ok(client.includes("try { return JSON.parse(json) } catch { return null }"))
  assert.ok(client.includes("const draftStatus = inspectLocaleDraft({"))
  assert.ok(client.includes("const untranslatedKeys = hasValidCommunityCode ? draftStatus.untranslatedKeys : []"))
  assert.ok(client.includes("totalTranslationKeys - untranslatedKeys.length"))
})


test('readiness status is suppressed while the current JSON draft still has untranslated strings', () => {
  const progressPos = client.indexOf('const draftValues = (() => {')
  const remotePos = client.indexOf('const remoteMessage = (() => {')
  const readyPos = client.indexOf("remoteState.state === 'ready-to-submit'")
  assert.ok(progressPos >= 0 && remotePos > progressPos && readyPos > remotePos)
  assert.ok(client.includes("if (remoteState.state === 'ready-to-submit') return submitBlocked"))
  assert.ok(client.includes("remoteState?.state === 'published' || submitBlocked"))
})

test('server locale metadata is merged with server locale translations', () => {
  assert.match(client, /mergeCustomLocales\(data\.locales \|\| \{\}, data\.localeMetadata \|\| \{\}\)/)
})

test('client exposes manual GitHub Releases update controls', () => {
  assert.match(client, /rpc\('release-status'\)/)
  assert.match(client, /rpc\('update-release'/)
  assert.match(client, /Check for updates/)
  assert.match(client, /Update to v\$\{releaseStatus\.release\.version\}/)
})
