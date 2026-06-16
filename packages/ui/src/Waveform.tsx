import { useEffect, useRef, useState } from 'react'

type WaveformSegment = {
  id: number
  start: number
  end: number
  text: string
  confidence?: number
}

type WaveformProps = {
  src: string
  segments?: WaveformSegment[]
  activeSegmentId?: number | null
  currentTime?: number
  onSeek?: (time: number) => void
  onSegmentClick?: (segment: WaveformSegment) => void
}

function downsamplePeaks(channelData: Float32Array, width: number): number[] {
  const blockSize = Math.max(1, Math.floor(channelData.length / width))
  const peaks: number[] = []

  for (let i = 0; i < width; i++) {
    const start = i * blockSize
    let peak = 0
    for (let j = 0; j < blockSize && start + j < channelData.length; j++) {
      peak = Math.max(peak, Math.abs(channelData[start + j] ?? 0))
    }
    peaks.push(peak)
  }

  return peaks
}

export function Waveform({
  src,
  segments = [],
  activeSegmentId,
  currentTime = 0,
  onSeek,
  onSegmentClick
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function decode() {
      if (!src) {
        setPeaks([])
        setDuration(0)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(src)
        const arrayBuffer = await response.arrayBuffer()
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
        await audioContext.close()

        if (cancelled) return

        const width = Math.max(200, containerRef.current?.clientWidth ?? 600)
        const channelData = audioBuffer.getChannelData(0)
        setPeaks(downsamplePeaks(channelData, width))
        setDuration(audioBuffer.duration)
      } catch {
        if (!cancelled) {
          setPeaks([])
          setDuration(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void decode()
    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.clientWidth
    const height = 96
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const styles = getComputedStyle(document.documentElement)
    const accent = styles.getPropertyValue('--cs-accent').trim() || '#4f8cff'
    const surface = styles.getPropertyValue('--cs-surface-2').trim() || '#1b2130'
    const border = styles.getPropertyValue('--cs-border').trim() || '#232833'

    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    if (duration > 0 && segments.length > 0) {
      for (const segment of segments) {
        const x = (segment.start / duration) * width
        const w = Math.max(2, ((segment.end - segment.start) / duration) * width)
        const isActive = segment.id === activeSegmentId
        ctx.fillStyle = isActive ? `${accent}55` : `${accent}22`
        ctx.fillRect(x, 0, w, height)
      }
    }

    if (peaks.length > 0) {
      const mid = height / 2
      ctx.strokeStyle = accent
      ctx.lineWidth = 1
      ctx.beginPath()
      peaks.forEach((peak, index) => {
        const x = (index / peaks.length) * width
        const y = peak * (height * 0.42)
        if (index === 0) ctx.moveTo(x, mid - y)
        else ctx.lineTo(x, mid - y)
      })
      peaks.forEach((peak, index) => {
        const x = (index / peaks.length) * width
        const y = peak * (height * 0.42)
        ctx.lineTo(x, mid + y)
      })
      ctx.closePath()
      ctx.fillStyle = `${accent}88`
      ctx.fill()
    }

    if (duration > 0 && currentTime > 0) {
      const playheadX = (currentTime / duration) * width
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
    }

    ctx.strokeStyle = border
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
  }, [peaks, segments, activeSegmentId, currentTime, duration])

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return

    const rect = canvas.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(duration, ratio * duration))
    onSeek?.(time)

    const segment = segments.find((item) => time >= item.start && time <= item.end)
    if (segment) onSegmentClick?.(segment)
  }

  return (
    <div ref={containerRef} className="cs-waveform">
      <canvas ref={canvasRef} onClick={handleClick} role="img" aria-label="Audio waveform" />
      {loading ? <span className="cs-waveform__hint">Decoding waveform...</span> : null}
    </div>
  )
}
