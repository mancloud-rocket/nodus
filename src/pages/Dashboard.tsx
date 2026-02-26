import { Phone, TrendingUp, Target, Wifi } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KPICard, MetricCard, AlertasActivas, ActividadReciente, TopPerformers } from '@/components/dashboard'
import { TrendChart } from '@/components/charts/TrendChart'
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'

export function Dashboard() {
  // 🚀 MOCK DATA SUPREMA PARA LA DEMO
  const displayMetrics = {
    total_llamadas: 15420,
    llamadas_hoy: 845,
    score_promedio: 94,
    cambio_score: 22, 
    tasa_validacion: 0.88, 
    cambio_validacion: 34, 
    alertas_activas: 2,
    monto_comprometido: 45600000 
  }

  const chartData = [
    { name: 'Lun', value: 68, value2: 45 },
    { name: 'Mar', value: 72, value2: 52 },
    { name: 'Mie', value: 79, value2: 61 },
    { name: 'Jue', value: 85, value2: 74 },
    { name: 'Vie', value: 89, value2: 82 },
    { name: 'Sab', value: 92, value2: 86 },
    { name: 'Hoy', value: 95, value2: 90 }
  ]

  const displayTopPerformers = [
    { agente_id: '1', nombre: 'Fernando Chacana (IA Coach)', score: 98, llamadas: 145, validacion: 96, trend: 'up' as any },
    { agente_id: '2', nombre: 'Carlos Ramirez', score: 92, llamadas: 132, validacion: 88, trend: 'up' as any },
    { agente_id: '3', nombre: 'Ana Martinez', score: 89, llamadas: 128, validacion: 85, trend: 'up' as any },
    { agente_id: '4', nombre: 'Maria Gonzalez', score: 85, llamadas: 156, validacion: 78, trend: 'stable' as any },
    { agente_id: '5', nombre: 'Jose Perez', score: 78, llamadas: 98, validacion: 65, trend: 'down' as any }
  ]

  const displayAlertas = [
    {
      alerta_id: '1',
      tipo: 'Oportunidad',
      severidad: 'media' as any,
      descripcion: 'El uso de doble alternativa aumenta 40% los cierres los dias viernes.',
      created_at: new Date().toISOString(),
      estado: 'nueva'
    },
    {
      alerta_id: '2',
      tipo: 'Mejora',
      severidad: 'baja' as any,
      descripcion: '3 agentes bajaron su nivel de empatia esta maniana. Sugerimos pausa activa.',
      created_at: new Date().toISOString(),
      estado: 'nueva'
    }
  ]
  
  const displayLlamadas = [
    {
      llamada_id: 'L-101',
      agente_nombre: 'Fernando Chacana',
      cliente_id: 'Sergio Tapia',
      duracion_segundos: 145,
      timestamp_inicio: new Date().toISOString(),
      estado: 'analizado',
      analisis: { score_total: 98 }
    },
    {
      llamada_id: 'L-102',
      agente_nombre: 'Carlos Ramirez',
      cliente_id: 'Maria Soto',
      duracion_segundos: 210,
      timestamp_inicio: new Date(Date.now() - 3600000).toISOString(),
      estado: 'analizado',
      analisis: { score_total: 92 }
    }
  ]

  return (
    <>
      <Header title="Dashboard Principal" />
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Dashboard de Operaciones</h1>
            <div className="flex items-center gap-2 text-xs">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-bold">Saturn IA Activo</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">General</TabsTrigger>
                <TabsTrigger value="analytics">Analitica</TabsTrigger>
                <TabsTrigger value="reports">Reportes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Llamadas Procesadas"
            value={formatNumber(displayMetrics.llamadas_hoy)}
            change={15.54}
            changeLabel="vs ayer"
            icon={Phone}
            sparklineData={[30, 40, 35, 50, 49, 60, 70]}
          />
          <KPICard
            title="Score Promedio IA"
            value={displayMetrics.score_promedio}
            change={displayMetrics.cambio_score}
            changeLabel="vs semana anterior (Sin IA)"
            icon={TrendingUp}
            sparklineData={[50, 40, 60, 45, 70, 55, 95]}
          />
          <KPICard
            title="Tasa de Cierres Reales"
            value={formatPercentage(displayMetrics.tasa_validacion * 100)}
            change={displayMetrics.cambio_validacion}
            changeLabel="vs mes pasado"
            icon={Target}
            sparklineData={[20, 30, 25, 40, 35, 45, 88]}
          />
          <MetricCard
            title="Recuperacion Proyectada"
            value={formatCurrency(displayMetrics.monto_comprometido)}
            change="+45.2% desde activacion"
            sparklineData={[40, 35, 50, 45, 60, 55, 70, 65, 100]}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-blue-100">
            <CardHeader>
              <CardTitle>Crecimiento de Efectividad</CardTitle>
              <CardDescription>
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Score de Calidad
                <span className="inline-block w-3 h-3 bg-red-400 rounded-full mx-2"></span> Cierres Exitosos
              </CardDescription>
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
              title="Impacto IA en Tiempo Real"
              value="+ 45%"
              change="Mejora en conversion neta"
              sparklineData={[20, 40, 35, 50, 49, 60, 70, 91, 80, 70, 90, 100]}
            />
            <AlertasActivas alertas={displayAlertas as any} maxItems={3} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActividadReciente llamadas={displayLlamadas as any} />
          <TopPerformers performers={displayTopPerformers} />
        </div>
      </div>
    </>
  )
}