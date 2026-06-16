export function exportTraceJson(trace: Record<string, unknown>): string {
  return JSON.stringify(trace, null, 2)
}

export function downloadTraceFilename(sessionId: string): string {
  return `callister-trace-${sessionId}.json`
}
