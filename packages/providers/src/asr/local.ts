import { spawn } from 'child_process'
import { ProviderHttpError } from '../utils'
import type { AsrProviderAdapter, AsrTranscribeOutput } from './types'

type FasterWhisperSegment = {
  id: number
  start: number
  end: number
  text: string
}

function runFasterWhisper(
  filePath: string,
  model: string,
  language: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const args = [filePath, '--model', model, '--output_format', 'json']
    if (language && language !== 'auto') {
      args.push('--language', language)
    }

    const child = spawn('faster-whisper', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => reject(error))
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }
      reject(new ProviderHttpError(stderr || `faster-whisper exited with code ${code}`, 500, false))
    })
  })
}

export const localWhisperAdapter: AsrProviderAdapter = {
  id: 'local',
  label: 'faster-whisper (local)',
  async transcribe({ request }): Promise<AsrTranscribeOutput> {
    const { stdout } = await runFasterWhisper(request.filePath, request.model, request.language)

    let parsed: { text?: string; segments?: FasterWhisperSegment[]; language?: string }
    try {
      parsed = JSON.parse(stdout) as {
        text?: string
        segments?: FasterWhisperSegment[]
        language?: string
      }
    } catch {
      parsed = {
        text: stdout.trim(),
        segments: []
      }
    }

    const segments =
      parsed.segments?.map((segment) => ({
        id: segment.id,
        start: segment.start,
        end: segment.end,
        text: segment.text.trim()
      })) ?? []

    const audioDurationSec =
      segments.length > 0 ? Math.max(...segments.map((segment) => segment.end)) : 0

    return {
      text: parsed.text?.trim() ?? segments.map((segment) => segment.text).join(' '),
      segments,
      detectedLanguage: parsed.language,
      rawRequest: {
        command: 'faster-whisper',
        model: request.model,
        language: request.language,
        filePath: request.filePath
      },
      rawResponse: parsed,
      audioDurationSec
    }
  }
}

export async function probeLocalWhisper(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('faster-whisper', ['--help'], { stdio: 'ignore' })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}
