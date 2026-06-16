import Store from 'electron-store'
import type { AsrRun } from '@callister/core'

const store = new Store<{ asrRuns: AsrRun[] }>({
  name: 'callister-asr-runs',
  defaults: { asrRuns: [] }
})

export function listAsrRuns(): AsrRun[] {
  return store.get('asrRuns').sort((a, b) => b.createdAt - a.createdAt)
}

export function saveAsrRun(run: AsrRun): AsrRun[] {
  const runs = listAsrRuns().filter((item) => item.id !== run.id)
  runs.unshift(run)
  store.set('asrRuns', runs.slice(0, 50))
  return store.get('asrRuns')
}

export function deleteAsrRun(runId: string): AsrRun[] {
  const runs = listAsrRuns().filter((item) => item.id !== runId)
  store.set('asrRuns', runs)
  return runs
}
