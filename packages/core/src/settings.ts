export type ThemeMode = 'light' | 'dark' | 'system'

export type ProviderId = 'openai' | 'anthropic' | 'ollama'

export type ProviderSettings = {
  enabled: boolean
  baseUrl: string
  defaultModel: string
}

export type AppSettings = {
  theme: ThemeMode
  providers: Record<ProviderId, ProviderSettings>
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  providers: {
    openai: {
      enabled: true,
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini'
    },
    anthropic: {
      enabled: true,
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-5-haiku-latest'
    },
    ollama: {
      enabled: true,
      baseUrl: 'http://127.0.0.1:11434',
      defaultModel: 'llama3.2'
    }
  }
}

export type ProviderStatus = {
  id: ProviderId
  label: string
  configured: boolean
  enabled: boolean
  baseUrl: string
  defaultModel: string
}
