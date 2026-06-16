import type { AsrSegment, AsrTranscribeRequest } from '@callister/core'

export type AsrTranscribeOptions = {
  request: AsrTranscribeRequest
  apiKey: string
  apiSecret?: string
  baseUrl: string
  readFile: (filePath: string) => Promise<Buffer>
}

export type AsrTranscribeOutput = {
  text: string
  segments: AsrSegment[]
  detectedLanguage?: string
  rawRequest: unknown
  rawResponse: unknown
  audioDurationSec: number
}

export type AsrProviderAdapter = {
  id: 'openai' | 'local' | 'xfyun_short' | 'xfyun_long'
  label: string
  transcribe: (options: AsrTranscribeOptions) => Promise<AsrTranscribeOutput>
}
