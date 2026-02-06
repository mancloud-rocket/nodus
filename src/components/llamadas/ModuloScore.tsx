import { Check, X, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ModuloContactoDirecto, ModuloCompromisoPago, ModuloAbandono } from '@/types'

interface ModuloScoreProps {
  titulo: string
  icon: React.ReactNode
  score: number
  maxScore?: number
  items: Array<{
    label: string
    presente: boolean
    puntos: number
    maxPuntos: number
    evidencia?: string
    alerta?: boolean
  }>
  delay?: number
}

export function ModuloScore({ 
  titulo, 
  icon, 
  score, 
  maxScore = 100, 
  items,
  delay = 0
}: ModuloScoreProps) {
  const percentage = (score / maxScore) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {titulo}
            </CardTitle>
            <div className={cn(
              "text-2xl font-mono font-bold",
              percentage >= 70 ? "text-success" : 
              percentage >= 40 ? "text-warning" : "text-destructive"
            )}>
              {score}<span className="text-sm text-muted-foreground">/{maxScore}</span>
            </div>
          </div>
          <Progress 
            value={percentage} 
            variant={percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'destructive'}
            className="h-2 mt-2"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.1 + i * 0.05 }}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg",
                  item.alerta ? "bg-destructive/10 border border-destructive/20" : "bg-muted/30"
                )}
              >
                {/* Check/X icon */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  item.presente ? "bg-success/20" : "bg-destructive/20"
                )}>
                  {item.presente ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      !item.presente && "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                    <Badge 
                      variant={item.presente ? "success" : "outline"}
                      className="font-mono text-xs"
                    >
                      {item.puntos}/{item.maxPuntos}
                    </Badge>
                  </div>
                  {item.evidencia && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                      "{item.evidencia}"
                    </p>
                  )}
                  {item.alerta && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Impacto crítico en cumplimiento</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Componente para Módulo Abandono
interface ModuloAbandonoProps {
  data: ModuloAbandono
  delay?: number
}

export function ModuloAbandonoCard({ data, delay = 0 }: ModuloAbandonoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant={data.hubo_abandono ? "glow" : "glass"} className={cn(
        data.hubo_abandono && "border-destructive/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              data.hubo_abandono ? "bg-destructive/20" : "bg-success/20"
            )}>
              {data.hubo_abandono ? (
                <X className="w-5 h-5 text-destructive" />
              ) : (
                <Check className="w-5 h-5 text-success" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {data.hubo_abandono ? 'Hubo abandono' : 'Sin abandono'}
              </p>
              {data.hubo_abandono && data.razon && (
                <p className="text-sm text-muted-foreground">{data.razon}</p>
              )}
            </div>
            {data.hubo_abandono && data.momento && (
              <Badge variant="destructive" className="ml-auto">
                Min {Math.floor(data.momento / 60)}:{(data.momento % 60).toString().padStart(2, '0')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

