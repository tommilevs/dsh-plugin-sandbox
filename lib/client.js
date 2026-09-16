window.__ModuleLoader__.load({
  id: 'dsh-plugin-sandbox',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

const API = '/api/dsh-plugin-sandbox'


const EN = {
  "status.running": "running",
  "status.working": "working",
  "status.stopped": "stopped",
  "status.error": "error",
  "app.title": "🧪 DSH Plugin Sandbox",
  "app.tagline": "Create · Experiment · Test · Snapshot · Compare · Promote",
  "app.warning": "⚠️ Development isolation only — plugins still run with the DSH user permissions.",
  "sections.sandboxes": "Sandboxes",
  "sections.plugins": "Plugins",
  "sections.dshHome": "Sandbox DSH_HOME",
  "sections.pluginUpdates": "Plugin updates",
  "empty.noSandboxes": "No sandboxes yet.",
  "empty.createSandbox": "Create a sandbox to begin.",
  "empty.noPlugins": "No plugins in this sandbox.",
  "actions.newSandbox": "+ New Sandbox",
  "actions.installPlugin": "＋ Install plugin",
  "actions.startSandbox": "▶ Start Sandbox",
  "actions.stop": "■ Stop",
  "actions.validate": "🧪 Validate",
  "actions.snapshot": "💾 Snapshot",
  "actions.diff": "View Diff",
  "actions.history": "Git History",
  "actions.reset": "Reset",
  "actions.rollback": "Rollback",
  "actions.promote": "🚀 Promote",
  "actions.delete": "🗑 Delete",
  "actions.open": "Open",
  "actions.addLanguage": "Add language",
  "actions.checkForUpdates": "Check for updates",
  "actions.updateToVersion": "Update to v{version}",
  "dialogs.sandboxName": "Sandbox name",
  "dialogs.newSandboxTitle": "Create sandbox",
  "dialogs.copyPluginsAndSettings": "Copy installed plugins and settings from main DSH",
  "dialogs.copyPluginsHint": "Turn this off to create a clean DSH with the same DSH version.",
  "dialogs.pluginSpec": "Plugin package / Git / absolute local path",
  "dialogs.snapshotMessage": "Snapshot message",
  "dialogs.manualSnapshot": "Manual snapshot",
  "dialogs.addLanguageTitle": "Add a language",
  "dialogs.localeCode": "Language code (exactly 2 lowercase letters, e.g. de)",
  "dialogs.localeName": "Language name (e.g. Deutsch)",
  "dialogs.localeFlag": "Language flag",
  "dialogs.translationJson": "Translation JSON",
  "dialogs.translationHint": "Translate the English template, keep every key, and use JSON only.",
  "dialogs.installLocally": "Install locally",
  "dialogs.submitGithub": "Submit to GitHub",
  "dialogs.cancel": "Cancel",
  "dialogs.create": "Create",
  "confirm.reset": "Reset all uncommitted sandbox changes?",
  "confirm.rollback": "Rollback to the previous Git commit?",
  "confirm.promote": "Validate and promote this sandbox to STABLE? A backup is created first.",
  "confirm.delete": "Delete this sandbox and its local Git history?",
  "messages.validationPassed": "Validation passed",
  "messages.noHistory": "No history",
  "messages.noChanges": "No uncommitted changes",
  "messages.promoted": "Promoted successfully.",
  "messages.restartMain": "Restart the main DSH to apply the promoted profile.",
  "messages.localeInstalled": "Language installed locally.",
  "messages.localeSubmitted": "GitHub contribution prepared.",
  "messages.invalidLocale": "Language code must contain exactly 2 lowercase Latin letters, e.g. de.",
  "messages.invalidJson": "Invalid JSON.",
  "messages.missingKeys": "Missing translation keys",
  "messages.extraKeys": "Unknown translation keys",
  "messages.invalidValues": "All translation values must be strings.",
  "messages.githubUnavailable": "GitHub submission is unavailable: GitHub CLI is not installed or not authenticated.",
  "messages.githubNotRepo": "GitHub submission is unavailable because this installation is not a Git checkout.",
  "messages.localeAlreadyInstalled": "This language is already installed locally.",
  "messages.submitInstalledLocale": "Submit {name} to GitHub",
  "messages.updateLocalLocale": "Update {name} locally",
  "messages.localeAlreadyPublished": "{name} is already published on GitHub.",
  "messages.localeReadyToSubmit": "{name} is installed locally and ready to submit.",
  "messages.localeUpdateReady": "Local {name} differs from the published GitHub version.",
  "messages.localeRemoteUnknown": "GitHub status is unavailable right now.",
  "messages.updateGithubLocale": "Update {name} on GitHub",
  "messages.localeSchemaUpdated": "Locale schema updated locally. {count} new English strings still need translation.",
  "messages.untranslatedKeys": "Untranslated keys",
  "messages.translateFirst": "Translate {count} strings before submitting",
  "messages.translationProgress": "Translation: {translated}/{total} ({percent}%)",
  "messages.missingTranslations": "Translations to complete",
  "messages.missingTranslationsHint": "These English strings still need translation. Copy the JSON into the translation area and replace the values.",
  "messages.originalEnglish": "Original English",
  "messages.copyMissingJson": "Copy missing JSON",
  "messages.copiedMissingJson": "Copied to clipboard.",
  "messages.clipboardUnavailable": "Could not copy automatically. Please copy the JSON manually.",
}
const RU = {
  "status.running": "запущен",
  "status.working": "в работе",
  "status.stopped": "остановлен",
  "status.error": "ошибка",
  "app.title": "🧪 DSH Plugin Sandbox",
  "app.tagline": "Создавай · Экспериментируй · Тестируй · Сохраняй · Сравнивай · Публикуй",
  "app.warning": "⚠️ Только для изолированной разработки — плагины по-прежнему работают с правами пользователя DSH.",
  "sections.sandboxes": "Песочницы",
  "sections.plugins": "Плагины",
  "sections.dshHome": "DSH_HOME песочницы",
  "sections.pluginUpdates": "Обновления плагина",
  "empty.noSandboxes": "Песочниц пока нет.",
  "empty.createSandbox": "Создай песочницу, чтобы начать.",
  "empty.noPlugins": "В этой песочнице пока нет плагинов.",
  "actions.newSandbox": "+ Новая песочница",
  "actions.installPlugin": "＋ Установить плагин",
  "actions.startSandbox": "▶ Запустить песочницу",
  "actions.stop": "■ Остановить",
  "actions.validate": "🧪 Проверить",
  "actions.snapshot": "💾 Снимок",
  "actions.diff": "Показать Diff",
  "actions.history": "История Git",
  "actions.reset": "Сбросить",
  "actions.rollback": "Откатить",
  "actions.promote": "🚀 Продвинуть",
  "actions.delete": "🗑 Удалить",
  "actions.open": "Открыть",
  "actions.addLanguage": "Добавить язык",
  "actions.checkForUpdates": "Проверить обновления",
  "actions.updateToVersion": "Обновить до v{version}",
  "dialogs.sandboxName": "Имя песочницы",
  "dialogs.newSandboxTitle": "Создать песочницу",
  "dialogs.copyPluginsAndSettings": "Копировать установленные плагины и настройки из основного DSH",
  "dialogs.copyPluginsHint": "Выключи, чтобы создать чистый DSH той же версии.",
  "dialogs.pluginSpec": "Пакет плагина / Git / абсолютный локальный путь",
  "dialogs.snapshotMessage": "Сообщение снимка",
  "dialogs.manualSnapshot": "Ручной снимок",
  "dialogs.addLanguageTitle": "Добавить язык",
  "dialogs.localeCode": "Код языка (ровно 2 строчные латинские буквы, например de)",
  "dialogs.localeName": "Название языка (например, Deutsch)",
  "dialogs.localeFlag": "Флаг языка",
  "dialogs.translationJson": "JSON перевода",
  "dialogs.translationHint": "Переведи английский шаблон, сохрани все ключи и используй только JSON.",
  "dialogs.installLocally": "Установить локально",
  "dialogs.submitGithub": "Отправить в GitHub",
  "dialogs.cancel": "Отмена",
  "dialogs.create": "Создать",
  "confirm.reset": "Сбросить все несохранённые изменения песочницы?",
  "confirm.rollback": "Откатить к предыдущему коммиту Git?",
  "confirm.promote": "Проверить и продвинуть эту песочницу в STABLE? Сначала будет создана резервная копия.",
  "confirm.delete": "Удалить эту песочницу вместе с её локальной историей Git?",
  "messages.validationPassed": "Проверка пройдена",
  "messages.noHistory": "История пуста",
  "messages.noChanges": "Нет несохранённых изменений",
  "messages.promoted": "Успешно продвинуто.",
  "messages.restartMain": "Перезапусти основной DSH, чтобы применить опубликованный профиль.",
  "messages.localeInstalled": "Язык установлен локально.",
  "messages.localeSubmitted": "GitHub contribution подготовлен.",
  "messages.invalidLocale": "Код языка должен содержать ровно 2 строчные латинские буквы, например de.",
  "messages.invalidJson": "Некорректный JSON.",
  "messages.missingKeys": "Не хватает ключей перевода",
  "messages.extraKeys": "Есть неизвестные ключи перевода",
  "messages.invalidValues": "Все значения перевода должны быть строками.",
  "messages.githubUnavailable": "Отправка в GitHub недоступна: GitHub CLI не установлен или не авторизован.",
  "messages.githubNotRepo": "Отправка в GitHub недоступна: эта установка не является Git checkout.",
  "messages.localeAlreadyInstalled": "Этот язык уже установлен локально.",
  "messages.submitInstalledLocale": "Отправить {name} в GitHub",
  "messages.updateLocalLocale": "Обновить {name} локально",
  "messages.localeAlreadyPublished": "{name} уже опубликован в GitHub.",
  "messages.localeReadyToSubmit": "{name} установлен локально и готов к отправке.",
  "messages.localeUpdateReady": "Локальный {name} отличается от опубликованной версии в GitHub.",
  "messages.localeRemoteUnknown": "Статус GitHub сейчас недоступен.",
  "messages.updateGithubLocale": "Обновить {name} в GitHub",
  "messages.localeSchemaUpdated": "Схема локали обновлена. Новых английских строк без перевода: {count}.",
  "messages.untranslatedKeys": "Непереведённые ключи",
  "messages.translateFirst": "Сначала переведи {count} строк перед отправкой",
  "messages.translationProgress": "Перевод: {translated}/{total} ({percent}%)",
  "messages.missingTranslations": "Переводы для завершения",
  "messages.missingTranslationsHint": "Эти английские строки ещё нужно перевести. Скопируй JSON в область перевода и замени значения.",
  "messages.originalEnglish": "Оригинал на английском",
  "messages.copyMissingJson": "Скопировать недостающий JSON",
  "messages.copiedMissingJson": "Скопировано в буфер обмена.",
  "messages.clipboardUnavailable": "Не удалось автоматически скопировать. Скопируй JSON вручную.",
}
const BUILTIN_LOCALE_METADATA = {
  en: { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  ru: { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
}
const FLAG_OPTIONS = [
  ['🌐', 'Neutral / none'], ['🇩🇪', 'Germany'], ['🇫🇷', 'France'], ['🇪🇸', 'Spain'], ['🇮🇹', 'Italy'],
  ['🇵🇹', 'Portugal'], ['🇧🇷', 'Brazil'], ['🇺🇦', 'Ukraine'], ['🇵🇱', 'Poland'], ['🇨🇿', 'Czechia'],
  ['🇳🇱', 'Netherlands'], ['🇸🇪', 'Sweden'], ['🇳🇴', 'Norway'], ['🇩🇰', 'Denmark'], ['🇫🇮', 'Finland'],
  ['🇪🇪', 'Estonia'], ['🇱🇻', 'Latvia'], ['🇱🇹', 'Lithuania'], ['🇹🇷', 'Türkiye'], ['🇬🇷', 'Greece'],
  ['🇨🇳', 'China'], ['🇯🇵', 'Japan'], ['🇰🇷', 'South Korea'], ['🇮🇳', 'India'], ['🇮🇱', 'Israel'],
  ['🇸🇦', 'Saudi Arabia'], ['🇦🇪', 'United Arab Emirates'], ['🇺🇸', 'United States'], ['🇨🇦', 'Canada'],
  ['🇲🇽', 'Mexico'], ['🇦🇷', 'Argentina'], ['🇦🇺', 'Australia'], ['🇳🇿', 'New Zealand'], ['🇿🇦', 'South Africa'],
]

let LOCALIZATION = Object.freeze({ en: Object.freeze(EN), ru: Object.freeze(RU) })
let LOCALE_METADATA = Object.freeze({ ...BUILTIN_LOCALE_METADATA })
const LOCALE_STORAGE_KEY = 'dsh-plugin-sandbox.locale'
const CUSTOM_LOCALES_STORAGE_KEY = 'dsh-plugin-sandbox.custom-locales'
const LOCALE_METADATA_STORAGE_KEY = 'dsh-plugin-sandbox.locale-metadata'
const LOCALE_UNTRANSLATED_STORAGE_KEY = 'dsh-plugin-sandbox.locale-untranslated'

function readStoredJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function storedCustomLocales() {
  const raw = readStoredJson(CUSTOM_LOCALES_STORAGE_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

function storedLocaleMetadata() {
  const raw = readStoredJson(LOCALE_METADATA_STORAGE_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

function storedUntranslatedLocales() {
  const raw = readStoredJson(LOCALE_UNTRANSLATED_STORAGE_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

function mergeCustomLocales(remote = {}, remoteMetadata = {}) {
  const merged = { ...LOCALIZATION }
  const metadata = { ...BUILTIN_LOCALE_METADATA }
  for (const [code, values] of Object.entries(storedCustomLocales())) {
    if (values && typeof values === 'object' && !Array.isArray(values)) merged[code] = values
  }
  for (const [code, values] of Object.entries(remote || {})) {
    if (values && typeof values === 'object' && !Array.isArray(values)) merged[code] = values
  }
  for (const [code, value] of Object.entries(storedLocaleMetadata())) {
    if (value && typeof value === 'object' && !Array.isArray(value)) metadata[code] = value
  }
  for (const [code, value] of Object.entries(remoteMetadata || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) metadata[code] = value
  }
  LOCALIZATION = Object.freeze(merged)
  LOCALE_METADATA = Object.freeze(metadata)
}

mergeCustomLocales()

function localeOf(input) {
  const values = Array.isArray(input) ? input : [input]
  for (const value of values) {
    const lang = String(value || '').trim().toLowerCase()
    const base = lang.split(/[-_]/)[0]
    if (LOCALIZATION[lang]) return lang
    if (LOCALIZATION[base]) return base
  }
  return 'en'
}
function makeT(locale) {
  const lang = localeOf(locale)
  return (key) => LOCALIZATION[lang]?.[key] ?? LOCALIZATION.en[key] ?? key
}

function readLocalePreference() {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (value === 'auto' || value === 'en' || value === 'ru' || LOCALIZATION[value]) return value
  } catch {}
  return 'auto'
}

function effectiveLocale(preference) {
  if (preference === 'ru' || preference === 'en' || LOCALIZATION[preference]) return preference
  return localeOf(typeof navigator !== 'undefined' ? navigator.languages || navigator.language : 'en')
}

const t = makeT(effectiveLocale(readLocalePreference()))

function persistCustomLocale(code, values, metadata, untranslatedKeys = []) {
  try {
    const locales = storedCustomLocales()
    locales[code] = values
    window.localStorage.setItem(CUSTOM_LOCALES_STORAGE_KEY, JSON.stringify(locales))
    const metadataStore = storedLocaleMetadata()
    metadataStore[code] = metadata
    window.localStorage.setItem(LOCALE_METADATA_STORAGE_KEY, JSON.stringify(metadataStore))
    const untranslated = storedUntranslatedLocales()
    if (untranslatedKeys.length) untranslated[code] = [...new Set(untranslatedKeys)].sort()
    else delete untranslated[code]
    window.localStorage.setItem(LOCALE_UNTRANSLATED_STORAGE_KEY, JSON.stringify(untranslated))
  } catch {}
}

function formatMessage(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

function displayMessage(key, fallback) {
  const value = t(key)
  return value === key ? (fallback ?? EN[key] ?? key) : value
}

function sameLocaleValues(left, right) {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every(key => key in right && left[key] === right[key])
}

function sameLocaleMetadata(left, right) {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) return false
  return String(left.code || '').trim().toLowerCase() === String(right.code || '').trim().toLowerCase()
    && String(left.nativeName || '').trim() === String(right.nativeName || '').trim()
    && String(left.flag || '').trim() === String(right.flag || '').trim()
}

function inspectLocaleDraft({ base, draft, existing = false, storedValues = null, metadata = null, storedMetadata = null, rememberedUntranslated = [] } = {}) {
  const expected = base && typeof base === 'object' && !Array.isArray(base) ? base : {}
  const baseKeys = Object.keys(expected)
  const validObject = Boolean(draft && typeof draft === 'object' && !Array.isArray(draft))
  const values = validObject ? draft : {}
  const missingKeys = baseKeys.filter(key => !(key in values))
  const extraKeys = validObject ? Object.keys(values).filter(key => !(key in expected)) : []
  const invalidValueKeys = validObject ? Object.entries(values).filter(([, value]) => typeof value !== 'string').map(([key]) => key) : []
  const rememberedKeys = Array.isArray(rememberedUntranslated) ? rememberedUntranslated : []
  const trackedKeys = existing
    ? [...new Set([...rememberedKeys, ...missingKeys])].filter(key => key in expected)
    : baseKeys
  const untranslatedKeys = trackedKeys.filter(key => missingKeys.includes(key) || values[key] === expected[key])
  const hasValidationError = !validObject || missingKeys.length > 0 || extraKeys.length > 0 || invalidValueKeys.length > 0
  const hasUnsavedValues = Boolean(existing && storedValues && !sameLocaleValues(values, storedValues))
  const hasUnsavedMetadata = Boolean(existing && storedMetadata && !sameLocaleMetadata(metadata, storedMetadata))
  const hasUnsavedChanges = hasUnsavedValues || hasUnsavedMetadata
  return {
    validObject,
    missingKeys,
    extraKeys,
    invalidValueKeys,
    untranslatedKeys,
    hasValidationError,
    hasUnsavedChanges,
    hasSubmissionBlock: hasValidationError || untranslatedKeys.length > 0 || hasUnsavedChanges,
  }
}

function missingLocaleKeys(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return Object.keys(EN)
  return Object.keys(EN).filter(key => !(key in values))
}

function missingTranslationEntries(values, keys) {
  const source = values && typeof values === 'object' && !Array.isArray(values) ? values : {}
  return Object.fromEntries((keys || []).filter(key => key in EN).map(key => [key, source[key] === EN[key] || !(key in source) ? EN[key] : source[key]]))
}

function mergeLocaleWithSchema(values) {
  return { ...EN, ...(values && typeof values === 'object' && !Array.isArray(values) ? values : {}) }
}

function localeNeedsTranslation(values, keys = []) {
  return keys.filter(key => values?.[key] === EN[key])
}

function localLocale(code) {
  const normalized = String(code || '').trim().toLowerCase()
  if (!normalized) return null
  const values = LOCALIZATION[normalized]
  const metadata = LOCALE_METADATA[normalized]
  if (!values || ['en', 'ru'].includes(normalized) || !metadata) return null
  const untranslatedStore = storedUntranslatedLocales()
  const missingKeys = missingLocaleKeys(values)
  const rememberedUntranslated = Array.isArray(untranslatedStore[normalized]) ? untranslatedStore[normalized] : []
  const untranslatedKeys = [...new Set([...missingKeys, ...rememberedUntranslated])].filter(key => key in EN)
  return { code: normalized, values, metadata, missingKeys, untranslatedKeys, needsSchemaMigration: missingKeys.length > 0 }
}

function validateLocaleClient(code, values) {
  if (!/^[a-z]{2}$/.test(code)) throw new Error(t('messages.invalidLocale'))
  if (!values || Array.isArray(values) || typeof values !== 'object') throw new Error(t('messages.invalidJson'))
  const baseKeys = Object.keys(EN).sort()
  const candidateKeys = Object.keys(values).sort()
  const missing = baseKeys.filter(key => !(key in values))
  const extra = candidateKeys.filter(key => !(key in EN))
  const invalid = Object.entries(values).filter(([, value]) => typeof value !== 'string')
  if (missing.length) throw new Error(`${t('messages.missingKeys')}: ${missing.join(', ')}`)
  if (extra.length) throw new Error(`${t('messages.extraKeys')}: ${extra.join(', ')}`)
  if (invalid.length) throw new Error(t('messages.invalidValues'))
}

async function rpc(method, args = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method, args }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data.result
}

function Button({ children, onClick, disabled = false, title = undefined, type = 'button' }) {
  return React.createElement('button', {
    type, disabled, onClick, title,
    style: {
      border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 8,
      padding: '7px 11px', background: 'var(--dsw-alias-surface-secondary, transparent)',
      color: 'inherit', cursor: disabled ? 'default' : 'pointer',
    },
  }, children)
}

const STATUS_STYLES = `
.dsh-sandbox-status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  vertical-align: middle;
}
.dsh-sandbox-status-running {
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, .45);
  animation: dsh-sandbox-pulse-running 2s ease-in-out infinite;
}
.dsh-sandbox-status-working {
  background: #f59e0b;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, .38);
  animation: dsh-sandbox-pulse-working 1.35s ease-in-out infinite;
}
.dsh-sandbox-status-stopped {
  background: #9ca3af;
}
.dsh-sandbox-status-error {
  background: #ef4444;
}
@keyframes dsh-sandbox-pulse-running {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, .42); opacity: .92; }
  50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); opacity: 1; }
}
@keyframes dsh-sandbox-pulse-working {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, .36); opacity: .72; }
  50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); opacity: 1; }
}
`;


function LanguageSwitcher({ onAddLanguage }) {
  const [preference, setPreference] = React.useState(readLocalePreference)
  const selectLocale = (next, event) => {
    if (next === '__add__') {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      const current = preference === '__add__' ? 'auto' : preference
      try { event?.target && (event.target.value = current) } catch {}
      setPreference(current)
      window.setTimeout(() => onAddLanguage?.(), 0)
      return
    }
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, next) } catch {}
    setPreference(next)
    window.location.reload()
  }
  const customCodes = Object.keys(LOCALIZATION).filter(code => !['en', 'ru'].includes(code)).sort()
  const labelFor = code => {
    const meta = LOCALE_METADATA[code]
    return meta ? `${meta.flag || '🌐'} ${meta.nativeName || code}` : `🌐 ${code}`
  }
  return React.createElement('select', {
    id: 'dsh-sandbox-language-switcher', className: 'dsh-sandbox-language-switcher', value: preference,
    title: 'Language', 'aria-label': 'Language',
    onChange: event => selectLocale(event.target.value, event),
    onPointerDown: event => event.stopPropagation(),
    onMouseDown: event => event.stopPropagation(),
    onClick: event => event.stopPropagation(),
    style: { border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 8, padding: '7px 28px 7px 9px', background: 'var(--dsw-alias-surface-secondary, transparent)', color: 'inherit', fontSize: 12, cursor: 'pointer', minWidth: 76 },
  },
    React.createElement('option', { value: 'auto' }, '🌐 Auto'),
    React.createElement('option', { value: 'en' }, labelFor('en')),
    React.createElement('option', { value: 'ru' }, labelFor('ru')),
    ...customCodes.map(code => React.createElement('option', { key: code, value: code }, labelFor(code))),
    React.createElement('option', { value: '__add__' }, `➕ ${t('actions.addLanguage')}`),
  )
}

function AddLanguageDialog({ open, onClose }) {
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [flag, setFlag] = React.useState('🌐')
  const [json, setJson] = React.useState(() => JSON.stringify(EN, null, 2))
  const [busy, setBusy] = React.useState(false)
  const [localMatch, setLocalMatch] = React.useState(() => localLocale(''))
  const [remoteState, setRemoteState] = React.useState(null)

  React.useEffect(() => {
    if (!open) return
    const match = localLocale(code)
    setLocalMatch(match)
    if (match) {
      setName(match.metadata.nativeName)
      setFlag(match.metadata.flag)
      setJson(JSON.stringify(mergeLocaleWithSchema(match.values), null, 2))
    } else if (code.trim().length === 0) {
      setName('')
      setFlag('🌐')
      setJson(JSON.stringify(EN, null, 2))
    }
    const normalized = code.trim().toLowerCase()
    if (!/^[a-z]{2}$/.test(normalized) || ['en', 'ru'].includes(normalized)) {
      setRemoteState(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const state = await rpc('locale-state', { code: normalized })
        if (!cancelled) setRemoteState(state)
      } catch {
        if (!cancelled) setRemoteState(null)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [code, open])

  if (!open) return null

  async function readAndValidate() {
    const normalizedCode = code.trim().toLowerCase()
    const nativeName = name.trim() || normalizedCode
    const values = JSON.parse(json)
    validateLocaleClient(normalizedCode, values)
    if (['en', 'ru'].includes(normalizedCode)) throw new Error('Built-in languages cannot be added as community locales.')
    if (!flag.trim()) throw new Error('Please choose a flag.')
    return { normalizedCode, nativeName, values, metadata: { code: normalizedCode, nativeName, flag: flag.trim() } }
  }
  async function installLocal() {
    setBusy(true)
    try {
      const normalizedCode = code.trim().toLowerCase()
      const nativeName = name.trim() || normalizedCode
      let values = JSON.parse(json)
      if (!/^[a-z]{2}$/.test(normalizedCode)) throw new Error(t('messages.invalidLocale'))
      if (['en', 'ru'].includes(normalizedCode)) throw new Error('Built-in languages cannot be added as community locales.')
      if (!flag.trim()) throw new Error('Please choose a flag.')

      const metadata = { code: normalizedCode, nativeName, flag: flag.trim() }
      const migrationKeys = localMatch
        ? [...new Set([...(localMatch.missingKeys || []), ...(localMatch.untranslatedKeys || []), ...missingLocaleKeys(values)])]
        : Object.keys(EN)
      if (localMatch && migrationKeys.length) values = mergeLocaleWithSchema(values)
      validateLocaleClient(normalizedCode, values)
      const installationStatus = inspectLocaleDraft({
        base: EN,
        draft: values,
        existing: Boolean(localMatch),
        storedValues: localMatch?.values ?? null,
        metadata,
        storedMetadata: localMatch?.metadata ?? null,
        rememberedUntranslated: migrationKeys,
      })
      await rpc('install-locale', { code: normalizedCode, nativeName, flag: metadata.flag, values, replace: Boolean(localMatch) })
      const untranslatedKeys = installationStatus.untranslatedKeys
      persistCustomLocale(normalizedCode, values, metadata, untranslatedKeys)
      window.alert(untranslatedKeys.length ? formatMessage(t('messages.localeSchemaUpdated'), { count: untranslatedKeys.length }) : t('messages.localeInstalled'))
      window.location.reload()
    } catch (e) { window.alert(String(e.message || e)) } finally { setBusy(false) }
  }
  async function submitGithub() {
    setBusy(true)
    try {
      const { normalizedCode, nativeName, values, metadata } = await readAndValidate()
      const sourceUntranslated = new Set([...(localMatch?.untranslatedKeys || []), ...(storedUntranslatedLocales()[normalizedCode] || [])])
      const submissionStatus = inspectLocaleDraft({
        base: EN,
        draft: values,
        existing: Boolean(localMatch),
        storedValues: localMatch?.values ?? null,
        metadata,
        storedMetadata: localMatch?.metadata ?? null,
        rememberedUntranslated: [...sourceUntranslated],
      })
      if (submissionStatus.untranslatedKeys.length) throw new Error(formatMessage(t('messages.translateFirst'), { count: submissionStatus.untranslatedKeys.length }))
      if (submissionStatus.hasUnsavedChanges) throw new Error(formatMessage(t('messages.updateLocalLocale'), { name: localMatch.metadata.nativeName }))
      const result = await rpc('submit-locale', localMatch ? { code: normalizedCode } : { code: normalizedCode, nativeName, flag: metadata.flag, values })
      persistCustomLocale(normalizedCode, values, metadata)
      if (result.alreadyPublished) {
        window.alert(formatMessage(t('messages.localeAlreadyPublished'), { name: metadata.nativeName }))
      } else {
        window.alert(`${t('messages.localeSubmitted')}\n${result.pullRequest || ''}`)
      }
      window.location.reload()
    } catch (e) { window.alert(String(e.message || e)) } finally { setBusy(false) }
  }
  const draftValues = (() => {
    try { return JSON.parse(json) } catch { return null }
  })()
  const draftCode = code.trim().toLowerCase()
  const hasValidCommunityCode = /^[a-z]{2}$/.test(draftCode) && !['en', 'ru'].includes(draftCode)
  const draftMetadata = { code: draftCode, nativeName: name.trim() || draftCode, flag: flag.trim() }
  const draftStatus = inspectLocaleDraft({
    base: EN,
    draft: draftValues,
    existing: Boolean(localMatch),
    storedValues: localMatch?.values ?? null,
    metadata: draftMetadata,
    storedMetadata: localMatch?.metadata ?? null,
    rememberedUntranslated: localMatch?.untranslatedKeys || [],
  })
  const untranslatedKeys = hasValidCommunityCode ? draftStatus.untranslatedKeys : []
  const totalTranslationKeys = Object.keys(EN).length
  const translatedTranslationKeys = Math.max(0, totalTranslationKeys - untranslatedKeys.length)
  const translationPercent = totalTranslationKeys ? Math.round((translatedTranslationKeys / totalTranslationKeys) * 100) : 100
  const submitBlockedByTranslation = hasValidCommunityCode && untranslatedKeys.length > 0
  const validationMessage = !hasValidCommunityCode
    ? t('messages.invalidLocale')
    : !draftStatus.validObject
      ? t('messages.invalidJson')
      : draftStatus.missingKeys.length
        ? `${t('messages.missingKeys')}: ${draftStatus.missingKeys.length}`
        : draftStatus.extraKeys.length
          ? `${t('messages.extraKeys')}: ${draftStatus.extraKeys.length}`
          : draftStatus.invalidValueKeys.length
            ? t('messages.invalidValues')
            : null
  const submitBlockedByUnsavedDraft = hasValidCommunityCode && draftStatus.hasUnsavedChanges
  const submitBlocked = !hasValidCommunityCode || draftStatus.hasSubmissionBlock
  const submitBlockMessage = validationMessage
    || (submitBlockedByTranslation ? formatMessage(t('messages.translateFirst'), { count: untranslatedKeys.length }) : null)
    || (submitBlockedByUnsavedDraft && localMatch ? formatMessage(t('messages.updateLocalLocale'), { name: localMatch.metadata.nativeName }) : null)
  const remoteMessage = (() => {
    if (!localMatch || !remoteState) return null
    const nameValue = localMatch.metadata.nativeName
    if (remoteState.state === 'published') return `🟢 ${formatMessage(t('messages.localeAlreadyPublished'), { name: nameValue })}`
    if (remoteState.state === 'update-available') return `🟡 ${formatMessage(t('messages.localeUpdateReady'), { name: nameValue })}`
    if (remoteState.state === 'ready-to-submit') return submitBlocked
      ? `🟡 ${submitBlockMessage}`
      : `🔵 ${formatMessage(t('messages.localeReadyToSubmit'), { name: nameValue })}`
    if (remoteState.remoteUnknown) return `⚪ ${t('messages.localeRemoteUnknown')}`
    return null
  })()
  const submitLabel = submitBlocked
    ? `🟡 ${submitBlockMessage}`
    : localMatch
      ? remoteState?.state === 'published'
        ? formatMessage(t('messages.localeAlreadyPublished'), { name: localMatch.metadata.nativeName })
        : remoteState?.state === 'update-available'
          ? `🚀 ${formatMessage(t('messages.updateGithubLocale'), { name: localMatch.metadata.nativeName })}`
          : `🚀 ${formatMessage(t('messages.submitInstalledLocale'), { name: localMatch.metadata.nativeName })}`
      : t('dialogs.submitGithub')
  return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,.56)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } },
    React.createElement('div', { style: { width: 'min(920px, 96vw)', maxHeight: '92vh', overflow: 'auto', border: '1px solid var(--dsw-alias-border-subtle, #555)', borderRadius: 16, background: 'var(--dsw-alias-surface-primary, #111)', padding: 20, boxShadow: '0 25px 80px rgba(0,0,0,.5)' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' } },
        React.createElement('div', { style: { fontSize: 20, fontWeight: 750 } }, t('dialogs.addLanguageTitle')),
        React.createElement(Button, { onClick: onClose, disabled: busy }, '✕'),
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, marginTop: 16 } },
        React.createElement('label', null, t('dialogs.localeCode')),
        React.createElement('input', { value: code, maxLength: 2, inputMode: 'text', autoCapitalize: 'none', onChange: e => setCode(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 2).toLowerCase()), placeholder: 'de' }),
        React.createElement('label', null, t('dialogs.localeName')),
        React.createElement('input', { value: name, onChange: e => setName(e.target.value), placeholder: 'Deutsch' }),
        React.createElement('label', null, t('dialogs.localeFlag')),
        React.createElement('select', { value: flag, onChange: e => setFlag(e.target.value) }, ...FLAG_OPTIONS.map(([emoji, country]) => React.createElement('option', { key: emoji, value: emoji }, `${emoji} ${country}`))),
      ),
      localMatch && React.createElement('div', { style: { marginTop: 12, fontSize: 12, opacity: .82 } }, `✓ ${formatMessage(t('messages.localeAlreadyInstalled'), { name: localMatch.metadata.nativeName })}`),
      localMatch?.needsSchemaMigration && React.createElement('div', { style: { marginTop: 8, fontSize: 12, opacity: .92 } }, `🟡 ${localMatch.missingKeys.length} new strings were added to the current template. Review and translate them, then update locally.`),
      hasValidCommunityCode && draftStatus.validObject && React.createElement('div', { style: { marginTop: 8, fontSize: 12, opacity: .92 } },
        `🟡 ${formatMessage(t('messages.translationProgress'), { translated: translatedTranslationKeys, total: totalTranslationKeys, percent: translationPercent })}`,
      ),
      (validationMessage || submitBlockedByTranslation) && React.createElement('div', { style: { marginTop: 8, fontSize: 12, opacity: .92 } },
        validationMessage && React.createElement('div', null, `🔴 ${validationMessage}`),
        submitBlockedByTranslation && React.createElement(React.Fragment, null,
          React.createElement('details', { style: { marginTop: 8, border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 10, padding: '8px 10px' } },
            React.createElement('summary', { style: { cursor: 'pointer', fontWeight: 650 } }, `${displayMessage('messages.missingTranslations', 'Translations to complete')} (${untranslatedKeys.length})`),
            React.createElement('div', { style: { marginTop: 8, opacity: .75, lineHeight: 1.4 } }, displayMessage('messages.missingTranslationsHint', 'These English strings still need translation. Copy the JSON into the translation area and replace the values.')),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 10 } },
              React.createElement('div', { style: { fontWeight: 600 } }, displayMessage('messages.originalEnglish', 'Original English')),
              React.createElement(Button, { onClick: async () => {
                try { await navigator.clipboard.writeText(JSON.stringify(missingTranslationEntries(draftValues, untranslatedKeys), null, 2)); window.alert(displayMessage('messages.copiedMissingJson', 'Copied to clipboard.')) }
                catch { window.alert(displayMessage('messages.clipboardUnavailable', 'Could not copy automatically. Please copy the JSON manually.')) }
              } }, `📋 ${displayMessage('messages.copyMissingJson', 'Copy missing JSON')}`),
            ),
            React.createElement('pre', { style: { marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.45, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,.18)', overflow: 'auto' } }, JSON.stringify(missingTranslationEntries(draftValues, untranslatedKeys), null, 2)),
          ),
        ),
      ),
      remoteMessage && React.createElement('div', { style: { marginTop: 8, fontSize: 12, opacity: .88 } }, remoteMessage),
      React.createElement('div', { style: { fontWeight: 650, marginTop: 18 } }, t('dialogs.translationJson')),
      React.createElement('div', { style: { opacity: .65, fontSize: 12, margin: '5px 0 8px' } }, t('dialogs.translationHint')),
      React.createElement('textarea', { value: json, onChange: e => setJson(e.target.value), spellCheck: false, style: { width: '100%', minHeight: 360, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.45, padding: 12, borderRadius: 10, border: '1px solid var(--dsw-alias-border-subtle, #555)', background: 'rgba(0,0,0,.18)', color: 'inherit' } }),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 14 } },
        React.createElement(Button, { onClick: onClose, disabled: busy }, t('dialogs.cancel')),
        React.createElement(Button, { onClick: installLocal, disabled: busy }, `💾 ${localMatch ? formatMessage(t('messages.updateLocalLocale'), { name: localMatch.metadata.nativeName }) : t('dialogs.installLocally')}`),
        React.createElement(Button, { onClick: submitGithub, disabled: busy || remoteState?.state === 'published' || submitBlocked, title: submitBlocked ? submitBlockMessage : undefined }, submitLabel),
      ),
    ),
  )
}

