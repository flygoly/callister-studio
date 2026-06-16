import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { LlmPage } from './pages/LlmPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { useAppStore } from './stores/useAppStore'

export function App(): React.ReactElement {
  const initialize = useAppStore((state) => state.initialize)

  useEffect(() => {
    void initialize()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const theme = useAppStore.getState().settings.theme
      if (theme === 'system') {
        void useAppStore.getState().setTheme('system')
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="asr" element={<PlaceholderPage module="ASR" />} />
          <Route path="tts" element={<PlaceholderPage module="TTS" />} />
          <Route path="llm" element={<LlmPage />} />
          <Route path="agent" element={<PlaceholderPage module="Agent" />} />
          <Route path="ocr" element={<PlaceholderPage module="OCR" />} />
          <Route path="cv" element={<PlaceholderPage module="CV" />} />
          <Route path="nlp" element={<PlaceholderPage module="NLP" />} />
          <Route path="pipelines" element={<PlaceholderPage module="Pipelines" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
