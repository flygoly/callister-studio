import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@callister/ui'
import { useAppStore } from '../stores/useAppStore'

const modules = [
  {
    path: '/llm',
    title: 'LLM',
    description: 'Chat, streaming, and raw request/response inspection.',
    ready: true
  },
  {
    path: '/asr',
    title: 'ASR',
    description: 'Speech-to-text with waveform and timestamp overlays.',
    ready: true
  },
  {
    path: '/tts',
    title: 'TTS',
    description: 'Text-to-speech synthesis and latency metrics.',
    ready: false
  },
  {
    path: '/agent',
    title: 'Agent',
    description: 'Multi-step agent loops with tool-call tracing.',
    ready: false
  },
  {
    path: '/ocr',
    title: 'OCR',
    description: 'Extract text and visualize bounding boxes.',
    ready: false
  },
  {
    path: '/cv',
    title: 'CV',
    description: 'Classification and detection result overlays.',
    ready: false
  },
  {
    path: '/nlp',
    title: 'NLP',
    description: 'Tokenization, embeddings, and similarity tools.',
    ready: false
  },
  {
    path: '/pipelines',
    title: 'Pipelines',
    description: 'Chain modules into end-to-end workflows.',
    ready: false
  }
]

export function HomePage(): React.ReactElement {
  const providerStatus = useAppStore((state) => state.providerStatus)
  const refreshProviderStatus = useAppStore((state) => state.refreshProviderStatus)

  useEffect(() => {
    void refreshProviderStatus()
  }, [refreshProviderStatus])

  return (
    <div className="home-page">
      <section className="hero-card">
        <h2>Welcome to Callister Studio</h2>
        <p>
          A desktop workbench for debugging, testing, and learning how AI services behave — from
          input through intermediate steps to final output.
        </p>
      </section>

      <section className="provider-strip">
        {providerStatus.map((provider) => (
          <div key={provider.id} className="provider-chip">
            <strong>{provider.label}</strong>
            <StatusBadge tone={provider.configured && provider.enabled ? 'success' : 'warning'}>
              {provider.configured ? 'Configured' : 'Needs setup'}
            </StatusBadge>
          </div>
        ))}
      </section>

      <section className="module-grid">
        {modules.map((module) => (
          <Link key={module.path} to={module.path} className="module-card">
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <StatusBadge tone={module.ready ? 'success' : 'neutral'}>
              {module.ready ? 'Available' : 'Planned'}
            </StatusBadge>
          </Link>
        ))}
      </section>
    </div>
  )
}
