import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  AppSettings,
  AsrFixture,
  AsrRun,
  AsrTranscribeRequest,
  CallisterBridge,
  CredentialsDeletePayload,
  CredentialsSetPayload,
  LLMChatResult,
  LLMFixture,
  LLMSession,
  LLMStreamErrorPayload
} from '@callister/core'
import { IPC } from '@callister/core'
import { electronAPI } from '@callister/core/electron'

const bridge: CallisterBridge = {
  ...electronAPI,
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    set: (settings: AppSettings) => ipcRenderer.invoke(IPC.settingsSet, settings),
    getProviderStatus: () => ipcRenderer.invoke(IPC.credentialsStatus)
  },
  credentials: {
    set: (payload: CredentialsSetPayload) => ipcRenderer.invoke(IPC.credentialsSet, payload),
    delete: (payload: CredentialsDeletePayload) =>
      ipcRenderer.invoke(IPC.credentialsDelete, payload)
  },
  llm: {
    stream: async (request, handlers) => {
      const requestId = crypto.randomUUID()

      const onChunk = (_event: IpcRendererEvent, payload: { requestId: string; delta: string }) => {
        if (payload.requestId !== requestId) return
        handlers.onChunk(payload.delta)
      }

      const onDone = (
        _event: IpcRendererEvent,
        payload: { requestId: string; result: LLMChatResult }
      ) => {
        if (payload.requestId !== requestId) return
        cleanup()
        handlers.onDone(payload.result)
      }

      const onError = (_event: IpcRendererEvent, payload: LLMStreamErrorPayload) => {
        if (payload.requestId !== requestId) return
        cleanup()
        handlers.onError(payload)
      }

      const cleanup = () => {
        ipcRenderer.removeListener(IPC.llmStreamChunk, onChunk)
        ipcRenderer.removeListener(IPC.llmStreamDone, onDone)
        ipcRenderer.removeListener(IPC.llmStreamError, onError)
      }

      ipcRenderer.on(IPC.llmStreamChunk, onChunk)
      ipcRenderer.on(IPC.llmStreamDone, onDone)
      ipcRenderer.on(IPC.llmStreamError, onError)

      await ipcRenderer.invoke(IPC.llmStream, { requestId, request })
      return requestId
    }
  },
  sessions: {
    list: () => ipcRenderer.invoke(IPC.sessionsList),
    save: (session: LLMSession) => ipcRenderer.invoke(IPC.sessionsSave, session),
    delete: (sessionId: string) => ipcRenderer.invoke(IPC.sessionsDelete, sessionId)
  },
  fixture: {
    export: (fixture: LLMFixture) => ipcRenderer.invoke(IPC.fixtureExport, fixture),
    import: () => ipcRenderer.invoke(IPC.fixtureImport)
  },
  asr: {
    pickAudio: () => ipcRenderer.invoke(IPC.asrPickAudio),
    saveTemp: (base64: string, fileName: string) =>
      ipcRenderer.invoke(IPC.asrSaveTemp, { base64, fileName }),
    loadAsset: (filePath: string) => ipcRenderer.invoke(IPC.asrLoadAsset, filePath),
    transcribe: (request: AsrTranscribeRequest) =>
      ipcRenderer.invoke(IPC.asrTranscribe, { requestId: crypto.randomUUID(), request }),
    batch: (request, filePaths) => ipcRenderer.invoke(IPC.asrBatch, { request, filePaths }),
    probeLocal: () => ipcRenderer.invoke(IPC.asrProbeLocal),
    runs: {
      list: () => ipcRenderer.invoke(IPC.asrRunsList),
      save: (run: AsrRun) => ipcRenderer.invoke(IPC.asrRunsSave, run),
      delete: (runId: string) => ipcRenderer.invoke(IPC.asrRunsDelete, runId)
    },
    fixture: {
      export: (fixture: AsrFixture) => ipcRenderer.invoke(IPC.asrFixtureExport, fixture),
      import: () => ipcRenderer.invoke(IPC.asrFixtureImport)
    }
  }
}

contextBridge.exposeInMainWorld('callister', bridge)
