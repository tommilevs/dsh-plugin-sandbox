const SENSITIVE_KEY = /(?:token|password|secret|api[_-]?key|authorization|credentials)/i
const URL_PATTERN = /(?:git\+)?https?:\/\/[^\s"'<>]+/gi
const REDACTED = '[redacted]'

function sensitiveKey(key) {
  return typeof key === 'string' && SENSITIVE_KEY.test(key)
}

export function redactUrlCredentials(value) {
  if (typeof value !== 'string') return value
  return value.replace(URL_PATTERN, candidate => {
    const gitPrefix = candidate.startsWith('git+') ? 'git+' : ''
    let url
    try { url = new URL(gitPrefix ? candidate.slice(gitPrefix.length) : candidate) } catch { return candidate }
    const sensitiveQuery = [...url.searchParams.keys()].some(sensitiveKey)
    if (!url.username && !url.password && !sensitiveQuery) return candidate
    url.username = ''
    url.password = ''
    for (const key of [...url.searchParams.keys()]) if (sensitiveKey(key)) url.searchParams.delete(key)
    return `${gitPrefix}${url}`
  })
}

export function redactJsonSecrets(value) {
  if (Array.isArray(value)) return value.map(redactJsonSecrets)
  if (!value || typeof value !== 'object') return redactUrlCredentials(value)
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sensitiveKey(key) ? REDACTED : redactJsonSecrets(child)]))
}

function mapping(line) {
  const match = line.match(/^(\s*(?:-\s+)?(?:(['"])(.*?)\2|([^:#]+?))\s*:\s*)(.*)$/)
  if (!match) return null
  return { prefix: match[1], key: (match[3] ?? match[4]).trim(), value: match[5], indent: match[1].match(/^\s*/)[0].length }
}

function inlineSecrets(line) {
  return line.replace(/([,{]\s*(?:['"])?([\w.-]+)(?:['"])?\s*:\s*)(?:"(?:\\.|[^"])*"|'[^']*'|[^,}]*)/g, (whole, prefix, key) => sensitiveKey(key) ? `${prefix}"${REDACTED}"` : whole)
}

export function redactYamlSecrets(source) {
  const lines = source.split(/\r?\n/), output = []
  let concealedIndent = null
  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length
    if (concealedIndent !== null && line.trim() && indent > concealedIndent) continue
    if (concealedIndent !== null && (line.trim() || indent <= concealedIndent)) concealedIndent = null
    const entry = mapping(line)
    if (entry && sensitiveKey(entry.key)) {
      if (!entry.value.trim() || /^#/.test(entry.value.trim())) concealedIndent = entry.indent
      const comment = entry.value.match(/\s+(#.*)$/)?.[1] || ''
      output.push(`${entry.prefix}"${REDACTED}"${comment}`)
      continue
    }
    output.push(inlineSecrets(redactUrlCredentials(line)))
  }
  return output.join(source.includes('\r\n') ? '\r\n' : '\n')
}

export function redactDiagnostic(source) {
  return redactUrlCredentials(String(source || ''))
    .replace(/(\bBearer\s+)[^\s,;]+/gi, '$1[redacted]')
    .replace(/(\b(?:[\w.-]*(?:token|password|secret)|api[_-]?key|authorization|credentials)\b\s*[:=]\s*)(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^\s,;]+)/gi, '$1[redacted]')
}
