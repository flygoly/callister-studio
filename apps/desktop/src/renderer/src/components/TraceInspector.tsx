import { useState } from 'react'
import type { LLMChatMetrics, LLMChatResult } from '@callister/core'
import { JsonViewer, Panel, StatusBadge } from '@callister/ui'

type TraceInspectorProps = {
  result: LLMChatResult | null
  trace: Record<string, unknown> | null
  error: string | null
  streaming: boolean
}

type TraceTab = 'output' | 'request' | 'response' | 'metrics' | 'timeline'

export function TraceInspector({ result, trace, error, streaming }: TraceInspectorProps) {
  const [tab, setTab] = useState<TraceTab>('output')

  const tabs: Array<{ id: TraceTab; label: string }> = [
    { id: 'output', label: 'Output' },
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
        {streaming ? <StatusBadge tone="warning">Streaming</StatusBadge> : null}
        {error ? <StatusBadge tone="danger">Error</StatusBadge> : null}
      </div>

      <div className="trace-content">
        {tab === 'output' ? (
          <pre className="trace-output">
            {result?.content || (streaming ? 'Waiting for tokens...' : 'No output yet')}
          </pre>
        ) : null}
        {tab === 'request' ? <JsonViewer value={result?.rawRequest ?? null} /> : null}
        {tab === 'response' ? <JsonViewer value={result?.rawResponseChunks ?? null} /> : null}
        {tab === 'metrics' ? <MetricsView metrics={result?.metrics ?? null} error={error} /> : null}
        {tab === 'timeline' ? (
          <JsonViewer value={trace} emptyLabel="Run a request to populate the trace timeline" />
        ) : null}
      </div>
    </Panel>
  )
}

function MetricsView({ metrics, error }: { metrics: LLMChatMetrics | null; error: string | null }) {
  if (error) {
    return <div className="trace-error">{error}</div>
  }
  if (!metrics) {
    return <div className="trace-empty">Metrics appear after a completed run.</div>
  }

  return (
    <div className="metrics-grid">
      <MetricCard label="TTFB" value={`${metrics.ttfbMs.toFixed(0)} ms`} />
      <MetricCard label="Total" value={`${metrics.totalMs.toFixed(0)} ms`} />
      <MetricCard label="Tokens / sec" value={metrics.tokensPerSecond.toFixed(1)} />
      <MetricCard label="Input tokens (est.)" value={String(metrics.estimatedInputTokens)} />
      <MetricCard label="Output tokens (est.)" value={String(metrics.estimatedOutputTokens)} />
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
