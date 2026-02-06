import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ElementoData {
  categoria: string
  total_llamadas: number
  prob_promedio: number | null
  porcentaje_del_total: number | null
}

interface ImpactoElementosChartProps {
  data: ElementoData[]
  titulo?: string
}

export function ImpactoElementosChart({ data, titulo = "Impacto por Elementos" }: ImpactoElementosChartProps) {
  // Encontrar el maximo para escalar las barras (minimo 100)
  const maxProb = Math.max(...data.map(d => d.prob_promedio || 0), 100)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const prob = item.prob_promedio || 0
            const barWidth = (prob / maxProb) * 100
            const isLast = index === data.length - 1
            
            return (
              <div key={item.categoria} className="space-y-1">
                {/* Labels row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.categoria}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.total_llamadas} llamadas
                  </span>
                </div>
                
                {/* Bar row with percentage always visible */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded transition-all duration-500",
                        isLast ? "bg-emerald-500" : "bg-emerald-400"
                      )}
                      style={{ width: `${Math.max(barWidth, 8)}%` }}
                    />
                  </div>
                  {/* Percentage always outside and visible */}
                  <span className={cn(
                    "text-sm font-bold min-w-[50px] text-right",
                    isLast ? "text-emerald-600" : "text-emerald-500"
                  )}>
                    {prob.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Probabilidad promedio de cumplimiento segun elementos de compromiso presentes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

