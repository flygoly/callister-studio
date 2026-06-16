import type { CallisterAPI } from './types'

export const electronAPI: CallisterAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node ?? '',
    chrome: process.versions.chrome ?? '',
    electron: process.versions.electron ?? ''
  }
}
