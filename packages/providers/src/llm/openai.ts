import type { LLMMessage } from '@callister/core'
import { isRetryableStatus, ProviderHttpError, readErrorMessage } from '../utils'
import type { LLMProviderAdapter } from './types'

export type { LLMProviderAdapter, StreamLLMOptions, StreamLLMResult } from './types'

function buildOpenAIMessages(messages: LLMMessage[]) {
  return messages.map((message) => ({ role: message.role, content: message.content }))
}

export const openaiAdapter: LLMProviderAdapter = {
  id: 'openai',
  label: 'OpenAI-compatible',
  async streamChat({ request, apiKey, baseUrl, ctx }) {
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
    const body = {
      model: request.model,
      messages: buildOpenAIMessages(request.messages),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: ctx.signal
    })

    if (!response.ok) {
      const message = await readErrorMessage(response)
      throw new ProviderHttpError(message, response.status, isRetryableStatus(response.status))
    }

    if (!response.body) {
      throw new Error('No response body from provider')
    }

    const rawResponseChunks: unknown[] = []
    let content = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          rawResponseChunks.push(parsed)
          const delta = parsed.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            content += delta
            ctx.onChunk(delta)
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return { content, rawRequest: body, rawResponseChunks }
  }
}

export const ollamaAdapter: LLMProviderAdapter = {
  id: 'ollama',
  label: 'Ollama',
  async streamChat({ request, apiKey, baseUrl, ctx }) {
    void apiKey
    const url = `${baseUrl.replace(/\/$/, '')}/api/chat`
    const body = {
      model: request.model,
      messages: buildOpenAIMessages(request.messages),
      stream: true,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctx.signal
    })

    if (!response.ok) {
      const message = await readErrorMessage(response)
      throw new ProviderHttpError(message, response.status, isRetryableStatus(response.status))
    }

    if (!response.body) {
      throw new Error('No response body from provider')
    }

    const rawResponseChunks: unknown[] = []
    let content = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        try {
          const parsed = JSON.parse(trimmed) as {
            message?: { content?: string }
            done?: boolean
          }
          rawResponseChunks.push(parsed)
          const delta = parsed.message?.content ?? ''
          if (delta) {
            content += delta
            ctx.onChunk(delta)
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return { content, rawRequest: body, rawResponseChunks }
  }
}
