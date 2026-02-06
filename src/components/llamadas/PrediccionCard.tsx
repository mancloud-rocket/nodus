import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import type { PrediccionCumplimiento } from '@/types'

interface PrediccionCardProps {
  prediccion: PrediccionCumplimiento
  delay?: number
}

export function PrediccionCard({ prediccion, delay = 0 }: PrediccionCardProps) {
  const { probabilidad, nivel, factores_positivos, factores_negativos, razonamiento } = prediccion

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant="gradient">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            Predicción de Cumplimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-4">
            {/* Gauge */}
            <ScoreGauge 
              value={probabilidad} 
              size="lg"
              label="prob."
            />

            {/* Nivel y badge */}
            <div className="flex-1">
              <Badge 
                variant={nivel === 'alta' ? 'success' : nivel === 'media' ? 'warning' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {nivel.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {razonamiento}
              </p>
            </div>
          </div>

          {/* Factores */}
          <div className="grid grid-cols-2 gap-4">
            {/* Positivos */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-success flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Factores Positivos
              </p>
              {factores_positivos.map((factor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span className="text-muted-foreground">{factor}</span>
                </motion.div>
              ))}
            </div>

            {/* Negativos */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-destructive flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Factores Negativos
              </p>
              {factores_negativos.map((factor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-muted-foreground">{factor}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

