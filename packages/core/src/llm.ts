import type { ProviderId } from './settings'

export type LLMRole = 'system' | 'user' | 'assistant'

export type LLMMessage = {
  role: LLMRole
  content: string
}

export type LLMChatRequest = {
  providerId: ProviderId
  model: string
  messages: LLMMessage[]
  temperature: number
  maxTokens: number
  stream: boolean
}

export type LLMStreamChunk = {
  requestId: string
  delta: string
  done?: boolean
}

export type LLMChatMetrics = {
  ttfbMs: number
  totalMs: number
  tokensPerSecond: number
  estimatedInputTokens: number
  estimatedOutputTokens: number
}

export type LLMChatResult = {
  requestId: string
  content: string
  rawRequest: unknown
  rawResponseChunks: unknown[]
  metrics: LLMChatMetrics
  error?: string
}

export type LLMSession = {
  id: string
  title: string
  providerId: ProviderId
  model: string
  systemPrompt: string
  messages: LLMMessage[]
  createdAt: number
  updatedAt: number
}

export type LLMFixture = {
  version: 1
  type: 'llm-session'
  exportedAt: number
  session: LLMSession
  trace?: Record<string, unknown>
}
