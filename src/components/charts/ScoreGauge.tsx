import { cn } from '@/lib/utils'

interface ScoreGaugeProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
}

export function ScoreGauge({ 
  value, 
  max = 100, 
  size = 'md', 
  label,
  showValue = true,
}: ScoreGaugeProps) {
  const percentage = (value / max) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const sizes = {
    sm: { wrapper: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]' },
    md: { wrapper: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
    lg: { wrapper: 'w-32 h-32', text: 'text-4xl', label: 'text-sm' },
  }

  const getColor = () => {
    if (percentage >= 70) return { stroke: 'stroke-success', text: 'text-success' }
    if (percentage >= 40) return { stroke: 'stroke-warning', text: 'text-warning' }
    return { stroke: 'stroke-destructive', text: 'text-destructive' }
  }

  const colors = getColor()

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size].wrapper)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-secondary"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={colors.stroke}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className={cn("font-semibold", sizes[size].text, colors.text)}>
            {value}
          </span>
        )}
        {label && (
          <span className={cn("text-muted-foreground", sizes[size].label)}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
