import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModuloHeader, DonutMetric } from '@/components/modulos'
import { useAbandonoKPIs, useAbandonosDetalle, useAgentesModulos } from '@/hooks/useModulos'
import { RefreshCw, AlertTriangle, Clock, DollarSign, MessageSquare, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockKPIs = [
  { kpi: 'primeros_30_seg', valor: 34, porcentaje_abandonos: 34, porcentaje_total: 6 },
  { kpi: 'al_mencionar_monto', valor: 28, porcentaje_abandonos: 28, porcentaje_total: 5 },
  { kpi: 'durante_objeciones', valor: 22, porcentaje_abandonos: 22, porcentaje_total: 4 }
]

const mockDetalles = [
  { momento_rango: '0-30 seg', razon: 'Cliente no interesado', iniciado_por: 'cliente', total: 45, porcentaje: 34 },
  { momento_rango: '31-60 seg', razon: 'Monto muy alto', iniciado_por: 'cliente', total: 35, porcentaje: 26 },
  { momento_rango: '1-2 min', razon: 'Sin opciones de pago', iniciado_por: 'cliente', total: 25, porcentaje: 19 },
  { momento_rango: '> 2 min', razon: 'Objeciones no resueltas', iniciado_por: 'cliente', total: 28, porcentaje: 21 }
]

const mockAgentes = [
  { agente_nombre: 'Carlos Ramirez', equipo: 'Norte', tasa_abandono: 12, llamadas_con_abandono: 8, total_llamadas: 67, ranking_score: 1 },
  { agente_nombre: 'Maria Gonzalez', equipo: 'Sur', tasa_abandono: 15, llamadas_con_abandono: 12, total_llamadas: 80, ranking_score: 2 },
  { agente_nombre: 'Luis Torres', equipo: 'Norte', tasa_abandono: 18, llamadas_con_abandono: 11, total_llamadas: 61, ranking_score: 3 },
  { agente_nombre: 'Ana Martinez', equipo: 'Centro', tasa_abandono: 24, llamadas_con_abandono: 15, total_llamadas: 63, ranking_score: 4 },
  { agente_nombre: 'Jose Perez', equipo: 'Sur', tasa_abandono: 32, llamadas_con_abandono: 19, total_llamadas: 59, ranking_score: 5 }
]

const patrones = [
  { 
    titulo: 'Recurrencia de Abandonos',
    descripcion: 'El sistema detecta patrones especificos: ciertos agentes experimentan mas cortes? Hay horarios con mayor abandono? Determinados tipos de deuda generan mas desconexiones?',
    icon: Clock
  },
  {
    titulo: 'Mapeo del Script',
    descripcion: 'La IA identifica en que parte especifica de la estructura del script ocurren mas abandonos, permitiendole redisenar secciones problematicas.',
    icon: MessageSquare
  }
]

export function AbandonoLlamadas() {
  const kpis = useAbandonoKPIs()
  const detalles = useAbandonosDetalle()
  const agentes = useAgentesModulos()

  const displayKPIs = (kpis.data && kpis.data.length > 0) ? kpis.data : mockKPIs
  const displayDetalles = (detalles.data && detalles.data.length > 0) ? detalles.data : mockDetalles
  const displayAgentes = (agentes.data && agentes.data.length > 0) ? agentes.data : mockAgentes

  const loading = kpis.loading || detalles.loading || agentes.loading

  const handleRefresh = () => {
    kpis.refetch()
    detalles.refetch()
    agentes.refetch()
  }

  // Procesar KPIs
  const kpiMap = displayKPIs.reduce((acc, k) => {
    acc[k.kpi] = k.porcentaje_abandonos || 0
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <Header title="Abandono de Llamadas" />
      
      <div className="p-6 space-y-6">
        {/* Module Header */}
        <ModuloHeader
          badge="Modulo 3"
          titulo="Analisis del Abandono de Llamadas: Prevenir la Desconexion"
          subtitulo="Cada llamada cortada representa una oportunidad perdida de recuperacion. Este modulo identifica exactamente donde y por que los deudores abandonan las llamadas."
          color="amber"
        />

        {/* Main KPIs - Donut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <DonutMetric 
                value={kpiMap.primeros_30_seg || 34}
                label="Abandonan en los primeros 30 segundos"
                size="lg"
                color="red"
              />
              <p className="mt-4 text-xs text-muted-foreground text-center">
                La primera impresion es critica
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <DonutMetric 
                value={kpiMap.al_mencionar_monto || 28}
                label="Cortan al mencionar el monto total"
                size="lg"
                color="amber"
              />
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Requiere mejora en presentacion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <DonutMetric 
                value={kpiMap.durante_objeciones || 22}
                label="Desconectan durante objeciones"
                size="lg"
                color="coral"
              />
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Capacitacion en manejo de objeciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patterns and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patrones Detectados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patrones.map((patron, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="p-2 rounded-lg bg-amber-500/10 h-fit">
                    <patron.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">{patron.titulo}</p>
                    <p className="text-xs text-muted-foreground">{patron.descripcion}</p>
                  </div>
                </div>
              ))}

              {/* Result Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p className="text-sm">
                    <strong className="text-emerald-700">Resultado:</strong> Scripts optimizados basados en 
                    datos reales que reducen hasta un 40% las llamadas cortadas prematuramente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail by Moment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Detalle por Momento</CardTitle>
                  <CardDescription>Distribucion de abandonos</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayDetalles.slice(0, 5).map((detalle, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-muted-foreground">
                      {detalle.momento_rango}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 flex items-center justify-end px-2"
                          style={{ width: `${detalle.porcentaje}%` }}
                        >
                          {(detalle.porcentaje || 0) > 20 && (
                            <span className="text-xs font-medium text-white">
                              {detalle.porcentaje}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {(detalle.porcentaje || 0) <= 20 && (
                      <span className="text-xs font-medium w-10">
                        {detalle.porcentaje}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Razon principal:</strong> {displayDetalles[0]?.razon || 'Cliente no interesado'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasa de Abandono por Agente</CardTitle>
            <CardDescription>Ordenado de menor a mayor abandono (mejor a peor)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Agente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Tasa Abandono</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Abandonos</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Total Llamadas</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAgentes
                    .sort((a, b) => (a.tasa_abandono || 0) - (b.tasa_abandono || 0))
                    .slice(0, 10)
                    .map((agente, index) => (
                    <tr key={agente.agente_nombre} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                          index === 0 && "bg-emerald-100 text-emerald-700",
                          index === 1 && "bg-emerald-50 text-emerald-600",
                          index === 2 && "bg-slate-100 text-slate-700",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{agente.agente_nombre}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{agente.equipo}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-bold",
                            (agente.tasa_abandono || 0) <= 15 ? "border-emerald-500 text-emerald-600" : 
                            (agente.tasa_abandono || 0) <= 25 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-500"
                          )}
                        >
                          {agente.tasa_abandono}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{agente.llamadas_con_abandono || '-'}</td>
                      <td className="py-3 px-4 text-center text-sm">{agente.total_llamadas}</td>
                      <td className="py-3 px-4 text-center">
                        {(agente.tasa_abandono || 0) <= 15 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Excelente</Badge>
                        ) : (agente.tasa_abandono || 0) <= 25 ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Normal</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Requiere atencion</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}




