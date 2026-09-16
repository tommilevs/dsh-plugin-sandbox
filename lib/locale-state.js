export function classifyLocaleState({ localInstalled = false, remoteExists = false, localEqualsRemote = false } = {}) {
  if (!localInstalled) return 'new'
  if (!remoteExists) return 'ready-to-submit'
  if (localEqualsRemote) return 'published'
  return 'update-available'
}
