import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, SlidersHorizontal, MoreHorizontal, ChevronLeft, ChevronRight, UserPlus, Mail, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAgentes, useResumenAgentes } from '@/hooks/useSupabase'
import { isSupabaseConfigured } from '@/lib/supabase'
import { MetricCard } from '@/components/dashboard'

// Mock data fallback
import { mockAgentes, mockTopPerformers } from '@/data/mockData'

export function Agentes() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: agentesDB, loading: loadingAgentes, refetch: refetchAgentes } = useAgentes()
  const { data: resumenDB, loading: loadingResumen, refetch: refetchResumen } = useResumenAgentes()

  const loading = loadingAgentes || loadingResumen

  const refetch = () => {
    refetchAgentes()
    refetchResumen()
  }

  // Combinar datos de agentes con resumen
  const agentesConMetricas = (agentesDB && agentesDB.length > 0)
    ? agentesDB.map(agente => {
        const resumen = resumenDB?.find(r => r.agente_id === agente.agente_id)
        return {
          agente_id: agente.agente_id,
          nombre: agente.nombre,
          email: agente.email || '',
          estado: agente.estado,
          equipo: agente.equipo || '',
          score: resumen?.score_semana ?? 0,
          llamadas: resumen?.llamadas_semana ?? 0,
          validacion: (resumen?.tasa_validacion_ultimo_reporte ?? 0) * 100,
          trend: 'stable' as const,
        }
      })
    : mockAgentes.map(agente => {
        const metricas = mockTopPerformers.find(p => p.agente_id === agente.agente_id)
        return {
          agente_id: agente.agente_id,
          nombre: agente.nombre,
          email: agente.email || '',
          estado: agente.estado,
          equipo: agente.equipo || '',
          score: metricas?.score ?? 0,
          llamadas: metricas?.llamadas ?? 0,
          validacion: metricas?.validacion ?? 0,
          trend: metricas?.trend ?? 'stable' as const,
        }
      })

  const filteredAgentes = agentesConMetricas.filter(agente =>
    agente.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAgentes = agentesConMetricas.length
  const agentesActivos = agentesConMetricas.filter(a => a.estado === 'activo').length
  const scorePromedio = agentesConMetricas.length > 0
    ? Math.round(agentesConMetricas.reduce((acc, a) => acc + a.score, 0) / agentesConMetricas.length)
    : 0

  const isConnected = isSupabaseConfigured()

  return (
    <>
      <Header title="Agentes" />
      
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Home</span>
          <span>-</span>
          <span className="text-foreground">Agentes</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Equipo de Agentes</h1>
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
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Invitar
            </Button>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Agregar Agente
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Agentes"
            value={totalAgentes.toString()}
            change="Equipo completo"
          />
          <MetricCard
            title="Agentes Activos"
            value={agentesActivos.toString()}
            change={`${Math.round((agentesActivos / totalAgentes) * 100)}% del equipo`}
          />
          <MetricCard
            title="Score Promedio"
            value={scorePromedio.toString()}
            change="Ultima semana"
          />
          <MetricCard
            title="Llamadas Totales"
            value={agentesConMetricas.reduce((acc, a) => acc + a.llamadas, 0).toString()}
            change="Ultima semana"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar agente..." 
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
            Equipo
          </Button>

          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Vista
            </Button>
          </div>
        </div>

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
                    Nombre
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Llamadas
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Validacion
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Equipo
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredAgentes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Cargando agentes...
                    </td>
                  </tr>
                ) : filteredAgentes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No se encontraron agentes
                    </td>
                  </tr>
                ) : (
                  filteredAgentes.map((agente) => (
                    <tr key={agente.agente_id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="p-4">
                        <input type="checkbox" className="rounded border-border" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {agente.nombre.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{agente.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {agente.email || '-'}
                      </td>
                      <td className="p-4">
                        {agente.llamadas}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "font-semibold",
                          agente.score >= 70 ? "text-success" :
                          agente.score >= 40 ? "text-warning" : "text-destructive"
                        )}>
                          {agente.score}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "font-medium",
                          agente.validacion >= 60 ? "text-success" :
                          agente.validacion >= 40 ? "text-warning" : "text-destructive"
                        )}>
                          {agente.validacion.toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={agente.estado === 'activo' ? 'success' : 'secondary'}
                        >
                          {agente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{agente.equipo || '-'}</span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {filteredAgentes.length} agentes
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Filas por pagina</span>
                  <select className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
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
