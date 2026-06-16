import { CodeBlock } from './CodeBlock'

type JsonViewerProps = {
  value: unknown
  emptyLabel?: string
}

export function JsonViewer({ value, emptyLabel = 'No data' }: JsonViewerProps) {
  if (value === undefined || value === null) {
    return <div className="cs-json-viewer cs-json-viewer--empty">{emptyLabel}</div>
  }

  const code = JSON.stringify(value, null, 2)
  return (
    <div className="cs-json-viewer">
      <CodeBlock code={code} language="json" />
    </div>
  )
}
