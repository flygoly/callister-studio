import { basename } from 'path'
import { ProviderHttpError } from '../../utils'
import type { AsrProviderAdapter, AsrTranscribeOutput } from '../types'
import { buildLfasrSigna } from './auth'
import { nextSliceId, parseLfasrResult } from './parse'

const SLICE_SIZE = 10 * 1024 * 1024
const PROGRESS_POLL_MS = 3000
const PROGRESS_MAX_ATTEMPTS = 120

type FlowStep = {
  step: string
  at: number
  request?: unknown
  response?: unknown
}

type LfasrEnvelope = {
  ok?: number
  err_no?: number
  failed?: string | null
  data?: string | null
}

async function postForm(
  url: string,
  params: Record<string, string>
): Promise<{ body: LfasrEnvelope; url: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams(params)
  })
  const body = (await response.json()) as LfasrEnvelope
  if (!response.ok || body.ok !== 0) {
    throw new ProviderHttpError(
      body.failed ?? `LFASR request failed (${body.err_no ?? response.status})`,
      body.err_no ?? response.status,
      false
    )
  }
  return { body, url }
}

async function postUpload(
  baseUrl: string,
  params: Record<string, string>,
  content: Buffer
): Promise<LfasrEnvelope> {
  const form = new FormData()
  for (const [key, value] of Object.entries(params)) {
    form.append(key, value)
  }
  form.append('content', new Blob([Uint8Array.from(content)]), 'slice')

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form })
  const body = (await response.json()) as LfasrEnvelope
  if (!response.ok || body.ok !== 0) {
    throw new ProviderHttpError(
      body.failed ?? `LFASR upload failed (${body.err_no ?? response.status})`,
      body.err_no ?? response.status,
      false
    )
  }
  return body
}

function authParams(appId: string, apiSecret: string): { app_id: string; signa: string; ts: string } {
  const { ts, signa } = buildLfasrSigna(appId, apiSecret)
  return { app_id: appId, signa, ts }
}

export const xfyunLongAdapter: AsrProviderAdapter = {
  id: 'xfyun_long',
  label: 'iFlytek Long (LFASR REST)',
  async transcribe({ request, apiKey, apiSecret, baseUrl, readFile }): Promise<AsrTranscribeOutput> {
    const appId = request.auth?.appId ?? request.auth?.apiKey ?? apiKey
    const secret = request.auth?.apiSecret ?? apiSecret

    if (!appId || !secret) {
      throw new ProviderHttpError('iFlytek App ID and API Secret are required', 400, false)
    }

    const apiBase = (baseUrl || 'https://raasr.xfyun.cn/api').replace(/\/$/, '')
    const fileName = request.fileName || basename(request.filePath)
    const buffer = await readFile(request.filePath)
    const sliceNum = Math.max(1, Math.ceil(buffer.byteLength / SLICE_SIZE))
    const flow: FlowStep[] = []

    const language =
      request.language === 'auto' || request.language === 'zh_cn' ? 'cn' : request.language

    const prepareParams = {
      ...authParams(appId, secret),
      file_len: String(buffer.byteLength),
      file_name: fileName,
      slice_num: String(sliceNum),
      language
    }

    const prepare = await postForm(`${apiBase}/prepare`, prepareParams)
    flow.push({
      step: 'prepare',
      at: Date.now(),
      request: { url: `${apiBase}/prepare`, params: prepareParams },
      response: prepare.body
    })

    const taskId = prepare.body.data
    if (!taskId) {
      throw new ProviderHttpError('LFASR prepare did not return task_id', 500, false)
    }

    for (let index = 0; index < sliceNum; index++) {
      const start = index * SLICE_SIZE
      const end = Math.min(start + SLICE_SIZE, buffer.byteLength)
      const slice = buffer.subarray(start, end)
      const sliceId = nextSliceId(index)
      const uploadParams = {
        ...authParams(appId, secret),
        task_id: taskId,
        slice_id: sliceId
      }
      const uploadBody = await postUpload(apiBase, uploadParams, slice)
      flow.push({
        step: `upload.${index + 1}`,
        at: Date.now(),
        request: {
          url: `${apiBase}/upload`,
          params: uploadParams,
          bytes: slice.byteLength
        },
        response: uploadBody
      })
    }

    const mergeParams = { ...authParams(appId, secret), task_id: taskId }
    const merge = await postForm(`${apiBase}/merge`, mergeParams)
    flow.push({
      step: 'merge',
      at: Date.now(),
      request: { url: `${apiBase}/merge`, params: mergeParams },
      response: merge.body
    })

    let progressStatus = -1
    let progressData: unknown = null

    for (let attempt = 0; attempt < PROGRESS_MAX_ATTEMPTS; attempt++) {
      const progressParams = { ...authParams(appId, secret), task_id: taskId }
      const progress = await postForm(`${apiBase}/getProgress`, progressParams)
      progressData = progress.body.data

      let status = -1
      if (typeof progress.body.data === 'string') {
        try {
          status = Number((JSON.parse(progress.body.data) as { status?: number }).status ?? -1)
        } catch {
          status = -1
        }
      }

      progressStatus = status
      flow.push({
        step: `getProgress.${attempt + 1}`,
        at: Date.now(),
        request: { url: `${apiBase}/getProgress`, params: progressParams },
        response: progress.body
      })

      if (status === 9 || status === 5) break
      await new Promise((resolve) => setTimeout(resolve, PROGRESS_POLL_MS))
    }

    if (progressStatus !== 9 && progressStatus !== 5) {
      throw new ProviderHttpError(
        `LFASR task not ready (last status=${progressStatus}). Check flow log for details.`,
        408,
        true
      )
    }

    const resultParams = { ...authParams(appId, secret), task_id: taskId }
    const result = await postForm(`${apiBase}/getResult`, resultParams)
    flow.push({
      step: 'getResult',
      at: Date.now(),
      request: { url: `${apiBase}/getResult`, params: resultParams },
      response: result.body
    })

    let parsedData: unknown = result.body.data
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData)
      } catch {
        // keep raw string
      }
    }

    const { text, segments } = parseLfasrResult(parsedData)
    const audioDurationSec =
      segments.length > 0 ? Math.max(...segments.map((segment) => segment.end)) : buffer.byteLength / 32000

    return {
      text,
      segments,
      detectedLanguage: language,
      rawRequest: {
        mode: 'xfyun_long',
        apiBase,
        prepareParams,
        taskId,
        sliceNum
      },
      rawResponse: {
        taskId,
        progress: progressData,
        result: result.body,
        flow
      },
      audioDurationSec: Math.max(1, audioDurationSec)
    }
  }
}
