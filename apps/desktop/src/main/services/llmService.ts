import type { WebContents } from 'electron'
import type { LLMChatRequest, LLMChatResult } from '@callister/core'
import { IPC } from '@callister/core'
import { estimateTokens, getLLMAdapter, ProviderHttpError } from '@callister/providers'
import { getApiKey } from './credentialVault'
import { getSettings } from './settingsService'

export async function streamLLMChat(
  requestId: string,
  request: LLMChatRequest,
  sender: WebContents
): Promise<void> {
  const settings = getSettings()
  const providerSettings = settings.providers[request.providerId]

  if (!providerSettings.enabled) {
    sender.send(IPC.llmStreamError, {
      requestId,
      message: `${request.providerId} is disabled in settings`,
      retryable: false
    })
    return
  }

  const apiKey = request.providerId === 'ollama' ? '' : getApiKey(request.providerId)
  if (request.providerId !== 'ollama' && !apiKey) {
    sender.send(IPC.llmStreamError, {
      requestId,
      message: `API key not configured for ${request.providerId}`,
      statusCode: 401,
      retryable: false
    })
    return
  }

  const adapter = getLLMAdapter(request.providerId)
  const startedAt = Date.now()
  let firstChunkAt: number | null = null
  const inputText = request.messages.map((message) => message.content).join('\n')
  const estimatedInputTokens = estimateTokens(inputText)

  try {
    const streamResult = await adapter.streamChat({
      request,
      apiKey: apiKey ?? '',
      baseUrl: providerSettings.baseUrl,
      ctx: {
        onChunk: (delta) => {
          if (!firstChunkAt) firstChunkAt = Date.now()
          sender.send(IPC.llmStreamChunk, { requestId, delta })
        }
      }
    })

    const totalMs = Date.now() - startedAt
    const ttfbMs = firstChunkAt ? firstChunkAt - startedAt : totalMs
    const estimatedOutputTokens = estimateTokens(streamResult.content)
    const generationMs = Math.max(totalMs - ttfbMs, 1)

    const result: LLMChatResult = {
      requestId,
      content: streamResult.content,
      rawRequest: streamResult.rawRequest,
      rawResponseChunks: streamResult.rawResponseChunks,
      metrics: {
        ttfbMs,
        totalMs,
        tokensPerSecond: estimatedOutputTokens / (generationMs / 1000),
        estimatedInputTokens,
        estimatedOutputTokens
      }
    }

    sender.send(IPC.llmStreamDone, { requestId, result })
  } catch (error) {
    if (error instanceof ProviderHttpError) {
      sender.send(IPC.llmStreamError, {
        requestId,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable
      })
      return
    }

    sender.send(IPC.llmStreamError, {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown LLM error',
      retryable: true
    })
  }
}