function statusDot(status) {
  const labels = {
    running: t('status.running'),
    working: t('status.working'),
    stopped: t('status.stopped'),
    error: t('status.error'),
  }
  return React.createElement('span', {
    style: { display: 'inline-flex', alignItems: 'center', gap: 6 },
    title: labels[status] || status,
    'aria-label': labels[status] || status,
  },
    React.createElement('span', { className: `dsh-sandbox-status-dot dsh-sandbox-status-${status}` }),
    labels[status] || status,
  )
}

function getSandboxStatus(sandbox, state, isSelected) {
  if (state.error && isSelected) return 'error'
  if (state.loading) return 'working'
  if (sandbox.runtime?.running) return 'running'
  return 'stopped'
}

function PluginList({ plugins }) {
  if (!plugins?.length) return React.createElement('div', { style: { opacity: .6 } }, t('empty.noPlugins'))
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    ...plugins.map(p => React.createElement('div', {
      key: p.name,
      style: { display: 'flex', justifyContent: 'space-between', gap: 10 },
    },
      React.createElement('code', null, p.name),
      React.createElement('span', { style: { opacity: .7 } }, String(p.version)),
    )),
  )
}

function NewSandboxDialog({ open, id, copyPlugins = true, busy = false, onIdChange, onCopyPluginsChange, onSubmit, onClose }) {
  if (!open) return null
  return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,.56)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } },
    React.createElement('form', {
      onSubmit: event => { event.preventDefault(); if (String(id || '').trim() && !busy) onSubmit() },
      style: { width: 'min(520px, 96vw)', border: '1px solid var(--dsw-alias-border-subtle, #555)', borderRadius: 16, background: 'var(--dsw-alias-surface-primary, #111)', padding: 20, boxShadow: '0 25px 80px rgba(0,0,0,.5)' },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' } },
        React.createElement('div', { style: { fontSize: 20, fontWeight: 750 } }, t('dialogs.newSandboxTitle')),
        React.createElement(Button, { type: 'button', onClick: onClose, disabled: busy }, '✕'),
      ),
      React.createElement('label', { style: { display: 'block', marginTop: 18, fontWeight: 650 } }, t('dialogs.sandboxName')),
      React.createElement('input', {
        value: id,
        autoFocus: true,
        onChange: event => onIdChange(event.target.value),
        style: { width: '100%', boxSizing: 'border-box', marginTop: 7, padding: '9px 10px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-subtle, #555)', background: 'rgba(0,0,0,.18)', color: 'inherit' },
      }),
      React.createElement('label', { style: { display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer' } },
        React.createElement('input', { type: 'checkbox', checked: copyPlugins, onChange: event => onCopyPluginsChange(event.target.checked), style: { marginTop: 3 } }),
        React.createElement('span', null,
          React.createElement('span', { style: { display: 'block', fontWeight: 650 } }, t('dialogs.copyPluginsAndSettings')),
          React.createElement('span', { style: { display: 'block', opacity: .68, fontSize: 12, marginTop: 4 } }, t('dialogs.copyPluginsHint')),
        ),
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 } },
        React.createElement(Button, { type: 'button', onClick: onClose, disabled: busy }, t('dialogs.cancel')),
        React.createElement(Button, { type: 'submit', disabled: busy || !String(id || '').trim() }, t('dialogs.create')),
      ),
    ),
  )
}

