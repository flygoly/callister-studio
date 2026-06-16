export type TraceStep = {
  id: string
  name: string
  startedAt: number
  endedAt?: number
  payload?: unknown
}

export class TraceSession {
  readonly id: string
  readonly steps: TraceStep[] = []
  readonly startedAt: number

  constructor(id = crypto.randomUUID()) {
    this.id = id
    this.startedAt = Date.now()
  }

  startStep(name: string, payload?: unknown): string {
    const step: TraceStep = {
      id: crypto.randomUUID(),
      name,
      startedAt: Date.now(),
      payload
    }
    this.steps.push(step)
    return step.id
  }

  endStep(stepId: string, payload?: unknown): void {
    const step = this.steps.find((item) => item.id === stepId)
    if (!step) return
    step.endedAt = Date.now()
    if (payload !== undefined) {
      step.payload = payload
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      startedAt: this.startedAt,
      endedAt: Date.now(),
      steps: this.steps
    }
  }

  exportJson(): string {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export { exportTraceJson, downloadTraceFilename } from './export'
