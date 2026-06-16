import Store from 'electron-store'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ProviderId,
  type ProviderStatus
} from '@callister/core'
import { getConfiguredProviderIds, hasApiKey } from './credentialVault'

const store = new Store<{ settings: AppSettings }>({
  name: 'callister-settings',
  defaults: { settings: DEFAULT_SETTINGS }
})

const providerLabels: Record<ProviderId, string> = {
  openai: 'OpenAI-compatible',
  anthropic: 'Anthropic',
  ollama: 'Ollama'
}

export function getSettings(): AppSettings {
  return store.get('settings')
}

export function setSettings(settings: AppSettings): AppSettings {
  store.set('settings', settings)
  return settings
}

export function getProviderStatus(): ProviderStatus[] {
  const settings = getSettings()
  const configuredIds = new Set(getConfiguredProviderIds())

  return (Object.keys(settings.providers) as ProviderId[]).map((id) => ({
    id,
    label: providerLabels[id],
    configured: id === 'ollama' ? true : configuredIds.has(id) || hasApiKey(id),
    enabled: settings.providers[id].enabled,
    baseUrl: settings.providers[id].baseUrl,
    defaultModel: settings.providers[id].defaultModel
  }))
}
