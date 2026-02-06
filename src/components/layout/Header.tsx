import { Bell, Search, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-background border-b border-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Search */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-9 bg-secondary/50 border-0"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Toggle theme would go here */}
          <div className="w-px h-6 bg-border mx-2" />

          {/* Download */}
          <Button variant="default" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>

          {/* Date picker */}
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Pick a date
          </Button>
        </div>
      </div>
    </header>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning'
  }
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {badge && (
            <Badge variant={badge.variant}>{badge.label}</Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