function SandboxPanel() {
  const [state, setState] = React.useState({ loading: true, data: null, selected: null, error: '' })
  const [releaseStatus, setReleaseStatus] = React.useState(null)
  const [addLanguageOpen, setAddLanguageOpen] = React.useState(false)
  const [createDraft, setCreateDraft] = React.useState({ open: false, id: '', copyPlugins: true, busy: false })

  const refresh = React.useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: '' }))
      const data = await rpc('status')
      mergeCustomLocales(data.locales || {}, data.localeMetadata || {})
      setState(s => ({ ...s, loading: false, data, selected: s.selected || data.sandboxes[0]?.id || null }))
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: String(e.message || e) }))
    }
  }, [])

  React.useEffect(() => { refresh() }, [refresh])

  async function withRefresh(fn) {
    try { await fn(); await refresh() } catch (e) { window.alert(String(e.message || e)) }
  }
  function openCreate() {
    setCreateDraft({ open: true, id: `sandbox-${Date.now()}`, copyPlugins: true, busy: false })
  }
  async function create() {
    const id = String(createDraft.id || '').trim()
    if (!id || createDraft.busy) return
    setCreateDraft(draft => ({ ...draft, busy: true }))
    try {
      await rpc('create', { id, copyPlugins: createDraft.copyPlugins })
      setCreateDraft(draft => ({ ...draft, open: false, busy: false }))
      await refresh()
      setState(current => ({ ...current, selected: id }))
    } catch (error) {
      setCreateDraft(draft => ({ ...draft, busy: false }))
      window.alert(String(error.message || error))
    }
  }
  async function install() {
    if (!state.selected) return
    const spec = window.prompt(t('dialogs.pluginSpec'), 'dsh-better-sidebar@latest')
    if (spec) await withRefresh(() => rpc('install', { id: state.selected, spec }))
  }
  async function start() {
    if (!state.selected) return
    try {
      const r = await rpc('start', { id: state.selected })
      if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer')
      await refresh()
    } catch (e) { window.alert(String(e.message || e)) }
  }
  async function stop() { if (state.selected) await withRefresh(() => rpc('stop', { id: state.selected })) }
  async function snapshot() {
    if (state.selected) await withRefresh(() => rpc('snapshot', {
      id: state.selected,
      message: window.prompt(t('dialogs.snapshotMessage'), t('dialogs.manualSnapshot')) || t('dialogs.manualSnapshot'),
    }))
  }
  async function validate() {
    if (!state.selected) return
    try {
      const r = await rpc('validate', { id: state.selected })
      window.alert(r.ok ? t('messages.validationPassed') : r.checks.filter(x => !x.ok).map(x => `${x.name}: ${x.detail}`).join('\n'))
      await refresh()
    } catch (e) { window.alert(String(e.message || e)) }
  }
  async function history() {
    if (!state.selected) return
    try { window.alert((await rpc('history', { id: state.selected })).join('\n') || t('messages.noHistory')) }
    catch (e) { window.alert(String(e.message || e)) }
  }
  async function diff() {
    if (!state.selected) return
    try { window.alert((await rpc('diff', { id: state.selected })).patch || t('messages.noChanges')) }
    catch (e) { window.alert(String(e.message || e)) }
  }
  async function reset() {
    if (state.selected && window.confirm(t('confirm.reset'))) await withRefresh(() => rpc('reset', { id: state.selected }))
  }
  async function rollback() {
    if (state.selected && window.confirm(t('confirm.rollback'))) await withRefresh(() => rpc('rollback', { id: state.selected }))
  }
  async function promote() {
    if (!state.selected || !window.confirm(t('confirm.promote'))) return
    try {
      const r = await rpc('promote', { id: state.selected })
      const backup = r.backup ? `\nBackup: ${r.backup}` : ''
      const restart = r.restartRequired ? `\n${t('messages.restartMain')}` : ''
      window.alert(`${t('messages.promoted')}${backup}${restart}`)
      await refresh()
    } catch (e) { window.alert(String(e.message || e)) }
  }
  async function remove() {
    if (state.selected && window.confirm(t('confirm.delete'))) await withRefresh(() => rpc('destroy', { id: state.selected }))
  }
  async function checkForUpdates() {
    try { setReleaseStatus({ state: 'checking' }); setReleaseStatus(await rpc('release-status')) }
    catch (e) { setReleaseStatus({ state: 'unavailable', error: String(e.message || e) }) }
  }
  async function updateRelease() {
    try { const result = await rpc('update-release', { release: releaseStatus?.release }); window.alert(`Updated to v${result.version}. Restart DSH to apply it.`) }
    catch (e) { window.alert(String(e.message || e)) }
  }

  const selected = state.data?.sandboxes?.find(s => s.id === state.selected)
  const buttonRow = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }
  return React.createElement(React.Fragment, null,
    React.createElement(AddLanguageDialog, { open: addLanguageOpen, onClose: () => setAddLanguageOpen(false) }),
    React.createElement(NewSandboxDialog, {
      open: createDraft.open,
      id: createDraft.id,
      copyPlugins: createDraft.copyPlugins,
      busy: createDraft.busy,
      onIdChange: id => setCreateDraft(draft => ({ ...draft, id })),
      onCopyPluginsChange: copyPlugins => setCreateDraft(draft => ({ ...draft, copyPlugins })),
      onSubmit: create,
      onClose: () => setCreateDraft(draft => ({ ...draft, open: false })),
    }),
    React.createElement('style', null, STATUS_STYLES),
    React.createElement('div', { style: { padding: 20, maxWidth: 1000, margin: '0 auto', color: 'inherit' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 } },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 24, fontWeight: 750 } }, t('app.title')),
        React.createElement('div', { style: { opacity: .7, marginTop: 4 } }, t('app.tagline')),
        React.createElement('div', { style: { opacity: .55, fontSize: 12, marginTop: 8 } }, t('app.warning')),
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
        React.createElement(LanguageSwitcher, { onAddLanguage: () => setAddLanguageOpen(true) }),
        React.createElement(Button, { onClick: openCreate }, t('actions.newSandbox')),
      ),
    ),
    state.error ? React.createElement('div', { style: { border: '1px solid currentColor', borderRadius: 8, padding: 10, marginBottom: 14 } }, state.error) : null,
    React.createElement('div', { style: { border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 12, padding: 12, marginBottom: 14 } },
      React.createElement('div', { style: { fontWeight: 650 } }, t('sections.pluginUpdates')),
      React.createElement('div', { style: { fontSize: 12, opacity: .72, marginTop: 4 } }, releaseStatus?.installedVersion ? `Installed: v${releaseStatus.installedVersion}` : 'Check GitHub Releases manually.'),
      React.createElement('div', { style: buttonRow },
        React.createElement(Button, { onClick: checkForUpdates, disabled: releaseStatus?.state === 'checking' }, releaseStatus?.state === 'checking' ? '…' : t('actions.checkForUpdates')),
        releaseStatus?.state === 'update-available' && React.createElement(Button, { onClick: updateRelease }, formatMessage(t('actions.updateToVersion'), { version: releaseStatus.release.version })),
        releaseStatus?.state === 'update-available' && React.createElement('a', { href: releaseStatus.release.notesUrl, target: '_blank', rel: 'noreferrer' }, 'Release notes'),
      ),
      releaseStatus?.state === 'development-link' && React.createElement('div', { style: { fontSize: 12, opacity: .72, marginTop: 8 } }, 'Development link detected; it will not be replaced.'),
      releaseStatus?.error && React.createElement('div', { style: { fontSize: 12, marginTop: 8 } }, releaseStatus.error),
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '230px 1fr', gap: 14 } },
      React.createElement('div', { style: { border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 12, padding: 10 } },
        React.createElement('div', { style: { fontWeight: 650, marginBottom: 8 } }, t('sections.sandboxes')),
        ...(state.data?.sandboxes || []).map(s => React.createElement('button', {
          key: s.id,
          onClick: () => setState(x => ({ ...x, selected: s.id })),
          style: { width: '100%', textAlign: 'left', border: 0, borderRadius: 8, padding: 10, marginBottom: 6, background: s.id === state.selected ? 'var(--dsw-alias-interactive-bg-selected, #333)' : 'transparent', color: 'inherit' },
        },
          React.createElement('div', { style: { fontWeight: 600 } }, s.id),
          React.createElement('div', { style: { fontSize: 12, opacity: .72 } },
            statusDot(getSandboxStatus(s, state, s.id === state.selected)),
          ),
        )),
        !state.data?.sandboxes?.length && !state.loading ? React.createElement('div', { style: { opacity: .6, padding: 10 } }, t('empty.noSandboxes')) : null,
      ),
      React.createElement('div', { style: { border: '1px solid var(--dsw-alias-border-subtle, #444)', borderRadius: 12, padding: 16 } },
        selected ? React.createElement(React.Fragment, null,
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' } },
            React.createElement('div', { style: { fontSize: 19, fontWeight: 700 } }, selected.id),
            React.createElement('code', { style: { opacity: .6, fontSize: 11 } }, selected.head || ''),
          ),
          React.createElement('div', { style: { fontSize: 12, opacity: .6, wordBreak: 'break-all', marginTop: 4 } }, selected.path),
          React.createElement('div', { style: { fontSize: 12, marginTop: 10 } }, statusDot(getSandboxStatus(selected, state, true))),
          selected.runtime?.running ? React.createElement('div', { style: { marginTop: 12 } },
            'Runtime: ', React.createElement('code', null, selected.runtime.url), ' ',
            React.createElement(Button, { onClick: () => window.open(selected.runtime.url, '_blank', 'noopener,noreferrer') }, t('actions.open')),
          ) : null,
          React.createElement('h3', { style: { margin: '18px 0 8px' } }, t('sections.plugins')),
          React.createElement(PluginList, { plugins: selected.plugins }),
          React.createElement('div', { style: buttonRow },
            React.createElement(Button, { onClick: install }, t('actions.installPlugin')),
            React.createElement(Button, { onClick: start, disabled: selected.runtime?.running }, t('actions.startSandbox')),
            React.createElement(Button, { onClick: stop, disabled: !selected.runtime?.running }, t('actions.stop')),
            React.createElement(Button, { onClick: validate }, t('actions.validate')),
            React.createElement(Button, { onClick: snapshot }, t('actions.snapshot')),
            React.createElement(Button, { onClick: diff }, t('actions.diff')),
            React.createElement(Button, { onClick: history }, t('actions.history')),
            React.createElement(Button, { onClick: reset }, t('actions.reset')),
            React.createElement(Button, { onClick: rollback }, t('actions.rollback')),
            React.createElement(Button, { onClick: promote }, t('actions.promote')),
            React.createElement(Button, { onClick: remove }, t('actions.delete')),
          ),
          React.createElement('div', { style: { marginTop: 18, padding: 12, borderRadius: 10, background: 'var(--dsw-alias-surface-secondary, rgba(127,127,127,.08))' } },
            React.createElement('div', { style: { fontWeight: 650 } }, t('sections.dshHome')),
            React.createElement('code', { style: { fontSize: 12, wordBreak: 'break-all' } }, selected.dshHome),
          ),
        ) : React.createElement('div', { style: { opacity: .6, padding: 20 } }, t('empty.createSandbox')),
      ),
    ),
    ),
  )
}

