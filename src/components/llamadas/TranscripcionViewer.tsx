import { User, Headphones, Smile, Meh, Frown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatDuration } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Segmento, Emocion } from '@/types'

interface TranscripcionViewerProps {
  segmentos: Segmento[]
  onTimestampClick?: (timestamp: number) => void
  currentTime?: number
}

const emocionIcons: Record<Emocion, { icon: typeof Smile, color: string }> = {
  positivo: { icon: Smile, color: 'text-success' },
  neutral: { icon: Meh, color: 'text-muted-foreground' },
  negativo: { icon: Frown, color: 'text-destructive' },
}

export function TranscripcionViewer({ 
  segmentos, 
  onTimestampClick,
  currentTime = 0 
}: TranscripcionViewerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Transcripción</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {segmentos.map((segmento, index) => {
              const isAgente = segmento.speaker === 'agente'
              const emocionConfig = emocionIcons[segmento.emocion]
              const EmocionIcon = emocionConfig.icon
              const isActive = currentTime >= segmento.timestamp_inicio && 
                              (segmento.timestamp_fin === undefined || currentTime < segmento.timestamp_fin)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex gap-3 p-3 rounded-lg transition-all cursor-pointer",
                    "hover:bg-muted/50",
                    isActive && "bg-primary/10 border border-primary/30",
                    isAgente ? "pr-8" : "pl-8"
                  )}
                  onClick={() => onTimestampClick?.(segmento.timestamp_inicio)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isAgente ? "bg-primary/20" : "bg-secondary/20"
                  )}>
                    {isAgente ? (
                      <Headphones className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-secondary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        isAgente ? "text-primary" : "text-secondary"
                      )}>
                        {segmento.speaker}
                      </span>
                      <button
                        className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTimestampClick?.(segmento.timestamp_inicio)
                        }}
                      >
                        {formatDuration(Math.floor(segmento.timestamp_inicio))}
                      </button>
                      <EmocionIcon className={cn("w-3.5 h-3.5", emocionConfig.color)} />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {segmento.texto}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

