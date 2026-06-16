import type { ProviderId } from '@callister/core'
import { getAsrAdapter, probeLocalWhisper } from './asr'
import { anthropicAdapter } from './llm/anthropic'
import { ollamaAdapter, openaiAdapter } from './llm/openai'
import type { LLMProviderAdapter } from './llm/types'

const adapters: Record<ProviderId, LLMProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  ollama: ollamaAdapter
}

export function getLLMAdapter(providerId: ProviderId): LLMProviderAdapter {
  const adapter = adapters[providerId]
  if (!adapter) {
    throw new Error(`Unknown provider: ${providerId}`)
  }
  return adapter
}

export function listLLMProviders(): LLMProviderAdapter[] {
  return Object.values(adapters)
}

export { getAsrAdapter, probeLocalWhisper }
export { anthropicAdapter, ollamaAdapter, openaiAdapter }
export type { LLMProviderAdapter }
export { estimateTokens, ProviderHttpError } from './utils'
export { createProviderRegistry, ProviderRegistry } from './registry'
