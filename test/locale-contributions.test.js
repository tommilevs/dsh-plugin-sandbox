import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'))
const ru = JSON.parse(readFileSync(new URL('../locales/ru.json', import.meta.url), 'utf8'))
const enMeta = JSON.parse(readFileSync(new URL('../locales/metadata/en.json', import.meta.url), 'utf8'))

test('English and Russian translations contain only UI strings, not cross-language picker metadata', () => {
  for (const table of [en, ru]) {
    assert.equal('language.russian' in table, false)
    assert.equal('language.english' in table, false)
    assert.equal('language.auto' in table, false)
  }
})

test('built-in English metadata is separate and has exactly the identity fields', () => {
  assert.deepEqual(enMeta, { code: 'en', nativeName: 'English', flag: '🇬🇧' })
})

test('locale validator still validates the exact English key schema', () => {
  execFileSync(process.execPath, ['scripts/validate-locale.mjs', 'locales/en.json', 'locales/ru.json'], { stdio: 'pipe' })
})

test('community locale codes are exactly two lowercase ASCII letters', () => {
  const source = readFileSync(new URL('../scripts/validate-locale.mjs', import.meta.url), 'utf8')
  assert.match(source, /\^\[a-z\]\{2\}\$/)
  for (const code of ['de', 'fr', 'zh', 'ja']) assert.match(code, /^[a-z]{2}$/)
  for (const code of ['DE', 'deu', 'de-DE', 'pt-BR', '1a', 'd', 'de_']) assert.doesNotMatch(code, /^[a-z]{2}$/)
})

test('canonical English locale schema contains all client contribution-state keys', () => {
  for (const key of [
    'dialogs.localeFlag',
    'messages.localeAlreadyInstalled',
    'messages.submitInstalledLocale',
    'messages.updateLocalLocale',
    'messages.localeAlreadyPublished',
    'messages.localeReadyToSubmit',
    'messages.localeUpdateReady',
    'messages.localeRemoteUnknown',
    'messages.updateGithubLocale',
  ]) assert.equal(key in en, true, `missing canonical key: ${key}`)
})



test('embedded client English schema matches the canonical English key set', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  for (const key of Object.keys(en)) {
    assert.match(source, new RegExp(`\"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\":`), `embedded EN is missing canonical key: ${key}`)
  }
  for (const key of ['messages.localeSchemaUpdated', 'messages.untranslatedKeys']) {
    assert.match(source, new RegExp(`\"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\":`))
    assert.equal(key in en, true, `canonical EN is missing client key: ${key}`)
  }
})

test('canonical English and Russian schemas stay key-identical', () => {
  assert.deepEqual(Object.keys(ru).sort(), Object.keys(en).sort())
})
test('legacy local locales can be migrated from the English schema without losing existing translations', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /mergeLocaleWithSchema\(match\.values\)/)
  assert.match(source, /localeNeedsTranslation/)
  assert.match(source, /untranslatedKeys/)
})

test('submit-locale supports server-side reuse of an installed local locale', () => {
  const source = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  assert.match(source, /loadStoredLocalePair\(code\)/)
  assert.match(source, /if \(values === undefined \|\| values === null\)/)
})


test('legacy locale migration keeps newly added schema keys marked as untranslated', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /const untranslatedKeys = \[\.\.\.new Set\(\[\.\.\.missingKeys, \.\.\.rememberedUntranslated\]\)\]/)
  assert.match(source, /const sourceUntranslated = new Set/)
  assert.match(source, /submitBlockedByTranslation/)
})

test('locale contribution state distinguishes new, pending, published and update-ready locales', async () => {
  const { classifyLocaleState } = await import('../lib/locale-state.js')
  assert.equal(classifyLocaleState({ localInstalled: false, remoteExists: false }), 'new')
  assert.equal(classifyLocaleState({ localInstalled: true, remoteExists: false }), 'ready-to-submit')
  assert.equal(classifyLocaleState({ localInstalled: true, remoteExists: true, localEqualsRemote: true }), 'published')
  assert.equal(classifyLocaleState({ localInstalled: true, remoteExists: true, localEqualsRemote: false }), 'update-available')
})


test('local installation refuses duplicate community locale unless replacement is explicit', () => {
  const source = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  assert.match(source, /Locale \$\{code\} is already installed locally/)
  assert.match(source, /!args\.replace/)
})


