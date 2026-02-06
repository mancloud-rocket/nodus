import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDuration } from '@/lib/utils'
import { motion } from 'framer-motion'

interface AudioPlayerProps {
  audioUrl: string
  duration: number
  onTimeUpdate?: (currentTime: number) => void
  className?: string
}

export function AudioPlayer({ audioUrl, duration, onTimeUpdate, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progress = progressRef.current
    if (!audio || !progress) return

    const rect = progress.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    audio.currentTime = percentage * duration
  }

  const progress = (currentTime / duration) * 100

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* Waveform visualization (simplified) */}
        <div 
          ref={progressRef}
          className="relative h-16 mb-4 bg-muted/30 rounded-lg cursor-pointer overflow-hidden group"
          onClick={handleProgressClick}
        >
          {/* Fake waveform bars */}
          <div className="absolute inset-0 flex items-center justify-around px-2">
            {Array.from({ length: 50 }).map((_, i) => {
              const height = 20 + Math.random() * 60
              const isPast = (i / 50) * 100 <= progress
              return (
                <motion.div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    isPast ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.01, duration: 0.3 }}
                />
              )
            })}
          </div>
          
          {/* Progress overlay */}
          <div 
            className="absolute inset-y-0 left-0 bg-primary/10 pointer-events-none"
            style={{ width: `${progress}%` }}
          />

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/50 transition-all"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => skip(-10)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="w-12 h-12"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => skip(10)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time */}
          <div className="font-mono text-sm">
            <span className="text-primary">{formatDuration(Math.floor(currentTime))}</span>
            <span className="text-muted-foreground"> / {formatDuration(duration)}</span>
          </div>

          {/* Volume */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

