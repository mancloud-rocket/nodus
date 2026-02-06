import { Phone, TrendingUp, Target, Subscript, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { KPICard, MetricCard, AlertasActivas, ActividadReciente, TopPerformers } from '@/components/dashboard'
import { TrendChart } from '@/components/charts/TrendChart'
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import { useDashboard } from '@/hooks/useDashboard'

// Mock data como fallback
import { mockAlertas, mockLlamadas, mockAnalisis } from '@/data/mockData'

export function Dashboard() {
  const {
    metrics,
    alertas,
    llamadasRecientes,
    topPerformers,
    tendencias,
    loading,
    realtimeConnected,
    refresh
  } = useDashboard()

  // Usar datos reales o mock como fallback
  const displayMetrics = metrics || {
    total_llamadas: 2847,
    llamadas_hoy: 127,
    score_promedio: 72,
    cambio_score: 5,
    tasa_validacion: 0.52,
    cambio_validacion: -3,
    probabilidad_promedio: 54,
    cambio_probabilidad: 2,
    alertas_activas: 3,
    monto_comprometido: 1250000
  }

  const displayAlertas = alertas.length > 0 ? alertas.map(a => ({
    alerta_id: a.alerta_id,
    tipo: a.tipo,
    severidad: a.severidad,
    descripcion: a.descripcion,
    causa_probable: a.causa_probable || undefined,
    impacto_estimado: a.impacto_estimado as { llamadas_afectadas?: number; perdida_oportunidades?: number } || undefined,
    accion_recomendada: a.accion_recomendada as { urgencia?: string; destinatario?: string; accion?: string } || undefined,
    agentes_relacionados: a.agentes_relacionados || undefined,
    estado: a.estado,
    notificacion_enviada: a.notificacion_enviada,
    created_at: a.created_at
  })) : mockAlertas

  const displayLlamadas = llamadasRecientes.length > 0 ? llamadasRecientes.map(l => ({
    llamada_id: l.registro_id,
    audio_url: l.audio_url,
    duracion_segundos: l.duracion_segundos || 0,
    timestamp_inicio: l.timestamp_inicio,
    timestamp_fin: l.timestamp_fin,
    agente_id: l.agente_id,
    agente_nombre: l.agente_nombre || 'Agente',
    cliente_id: l.cliente_ref,
    campana: l.campana || '',
    tipo_deuda: l.tipo_deuda || '',
    estado: l.estado as 'pendiente' | 'transcrito' | 'analizado' | 'error',
    created_at: l.created_at,
    updated_at: l.updated_at,
    analisis: l.analisis ? {
      analisis_id: l.analisis.analisis_id,
      llamada_id: l.registro_id,
      transcripcion_id: l.analisis.transcripcion_id,
      score_total: l.analisis.score_total,
      score_contacto_directo: l.analisis.score_contacto_directo || 0,
      score_compromiso_pago: l.analisis.score_compromiso_pago || 0,
      modulo_contacto_directo: l.analisis.modulo_contacto_directo as any,
      modulo_compromiso_pago: l.analisis.modulo_compromiso_pago as any,
      modulo_abandono: l.analisis.modulo_abandono as any,
      prediccion_cumplimiento: {
        probabilidad: l.analisis.probabilidad_cumplimiento,
        nivel: l.analisis.nivel_cumplimiento,
        factores_positivos: [],
        factores_negativos: [],
        razonamiento: ''
      },
      alertas: [],
      recomendaciones: [],
      created_at: l.analisis.created_at
    } : undefined
  })) : mockLlamadas.map(l => ({
    ...l,
    analisis: mockAnalisis[l.llamada_id]
  }))

  const displayTopPerformers = topPerformers.length > 0 ? topPerformers : [
    { agente_id: '1', nombre: 'Carlos Ramirez', score: 89, llamadas: 145, validacion: 78, trend: 'up' as const },
    { agente_id: '5', nombre: 'Luis Torres', score: 82, llamadas: 132, validacion: 71, trend: 'stable' as const },
    { agente_id: '4', nombre: 'Ana Martinez', score: 78, llamadas: 128, validacion: 65, trend: 'up' as const },
    { agente_id: '2', nombre: 'Maria Gonzalez', score: 72, llamadas: 156, validacion: 52, trend: 'down' as const },
    { agente_id: '3', nombre: 'Jose Perez', score: 58, llamadas: 98, validacion: 38, trend: 'down' as const }
  ]

  // Sparkline data
  const sparkline1 = [30, 40, 35, 50, 49, 60, 70]
  const sparkline2 = [50, 40, 60, 45, 70, 55, 80]
  const sparkline3 = [20, 30, 25, 40, 35, 45, 50]

  // Chart data
  const chartData = tendencias.length > 0 
    ? tendencias.map(t => ({
        name: t.fecha,
        value: t.score,
        value2: t.validacion
      }))
    : [
        { name: 'Lun', value: 68, value2: 48 },
        { name: 'Mar', value: 71, value2: 51 },
        { name: 'Mie', value: 75, value2: 55 },
        { name: 'Jue', value: 73, value2: 53 },
        { name: 'Vie', value: 72, value2: 52 },
        { name: 'Sab', value: 74, value2: 54 },
        { name: 'Hoy', value: 72, value2: 52 }
      ]

  return (
    <>
      <Header title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Page title with tabs and realtime status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            {/* Realtime indicator */}
            <div className="flex items-center gap-2 text-xs">
              {realtimeConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">En vivo</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Offline</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Llamadas Hoy"
            value={formatNumber(displayMetrics.llamadas_hoy)}
            change={15.54}
            changeLabel="vs ayer"
            icon={Phone}
            sparklineData={sparkline1}
          />
          <KPICard
            title="Score Promedio"
            value={displayMetrics.score_promedio}
            change={displayMetrics.cambio_score}
            changeLabel="vs semana anterior"
            icon={TrendingUp}
            sparklineData={sparkline2}
          />
          <KPICard
            title="Tasa Validacion"
            value={formatPercentage(displayMetrics.tasa_validacion * 100)}
            change={displayMetrics.cambio_validacion}
            changeLabel="vs semana anterior"
            icon={Target}
            sparklineData={sparkline3}
          />
          <MetricCard
            title="Monto Comprometido"
            value={formatCurrency(displayMetrics.monto_comprometido)}
            change="+20.1% from last month"
            sparklineData={[40, 35, 50, 45, 60, 55, 70, 65, 80]}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendencia Semanal</CardTitle>
              <CardDescription>Score promedio y tasa de validacion</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart 
                data={chartData}
                dataKey="value"
                dataKey2="value2"
                color="primary"
                color2="coral"
                height={280}
                showGrid
                showAxis
              />
            </CardContent>
          </Card>

          {/* Side metrics */}
          <div className="space-y-4">
            <MetricCard
              title="Total Llamadas"
              value={formatNumber(displayMetrics.total_llamadas)}
              change={`+${displayMetrics.llamadas_hoy} hoy`}
              sparklineData={[20, 40, 35, 50, 49, 60, 70, 91, 80, 70, 90, 100]}
            />
            <AlertasActivas alertas={displayAlertas} maxItems={3} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActividadReciente llamadas={displayLlamadas} />
          <TopPerformers performers={displayTopPerformers} />
        </div>
      </div>
    </>
  )
}