const name = 'dsh-plugin-sandbox/client'
const inject = ['slots']

function apply(ctx) {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-plugin-sandbox', order: 20 },
    props => React.createElement(Button, { onClick: () => window.dispatchEvent(new CustomEvent('dsh-plugin-sandbox:open')) }, props.wide ? '🧪 Sandbox' : '🧪'),
  ))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'dsh-plugin-sandbox-panel', order: 100 },
    () => {
      const [open, setOpen] = React.useState(false)
      React.useEffect(() => {
        const handler = () => setOpen(true)
        window.addEventListener('dsh-plugin-sandbox:open', handler)
        return () => window.removeEventListener('dsh-plugin-sandbox:open', handler)
      }, [])
      if (!open) return null
      return React.createElement('div', { style: { position: 'fixed', inset: '5% 5%', zIndex: 9999, overflow: 'auto', borderRadius: 16, border: '1px solid var(--dsw-alias-border-subtle, #555)', background: 'var(--dsw-alias-surface-primary, #111)', boxShadow: '0 25px 80px rgba(0,0,0,.5)' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', padding: '10px 14px 0' } }, React.createElement(Button, { onClick: () => setOpen(false) }, '✕')),
        React.createElement(SandboxPanel),
      )
    },
  ))
}

    module.exports = { name, inject, apply }
    return module.exports
  }
})
