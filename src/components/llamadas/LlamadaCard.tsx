import { Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn, formatDuration, formatRelativeTime } from '@/lib/utils'
import type { Llamada, AnalisisLlamada } from '@/types'
import { Link } from 'react-router-dom'

interface LlamadaCardProps {
  llamada: Llamada
  analisis?: AnalisisLlamada
  index?: number
}

export function LlamadaCard({ llamada, analisis }: LlamadaCardProps) {
  const score = analisis?.score_total
  const probabilidad = analisis?.prediccion_cumplimiento.probabilidad
  const alertas = analisis?.alertas || []
  const tieneAlertaCritica = alertas.some(a => a.tipo === 'critica')

  return (
    <Link to={`/llamadas/${llamada.llamada_id}`}>
      <Card className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        tieneAlertaCritica && "border-destructive/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {llamada.agente_nombre?.split(' ').map(n => n[0]).join('') || 'AG'}
                </AvatarFallback>
              </Avatar>
              {tieneAlertaCritica && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm">{llamada.agente_nombre || 'Agente'}</span>
                <span className="text-muted-foreground text-sm">→</span>
                <span className="text-sm text-muted-foreground truncate">
                  {llamada.cliente_id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(llamada.duracion_segundos)}
                </span>
                <span>{formatRelativeTime(new Date(llamada.timestamp_inicio))}</span>
              </div>
            </div>

            {analisis ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className={cn(
                    "text-lg font-semibold",
                    score && score >= 70 ? "text-success" : 
                    score && score >= 40 ? "text-warning" : "text-destructive"
                  )}>
                    {score}
                  </p>
                </div>

                <div className="w-20">
                  <p className="text-xs text-muted-foreground mb-1">Prob.</p>
                  <Progress 
                    value={probabilidad} 
                    variant={
                      probabilidad && probabilidad >= 60 ? 'success' : 
                      probabilidad && probabilidad >= 35 ? 'warning' : 'destructive'
                    }
                    className="h-1.5"
                  />
                  <p className="text-xs text-right mt-0.5">{probabilidad}%</p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary">
                {llamada.estado === 'transcrito' ? 'Procesando' : 'Pendiente'}
              </Badge>
            )}

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
