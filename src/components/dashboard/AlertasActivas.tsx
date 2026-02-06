import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { AlertaAnomalia, Severidad } from '@/types'

interface AlertasActivasProps {
  alertas: AlertaAnomalia[]
  maxItems?: number
}

const severidadConfig: Record<Severidad, { 
  icon: typeof AlertTriangle, 
  badge: 'destructive' | 'warning' | 'secondary' | 'default'
}> = {
  critica: { icon: AlertTriangle, badge: 'destructive' },
  alta: { icon: AlertCircle, badge: 'warning' },
  media: { icon: Info, badge: 'secondary' },
  baja: { icon: Info, badge: 'default' },
}

export function AlertasActivas({ alertas, maxItems = 5 }: AlertasActivasProps) {
  const visibleAlertas = alertas.slice(0, maxItems)
  const hasMore = alertas.length > maxItems

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Alertas Activas</CardTitle>
          <Badge variant="destructive">{alertas.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleAlertas.map((alerta) => {
            const config = severidadConfig[alerta.severidad]
            const Icon = config.icon

            return (
              <div
                key={alerta.alerta_id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border border-border",
                  "hover:bg-accent/50 transition-colors cursor-pointer"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  alerta.severidad === 'critica' && "bg-destructive/10 text-destructive",
                  alerta.severidad === 'alta' && "bg-warning/10 text-warning",
                  alerta.severidad === 'media' && "bg-secondary text-muted-foreground",
                  alerta.severidad === 'baja' && "bg-secondary text-muted-foreground"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={config.badge} className="text-[10px]">
                      {alerta.severidad}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alerta.tipo}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{alerta.descripcion}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            )
          })}
        </div>
        
        {hasMore && (
          <Button variant="ghost" className="w-full mt-3" size="sm">
            Ver todas ({alertas.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
