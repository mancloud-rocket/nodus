import { cn } from '@/lib/utils'

interface DonutMetricProps {
  value: number
  label: string
  sublabel?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'coral' | 'amber' | 'emerald' | 'red'
}

const sizeMap = {
  sm: { outer: 80, inner: 60, stroke: 10, text: 'text-lg' },
  md: { outer: 120, inner: 90, stroke: 15, text: 'text-2xl' },
  lg: { outer: 160, inner: 120, stroke: 20, text: 'text-3xl' }
}

const colorMap = {
  primary: '#0088FE',
  coral: '#FF6B6B',
  amber: '#F59E0B',
  emerald: '#10B981',
  red: '#EF4444'
}

export function DonutMetric({ 
  value, 
  label, 
  sublabel,
  size = 'md',
  color = 'primary'
}: DonutMetricProps) {
  const dims = sizeMap[size]
  const radius = (dims.outer - dims.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dims.outer, height: dims.outer }}>
        <svg 
          className="transform -rotate-90" 
          width={dims.outer} 
          height={dims.outer}
        >
          {/* Background circle */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dims.stroke}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={radius}
            fill="none"
            stroke={colorMap[color]}
            strokeWidth={dims.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", dims.text)}>
            {value}%
          </span>
        </div>
      </div>
      
      <p className="mt-2 text-sm font-medium text-center">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground text-center">{sublabel}</p>
      )}
    </div>
  )
}




