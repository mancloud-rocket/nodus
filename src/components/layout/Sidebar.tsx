import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  Target, 
  AlertTriangle, 
  TrendingUp,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronsUpDown,
  Layers,
  PhoneCall,
  UserCheck,
  PhoneOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navigation = [
  { 
    section: 'General',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Llamadas', href: '/llamadas', icon: Phone },
      { name: 'Agentes', href: '/agentes', icon: Users },
    ]
  },
  {
    section: 'Modulos de Analisis',
    items: [
      { name: 'Vision General', href: '/modulos', icon: Layers },
      { name: 'Contacto Directo', href: '/modulos/contacto', icon: PhoneCall },
      { name: 'Compromiso Pago', href: '/modulos/compromiso', icon: UserCheck },
      { name: 'Abandono', href: '/modulos/abandono', icon: PhoneOff },
    ]
  },
  {
    section: 'Analisis',
    items: [
      { name: 'Coaching', href: '/coaching', icon: Target },
      { name: 'Alertas', href: '/alertas', icon: AlertTriangle, badge: 3 },
      { name: 'Estrategia', href: '/estrategia', icon: TrendingUp },
    ]
  },
  {
    section: 'Otros',
    items: [
      { name: 'Chat IA', href: '/chat', icon: MessageSquare },
      { name: 'Configuracion', href: '/settings', icon: Settings },
    ]
  }
]

export function Sidebar() {
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">NODUS</h1>
            <p className="text-[10px] text-muted-foreground">Speech Analytics</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <ChevronsUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href))
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">FU</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Fernando U.</p>
              <p className="text-xs text-muted-foreground truncate">admin@360.com</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
