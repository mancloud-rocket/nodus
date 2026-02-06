import { useState, useCallback } from 'react'
import { Search, Plus, SlidersHorizontal, MoreHorizontal, ChevronLeft, ChevronRight, Edit, Eye, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLlamadas } from '@/hooks/useSupabase'
import { useAnalisisRealtime } from '@/hooks/useRealtime'
import { isSupabaseConfigured } from '@/lib/supabase'

// Mock data fallback
import { mockLlamadas, mockAnalisis } from '@/data/mockData'

export function Llamadas() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: llamadasDB, loading, error, refetch } = useLlamadas(100)
  const [realtimeCount, setRealtimeCount] = useState(0)

  // Realtime: escuchar nuevos analisis
  useAnalisisRealtime(useCallback(() => {
    setRealtimeCount(c => c + 1)
    refetch()
  }, [refetch]))

  // Usar datos de Supabase o mock
  const llamadasConAnalisis = (llamadasDB && llamadasDB.length > 0)
    ? llamadasDB.map(l => ({
        llamada: {
          llamada_id: l.registro_id,
          audio_url: l.audio_url,
          duracion_segundos: l.duracion_segundos || 0,
          timestamp_inicio: l.timestamp_inicio,
          timestamp_fin: l.timestamp_fin,
          agente_id: l.agente_id,
          agente_nombre: (l.agente as any)?.nombre || 'Agente',
          cliente_id: l.cliente_ref,
          campana: l.campana || '',
          tipo_deuda: l.tipo_deuda || '',
          estado: l.estado as 'pendiente' | 'transcrito' | 'analizado' | 'error',
          created_at: l.created_at,
          updated_at: l.updated_at,
        },
        analisis: l.analisis ? {
          analisis_id: l.analisis.analisis_id,
          score_total: l.analisis.score_total,
          prediccion_cumplimiento: {
            probabilidad: l.analisis.probabilidad_cumplimiento
          }
        } : undefined
      }))
    : mockLlamadas.map(l => ({
        llamada: l,
        analisis: mockAnalisis[l.llamada_id]
      }))

  const filteredLlamadas = llamadasConAnalisis.filter(({ llamada }) => {
    return (
      llamada.agente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      llamada.cliente_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const isConnected = isSupabaseConfigured()

  return (
    <>
      <Header title="Llamadas" />
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Llamadas</h1>
              <p className="text-muted-foreground text-sm">
                {filteredLlamadas.length} llamadas encontradas
                {realtimeCount > 0 && ` (+${realtimeCount} nuevas)`}
              </p>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Conectado</span>
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
            <Button variant="outline">Import</Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Llamada
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por agente o cliente..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Estado
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Campana
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
            Error al cargar llamadas: {error.message}
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
                    Llamada
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Detalle
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredLlamadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Cargando llamadas...
                    </td>
                  </tr>
                ) : filteredLlamadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No se encontraron llamadas
                    </td>
                  </tr>
                ) : (
                  filteredLlamadas.map(({ llamada, analisis }) => {
                    const score = analisis?.score_total

                    return (
                      <tr key={llamada.llamada_id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-border" />
                        </td>
                        <td className="p-4">
                          <Link to={`/llamadas/${llamada.llamada_id}`} className="font-medium text-primary hover:underline">
                            {llamada.llamada_id.toUpperCase().slice(0, 12)}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {llamada.tipo_deuda || 'General'}
                            </Badge>
                            <span className="text-sm">
                              {llamada.agente_nombre} - {llamada.cliente_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={
                              llamada.estado === 'analizado' ? 'success' : 
                              llamada.estado === 'transcrito' ? 'warning' : 'secondary'
                            }
                          >
                            {llamada.estado === 'analizado' ? 'Completado' : 
                             llamada.estado === 'transcrito' ? 'En proceso' : 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-semibold",
                                score >= 70 ? "text-success" :
                                score >= 40 ? "text-warning" : "text-destructive"
                              )}>
                                {score}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                / 100
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" asChild>
                              <Link to={`/llamadas/${llamada.llamada_id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon-sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
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
                {filteredLlamadas.length} llamadas
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Filas por pagina</span>
                  <select className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
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
