import { dialog, ipcMain, shell } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import type {
  AppSettings,
  AsrFixture,
  AsrRun,
  AsrTranscribeRequest,
  CredentialsDeletePayload,
  CredentialsSetPayload,
  LLMChatRequest,
  LLMFixture,
  LLMSession
} from '@callister/core'
import { IPC } from '@callister/core'
import { probeLocalWhisper } from '@callister/providers'
import {
  batchTranscribe,
  loadAudioAsset,
  saveTempAudio,
  transcribeAudio
} from '../services/asrService'
import { deleteAsrRun, listAsrRuns, saveAsrRun } from '../services/asrSessionService'
import { deleteApiKey, setApiKey } from '../services/credentialVault'
import { streamLLMChat } from '../services/llmService'
import { deleteSession, listSessions, saveSession } from '../services/sessionService'
import { getProviderStatus, getSettings, setSettings } from '../services/settingsService'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.settingsGet, () => getSettings())

  ipcMain.handle(IPC.settingsSet, (_event, settings: AppSettings) => setSettings(settings))

  ipcMain.handle(IPC.credentialsStatus, () => getProviderStatus())

  ipcMain.handle(IPC.credentialsSet, (_event, payload: CredentialsSetPayload) => {
    setApiKey(payload.providerId, payload.apiKey)
  })

  ipcMain.handle(IPC.credentialsDelete, (_event, payload: CredentialsDeletePayload) => {
    deleteApiKey(payload.providerId)
  })

  ipcMain.handle(
    IPC.llmStream,
    async (event, payload: { requestId: string; request: LLMChatRequest }) => {
      await streamLLMChat(payload.requestId, payload.request, event.sender)
    }
  )

  ipcMain.handle(IPC.sessionsList, () => listSessions())

  ipcMain.handle(IPC.sessionsSave, (_event, session: LLMSession) => saveSession(session))

  ipcMain.handle(IPC.sessionsDelete, (_event, sessionId: string) => deleteSession(sessionId))

  ipcMain.handle(IPC.fixtureExport, async (_event, fixture: LLMFixture) => {
    const result = await dialog.showSaveDialog({
      title: 'Export LLM fixture',
      defaultPath: `callister-llm-${fixture.session.id}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return ''
    await writeFile(result.filePath, JSON.stringify(fixture, null, 2), 'utf8')
    return result.filePath
  })

  ipcMain.handle(IPC.fixtureImport, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import LLM fixture',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const raw = await readFile(result.filePaths[0], 'utf8')
    return JSON.parse(raw) as LLMFixture
  })

  ipcMain.handle(IPC.asrPickAudio, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select audio file',
      filters: [
        {
          name: 'Audio',
          extensions: ['wav', 'mp3', 'm4a', 'ogg', 'webm', 'flac']
        }
      ],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    IPC.asrSaveTemp,
    async (_event, payload: { base64: string; fileName: string }) =>
      saveTempAudio(payload.base64, payload.fileName)
  )

  ipcMain.handle(IPC.asrLoadAsset, async (_event, filePath: string) => loadAudioAsset(filePath))

  ipcMain.handle(
    IPC.asrTranscribe,
    async (_event, payload: { requestId: string; request: AsrTranscribeRequest }) =>
      transcribeAudio(payload.requestId, payload.request)
  )

  ipcMain.handle(
    IPC.asrBatch,
    async (
      _event,
      payload: {
        request: Omit<AsrTranscribeRequest, 'filePath' | 'fileName'>
        filePaths: string[]
      }
    ) => batchTranscribe(payload.request, payload.filePaths)
  )

  ipcMain.handle(IPC.asrProbeLocal, () => probeLocalWhisper())

  ipcMain.handle(IPC.asrRunsList, () => listAsrRuns())

  ipcMain.handle(IPC.asrRunsSave, (_event, run: AsrRun) => saveAsrRun(run))

  ipcMain.handle(IPC.asrRunsDelete, (_event, runId: string) => deleteAsrRun(runId))

  ipcMain.handle(IPC.asrFixtureExport, async (_event, fixture: AsrFixture) => {
    const result = await dialog.showSaveDialog({
      title: 'Export ASR fixture',
      defaultPath: `callister-asr-${fixture.run.id}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return ''
    await writeFile(result.filePath, JSON.stringify(fixture, null, 2), 'utf8')
    return result.filePath
  })

  ipcMain.handle(IPC.asrFixtureImport, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import ASR fixture',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    const raw = await readFile(result.filePaths[0], 'utf8')
    return JSON.parse(raw) as AsrFixture
  })

  ipcMain.handle(IPC.systemOpenExternal, async (_event, url: string) => {
    await shell.openExternal(url)
  })
}
