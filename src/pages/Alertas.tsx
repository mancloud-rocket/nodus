import { useState, useCallback, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, Plus, SlidersHorizontal, MoreHorizontal, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Bell } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useAlertas as useAlertasQuery } from '@/hooks/useSupabase'
import { useAlertasRealtime } from '@/hooks/useRealtime'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { Severidad, EstadoAlerta } from '@/types'
import type { AlertaAnomalia } from '@/types/database'

// Mock data fallback
import { mockAlertas } from '@/data/mockData'

const severidadConfig: Record<Severidad, { 
  icon: typeof AlertTriangle, 
  badge: 'destructive' | 'warning' | 'secondary' | 'default'
}> = {
  critica: { icon: AlertTriangle, badge: 'destructive' },
  alta: { icon: AlertCircle, badge: 'warning' },
  media: { icon: Info, badge: 'secondary' },
  baja: { icon: Info, badge: 'default' },
}

export function Alertas() {
  const [searchQuery, setSearchQuery] = useState('')
  const [localAlertas, setLocalAlertas] = useState<AlertaAnomalia[]>([])
  const { data: alertasDB, loading, error, refetch } = useAlertasQuery(true)

  // Sync DB data to local state
  useEffect(() => {
    if (alertasDB && alertasDB.length > 0) {
      setLocalAlertas(alertasDB)
    }
  }, [alertasDB])

  // Realtime: escuchar nuevas alertas
  const handleNuevaAlerta = useCallback((alerta: AlertaAnomalia) => {
    setLocalAlertas(prev => [alerta, ...prev])
  }, [])

  useAlertasRealtime(handleNuevaAlerta)

  // Usar datos de Supabase o mock
  const alertas = localAlertas.length > 0 
    ? localAlertas.map(a => ({
        alerta_id: a.alerta_id,
        tipo: a.tipo as 'individual' | 'sistemica' | 'patron',
        severidad: a.severidad as Severidad,
        descripcion: a.descripcion,
        causa_probable: a.causa_probable || undefined,
        impacto_estimado: a.impacto_estimado as any,
        accion_recomendada: a.accion_recomendada as any,
        agentes_relacionados: a.agentes_relacionados || undefined,
        estado: a.estado as EstadoAlerta,
        notificacion_enviada: a.notificacion_enviada,
        created_at: a.created_at
      }))
    : mockAlertas

  const filteredAlertas = alertas.filter(alerta =>
    alerta.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Conteo por severidad
  const countBySeveridad = (sev: Severidad) => 
    alertas.filter(a => a.severidad === sev).length

  const isConnected = isSupabaseConfigured()

  return (
    <>
      <Header title="Alertas" />
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Alertas</h1>
              <p className="text-muted-foreground text-sm">Monitoreo de anomalias del sistema</p>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">En vivo</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Modo demo</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button>
              <Bell className="w-4 h-4 mr-2" />
              Configurar Alertas
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {(['critica', 'alta', 'media', 'baja'] as Severidad[]).map((sev) => {
            const config = severidadConfig[sev]
            const Icon = config.icon
            const count = countBySeveridad(sev)
            
            return (
              <Card key={sev}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      sev === 'critica' && "bg-destructive/10 text-destructive",
                      sev === 'alta' && "bg-warning/10 text-warning",
                      sev === 'media' && "bg-secondary text-muted-foreground",
                      sev === 'baja' && "bg-secondary text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sev}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Buscar alertas..." 
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Severidad
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Estado
          </Button>

          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Vista
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            Error al cargar alertas: {error.message}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                    <input type="checkbox" className="rounded border-border" />
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Alerta
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Descripcion
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Severidad
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Creada
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredAlertas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Cargando alertas...
                    </td>
                  </tr>
                ) : filteredAlertas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No hay alertas activas
                    </td>
                  </tr>
                ) : (
                  filteredAlertas.map((alerta) => {
                    const config = severidadConfig[alerta.severidad]
                    const Icon = config.icon

                    return (
                      <tr key={alerta.alerta_id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-border" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              alerta.severidad === 'critica' && "bg-destructive/10 text-destructive",
                              alerta.severidad === 'alta' && "bg-warning/10 text-warning",
                              alerta.severidad === 'media' && "bg-secondary text-muted-foreground",
                              alerta.severidad === 'baja' && "bg-secondary text-muted-foreground"
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-primary">
                              {alerta.alerta_id.toUpperCase().slice(0, 10)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="text-sm truncate">{alerta.descripcion}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant={config.badge}>
                            {alerta.severidad}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={alerta.estado === 'nueva' ? 'default' : 'secondary'}>
                            {alerta.estado}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatRelativeTime(new Date(alerta.created_at))}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {filteredAlertas.length} alertas
              </p>
              <div className="flex items-center gap-6">
                <span className="text-sm">Pagina 1 de 1</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon-sm" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
