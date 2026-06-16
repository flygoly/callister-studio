import type { LLMChatRequest } from '@callister/core'

export type StreamContext = {
  onChunk: (delta: string) => void
  signal?: AbortSignal
}

export type StreamLLMOptions = {
  request: LLMChatRequest
  apiKey: string
  baseUrl: string
  ctx: StreamContext
}

export type StreamLLMResult = {
  content: string
  rawRequest: unknown
  rawResponseChunks: unknown[]
}

export type LLMProviderAdapter = {
  id: 'openai' | 'anthropic' | 'ollama'
  label: string
  streamChat: (options: StreamLLMOptions) => Promise<StreamLLMResult>
}
