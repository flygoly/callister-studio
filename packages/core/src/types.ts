export type CallisterAPI = {
  platform: NodeJS.Platform
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

export type ProviderAdapter = {
  id: string
  label: string
  configure: (config: Record<string, unknown>) => void
  healthCheck: () => Promise<boolean>
}

export type PlaygroundModule = {
  id: string
  label: string
  run: (input: unknown) => AsyncIterable<unknown>
}
