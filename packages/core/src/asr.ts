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
  /**
   * Optional per-provider credentials for local/debug providers.
   * For example: iFlytek WebSocket/REST uses app_id + apiSecret.
   */
  auth?: {
    appId?: string
    apiKey?: string
    apiSecret?: string
  }
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

export type AsrSdkLanguage = 'java' | 'python' | 'nodejs' | 'go' | 'curl'

export type XfyunSnippetContext = {
  mode: 'short' | 'long'
  appId: string
  apiKey: string
  apiSecret: string
  language: string
  fileName: string
  hostUrl?: string
  apiBase?: string
}

export function buildXfyunSnippet(
  sdkLanguage: AsrSdkLanguage,
  context: XfyunSnippetContext
): string {
  if (context.mode === 'short') {
    return buildShortSnippet(sdkLanguage, context)
  }
  return buildLongSnippet(sdkLanguage, context)
}

function buildShortSnippet(sdk: AsrSdkLanguage, ctx: XfyunSnippetContext): string {
  const host = ctx.hostUrl ?? 'wss://iat-api.xfyun.cn/v2/iat'
  const lang = ctx.language === 'auto' ? 'zh_cn' : ctx.language

  if (sdk === 'java') {
    return `// iFlytek Short Speech (WebSocket IAT) - Java outline
// 1) Build auth URL with HMAC-SHA256 (host, date, request-line)
// 2) Open WebSocket: ${host}
// 3) Send first frame with common.app_id + business params
// 4) Stream audio frames every 40ms (1280 bytes for PCM16k)
// 5) Send final frame: {"data":{"status":2}}

String appId = "${ctx.appId}";
String apiKey = "${ctx.apiKey}";
String apiSecret = "${ctx.apiSecret}";
String language = "${lang}";
String filePath = "${ctx.fileName}";

// business params
// language=${lang}, domain=iat, accent=mandarin
// data.encoding=raw|lame, data.format=audio/L16;rate=16000`
  }

  if (sdk === 'python') {
    return `import base64
import json
import websocket

APP_ID = "${ctx.appId}"
API_KEY = "${ctx.apiKey}"
API_SECRET = "${ctx.apiSecret}"
FILE_PATH = "${ctx.fileName}"
HOST = "${host}"

# 1) assemble signed wss url (authorization/date/host)
# 2) ws = websocket.create_connection(signed_url)
# 3) send first frame with common + business
# 4) stream 1280-byte chunks every 40ms
# 5) send {"data": {"status": 2}}

business = {"language": "${lang}", "domain": "iat", "accent": "mandarin"}`
  }

  if (sdk === 'nodejs') {
    return `import fs from 'node:fs'
import WebSocket from 'ws'
// build signed url for ${host}

const APP_ID = '${ctx.appId}'
const API_KEY = '${ctx.apiKey}'
const API_SECRET = '${ctx.apiSecret}'
const FILE = '${ctx.fileName}'

// ws.on('open', () => send frames with status 0/1/2)
// business: { language: '${lang}', domain: 'iat', accent: 'mandarin' }`
  }

  if (sdk === 'go') {
    return `// Go pseudo-code for iFlytek short IAT
appId := "${ctx.appId}"
apiKey := "${ctx.apiKey}"
apiSecret := "${ctx.apiSecret}"
filePath := "${ctx.fileName}"
host := "${host}"

// signedURL := assembleAuthUrl(host, apiKey, apiSecret)
// conn := websocket.Dial(signedURL)
// send common{business{language:"${lang}", domain:"iat"}} + audio frames`
  }

  return `# Short IAT handshake (curl cannot stream audio over ws)
# Use official demo for ${ctx.fileName}
# Host: ${host}
# app_id=${ctx.appId}
# language=${lang}`
}

function buildLongSnippet(sdk: AsrSdkLanguage, ctx: XfyunSnippetContext): string {
  const apiBase = ctx.apiBase ?? 'https://raasr.xfyun.cn/api'
  const lang = ctx.language === 'auto' ? 'cn' : ctx.language

  if (sdk === 'java') {
    return `// iFlytek Long Speech (LFASR REST) - Java outline
String appId = "${ctx.appId}";
String apiSecret = "${ctx.apiSecret}";
String fileName = "${ctx.fileName}";
String apiBase = "${apiBase}";

// signa = Base64(HmacSHA1(MD5(appId + ts), apiSecret))
// 1) POST /prepare
// 2) POST /upload (multipart, slice_id increments)
// 3) POST /merge
// 4) POST /getProgress (poll until status=9)
// 5) POST /getResult

// prepare params: file_len, file_name, slice_num, language=${lang}`
  }

  if (sdk === 'python') {
    return `import hashlib, hmac, base64, time, requests

APP_ID = "${ctx.appId}"
API_SECRET = "${ctx.apiSecret}"
FILE = "${ctx.fileName}"
API_BASE = "${apiBase}"

def signa(app_id, secret):
    ts = str(int(time.time()))
    md5 = hashlib.md5((app_id + ts).encode()).hexdigest()
    sig = base64.b64encode(hmac.new(secret.encode(), md5.encode(), hashlib.sha1).digest())
    return ts, sig.decode()

# 1) POST {API_BASE}/prepare
# 2) POST {API_BASE}/upload (multipart content)
# 3) POST {API_BASE}/merge
# 4) POST {API_BASE}/getProgress
# 5) POST {API_BASE}/getResult
# language=${lang}`
  }

  if (sdk === 'nodejs') {
    return `const API_BASE = '${apiBase}'
const APP_ID = '${ctx.appId}'
const API_SECRET = '${ctx.apiSecret}'
const FILE = '${ctx.fileName}'

// signa = HmacSHA1(MD5(appId+ts), secret) base64
// await fetch(API_BASE + '/prepare', { method:'POST', body: URLSearchParams })
// await fetch(API_BASE + '/upload', { method:'POST', body: FormData })
// await fetch(API_BASE + '/merge', ...)
// poll /getProgress until status 9
// await fetch(API_BASE + '/getResult', ...)
// language=${lang}`
  }

  if (sdk === 'go') {
    return `appId := "${ctx.appId}"
apiSecret := "${ctx.apiSecret}"
fileName := "${ctx.fileName}"
apiBase := "${apiBase}"

// signa := HmacSHA1(MD5(appId+ts), apiSecret) base64
// POST apiBase+"/prepare" -> task_id
// POST apiBase+"/upload" per slice
// POST apiBase+"/merge"
// POST apiBase+"/getProgress" poll
// POST apiBase+"/getResult"`
  }

  return `curl -X POST '${apiBase}/prepare' \\
  -d 'app_id=${ctx.appId}&ts=<unix>&signa=<signa>&file_len=<bytes>&file_name=${ctx.fileName}&slice_num=1&language=${lang}'
# then /upload, /merge, /getProgress, /getResult`
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
