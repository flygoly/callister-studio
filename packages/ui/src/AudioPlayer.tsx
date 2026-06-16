import { useEffect, useRef } from 'react'

type AudioPlayerProps = {
  src: string
  currentTime?: number
  onTimeUpdate?: (time: number) => void
  onDuration?: (duration: number) => void
}

export function AudioPlayer({ src, currentTime, onTimeUpdate, onDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || currentTime === undefined) return
    if (Math.abs(audio.currentTime - currentTime) > 0.15) {
      audio.currentTime = currentTime
    }
  }, [currentTime])

  return (
    <audio
      ref={audioRef}
      className="cs-audio-player"
      controls
      src={src}
      onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
      onLoadedMetadata={(event) => onDuration?.(event.currentTarget.duration)}
    />
  )
}
