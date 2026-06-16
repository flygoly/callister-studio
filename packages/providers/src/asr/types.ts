import type { AsrSegment, AsrTranscribeRequest } from '@callister/core'

export type AsrTranscribeOptions = {
  request: AsrTranscribeRequest
  apiKey: string
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
  id: 'openai' | 'local'
  label: string
  transcribe: (options: AsrTranscribeOptions) => Promise<AsrTranscribeOutput>
}
