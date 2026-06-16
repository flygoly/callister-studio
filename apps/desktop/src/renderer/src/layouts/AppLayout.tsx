import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { StatusBadge } from '@callister/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAppStore } from '../stores/useAppStore'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/asr', label: 'ASR' },
  { to: '/tts', label: 'TTS' },
  { to: '/llm', label: 'LLM' },
  { to: '/agent', label: 'Agent' },
  { to: '/ocr', label: 'OCR' },
  { to: '/cv', label: 'CV' },
  { to: '/nlp', label: 'NLP' },
  { to: '/pipelines', label: 'Pipelines' },
  { to: '/settings', label: 'Settings' }
]

export function AppLayout(): React.ReactElement {
  const loading = useAppStore((state) => state.loading)
  const providerStatus = useAppStore((state) => state.providerStatus)
  const refreshProviderStatus = useAppStore((state) => state.refreshProviderStatus)

  useEffect(() => {
    void refreshProviderStatus()
  }, [refreshProviderStatus])

  const configuredCount = providerStatus.filter((item) => item.configured && item.enabled).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">CS</span>
          <div>
            <strong>Callister</strong>
            <p>Studio</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <h1>AI Workbench</h1>
            <p>Debug, test, visualize, and learn AI pipelines.</p>
          </div>
          <div className="topbar-actions">
            <StatusBadge tone={configuredCount > 0 ? 'success' : 'warning'}>
              {loading ? 'Loading...' : `${configuredCount} providers ready`}
            </StatusBadge>
            <div className="topbar-theme">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
