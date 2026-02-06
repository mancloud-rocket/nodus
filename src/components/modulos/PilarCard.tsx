import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PilarCardProps {
  titulo: string
  descripcion: string
  score: number
  peso?: string
  cambio?: number
  color?: 'primary' | 'coral' | 'amber' | 'emerald'
  size?: 'default' | 'large'
}

const colorMap = {
  primary: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20'
  },
  coral: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20'
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20'
  }
}

export function PilarCard({ 
  titulo, 
  descripcion, 
  score, 
  peso,
  cambio,
  color = 'primary',
  size = 'default'
}: PilarCardProps) {
  const colors = colorMap[color]
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-md",
      size === 'large' && "p-2"
    )}>
      <CardContent className={cn("p-4", size === 'large' && "p-6")}>
        {peso && (
          <div className={cn(
            "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold",
            colors.bg,
            colors.text
          )}>
            {peso}
          </div>
        )}
        
        <h3 className={cn(
          "font-semibold mb-1",
          colors.text,
          size === 'large' ? "text-lg" : "text-sm"
        )}>
          {titulo}
        </h3>
        
        <p className={cn(
          "text-muted-foreground mb-4 line-clamp-2",
          size === 'large' ? "text-sm" : "text-xs"
        )}>
          {descripcion}
        </p>
        
        <div className="flex items-end justify-between">
          <div>
            <p className={cn(
              "font-bold",
              size === 'large' ? "text-3xl" : "text-2xl"
            )}>
              {score}
              <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
            </p>
          </div>
          
          {cambio !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              cambio > 0 ? "text-emerald-600" : cambio < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {cambio > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : cambio < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{cambio > 0 ? '+' : ''}{cambio}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

