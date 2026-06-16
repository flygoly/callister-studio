import type { AsrProviderId } from '@callister/core'
import { localWhisperAdapter, probeLocalWhisper } from './local'
import { openaiWhisperAdapter } from './openai'
import { xfyunLongAdapter } from './xfyun/long'
import { xfyunShortAdapter } from './xfyun/short'

const adapters = {
  openai: openaiWhisperAdapter,
  local: localWhisperAdapter,
  xfyun_short: xfyunShortAdapter,
  xfyun_long: xfyunLongAdapter
} as const

export function getAsrAdapter(providerId: AsrProviderId) {
  const adapter = adapters[providerId]
  if (!adapter) {
    throw new Error(`Unknown ASR provider: ${providerId}`)
  }
  return adapter
}

export { buildXfyunSnippet } from './xfyun'
export type { AsrSdkLanguage, XfyunSnippetContext } from './xfyun'
export { localWhisperAdapter, openaiWhisperAdapter, probeLocalWhisper }
export { xfyunLongAdapter, xfyunShortAdapter }
export type { AsrProviderAdapter } from './types'
