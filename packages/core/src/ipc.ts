import type { AppSettings, ProviderId, ProviderStatus } from './settings'
import type {
  AsrAudioAsset,
  AsrBatchItem,
  AsrFixture,
  AsrRun,
  AsrTranscribeRequest,
  AsrTranscribeResult
} from './asr'
import type { LLMChatRequest, LLMChatResult, LLMFixture, LLMSession } from './llm'

export const IPC = {
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  credentialsSet: 'credentials:set',
  credentialsDelete: 'credentials:delete',
  credentialsStatus: 'credentials:status',
  llmStream: 'llm:stream',
  llmStreamChunk: 'llm:stream-chunk',
  llmStreamDone: 'llm:stream-done',
  llmStreamError: 'llm:stream-error',
  sessionsList: 'sessions:list',
  sessionsSave: 'sessions:save',
  sessionsDelete: 'sessions:delete',
  fixtureExport: 'fixture:export',
  fixtureImport: 'fixture:import',
  asrPickAudio: 'asr:pick-audio',
  asrSaveTemp: 'asr:save-temp',
  asrLoadAsset: 'asr:load-asset',
  asrTranscribe: 'asr:transcribe',
  asrBatch: 'asr:batch',
  asrProbeLocal: 'asr:probe-local',
  asrRunsList: 'asr:runs-list',
  asrRunsSave: 'asr:runs-save',
  asrRunsDelete: 'asr:runs-delete',
  asrFixtureExport: 'asr:fixture-export',
  asrFixtureImport: 'asr:fixture-import',
  systemOpenExternal: 'system:open-external'
} as const

export type CredentialsSetPayload = {
  providerId: ProviderId | 'xfyun'
  apiKey: string
}

export type CredentialsDeletePayload = {
  providerId: ProviderId | 'xfyun'
}

export type LLMStreamPayload = {
  requestId: string
  request: LLMChatRequest
}

export type LLMStreamChunkPayload = {
  requestId: string
  delta: string
}

export type LLMStreamDonePayload = {
  requestId: string
  result: LLMChatResult
}

export type LLMStreamErrorPayload = {
  requestId: string
  message: string
  statusCode?: number
  retryable?: boolean
}

export type CallisterBridge = {
  platform: NodeJS.Platform
  versions: {
    node: string
    chrome: string
    electron: string
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (settings: AppSettings) => Promise<AppSettings>
    getProviderStatus: () => Promise<ProviderStatus[]>
  }
  credentials: {
    set: (payload: CredentialsSetPayload) => Promise<void>
    delete: (payload: CredentialsDeletePayload) => Promise<void>
  }
  llm: {
    stream: (
      request: LLMChatRequest,
      handlers: {
        onChunk: (delta: string) => void
        onDone: (result: LLMChatResult) => void
        onError: (error: LLMStreamErrorPayload) => void
      }
    ) => Promise<string>
  }
  sessions: {
    list: () => Promise<LLMSession[]>
    save: (session: LLMSession) => Promise<LLMSession[]>
    delete: (sessionId: string) => Promise<LLMSession[]>
  }
  fixture: {
    export: (fixture: LLMFixture) => Promise<string>
    import: () => Promise<LLMFixture | null>
  }
  system: {
    openExternal: (url: string) => Promise<void>
  }
  asr: {
    pickAudio: () => Promise<string | null>
    saveTemp: (base64: string, fileName: string) => Promise<string>
    loadAsset: (filePath: string) => Promise<AsrAudioAsset>
    transcribe: (request: AsrTranscribeRequest) => Promise<AsrTranscribeResult>
    batch: (
      request: Omit<AsrTranscribeRequest, 'filePath' | 'fileName'>,
      filePaths: string[]
    ) => Promise<AsrBatchItem[]>
    probeLocal: () => Promise<boolean>
    runs: {
      list: () => Promise<AsrRun[]>
      save: (run: AsrRun) => Promise<AsrRun[]>
      delete: (runId: string) => Promise<AsrRun[]>
    }
    fixture: {
      export: (fixture: AsrFixture) => Promise<string>
      import: () => Promise<AsrFixture | null>
    }
  }
}
