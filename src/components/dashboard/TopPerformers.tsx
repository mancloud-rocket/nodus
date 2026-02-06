import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Performer {
  agente_id: string
  nombre: string
  score: number
  llamadas: number
  validacion: number
  trend: 'up' | 'down' | 'stable'
}

interface TopPerformersProps {
  performers: Performer[]
}

export function TopPerformers({ performers }: TopPerformersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button variant="outline" size="sm">Invite</Button>
        </div>
        <p className="text-sm text-muted-foreground">Top performers this week</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performers.slice(0, 5).map((performer) => {
            const TrendIcon = performer.trend === 'up' 
              ? TrendingUp 
              : performer.trend === 'down' 
                ? TrendingDown 
                : Minus

            return (
              <div
                key={performer.agente_id}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {performer.nombre.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{performer.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {performer.llamadas} llamadas • {performer.validacion}% validación
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <TrendIcon className={cn(
                    "w-4 h-4",
                    performer.trend === 'up' && "text-success",
                    performer.trend === 'down' && "text-destructive",
                    performer.trend === 'stable' && "text-muted-foreground"
                  )} />
                  <Badge 
                    variant={performer.score >= 70 ? 'success' : performer.score >= 40 ? 'warning' : 'destructive'}
                    className="min-w-[3rem] justify-center"
                  >
                    {performer.score}
                  </Badge>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
