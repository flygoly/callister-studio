import { useEffect, useState } from 'react'
import type { AsrProviderId, ProviderId } from '@callister/core'
import { Button, Input, Panel, Select, StatusBadge } from '@callister/ui'
import { callister } from '../lib/callister'
import { useAppStore } from '../stores/useAppStore'
import { ThemeToggle } from '../components/ThemeToggle'

const providerOrder: ProviderId[] = ['openai', 'anthropic', 'ollama']
const asrProviderOrder: AsrProviderId[] = ['openai', 'local']

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const providerStatus = useAppStore((state) => state.providerStatus)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const refreshProviderStatus = useAppStore((state) => state.refreshProviderStatus)
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
    openai: '',
    anthropic: '',
    ollama: ''
  })
  const [message, setMessage] = useState('')
  const [localWhisperAvailable, setLocalWhisperAvailable] = useState(false)

  useEffect(() => {
    void refreshProviderStatus()
    void callister.asr.probeLocal().then(setLocalWhisperAvailable)
  }, [refreshProviderStatus])

  const saveProvider = async (providerId: ProviderId) => {
    const providerSettings = settings.providers[providerId]
    const nextSettings = {
      ...settings,
      providers: {
        ...settings.providers,
        [providerId]: providerSettings
      }
    }
    await updateSettings(nextSettings)

    if (providerId !== 'ollama' && apiKeys[providerId].trim()) {
      await callister.credentials.set({ providerId, apiKey: apiKeys[providerId].trim() })
      setApiKeys((current) => ({ ...current, [providerId]: '' }))
    }

    await refreshProviderStatus()
    setMessage(`${providerId} settings saved`)
  }

  const clearCredential = async (providerId: ProviderId) => {
    if (providerId === 'ollama') return
    await callister.credentials.delete({ providerId })
    await refreshProviderStatus()
    setMessage(`${providerId} API key removed`)
  }

  return (
    <div className="settings-page">
      <Panel title="Appearance">
        <ThemeToggle />
      </Panel>

      {providerOrder.map((providerId) => {
        const status = providerStatus.find((item) => item.id === providerId)
        const providerSettings = settings.providers[providerId]

        return (
          <Panel key={providerId} title={status?.label ?? providerId}>
            <div className="settings-grid">
              <div className="settings-row">
                <StatusBadge tone={status?.configured ? 'success' : 'warning'}>
                  {status?.configured ? 'Configured' : 'Not configured'}
                </StatusBadge>
                <StatusBadge tone={providerSettings.enabled ? 'success' : 'neutral'}>
                  {providerSettings.enabled ? 'Enabled' : 'Disabled'}
                </StatusBadge>
              </div>

              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={providerSettings.enabled}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      providers: {
                        ...settings.providers,
                        [providerId]: {
                          ...providerSettings,
                          enabled: event.target.checked
                        }
                      }
                    })
                  }
                />
                Enable provider
              </label>

              <Input
                label="Base URL"
                value={providerSettings.baseUrl}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    providers: {
                      ...settings.providers,
                      [providerId]: {
                        ...providerSettings,
                        baseUrl: event.target.value
                      }
                    }
                  })
                }
              />

              <Input
                label="Default model"
                value={providerSettings.defaultModel}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    providers: {
                      ...settings.providers,
                      [providerId]: {
                        ...providerSettings,
                        defaultModel: event.target.value
                      }
                    }
                  })
                }
              />

              {providerId !== 'ollama' ? (
                <Input
                  label="API key"
                  type="password"
                  placeholder="Paste API key"
                  value={apiKeys[providerId]}
                  onChange={(event) =>
                    setApiKeys((current) => ({ ...current, [providerId]: event.target.value }))
                  }
                />
              ) : (
                <p className="settings-hint">
                  Ollama runs locally and does not require an API key.
                </p>
              )}

              <div className="settings-actions">
                <Button variant="primary" onClick={() => void saveProvider(providerId)}>
                  Save
                </Button>
                {providerId !== 'ollama' ? (
                  <Button variant="ghost" onClick={() => void clearCredential(providerId)}>
                    Clear API key
                  </Button>
                ) : null}
              </div>
            </div>
          </Panel>
        )
      })}

      <Panel title="ASR (Speech-to-Text)">
        <div className="settings-grid">
          <Select
            label="Default provider"
            value={settings.asr.defaultProvider}
            options={[
              { value: 'openai', label: 'OpenAI Whisper' },
              { value: 'local', label: 'faster-whisper (local)' }
            ]}
            onChange={(event) =>
              updateSettings({
                ...settings,
                asr: {
                  ...settings.asr,
                  defaultProvider: event.target.value as AsrProviderId
                }
              })
            }
          />
        </div>
      </Panel>

      {asrProviderOrder.map((providerId) => {
        const asrProvider = settings.asr.providers[providerId]
        const label = providerId === 'openai' ? 'OpenAI Whisper' : 'faster-whisper (local)'

        return (
          <Panel key={providerId} title={label}>
            <div className="settings-grid">
              <div className="settings-row">
                <StatusBadge tone={asrProvider.enabled ? 'success' : 'neutral'}>
                  {asrProvider.enabled ? 'Enabled' : 'Disabled'}
                </StatusBadge>
                {providerId === 'openai' ? (
                  <StatusBadge tone={providerStatus.find((p) => p.id === 'openai')?.configured ? 'success' : 'warning'}>
                    {providerStatus.find((p) => p.id === 'openai')?.configured
                      ? 'API key configured'
                      : 'Needs OpenAI API key'}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone={localWhisperAvailable ? 'success' : 'warning'}>
                    {localWhisperAvailable ? 'CLI found' : 'faster-whisper not in PATH'}
                  </StatusBadge>
                )}
              </div>

              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={asrProvider.enabled}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      asr: {
                        ...settings.asr,
                        providers: {
                          ...settings.asr.providers,
                          [providerId]: { ...asrProvider, enabled: event.target.checked }
                        }
                      }
                    })
                  }
                />
                Enable provider
              </label>

              <Input
                label="Model"
                value={asrProvider.model}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    asr: {
                      ...settings.asr,
                      providers: {
                        ...settings.asr.providers,
                        [providerId]: { ...asrProvider, model: event.target.value }
                      }
                    }
                  })
                }
              />

              <Input
                label="Language"
                placeholder="auto"
                value={asrProvider.language}
                onChange={(event) =>
                  updateSettings({
                    ...settings,
                    asr: {
                      ...settings.asr,
                      providers: {
                        ...settings.asr.providers,
                        [providerId]: { ...asrProvider, language: event.target.value }
                      }
                    }
                  })
                }
              />

              {providerId === 'openai' ? (
                <Input
                  label="Base URL"
                  value={asrProvider.baseUrl ?? settings.providers.openai.baseUrl}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      asr: {
                        ...settings.asr,
                        providers: {
                          ...settings.asr.providers,
                          openai: { ...asrProvider, baseUrl: event.target.value }
                        }
                      }
                    })
                  }
                />
              ) : (
                <p className="settings-hint">
                  Install faster-whisper and ensure the CLI is available in your PATH.
                </p>
              )}
            </div>
          </Panel>
        )
      })}

      {message ? <p className="settings-message">{message}</p> : null}
    </div>
  )
}
