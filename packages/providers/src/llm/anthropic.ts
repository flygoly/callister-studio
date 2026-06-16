import type { LLMMessage } from '@callister/core'
import { isRetryableStatus, ProviderHttpError, readErrorMessage } from '../utils'
import type { StreamLLMOptions, StreamLLMResult } from './types'

function buildAnthropicMessages(messages: LLMMessage[]) {
  const system = messages.find((message) => message.role === 'system')?.content
  const chatMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content
    }))

  return { system, chatMessages }
}

export const anthropicAdapter = {
  id: 'anthropic' as const,
  label: 'Anthropic',
  async streamChat({ request, apiKey, baseUrl, ctx }: StreamLLMOptions): Promise<StreamLLMResult> {
    const url = `${baseUrl.replace(/\/$/, '')}/messages`
    const { system, chatMessages } = buildAnthropicMessages(request.messages)
    const body = {
      model: request.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      system,
      messages: chatMessages,
      stream: true
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
    let currentEvent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
          continue
        }
        if (!line.startsWith('data:')) continue

        const payload = line.slice(5).trim()
        if (!payload) continue

        try {
          const parsed = JSON.parse(payload) as {
            delta?: { text?: string }
            error?: { message?: string }
          }
          rawResponseChunks.push({ event: currentEvent, data: parsed })

          if (currentEvent === 'content_block_delta') {
            const delta = parsed.delta?.text ?? ''
            if (delta) {
              content += delta
              ctx.onChunk(delta)
            }
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return { content, rawRequest: body, rawResponseChunks }
  }
}
