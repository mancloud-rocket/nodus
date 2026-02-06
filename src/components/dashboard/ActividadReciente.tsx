import { Clock, MoreHorizontal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import type { Llamada, AnalisisLlamada } from '@/types'

interface LlamadaConAnalisis extends Llamada {
  analisis?: AnalisisLlamada
}

interface ActividadRecienteProps {
  llamadas: LlamadaConAnalisis[]
}

export function ActividadReciente({ llamadas }: ActividadRecienteProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {llamadas.slice(0, 5).map((llamada) => {
            const score = llamada.analisis?.score_total

            return (
              <div
                key={llamada.llamada_id}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback className="text-xs bg-secondary">
                    {llamada.agente_nombre?.split(' ').map(n => n[0]).join('') || 'AG'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {llamada.agente_nombre || 'Agente'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      → {llamada.cliente_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(llamada.duracion_segundos)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(new Date(llamada.timestamp_inicio))}</span>
                  </div>
                </div>

                {llamada.estado === 'analizado' && score !== undefined ? (
                  <Badge 
                    variant={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'destructive'}
                  >
                    {score}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {llamada.estado === 'transcrito' ? 'Procesando' : 'Pendiente'}
                  </Badge>
                )}

                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
