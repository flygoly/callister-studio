import { dialog, ipcMain } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import type {
  AppSettings,
  CredentialsDeletePayload,
  CredentialsSetPayload,
  LLMChatRequest,
  LLMFixture,
  LLMSession
} from '@callister/core'
import { IPC } from '@callister/core'
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
}
