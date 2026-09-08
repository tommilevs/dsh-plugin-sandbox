import { readFileSync } from 'node:fs'

const [basePath, candidatePath, metadataPath] = process.argv.slice(2)
if (!basePath || !candidatePath) {
  console.error('usage: node scripts/validate-locale.mjs <base-en.json> <candidate.json> [metadata.json]')
  process.exit(2)
}
const localeCode = candidatePath.split('/').pop().replace(/\.json$/i, '')
if (!/^[a-z]{2}$/.test(localeCode)) {
  console.error(`invalid locale code: ${localeCode}; expected exactly two lowercase Latin letters`)
  process.exit(1)
}
const parse = (path) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) }
  catch (error) { throw new Error(`${path}: invalid JSON: ${error.message}`) }
}
const base = parse(basePath)
const candidate = parse(candidatePath)
if (!base || Array.isArray(base) || typeof base !== 'object') throw new Error('English locale must be an object')
if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') throw new Error('Candidate locale must be an object')
const baseKeys = Object.keys(base).sort()
const candidateKeys = Object.keys(candidate).sort()
const missing = baseKeys.filter(key => !(key in candidate))
const extra = candidateKeys.filter(key => !(key in base))
const invalidValues = Object.entries(candidate).filter(([, value]) => typeof value !== 'string').map(([key]) => key)
if (missing.length || extra.length || invalidValues.length) {
  if (missing.length) console.error(`missing keys: ${missing.join(', ')}`)
  if (extra.length) console.error(`extra keys: ${extra.join(', ')}`)
  if (invalidValues.length) console.error(`non-string values: ${invalidValues.join(', ')}`)
  process.exit(1)
}
if (metadataPath) {
  const metadata = parse(metadataPath)
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') throw new Error('Locale metadata must be an object')
  const expectedKeys = ['code', 'flag', 'nativeName']
  if (Object.keys(metadata).sort().join('\0') !== expectedKeys.join('\0')) throw new Error('Locale metadata must contain only code, nativeName and flag')
  if (!/^[a-z]{2}$/.test(String(metadata.code || ''))) throw new Error('Locale metadata code must contain exactly two lowercase Latin letters')
  if (String(metadata.code).toLowerCase() !== localeCode) throw new Error('Locale metadata code must match locale filename')
  if (!String(metadata.nativeName || '').trim()) throw new Error('Locale metadata nativeName is required')
  if (!String(metadata.flag || '').trim()) throw new Error('Locale metadata flag is required')
}
console.log(`locale ok: ${localeCode}`)
