import type { AsrProviderId } from './settings'

export type AsrSegment = {
  id: number
  start: number
  end: number
  text: string
  confidence?: number
}

export type AsrTranscribeRequest = {
  providerId: AsrProviderId
  model: string
  language: string
  filePath: string
  fileName: string
}

export type AsrMetrics = {
  totalMs: number
  audioDurationSec: number
  realtimeFactor: number
}

export type AsrTranscribeResult = {
  requestId: string
  text: string
  segments: AsrSegment[]
  detectedLanguage?: string
  rawRequest: unknown
  rawResponse: unknown
  metrics: AsrMetrics
}

export type AsrAudioAsset = {
  filePath: string
  fileName: string
  mimeType: string
  durationSec: number
  previewBase64: string
}

export type AsrRun = {
  id: string
  title: string
  providerId: AsrProviderId
  model: string
  fileName: string
  result?: AsrTranscribeResult
  createdAt: number
}

export type AsrFixture = {
  version: 1
  type: 'asr-run'
  exportedAt: number
  run: AsrRun
  trace?: Record<string, unknown>
}

export type AsrBatchItem = {
  fileName: string
  filePath: string
  status: 'pending' | 'success' | 'error'
  text?: string
  error?: string
  durationSec?: number
  processingMs?: number
}
