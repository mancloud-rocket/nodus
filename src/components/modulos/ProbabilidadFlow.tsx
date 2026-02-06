import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface FlowStep {
  paso: string
  prob_teorica: number
  prob_real?: number | null
  n?: number
}

interface ProbabilidadFlowProps {
  pasos: FlowStep[]
}

export function ProbabilidadFlow({ pasos }: ProbabilidadFlowProps) {
  return (
    <div className="space-y-3">
      {pasos.map((paso, index) => {
        const widthPercent = Math.min(100, Math.max(20, paso.prob_teorica))
        
        return (
          <div key={paso.paso} className="flex items-center gap-3">
            {/* Arrow indicator */}
            <div 
              className={cn(
                "relative h-12 rounded-r-full flex items-center justify-between px-4 transition-all",
                "bg-primary text-white"
              )}
              style={{ width: `${widthPercent}%`, minWidth: '140px' }}
            >
              <span className="font-medium text-sm truncate">
                {paso.paso}
              </span>
              <span className="font-bold">
                {paso.prob_teorica}%
              </span>
              
              {/* Arrow point */}
              <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                <ChevronRight className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            {/* Real probability if available */}
            {paso.prob_real !== null && paso.prob_real !== undefined && (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                Real: <span className="font-semibold text-foreground">{paso.prob_real}%</span>
                {paso.n !== undefined && (
                  <span className="ml-1">({paso.n} llamadas)</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}




