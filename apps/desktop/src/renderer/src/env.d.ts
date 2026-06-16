import type { CallisterBridge } from '@callister/core'

declare global {
  interface Window {
    callister: CallisterBridge
  }
}

export {}