test('legacy locale update migrates schema before validation', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const installBlock = source.match(/async function installLocal\(\) \{[\s\S]*?\n  \}\n  async function submitGithub/)?.[0] || ''
  assert.match(source, /function mergeLocaleWithSchema\(values\)/)
  assert.match(installBlock, /let values = JSON\.parse\(json\)/)
  assert.match(installBlock, /const migrationKeys =/)
  assert.match(installBlock, /if \(localMatch && migrationKeys\.length\) values = mergeLocaleWithSchema\(values\)/)
  assert.match(installBlock, /validateLocaleClient\(normalizedCode, values\)/)
  assert.equal(installBlock.startsWith('async function installLocal() {\n    setBusy(true)\n    try {\n      const { normalizedCode, nativeName, metadata } = await readAndValidate()'), false, 'legacy install must not validate the stale payload before migration')
  assert.ok(installBlock.indexOf('if (localMatch && migrationKeys.length) values = mergeLocaleWithSchema(values)') < installBlock.lastIndexOf('validateLocaleClient(normalizedCode, values)'), 'migration must happen before final validation')
})

test('GitHub submission distinguishes published, add and update flows', () => {
  const source = readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
  assert.match(source, /alreadyPublished: true/)
  assert.match(source, /const mode = remoteExists \? 'update' : 'add'/)
  assert.match(source, /fix\(i18n\): update/)
})

test('client exposes a dedicated GitHub update action label', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /messages\.updateGithubLocale/)
})

test('Submit explains why it is disabled while locale strings remain untranslated', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /messages\.translateFirst/)
  assert.match(source, /messages\.translationProgress/)
  assert.match(source, /translationPercent/)
})

test('missing translations UI uses human-readable labels instead of internal message keys', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /displayMessage\('messages\.missingTranslations'/)
  assert.match(source, /displayMessage\('messages\.originalEnglish'/)
  assert.match(source, /displayMessage\('messages\.copyMissingJson'/)
  assert.doesNotMatch(source, /formatMessage\(t\('messages\.missingTranslations'/)
})

test('missing translation panel falls back to human labels when a locale contains raw message keys', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /function displayMessage\(key, fallback\)/)
  assert.match(source, /value === key \? \(fallback \?\? EN\[key\] \?\? key\) : value/)
  assert.match(source, /displayMessage\('messages\.missingTranslations'/)
  assert.match(source, /displayMessage\('messages\.originalEnglish'/)
  assert.match(source, /displayMessage\('messages\.copyMissingJson'/)
})

test('submit fallback stays human-readable instead of exposing untranslated key names', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /throw new Error\(formatMessage\(t\('messages\.translateFirst'/)
})

test('canonical English and Russian locale files stay aligned with embedded locale keys', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'))
  const ru = JSON.parse(readFileSync(new URL('../locales/ru.json', import.meta.url), 'utf8'))
  const enBlock = Function('return ' + source.match(/const EN = (\{[\s\S]*?\n\})\nconst RU =/)[1])()
  const ruBlock = Function('return ' + source.match(/const RU = (\{[\s\S]*?\n\})\nconst BUILTIN/)[1])()
  assert.deepEqual(Object.keys(en).sort(), Object.keys(enBlock).sort())
  assert.deepEqual(Object.keys(ru).sort(), Object.keys(ruBlock).sort())
})

test('missing translations are presented as an English JSON fragment instead of a raw key list', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /function missingTranslationEntries\(values, keys\)/)
  assert.match(source, /messages\.missingTranslations/)
  assert.match(source, /messages\.originalEnglish/)
  assert.match(source, /messages\.copyMissingJson/)
  assert.match(source, /navigator\.clipboard/)
  assert.doesNotMatch(source, /formatMessage\(t\('messages\.untranslatedKeys'/)
})


test('missing JSON fragment is derived from English values for currently untranslated keys', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  assert.match(source, /return Object\.fromEntries\(\(keys \|\| \[\]\)\.filter\(key => key in EN\)/)
  assert.match(source, /JSON\.stringify\(missingTranslationEntries\(draftValues, untranslatedKeys\), null, 2\)/)
  assert.match(source, /messages\.clipboardUnavailable/)
})
