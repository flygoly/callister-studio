import { create } from 'zustand'
import type { AppSettings, ProviderStatus, ThemeMode } from '@callister/core'
import { DEFAULT_SETTINGS } from '@callister/core'
import { callister } from '../lib/callister'

type AppState = {
  settings: AppSettings
  providerStatus: ProviderStatus[]
  resolvedTheme: 'light' | 'dark'
  loading: boolean
  initialize: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  updateSettings: (settings: AppSettings) => Promise<void>
  refreshProviderStatus: () => Promise<void>
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(resolved: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = resolved
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  providerStatus: [],
  resolvedTheme: 'dark',
  loading: true,
  initialize: async () => {
    const settings = await callister.settings.get()
    const providerStatus = await callister.settings.getProviderStatus()
    const resolvedTheme = resolveTheme(settings.theme)
    applyTheme(resolvedTheme)
    set({ settings, providerStatus, resolvedTheme, loading: false })
  },
  setTheme: async (theme) => {
    const settings = { ...get().settings, theme }
    const saved = await callister.settings.set(settings)
    const resolvedTheme = resolveTheme(saved.theme)
    applyTheme(resolvedTheme)
    set({ settings: saved, resolvedTheme })
  },
  updateSettings: async (settings) => {
    const saved = await callister.settings.set(settings)
    const providerStatus = await callister.settings.getProviderStatus()
    const resolvedTheme = resolveTheme(saved.theme)
    applyTheme(resolvedTheme)
    set({ settings: saved, providerStatus, resolvedTheme })
  },
  refreshProviderStatus: async () => {
    const providerStatus = await callister.settings.getProviderStatus()
    set({ providerStatus })
  }
}))
