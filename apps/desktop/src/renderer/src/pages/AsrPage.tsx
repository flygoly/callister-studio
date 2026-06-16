import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AsrAudioAsset, AsrBatchItem, AsrProviderId, AsrRun, AsrSdkLanguage, AsrSegment, AsrTranscribeResult } from '@callister/core'
import { buildXfyunSnippet } from '@callister/core'
import { TraceSession } from '@callister/trace'
import {
  AudioPlayer,
  Button,
  CodeBlock,
  Input,
  Panel,
  ProviderCard,
  Select,
  SplitPane,
  StatusBadge,
  TextArea,
  Waveform
} from '@callister/ui'
import { AsrTraceInspector } from '../components/AsrTraceInspector'
import { callister } from '../lib/callister'
import { useAppStore } from '../stores/useAppStore'

function createRun(providerId: AsrProviderId, model: string): AsrRun {
  return {
    id: crypto.randomUUID(),
    title: 'New ASR run',
    providerId,
    model,
    fileName: '',
    createdAt: Date.now()
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read audio blob'))
        return
      }
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio blob'))
    reader.readAsDataURL(blob)
  })
}

function audioSrcFromAsset(asset: AsrAudioAsset | null): string {
  if (!asset?.previewBase64) return ''
  return `data:${asset.mimeType};base64,${asset.previewBase64}`
}

function openExternal(url: string) {
  void callister.system.openExternal?.(url)
}

const PROVIDER_CARDS = [
  {
    id: 'openai' as AsrProviderId,
    title: 'OpenAI',
    description: 'Whisper API',
    icon: '◐',
    docUrl: 'https://platform.openai.com/docs/guides/speech-to-text'
  },
  {
    id: 'local' as AsrProviderId,
    title: 'Local',
    description: 'faster-whisper',
    icon: '⌂',
    docUrl: 'https://github.com/SYSTRAN/faster-whisper'
  },
  {
    id: 'xfyun_short' as AsrProviderId,
    title: 'iFlytek',
    description: 'IAT / LFASR',
    icon: '✦',
    docUrl: 'https://www.xfyun.cn/doc/asr/voicedictation/API.html'
  }
]

