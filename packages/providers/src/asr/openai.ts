import { basename } from 'path'
import { ProviderHttpError, isRetryableStatus, readErrorMessage } from '../utils'
import type { AsrProviderAdapter, AsrTranscribeOutput } from './types'

type WhisperVerboseResponse = {
  text?: string
  language?: string
  duration?: number
  segments?: Array<{
    id: number
    start: number
    end: number
    text: string
    avg_logprob?: number
  }>
}

export const openaiWhisperAdapter: AsrProviderAdapter = {
  id: 'openai',
  label: 'OpenAI Whisper',
  async transcribe({ request, apiKey, baseUrl, readFile }): Promise<AsrTranscribeOutput> {
    const buffer = await readFile(request.filePath)
    const url = `${baseUrl.replace(/\/$/, '')}/audio/transcriptions`
    const form = new FormData()
    const blob = new Blob([Uint8Array.from(buffer)], { type: 'application/octet-stream' })
    form.append('file', blob, request.fileName || basename(request.filePath))
    form.append('model', request.model)
    form.append('response_format', 'verbose_json')

    if (request.language && request.language !== 'auto') {
      form.append('language', request.language)
    }

    const rawRequest = {
      url,
      model: request.model,
      language: request.language,
      fileName: request.fileName,
      response_format: 'verbose_json'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form
    })

    if (!response.ok) {
      const message = await readErrorMessage(response)
      throw new ProviderHttpError(message, response.status, isRetryableStatus(response.status))
    }

    const rawResponse = (await response.json()) as WhisperVerboseResponse
    const segments =
      rawResponse.segments?.map((segment) => ({
        id: segment.id,
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        confidence: segment.avg_logprob !== undefined ? Math.exp(segment.avg_logprob) : undefined
      })) ?? []

    const audioDurationSec =
      rawResponse.duration ??
      (segments.length > 0 ? Math.max(...segments.map((segment) => segment.end)) : 0)

    return {
      text: rawResponse.text?.trim() ?? segments.map((segment) => segment.text).join(' '),
      segments,
      detectedLanguage: rawResponse.language,
      rawRequest,
      rawResponse,
      audioDurationSec
    }
  }
}
