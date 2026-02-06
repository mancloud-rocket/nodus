import { cn } from '@/lib/utils'

interface CumplimientoBarProps {
  variable: string
  porcentaje: number
  puntos?: number
  pesoMaximo?: number
  color?: 'primary' | 'coral' | 'amber' | 'emerald'
}

export function CumplimientoBar({ 
  variable, 
  porcentaje, 
  puntos,
  pesoMaximo,
  color = 'primary'
}: CumplimientoBarProps) {
  // Determinar color de fondo basado en prop
  const bgColor = {
    primary: 'bg-emerald-500',
    coral: 'bg-coral-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500'
  }[color]

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{variable}</span>
        <div className="flex items-center gap-2">
          {puntos !== undefined && pesoMaximo !== undefined && (
            <span className="text-xs text-muted-foreground">
              {puntos}/{pesoMaximo} pts
            </span>
          )}
          <span className="font-semibold">{porcentaje}%</span>
        </div>
      </div>
      
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            bgColor
          )}
          style={{ width: `${Math.max(Math.min(100, porcentaje), 3)}%` }}
        />
      </div>
    </div>
  )
}

