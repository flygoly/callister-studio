import { useEffect, useState } from 'react'
import type { ProviderId } from '@callister/core'
import { Button, Input, Panel, StatusBadge } from '@callister/ui'
import { callister } from '../lib/callister'
import { useAppStore } from '../stores/useAppStore'
import { ThemeToggle } from '../components/ThemeToggle'

const providerOrder: ProviderId[] = ['openai', 'anthropic', 'ollama']

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

  useEffect(() => {
    void refreshProviderStatus()
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

      {message ? <p className="settings-message">{message}</p> : null}
    </div>
  )
}
