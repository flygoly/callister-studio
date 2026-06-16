import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { app } from 'electron'
import type { AsrAudioAsset, AsrBatchItem, AsrTranscribeRequest, AsrTranscribeResult, ProviderId } from '@callister/core'
import { getAsrAdapter } from '@callister/providers'
import { getApiKey } from './credentialVault'
import { getSettings } from './settingsService'

const MIME_BY_EXT: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
  '.flac': 'audio/flac'
}

const PREVIEW_LIMIT_BYTES = 8 * 1024 * 1024

function guessMimeType(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

async function ensureTempDir(): Promise<string> {
  const dir = join(app.getPath('userData'), 'asr-temp')
  await mkdir(dir, { recursive: true })
  return dir
}

export async function saveTempAudio(base64: string, fileName: string): Promise<string> {
  const dir = await ensureTempDir()
  const filePath = join(dir, `${Date.now()}-${fileName}`)
  await writeFile(filePath, Buffer.from(base64, 'base64'))
  return filePath
}

export async function loadAudioAsset(filePath: string): Promise<AsrAudioAsset> {
  const buffer = await readFile(filePath)
  const fileName = basename(filePath)
  const mimeType = guessMimeType(fileName)
  const previewBase64 =
    buffer.byteLength <= PREVIEW_LIMIT_BYTES ? buffer.toString('base64') : ''

  return {
    filePath,
    fileName,
    mimeType,
    durationSec: 0,
    previewBase64
  }
}

export async function transcribeAudio(
  requestId: string,
  request: AsrTranscribeRequest
): Promise<AsrTranscribeResult> {
  const settings = getSettings()
  const asrSettings = settings.asr.providers[request.providerId]

  if (!asrSettings.enabled) {
    throw new Error(`${request.providerId} ASR provider is disabled`)
  }

  const adapter = getAsrAdapter(request.providerId)
  const startedAt = Date.now()

  const apiKey = (request.providerId === 'openai' || request.providerId === 'xfyun_short' || request.providerId === 'xfyun_long')
    ? (request.auth?.apiKey ?? getApiKey('openai'))
    : ''
  const apiSecret = (request.providerId === 'xfyun_short' || request.providerId === 'xfyun_long')
    ? (request.auth?.apiSecret ?? getApiKey('xfyun' as ProviderId))
    : undefined

  if (request.providerId === 'openai' && !apiKey) {
    throw new Error('OpenAI API key not configured (used for Whisper)')
  }
  if ((request.providerId === 'xfyun_short' || request.providerId === 'xfyun_long') && (!apiKey || !apiSecret)) {
    throw new Error('iFlytek App ID and API Secret are required in Settings')
  }

  const output = await adapter.transcribe({
    request,
    apiKey: apiKey ?? '',
    apiSecret: apiSecret ?? '',
    baseUrl: asrSettings.baseUrl ?? settings.providers.openai.baseUrl,
    readFile: (filePath) => readFile(filePath)
  })

  const totalMs = Date.now() - startedAt
  const audioDurationSec = output.audioDurationSec || 1

  return {
    requestId,
    text: output.text,
    segments: output.segments,
    detectedLanguage: output.detectedLanguage,
    rawRequest: output.rawRequest,
    rawResponse: output.rawResponse,
    metrics: {
      totalMs,
      audioDurationSec,
      realtimeFactor: totalMs / 1000 / audioDurationSec
    }
  }
}

export async function batchTranscribe(
  request: Omit<AsrTranscribeRequest, 'filePath' | 'fileName'>,
  filePaths: string[]
): Promise<AsrBatchItem[]> {
  const results: AsrBatchItem[] = []

  for (const filePath of filePaths) {
    const fileName = basename(filePath)
    const item: AsrBatchItem = { fileName, filePath, status: 'pending' }
    const startedAt = Date.now()

    try {
      const result = await transcribeAudio(randomUUID(), {
        ...request,
        filePath,
        fileName
      })
      item.status = 'success'
      item.text = result.text
      item.durationSec = result.metrics.audioDurationSec
      item.processingMs = Date.now() - startedAt
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : 'Transcription failed'
    }

    results.push(item)
  }

  return results
}
