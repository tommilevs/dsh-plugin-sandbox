import { readFileSync } from 'node:fs'

const en = Object.freeze(JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8')))
const ru = Object.freeze(JSON.parse(readFileSync(new URL('../locales/ru.json', import.meta.url), 'utf8')))

export const locales = Object.freeze({ en, ru })

export const builtInLocaleMetadata = Object.freeze({
  en: Object.freeze({ code: 'en', nativeName: 'English', flag: '🇬🇧' }),
  ru: Object.freeze({ code: 'ru', nativeName: 'Русский', flag: '🇷🇺' }),
})

export function getLocaleMetadata(code) {
  const value = String(code || '').trim().toLowerCase()
  return builtInLocaleMetadata[value] || null
}

export function detectLocale(input) {
  const values = Array.isArray(input) ? input : [input]
  for (const value of values) {
    const lang = String(value || '').trim().toLowerCase()
    const base = lang.split(/[-_]/)[0]
    if (locales[lang]) return lang
    if (locales[base]) return base
  }
  return 'en'
}

export function createTranslator(locale, fallback = 'en') {
  const lang = detectLocale(locale)
  const primary = locales[lang] || locales[fallback] || locales.en
  const fallbackTable = locales[fallback] || locales.en
  return (key) => primary[key] ?? fallbackTable[key] ?? key
}
