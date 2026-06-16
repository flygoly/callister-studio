import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  LLMChatRequest,
  LLMChatResult,
  LLMMessage,
  LLMSession,
  ProviderId
} from '@callister/core'
import { TraceSession } from '@callister/trace'
import { Button, Input, Panel, Select, SplitPane, TextArea } from '@callister/ui'
import { TraceInspector } from '../components/TraceInspector'
import { callister } from '../lib/callister'
import { useAppStore } from '../stores/useAppStore'

function createSession(providerId: ProviderId, model: string): LLMSession {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: 'New LLM session',
    providerId,
    model,
    systemPrompt: 'You are a helpful assistant for debugging and learning AI workflows.',
    messages: [],
    createdAt: now,
    updatedAt: now
  }
}

export function LlmPage() {
  const settings = useAppStore((state) => state.settings)
  const providerStatus = useAppStore((state) => state.providerStatus)
  const [sessions, setSessions] = useState<LLMSession[]>([])
  const [activeSession, setActiveSession] = useState<LLMSession | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<LLMChatResult | null>(null)
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const providerOptions = useMemo(
    () =>
      providerStatus.map((provider) => ({
        value: provider.id,
        label: `${provider.label}${provider.configured ? '' : ' (not configured)'}`
      })),
    [providerStatus]
  )

  const loadSessions = useCallback(async () => {
    const items = await callister.sessions.list()
    setSessions(items)
    if (!activeSession && items[0]) {
      setActiveSession(items[0])
    }
  }, [activeSession])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!activeSession) {
      const defaultProvider = settings.providers.openai.enabled ? 'openai' : 'ollama'
      setActiveSession(
        createSession(defaultProvider, settings.providers[defaultProvider].defaultModel)
      )
    }
  }, [activeSession, settings.providers])

  const persistSession = async (session: LLMSession) => {
    const next = await callister.sessions.save(session)
    setSessions(next)
    setActiveSession(session)
  }

  const runChat = async (retry = false) => {
    if (!activeSession || !userPrompt.trim() || streaming) return

    const providerId = activeSession.providerId
    const providerSettings = settings.providers[providerId]
    const requestMessages: LLMMessage[] = [
      { role: 'system', content: activeSession.systemPrompt },
      ...activeSession.messages,
      { role: 'user', content: userPrompt.trim() }
    ]

    const request: LLMChatRequest = {
      providerId,
      model: activeSession.model || providerSettings.defaultModel,
      messages: requestMessages,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
      stream: true
    }

    const traceSession = new TraceSession()
    const prepareStep = traceSession.startStep('prepare', { request })
    traceSession.endStep(prepareStep)
    const networkStep = traceSession.startStep('network')

    setStreaming(true)
    setStreamText('')
    setResult(null)
    setError(null)
    setTrace(traceSession.toJSON())

    try {
      await callister.llm.stream(request, {
        onChunk: (delta) => {
          setStreamText((current) => current + delta)
        },
        onDone: (chatResult) => {
          traceSession.endStep(networkStep, { metrics: chatResult.metrics })
          const parseStep = traceSession.startStep('parse')
          traceSession.endStep(parseStep, { contentLength: chatResult.content.length })

          const assistantMessage: LLMMessage = { role: 'assistant', content: chatResult.content }
          const userMessage: LLMMessage = { role: 'user', content: userPrompt.trim() }
          const nextSession: LLMSession = {
            ...activeSession,
            title:
              activeSession.title === 'New LLM session'
                ? userPrompt.slice(0, 48)
                : activeSession.title,
            messages: [...activeSession.messages, userMessage, assistantMessage],
            updatedAt: Date.now()
          }

          setResult(chatResult)
          setTrace(traceSession.toJSON())
          setStreaming(false)
          setUserPrompt('')
          void persistSession(nextSession)
        },
        onError: (streamError) => {
          traceSession.endStep(networkStep, { error: streamError.message })
          setError(
            streamError.retryable && !retry
              ? `${streamError.message} — you can retry.`
              : streamError.message
          )
          setTrace(traceSession.toJSON())
          setStreaming(false)
        }
      })
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to start LLM request')
      setStreaming(false)
    }
  }

  const exportFixture = async () => {
    if (!activeSession) return
    await callister.fixture.export({
      version: 1,
      type: 'llm-session',
      exportedAt: Date.now(),
      session: activeSession,
      trace: trace ?? undefined
    })
  }

  const importFixture = async () => {
    const fixture = await callister.fixture.import()
    if (!fixture) return
    setActiveSession(fixture.session)
    setTrace(fixture.trace ?? null)
    await persistSession(fixture.session)
  }

  const deleteActiveSession = async () => {
    if (!activeSession) return
    const next = await callister.sessions.delete(activeSession.id)
    setSessions(next)
    setActiveSession(next[0] ?? createSession('openai', settings.providers.openai.defaultModel))
    setResult(null)
    setTrace(null)
    setStreamText('')
    setError(null)
  }

  if (!activeSession) {
    return <div className="llm-page">Loading LLM playground...</div>
  }

  const displayResult =
    result ??
    (streamText
      ? ({
          requestId: 'streaming',
          content: streamText,
          rawRequest: null,
          rawResponseChunks: [],
          metrics: {
            ttfbMs: 0,
            totalMs: 0,
            tokensPerSecond: 0,
            estimatedInputTokens: 0,
            estimatedOutputTokens: 0
          }
        } satisfies LLMChatResult)
      : null)

  return (
    <div className="llm-page">
      <div className="llm-toolbar">
        <Select
          label="Provider"
          value={activeSession.providerId}
          options={providerOptions}
          onChange={(event) =>
            setActiveSession({
              ...activeSession,
              providerId: event.target.value as ProviderId,
              model: settings.providers[event.target.value as ProviderId].defaultModel
            })
          }
        />
        <Input
          label="Model"
          value={activeSession.model}
          onChange={(event) => setActiveSession({ ...activeSession, model: event.target.value })}
        />
        <Input
          label="Temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(event) => setTemperature(event.target.value)}
        />
        <Input
          label="Max tokens"
          type="number"
          min="1"
          value={maxTokens}
          onChange={(event) => setMaxTokens(event.target.value)}
        />
        <div className="llm-toolbar__actions">
          <Button
            variant="primary"
            disabled={streaming || !userPrompt.trim()}
            onClick={() => void runChat()}
          >
            Run
          </Button>
          <Button disabled={streaming || !error} onClick={() => void runChat(true)}>
            Retry
          </Button>
          <Button disabled={!activeSession} onClick={() => void exportFixture()}>
            Export
          </Button>
          <Button onClick={() => void importFixture()}>Import</Button>
        </div>
      </div>

      <div className="llm-layout">
        <Panel title="Sessions" className="llm-sessions">
          <div className="session-list">
            <Button
              onClick={() => {
                const session = createSession(activeSession.providerId, activeSession.model)
                setActiveSession(session)
                setResult(null)
                setTrace(null)
                setStreamText('')
                setError(null)
              }}
            >
              New session
            </Button>
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={session.id === activeSession.id ? 'session-item active' : 'session-item'}
                onClick={() => {
                  setActiveSession(session)
                  setResult(null)
                  setTrace(null)
                  setStreamText('')
                  setError(null)
                }}
              >
                <strong>{session.title}</strong>
                <span>
                  {session.providerId} · {session.messages.length} messages
                </span>
              </button>
            ))}
          </div>
          <Button variant="danger" onClick={() => void deleteActiveSession()}>
            Delete session
          </Button>
        </Panel>

        <SplitPane
          left={
            <Panel title="Input">
              <div className="llm-inputs">
                <TextArea
                  label="System prompt"
                  value={activeSession.systemPrompt}
                  onChange={(event) =>
                    setActiveSession({ ...activeSession, systemPrompt: event.target.value })
                  }
                />
                <TextArea
                  label="User prompt"
                  value={userPrompt}
                  onChange={(event) => setUserPrompt(event.target.value)}
                  placeholder="Ask something to inspect request, streaming, and trace output..."
                />
              </div>
            </Panel>
          }
          right={
            <Panel title="Conversation">
              <div className="conversation-list">
                {activeSession.messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`conversation-item conversation-item--${message.role}`}
                  >
                    <strong>{message.role}</strong>
                    <p>{message.content}</p>
                  </div>
                ))}
                {streaming ? (
                  <div className="conversation-item conversation-item--assistant">
                    <strong>assistant</strong>
                    <p>{streamText || '...'}</p>
                  </div>
                ) : null}
              </div>
            </Panel>
          }
          bottom={
            <TraceInspector
              result={displayResult}
              trace={trace}
              error={error}
              streaming={streaming}
            />
          }
        />
      </div>
    </div>
  )
}
