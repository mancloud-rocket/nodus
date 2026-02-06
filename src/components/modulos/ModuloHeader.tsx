import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ModuloHeaderProps {
  badge: string
  titulo: string
  subtitulo?: string
  color?: 'primary' | 'coral' | 'amber' | 'emerald'
}

export function ModuloHeader({ badge, titulo, subtitulo, color = 'primary' }: ModuloHeaderProps) {
  // Gradientes con colores hardcodeados para evitar problemas con Tailwind
  const gradientStyles = {
    primary: 'bg-gradient-to-r from-[#0088FE] to-[#0066CC]',
    coral: 'bg-gradient-to-r from-[#FF6B6B] to-[#FF4757]',
    amber: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706]',
    emerald: 'bg-gradient-to-r from-[#10B981] to-[#059669]'
  }

  return (
    <div className={cn(
      "rounded-xl p-6 mb-6",
      gradientStyles[color]
    )}>
      <Badge variant="outline" className="bg-white/20 text-white border-white/30 mb-3">
        {badge}
      </Badge>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
        {titulo}
      </h1>
      {subtitulo && (
        <p className="text-white/80 text-sm md:text-base max-w-3xl">
          {subtitulo}
        </p>
      )}
    </div>
  )
}

