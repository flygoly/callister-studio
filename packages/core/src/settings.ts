export type ThemeMode = 'light' | 'dark' | 'system'

export type ProviderId = 'openai' | 'anthropic' | 'ollama'

export type AsrProviderId = 'openai' | 'local' | 'xfyun_short' | 'xfyun_long'

export type AsrProviderSettings = {
  enabled: boolean
  model: string
  language: string
  baseUrl?: string
}

export type AsrSettings = {
  defaultProvider: AsrProviderId
  providers: Record<AsrProviderId, AsrProviderSettings>
}

export const DEFAULT_ASR_SETTINGS: AsrSettings = {
  defaultProvider: 'openai',
  providers: {
    openai: {
      enabled: true,
      model: 'whisper-1',
      language: 'auto',
      baseUrl: 'https://api.openai.com/v1'
    },
    local: {
      enabled: false,
      model: 'base',
      language: 'auto'
    },
    xfyun_short: {
      enabled: true,
      model: 'iat',
      language: 'zh_cn',
      baseUrl: 'wss://iat-api.xfyun.cn/v2/iat'
    },
    xfyun_long: {
      enabled: true,
      model: 'lfasr',
      language: 'zh_cn',
      baseUrl: 'https://raasr.xfyun.cn/api'
    }
  }
}

export type ProviderSettings = {
  enabled: boolean
  baseUrl: string
  defaultModel: string
}

export type AppSettings = {
  theme: ThemeMode
  providers: Record<ProviderId, ProviderSettings>
  asr: AsrSettings
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
  },
  asr: DEFAULT_ASR_SETTINGS
}

export type ProviderStatus = {
  id: ProviderId
  label: string
  configured: boolean
  enabled: boolean
  baseUrl: string
  defaultModel: string
}