export function AsrPage() {
  const settings = useAppStore((state) => state.settings)
  const providerStatus = useAppStore((state) => state.providerStatus)
  const [runs, setRuns] = useState<AsrRun[]>([])
  const [activeRun, setActiveRun] = useState<AsrRun | null>(null)
  const [asset, setAsset] = useState<AsrAudioAsset | null>(null)
  const [audioSrc, setAudioSrc] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AsrTranscribeResult | null>(null)
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localAvailable, setLocalAvailable] = useState(false)
  const [recording, setRecording] = useState(false)
  const [compareRunId, setCompareRunId] = useState<string | null>(null)
  const [batchItems, setBatchItems] = useState<AsrBatchItem[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [xfyunMode, setXfyunMode] = useState<'short' | 'long'>('short')
  const [xfyunAppId, setXfyunAppId] = useState('')
  const [xfyunApiKey, setXfyunApiKey] = useState('')
  const [xfyunApiSecret, setXfyunApiSecret] = useState('')
  const [sdkLanguage, setSdkLanguage] = useState<AsrSdkLanguage>('nodejs')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const asrSettings = settings.asr
  const openaiConfigured = providerStatus.find((item) => item.id === 'openai')?.configured ?? false

  const xfyunProviderId: AsrProviderId = xfyunMode === 'short' ? 'xfyun_short' : 'xfyun_long'

  const sdkLanguageOptions = useMemo(
    () => [
      { value: 'java', label: 'Java' },
      { value: 'python', label: 'Python' },
      { value: 'nodejs', label: 'Node.js' },
      { value: 'go', label: 'Go' },
      { value: 'curl', label: 'cURL' }
    ],
    []
  )

  const xfyunModeOptions = useMemo(
    () => [
      { value: 'short', label: 'Short (WebSocket IAT ≤60s)' },
      { value: 'long', label: 'Long (REST LFASR ≤5h)' }
    ],
    []
  )

  const isXfyun = activeRun?.providerId === 'xfyun_short' || activeRun?.providerId === 'xfyun_long'

  const xfyunSnippet = useMemo(() => {
    if (!isXfyun || !xfyunAppId || !xfyunApiSecret) return ''
    return buildXfyunSnippet(sdkLanguage, {
      mode: xfyunMode,
      appId: xfyunAppId,
      apiKey: xfyunApiKey,
      apiSecret: xfyunApiSecret,
      language: asrSettings.providers[xfyunProviderId].language,
      fileName: asset?.fileName ?? 'audio.wav',
      hostUrl: asrSettings.providers['xfyun_short']?.baseUrl,
      apiBase: asrSettings.providers['xfyun_long']?.baseUrl
    })
  }, [isXfyun, xfyunAppId, xfyunApiKey, xfyunApiSecret, xfyunMode, sdkLanguage, asset, asrSettings.providers, xfyunProviderId])

  const providerCardState = useMemo(() => {
    return PROVIDER_CARDS.map((card) => {
      if (card.id === 'openai') {
        return { ...card, tone: openaiConfigured ? ('success' as const) : ('warning' as const), statusText: openaiConfigured ? 'Ready' : 'Needs key' }
      }
      if (card.id === 'local') {
        return { ...card, tone: localAvailable ? ('success' as const) : ('warning' as const), statusText: localAvailable ? 'Ready' : 'Not in PATH' }
      }
      return { ...card, tone: 'neutral' as const, statusText: 'iFlytek' }
    })
  }, [openaiConfigured, localAvailable])

  const compareRun = runs.find((run) => run.id === compareRunId) ?? null

  const loadRuns = useCallback(async () => {
    const items = await callister.asr.runs.list()
    setRuns(items)
    if (!activeRun && items[0]) {
      setActiveRun(items[0])
      if (items[0].result) setResult(items[0].result)
    }
  }, [activeRun])

  useEffect(() => {
    void loadRuns()
    void callister.asr.probeLocal().then(setLocalAvailable)
  }, [loadRuns])

  useEffect(() => {
    if (!activeRun) {
      const providerId = asrSettings.defaultProvider
      setActiveRun(createRun(providerId, asrSettings.providers[providerId].model))
      return
    }
    if (activeRun.providerId === 'xfyun_short' && xfyunMode !== 'short') {
      setXfyunMode('short')
    } else if (activeRun.providerId === 'xfyun_long' && xfyunMode !== 'long') {
      setXfyunMode('long')
    }
  }, [activeRun, asrSettings, xfyunMode])

  const selectProvider = (providerId: AsrProviderId) => {
    if (!activeRun) return
    if (providerId === activeRun.providerId) return
    const model = asrSettings.providers[providerId].model
    setActiveRun({ ...activeRun, providerId, model })
    setResult(null)
    setTrace(null)
    setError(null)
  }

  const loadAsset = async (filePath: string) => {
    const nextAsset = await callister.asr.loadAsset(filePath)
    setAsset(nextAsset)
    setAudioSrc(audioSrcFromAsset(nextAsset))
    setCurrentTime(0)
    setActiveSegmentId(null)
    if (activeRun) {
      setActiveRun({ ...activeRun, fileName: nextAsset.fileName })
    }
  }

  const ingestFile = async (file: File) => {
    const base64 = await blobToBase64(file)
    const filePath = await callister.asr.saveTemp(base64, file.name)
    await loadAsset(filePath)
  }

  const pickAudio = async () => {
    const filePath = await callister.asr.pickAudio()
    if (!filePath) return
    await loadAsset(filePath)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      await ingestFile(new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' }))
      setRecording(false)
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const persistRun = async (run: AsrRun) => {
    const next = await callister.asr.runs.save(run)
    setRuns(next)
    setActiveRun(run)
  }

  const currentProviderId = activeRun?.providerId ?? asrSettings.defaultProvider

  const runTranscribe = async () => {
    if (!activeRun || !asset || running) return

    const providerSettings = asrSettings.providers[activeRun.providerId]
    if (!providerSettings.enabled) {
      setError(`${activeRun.providerId} ASR provider is disabled in Settings`)
      return
    }

    const request = {
      providerId: activeRun.providerId,
      model: activeRun.model || providerSettings.model,
      language: providerSettings.language,
      filePath: asset.filePath,
      fileName: asset.fileName,
      auth: isXfyun
        ? {
            appId: xfyunAppId,
            apiKey: xfyunApiKey || xfyunAppId,
            apiSecret: xfyunApiSecret
          }
        : undefined
    }

    const traceSession = new TraceSession()
    const prepareStep = traceSession.startStep('prepare', { request })
    traceSession.endStep(prepareStep)
    const networkStep = traceSession.startStep('transcribe')

    setRunning(true)
    setResult(null)
    setError(null)
    setTrace(traceSession.toJSON())

    try {
      const transcribeResult = await callister.asr.transcribe(request)
      traceSession.endStep(networkStep, { metrics: transcribeResult.metrics })
      const parseStep = traceSession.startStep('parse', {
        segmentCount: transcribeResult.segments.length
      })
      traceSession.endStep(parseStep)

      const nextRun: AsrRun = {
        ...activeRun,
        title:
          activeRun.title === 'New ASR run'
            ? asset.fileName.slice(0, 48)
            : activeRun.title,
        fileName: asset.fileName,
        result: transcribeResult,
        createdAt: Date.now()
      }

      setResult(transcribeResult)
      setTrace(traceSession.toJSON())
      void persistRun(nextRun)
    } catch (runError) {
      traceSession.endStep(networkStep, {
        error: runError instanceof Error ? runError.message : 'Transcription failed'
      })
      setError(runError instanceof Error ? runError.message : 'Transcription failed')
      setTrace(traceSession.toJSON())
    } finally {
      setRunning(false)
    }
  }

  const runBatch = async () => {
    if (!activeRun || batchRunning) return
    const filePaths: string[] = []
    const picked = await callister.asr.pickAudio()
    if (picked) filePaths.push(picked)

    if (filePaths.length === 0) return

    const providerSettings = asrSettings.providers[activeRun.providerId]
    setBatchRunning(true)
    setBatchItems([])

    try {
      const items = await callister.asr.batch(
        {
          providerId: activeRun.providerId,
          model: activeRun.model || providerSettings.model,
          language: providerSettings.language
        },
        filePaths
      )
      setBatchItems(items)
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Batch transcription failed')
    } finally {
      setBatchRunning(false)
    }
  }

  const exportFixture = async () => {
    if (!activeRun) return
    await callister.asr.fixture.export({
      version: 1,
      type: 'asr-run',
      exportedAt: Date.now(),
      run: { ...activeRun, result: result ?? activeRun.result },
      trace: trace ?? undefined
    })
  }

  const importFixture = async () => {
    const fixture = await callister.asr.fixture.import()
    if (!fixture) return
    setActiveRun(fixture.run)
    setResult(fixture.run.result ?? null)
    setTrace(fixture.trace ?? null)
    await persistRun(fixture.run)
  }

  const deleteActiveRun = async () => {
    if (!activeRun) return
    const next = await callister.asr.runs.delete(activeRun.id)
    setRuns(next)
    const fallbackProvider = asrSettings.defaultProvider
    setActiveRun(
      next[0] ?? createRun(fallbackProvider, asrSettings.providers[fallbackProvider].model)
    )
    setResult(null)
    setTrace(null)
    setAsset(null)
    setAudioSrc('')
    setError(null)
  }

  const handleSegmentClick = (segment: AsrSegment) => {
    setActiveSegmentId(segment.id)
    setCurrentTime(segment.start)
  }

  const currentDocUrl = providerCardState.find((card) => card.id === currentProviderId)?.docUrl ?? ''

  if (!activeRun) {
    return <div className="asr-page">Loading ASR workbench...</div>
  }

  const segments = result?.segments ?? activeRun.result?.segments ?? []

  return (
    <div className="asr-page">
      <div className="asr-provider-cards">
        <span className="asr-provider-cards__label">Provider</span>
        <div className="cs-provider-card-grid">
          {providerCardState.map((card) => (
            <ProviderCard
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon}
              active={currentProviderId === card.id}
              tone={card.tone}
              statusText={card.statusText}
              onClick={() => selectProvider(card.id)}
            />
          ))}
        </div>
      </div>

      {isXfyun ? (
        <Panel
          title="iFlytek Credentials & Debug"
          actions={
            currentDocUrl ? (
              <button
                type="button"
                className="asr-doc-link"
                onClick={() => openExternal(currentDocUrl)}
              >
                📖 API Reference →
              </button>
            ) : null
          }
        >
          <div className="asr-xfyun-form">
            <Select
              label="Mode"
              value={xfyunMode}
              options={xfyunModeOptions}
              onChange={(event) => {
                const mode = event.target.value as 'short' | 'long'
                setXfyunMode(mode)
                const newPid = mode === 'short' ? 'xfyun_short' : 'xfyun_long'
                if (activeRun.providerId !== newPid) {
                  setActiveRun({
                    ...activeRun,
                    providerId: newPid,
                    model: asrSettings.providers[newPid].model
                  })
                }
              }}
            />
            <Input
              label="App ID / API Key"
              type="password"
              placeholder="iFlytek API Key"
              value={xfyunAppId}
              onChange={(event) => setXfyunAppId(event.target.value)}
            />
            <Input
              label="API Key (IAT)"
              type="password"
              placeholder="For IAT, if different from App ID"
              value={xfyunApiKey}
              onChange={(event) => setXfyunApiKey(event.target.value)}
            />
            <Input
              label="API Secret"
              type="password"
              placeholder="iFlytek API Secret"
              value={xfyunApiSecret}
              onChange={(event) => setXfyunApiSecret(event.target.value)}
            />
            <Select
              label="SDK language"
              value={sdkLanguage}
              options={sdkLanguageOptions}
              onChange={(event) => setSdkLanguage(event.target.value as AsrSdkLanguage)}
            />
          </div>
          {xfyunSnippet ? (
            <CodeBlock code={xfyunSnippet} language={sdkLanguage === 'curl' ? 'bash' : sdkLanguage} />
          ) : (
            <p className="settings-hint">
              Enter your App ID, API Key, and API Secret above to generate an SDK snippet
              showing the full call flow ({xfyunMode === 'short' ? 'WebSocket IAT' : 'REST LFASR'}). 
              Then load an audio file and click Transcribe to see the result JSON.
            </p>
          )}
          <div className="asr-xfyun-hint">
            <StatusBadge tone="warning">
              IAT: 16kHz PCM mono · LFASR: wav/flac/mp3/m4a · Max IAT 60s / LFASR 5h
            </StatusBadge>
          </div>
        </Panel>
      ) : currentProviderId === 'openai' ? (
        <Panel
          title="OpenAI Whisper"
          actions={
            currentDocUrl ? (
              <button
                type="button"
                className="asr-doc-link"
                onClick={() => openExternal(currentDocUrl)}
              >
                📖 API Reference →
              </button>
            ) : null
          }
        >
          <div className="asr-provider-config">
            <Input
              label="Model"
              value={activeRun.model}
              onChange={(event) => setActiveRun({ ...activeRun, model: event.target.value })}
            />
            <Input
              label="Language"
              value={asrSettings.providers.openai.language}
              placeholder="auto"
              onChange={(event) =>
                useAppStore.getState().updateSettings({
                  ...settings,
                  asr: {
                    ...asrSettings,
                    providers: {
                      ...asrSettings.providers,
                      openai: { ...asrSettings.providers.openai, language: event.target.value }
                    }
                  }
                })
              }
            />
          </div>
          {!openaiConfigured ? (
            <p className="settings-hint">OpenAI API key not configured. Add it in Settings.</p>
          ) : null}
        </Panel>
      ) : (
        <Panel
          title="faster-whisper (local)"
          actions={
            currentDocUrl ? (
              <button
                type="button"
                className="asr-doc-link"
                onClick={() => openExternal(currentDocUrl)}
              >
                📖 GitHub →
              </button>
            ) : null
          }
        >
          <div className="asr-provider-config">
            <Input
              label="Model"
              value={activeRun.model}
              onChange={(event) => setActiveRun({ ...activeRun, model: event.target.value })}
            />
            <Input
              label="Language"
              value={asrSettings.providers.local.language}
              placeholder="auto"
              onChange={(event) =>
                useAppStore.getState().updateSettings({
                  ...settings,
                  asr: {
                    ...asrSettings,
                    providers: {
                      ...asrSettings.providers,
                      local: { ...asrSettings.providers.local, language: event.target.value }
                    }
                  }
                })
              }
            />
          </div>
          {!localAvailable ? (
            <p className="settings-hint">
              faster-whisper CLI not found in PATH. Install it and restart the app.
            </p>
          ) : null}
        </Panel>
      )}

      <div className="asr-layout">
        <Panel title="Runs" className="asr-runs">
          <div className="session-list">
            <Button
              onClick={() => {
                const run = createRun(activeRun.providerId, activeRun.model)
                setActiveRun(run)
                setResult(null)
                setTrace(null)
                setAsset(null)
                setAudioSrc('')
                setError(null)
              }}
            >
              New run
            </Button>
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                className={run.id === activeRun.id ? 'session-item active' : 'session-item'}
                onClick={() => {
                  setActiveRun(run)
                  setResult(run.result ?? null)
                  setTrace(null)
                  setError(null)
                }}
              >
                <strong>{run.title}</strong>
                <span>
                  {run.providerId} · {run.fileName || 'no audio'}
                </span>
              </button>
            ))}
          </div>
          <div className="asr-compare-picker">
            <Select
              label="Compare with"
              value={compareRunId ?? ''}
              options={[
                { value: '', label: 'None' },
                ...runs
                  .filter((run) => run.id !== activeRun.id && run.result?.text)
                  .map((run) => ({ value: run.id, label: run.title }))
              ]}
              onChange={(event) => setCompareRunId(event.target.value || null)}
            />
          </div>
          <Button variant="danger" onClick={() => void deleteActiveRun()}>
            Delete run
          </Button>
        </Panel>

        <SplitPane
          left={
            <Panel title="Audio Input">
              <div
                className={dragOver ? 'asr-dropzone asr-dropzone--active' : 'asr-dropzone'}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  const file = event.dataTransfer.files[0]
                  if (file) void ingestFile(file)
                }}
              >
                <p>Drop an audio file here, or use the controls below.</p>
                <div className="asr-input-actions">
                  <Button onClick={() => void pickAudio()}>Open file</Button>
                  <Button
                    variant={recording ? 'danger' : 'ghost'}
                    onClick={() => void (recording ? stopRecording() : startRecording())}
                  >
                    {recording ? 'Stop recording' : 'Record mic'}
                  </Button>
                </div>
                {asset ? (
                  <div className="asr-asset-meta">
                    <StatusBadge tone="success">{asset.fileName}</StatusBadge>
                    {duration > 0 ? (
                      <span className="asr-duration">{duration.toFixed(1)}s</span>
                    ) : null}
                  </div>
                ) : (
                  <StatusBadge tone="neutral">No audio loaded</StatusBadge>
                )}
              </div>

              {audioSrc ? (
                <>
                  <Waveform
                    src={audioSrc}
                    segments={segments}
                    activeSegmentId={activeSegmentId}
                    currentTime={currentTime}
                    onSeek={setCurrentTime}
                    onSegmentClick={handleSegmentClick}
                  />
                  <AudioPlayer
                    src={audioSrc}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    onDuration={setDuration}
                  />
                </>
              ) : null}

              {compareRun?.result ? (
                <div className="asr-compare">
                  <h4>Compare</h4>
                  <div className="asr-compare-grid">
                    <div>
                      <strong>Current</strong>
                      <TextArea value={result?.text ?? ''} readOnly />
                    </div>
                    <div>
                      <strong>{compareRun.title}</strong>
                      <TextArea value={compareRun.result.text} readOnly />
                    </div>
                  </div>
                </div>
              ) : null}
            </Panel>
          }
          right={
            <Panel title="Transcript">
              <TextArea
                label="Editable transcript"
                value={result?.text ?? activeRun.result?.text ?? ''}
                onChange={(event) => {
                  if (!result) return
                  setResult({ ...result, text: event.target.value })
                }}
                placeholder="Transcription output appears here..."
              />
              {result?.detectedLanguage ? (
                <p className="asr-detected-language">
                  Detected language: <strong>{result.detectedLanguage}</strong>
                </p>
              ) : null}

              <div className="asr-batch">
                <div className="asr-batch-header">
                  <h4>Batch</h4>
                  <Button disabled={batchRunning} onClick={() => void runBatch()}>
                    {batchRunning ? 'Running...' : 'Transcribe file'}
                  </Button>
                </div>
                {batchItems.length > 0 ? (
                  <div className="asr-batch-list">
                    {batchItems.map((item) => (
                      <div key={item.filePath} className="asr-batch-item">
                        <div className="asr-batch-item__head">
                          <strong>{item.fileName}</strong>
                          <StatusBadge
                            tone={
                              item.status === 'success'
                                ? 'success'
                                : item.status === 'error'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {item.status}
                          </StatusBadge>
                        </div>
                        {item.text ? <p>{item.text}</p> : null}
                        {item.error ? <p className="trace-error">{item.error}</p> : null}
                        {item.processingMs !== undefined ? (
                          <span className="asr-batch-meta">{item.processingMs} ms</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="settings-hint">Queue single-file batch runs for quick smoke tests.</p>
                )}
              </div>
            </Panel>
          }
          bottom={
            <AsrTraceInspector
              result={result ?? activeRun.result ?? null}
              trace={trace}
              error={error}
              running={running}
            />
          }
        />
      </div>

      <div className="asr-toolbar__actions">
        <Button variant="primary" disabled={running || !asset} onClick={() => void runTranscribe()}>
          Transcribe
        </Button>
        <Button disabled={!activeRun} onClick={() => void exportFixture()}>
          Export
        </Button>
        <Button onClick={() => void importFixture()}>Import</Button>
      </div>
    </div>
  )
}
