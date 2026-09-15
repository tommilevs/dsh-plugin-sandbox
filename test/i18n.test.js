import test from 'node:test'
import assert from 'node:assert/strict'
import { getLocaleMetadata, builtInLocaleMetadata } from '../lib/i18n.js'

test('built-in locale metadata contains language identity and flag separately', () => {
  assert.deepEqual(getLocaleMetadata('en'), { code: 'en', nativeName: 'English', flag: '🇬🇧' })
  assert.deepEqual(getLocaleMetadata('ru'), { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' })
  assert.deepEqual(builtInLocaleMetadata.de, undefined)
})
