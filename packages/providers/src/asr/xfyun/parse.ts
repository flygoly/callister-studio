import type { AsrSegment } from '@callister/core'

type IatWord = { w?: string; sc?: number }
type IatWs = { bg?: number; cw?: IatWord[] }
type IatResult = {
  sn?: number
  ls?: boolean
  pgs?: string
  rg?: number[]
  ws?: IatWs[]
}

type IatFrame = {
  code?: number
  message?: string
  sid?: string
  data?: {
    status?: number
    result?: IatResult
  }
}

type LfasrSentence = {
  bg?: string
  ed?: string
  onebest?: string
  speaker?: string
}

export function parseIatFrames(frames: IatFrame[]): {
  text: string
  segments: AsrSegment[]
  sid?: string
} {
  const segments: AsrSegment[] = []
  let segmentId = 0
  let text = ''

  for (const frame of frames) {
    const result = frame.data?.result
    if (!result?.ws?.length) continue

    const words = result.ws
      .flatMap((item) => item.cw ?? [])
      .map((item) => item.w ?? '')
      .join('')
      .trim()

    if (!words) continue

    if (result.pgs === 'rpl' && result.rg && result.rg.length >= 2) {
      const [start, end] = result.rg
      for (let i = start - 1; i < end && i < segments.length; i++) {
        if (i >= 0) segments[i] = { ...segments[i], text: '' }
      }
    }

    const bgFrames = result.ws[0]?.bg ?? 0
    const startSec = bgFrames / 100
    const endSec = startSec + Math.max(0.5, words.length * 0.15)

    segments.push({
      id: segmentId++,
      start: startSec,
      end: endSec,
      text: words
    })
    text = segments
      .filter((segment) => segment.text)
      .map((segment) => segment.text)
      .join('')
  }

  return {
    text: text.trim(),
    segments: segments.filter((segment) => segment.text),
    sid: frames.find((frame) => frame.sid)?.sid
  }
}

export function parseLfasrResult(data: unknown): { text: string; segments: AsrSegment[] } {
  let sentences: LfasrSentence[] = []

  if (typeof data === 'string') {
    try {
      sentences = JSON.parse(data) as LfasrSentence[]
    } catch {
      sentences = []
    }
  } else if (Array.isArray(data)) {
    sentences = data as LfasrSentence[]
  } else if (data && typeof data === 'object' && 'onebest' in data) {
    sentences = [data as LfasrSentence]
  }

  const segments = sentences
    .filter((item) => item.onebest)
    .map((item, index) => ({
      id: index,
      start: Number(item.bg ?? 0) / 1000,
      end: Number(item.ed ?? 0) / 1000,
      text: item.onebest?.trim() ?? ''
    }))

  return {
    text: segments.map((segment) => segment.text).join('\n'),
    segments
  }
}

export function nextSliceId(index: number): string {
  let value = 'aaaaaaaaaa'
  for (let i = 0; i < index; i++) {
    const chars = value.split('')
    let carry = 1
    for (let j = chars.length - 1; j >= 0 && carry; j--) {
      if (chars[j] === 'z') {
        chars[j] = 'a'
      } else {
        chars[j] = String.fromCharCode(chars[j].charCodeAt(0) + 1)
        carry = 0
      }
    }
    value = chars.join('')
  }
  return value
}
