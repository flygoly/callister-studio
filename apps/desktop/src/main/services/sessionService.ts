import Store from 'electron-store'
import type { LLMSession } from '@callister/core'

const store = new Store<{ sessions: LLMSession[] }>({
  name: 'callister-sessions',
  defaults: { sessions: [] }
})

export function listSessions(): LLMSession[] {
  return store.get('sessions').sort((a, b) => b.updatedAt - a.updatedAt)
}

export function saveSession(session: LLMSession): LLMSession[] {
  const sessions = listSessions().filter((item) => item.id !== session.id)
  sessions.unshift(session)
  store.set('sessions', sessions.slice(0, 50))
  return store.get('sessions')
}

export function deleteSession(sessionId: string): LLMSession[] {
  const sessions = listSessions().filter((item) => item.id !== sessionId)
  store.set('sessions', sessions)
  return sessions
}
