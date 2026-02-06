import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Info, LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  sparklineData?: number[]
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg className="w-20 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-primary"
      />
    </svg>
  )
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel = 'Since Last week',
  icon: Icon,
  sparklineData
}: KPICardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {Icon && <Icon className="w-4 h-4" />}
            <span>{title}</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent>
              <p>More information about {title}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {changeLabel && (
              <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
            )}
          </div>
          
          {sparklineData ? (
            <MiniSparkline data={sparklineData} />
          ) : null}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Details</span>
            <div className={cn(
              "flex items-center gap-1 ml-auto text-sm font-medium",
              isPositive && "text-success",
              isNegative && "text-destructive"
            )}>
              {isPositive && <TrendingUp className="w-4 h-4" />}
              {isNegative && <TrendingDown className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Variante más compacta para métricas secundarias
interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  sparklineData?: number[]
  className?: string
}

export function MetricCard({ title, value, change, sparklineData, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold">{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground mt-0.5">{change}</p>
            )}
          </div>
          {sparklineData && <MiniSparkline data={sparklineData} />}
        </div>
      </CardContent>
    </Card>
  )
}
