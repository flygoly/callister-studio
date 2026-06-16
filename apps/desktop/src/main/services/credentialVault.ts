import { safeStorage } from 'electron'
import Store from 'electron-store'
import type { ProviderId } from '@callister/core'

type CredentialStore = Record<string, string>

const store = new Store<{ credentials: CredentialStore }>({
  name: 'callister-credentials',
  defaults: { credentials: {} }
})

function encrypt(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('base64')
  }
  return Buffer.from(value, 'utf8').toString('base64')
}

function decrypt(value: string): string {
  const buffer = Buffer.from(value, 'base64')
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(buffer)
  }
  return buffer.toString('utf8')
}

export function setApiKey(providerId: ProviderId | 'xfyun', apiKey: string): void {
  const credentials = store.get('credentials')
  credentials[providerId] = encrypt(apiKey.trim())
  store.set('credentials', credentials)
}

export function deleteApiKey(providerId: ProviderId | 'xfyun'): void {
  const credentials = store.get('credentials')
  delete credentials[providerId]
  store.set('credentials', credentials)
}

export function hasApiKey(providerId: ProviderId | 'xfyun'): boolean {
  return Boolean(store.get('credentials')[providerId])
}

export function getApiKey(providerId: ProviderId | 'xfyun'): string | null {
  const encrypted = store.get('credentials')[providerId]
  if (!encrypted) return null
  try {
    return decrypt(encrypted)
  } catch {
    return null
  }
}

export function getConfiguredProviderIds(): ProviderId[] {
  return (Object.keys(store.get('credentials')) as ProviderId[]).filter((id) => hasApiKey(id))
}
