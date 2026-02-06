import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface MiniBarProps {
  value: number
  max?: number
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'
  showValue?: boolean
  size?: 'sm' | 'md'
  label?: string
}

export function MiniBar({ 
  value, 
  max = 100, 
  color = 'primary',
  showValue = true,
  size = 'md',
  label
}: MiniBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    secondary: 'bg-secondary',
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
  }

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-mono text-foreground">{value}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted/50 overflow-hidden", heights[size])}>
        <motion.div 
          className={cn("h-full rounded-full", colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

interface StackedBarProps {
  segments: Array<{
    value: number
    color: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'
    label?: string
  }>
  total?: number
}

export function StackedBar({ segments, total }: StackedBarProps) {
  const sum = total || segments.reduce((acc, s) => acc + s.value, 0)

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    secondary: 'bg-secondary',
  }

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden flex">
        {segments.map((segment, i) => {
          const percentage = (segment.value / sum) * 100
          return (
            <motion.div
              key={i}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", colors[segment.color])}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
            />
          )
        })}
      </div>
      {segments.some(s => s.label) && (
        <div className="flex items-center gap-4 mt-2">
          {segments.map((segment, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", colors[segment.color])} />
              <span className="text-xs text-muted-foreground">{segment.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

