import WebSocket from 'ws'
import { basename, extname } from 'path'
import { ProviderHttpError } from '../../utils'
import type { AsrProviderAdapter, AsrTranscribeOutput } from '../types'
import { buildIatAuthUrl } from './auth'
import { parseIatFrames } from './parse'

const FRAME_SIZE = 1280
const FRAME_INTERVAL_MS = 40

type FlowStep = {
  step: string
  at: number
  detail?: unknown
  request?: unknown
  response?: unknown
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveEncoding(fileName: string): { encoding: string; format: string } {
  const ext = extname(fileName).toLowerCase()
  if (ext === '.mp3') {
    return { encoding: 'lame', format: 'audio/L16;rate=16000' }
  }
  return { encoding: 'raw', format: 'audio/L16;rate=16000' }
}

function transcribeShort({
  request,
  apiKey,
  apiSecret,
  baseUrl,
  readFile
}: Parameters<AsrProviderAdapter['transcribe']>[0]): Promise<AsrTranscribeOutput> {
  const appId = request.auth?.appId ?? request.auth?.apiKey ?? apiKey
  const iatApiKey = request.auth?.apiKey ?? request.auth?.appId ?? apiKey
  const secret = request.auth?.apiSecret ?? apiSecret

  if (!appId || !iatApiKey || !secret) {
    throw new ProviderHttpError('iFlytek App ID, API Key and API Secret are required', 400, false)
  }

  const hostUrl = baseUrl || 'wss://iat-api.xfyun.cn/v2/iat'
  const authUrl = buildIatAuthUrl(hostUrl, iatApiKey, secret)
  const { encoding, format } = resolveEncoding(request.fileName || basename(request.filePath))

  const flow: FlowStep[] = []
  const frames: unknown[] = []

  const business = {
    language: request.language === 'auto' ? 'zh_cn' : request.language,
    domain: request.model || 'iat',
    accent: 'mandarin',
    vad_eos: 5000
  }

  return readFile(request.filePath).then(
    (audioBuffer) =>
      new Promise<AsrTranscribeOutput>((resolve, reject) => {
        const ws = new WebSocket(authUrl)
        let sentBytes = 0
        let closed = false

        const pushFlow = (step: string, detail?: unknown, extra?: Partial<FlowStep>) => {
          flow.push({ step, at: Date.now(), detail, ...extra })
        }

        ws.on('open', async () => {
          pushFlow('websocket.open', { url: hostUrl })

          try {
            const total = audioBuffer.byteLength
            let offset = 0
            let frameIndex = 0

            while (offset < total && ws.readyState === WebSocket.OPEN) {
              const end = Math.min(offset + FRAME_SIZE, total)
              const chunk = audioBuffer.subarray(offset, end)
              const isFirst = frameIndex === 0
              const isLast = end >= total

              const payload: Record<string, unknown> = {
                data: {
                  status: isFirst ? 0 : 1,
                  format,
                  encoding,
                  audio: chunk.toString('base64')
                }
              }

              if (isFirst) {
                payload.common = { app_id: appId }
                payload.business = business
                pushFlow('send.first_frame', { common: payload.common, business: payload.business })
              }

              ws.send(JSON.stringify(payload))
              sentBytes += chunk.byteLength
              offset = end
              frameIndex += 1

              if (!isLast) {
                await sleep(FRAME_INTERVAL_MS)
              }
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ data: { status: 2 } }))
              pushFlow('send.end_marker', { bytesSent: sentBytes })
            }
          } catch (error) {
            if (!closed) {
              closed = true
              ws.close()
            }
            reject(error)
          }
        })

        ws.on('message', (data) => {
          try {
            const frame = JSON.parse(data.toString()) as {
              code?: number
              message?: string
              sid?: string
              data?: unknown
            }
            frames.push(frame)
            pushFlow('recv.frame', { code: frame.code, sid: frame.sid }, { response: frame })

            if (frame.code !== 0 && frame.code !== undefined) {
              if (!closed) {
                closed = true
                ws.close()
              }
              reject(new ProviderHttpError(frame.message ?? `iFlytek error ${frame.code}`, frame.code, false))
            }
          } catch (error) {
            pushFlow('recv.parse_error', { error: String(error) })
          }
        })

        ws.on('close', () => {
          if (closed) return
          closed = true

          const parsed = parseIatFrames(frames as Parameters<typeof parseIatFrames>[0])
          const audioDurationSec = Math.max(1, sentBytes / (16000 * 2))

          resolve({
            text: parsed.text,
            segments: parsed.segments,
            detectedLanguage: business.language,
            rawRequest: {
              mode: 'xfyun_short',
              authUrl: hostUrl,
              business,
              encoding,
              format,
              frameSize: FRAME_SIZE,
              frameIntervalMs: FRAME_INTERVAL_MS
            },
            rawResponse: {
              sid: parsed.sid,
              frames,
              flow
            },
            audioDurationSec
          })
        })

        ws.on('error', (error) => {
          if (!closed) {
            closed = true
            pushFlow('websocket.error', { message: error.message })
            reject(new ProviderHttpError(error.message, 500, true))
          }
        })
      })
  )
}

export const xfyunShortAdapter: AsrProviderAdapter = {
  id: 'xfyun_short',
  label: 'iFlytek Short (WebSocket IAT)',
  transcribe: transcribeShort
}
