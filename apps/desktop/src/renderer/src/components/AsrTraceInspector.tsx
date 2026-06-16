import { useState } from 'react'
import type { AsrMetrics, AsrTranscribeResult } from '@callister/core'
import { JsonViewer, Panel, StatusBadge } from '@callister/ui'

type AsrTraceInspectorProps = {
  result: AsrTranscribeResult | null
  trace: Record<string, unknown> | null
  error: string | null
  running: boolean
}

type TraceTab = 'transcript' | 'segments' | 'request' | 'response' | 'metrics' | 'timeline'

export function AsrTraceInspector({ result, trace, error, running }: AsrTraceInspectorProps) {
  const [tab, setTab] = useState<TraceTab>('transcript')

  const tabs: Array<{ id: TraceTab; label: string }> = [
    { id: 'transcript', label: 'Transcript' },
    { id: 'segments', label: 'Segments' },
    { id: 'request', label: 'Raw Request' },
    { id: 'response', label: 'Raw Response' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'timeline', label: 'Timeline' }
  ]

  return (
    <Panel title="Trace Inspector" className="trace-inspector">
      <div className="trace-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'trace-tab active' : 'trace-tab'}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        {running ? <StatusBadge tone="warning">Running</StatusBadge> : null}
        {error ? <StatusBadge tone="danger">Error</StatusBadge> : null}
      </div>

      <div className="trace-content">
        {tab === 'transcript' ? (
          <pre className="trace-output">
            {result?.text || (running ? 'Transcribing...' : 'No transcript yet')}
          </pre>
        ) : null}
        {tab === 'segments' ? <SegmentsView segments={result?.segments ?? []} /> : null}
        {tab === 'request' ? <JsonViewer value={result?.rawRequest ?? null} /> : null}
        {tab === 'response' ? <JsonViewer value={result?.rawResponse ?? null} /> : null}
        {tab === 'metrics' ? (
          <AsrMetricsView metrics={result?.metrics ?? null} error={error} />
        ) : null}
        {tab === 'timeline' ? (
          <JsonViewer value={trace} emptyLabel="Run a transcription to populate the trace timeline" />
        ) : null}
      </div>
    </Panel>
  )
}

function SegmentsView({ segments }: { segments: AsrTranscribeResult['segments'] }) {
  if (segments.length === 0) {
    return <div className="trace-empty">Segments appear when the provider returns timestamps.</div>
  }

  return (
    <div className="asr-segments">
      {segments.map((segment) => (
        <div key={segment.id} className="asr-segment-row">
          <span className="asr-segment-time">
            {formatTime(segment.start)} – {formatTime(segment.end)}
          </span>
          <p>{segment.text}</p>
          {segment.confidence !== undefined ? (
            <span className="asr-segment-confidence">{(segment.confidence * 100).toFixed(0)}%</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function AsrMetricsView({
  metrics,
  error
}: {
  metrics: AsrMetrics | null
  error: string | null
}) {
  if (error) {
    return <div className="trace-error">{error}</div>
  }
  if (!metrics) {
    return <div className="trace-empty">Metrics appear after a completed run.</div>
  }

  return (
    <div className="metrics-grid">
      <MetricCard label="Total" value={`${metrics.totalMs.toFixed(0)} ms`} />
      <MetricCard label="Audio duration" value={`${metrics.audioDurationSec.toFixed(2)} s`} />
      <MetricCard label="Realtime factor" value={`${metrics.realtimeFactor.toFixed(2)}x`} />
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(mins > 0 ? 4 : 1, '0')}`
}
