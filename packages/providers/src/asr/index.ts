import type { AsrProviderId } from '@callister/core'
import { localWhisperAdapter, probeLocalWhisper } from './local'
import { openaiWhisperAdapter } from './openai'

const adapters = {
  openai: openaiWhisperAdapter,
  local: localWhisperAdapter
} as const

export function getAsrAdapter(providerId: AsrProviderId) {
  const adapter = adapters[providerId]
  if (!adapter) {
    throw new Error(`Unknown ASR provider: ${providerId}`)
  }
  return adapter
}

export { localWhisperAdapter, openaiWhisperAdapter, probeLocalWhisper }
export type { AsrProviderAdapter } from './types'
