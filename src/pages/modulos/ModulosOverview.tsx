import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImpactoElementosChart } from '@/components/modulos'
import { TrendChart } from '@/components/charts/TrendChart'
import { useModulosOverview } from '@/hooks/useModulos'
import { RefreshCw, ArrowRight, Phone, UserCheck, PhoneOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Mock data como fallback
const mockKPIs = {
  score_total: { valor: 72, cambio: 5 },
  score_contacto: { valor: 68, cambio: 3 },
  score_compromiso: { valor: 75, cambio: 7 },
  tasa_validacion: { valor: 52, cambio: -3 },
  tasa_abandono: { valor: 18, cambio: -2 },
  probabilidad: { valor: 54, cambio: 4 }
}

const mockEvolucion = [
  { semana: 'Sem 1', score_total: 65, score_contacto: 60, score_compromiso: 70, prob_cumplimiento: 48 },
  { semana: 'Sem 2', score_total: 68, score_contacto: 63, score_compromiso: 72, prob_cumplimiento: 50 },
  { semana: 'Sem 3', score_total: 70, score_contacto: 66, score_compromiso: 73, prob_cumplimiento: 52 },
  { semana: 'Sem 4', score_total: 72, score_contacto: 68, score_compromiso: 75, prob_cumplimiento: 54 }
]

const mockAgentes = [
  { agente_nombre: 'Carlos Ramirez', equipo: 'Norte', score_contacto: 85, score_compromiso: 88, tasa_abandono: 12, score_total: 86, ranking_score: 1 },
  { agente_nombre: 'Maria Gonzalez', equipo: 'Sur', score_contacto: 78, score_compromiso: 82, tasa_abandono: 15, score_total: 80, ranking_score: 2 },
  { agente_nombre: 'Luis Torres', equipo: 'Norte', score_contacto: 75, score_compromiso: 78, tasa_abandono: 18, score_total: 76, ranking_score: 3 },
  { agente_nombre: 'Ana Martinez', equipo: 'Centro', score_contacto: 70, score_compromiso: 72, tasa_abandono: 22, score_total: 71, ranking_score: 4 },
  { agente_nombre: 'Jose Perez', equipo: 'Sur', score_contacto: 62, score_compromiso: 65, tasa_abandono: 28, score_total: 63, ranking_score: 5 }
]

const mockElementos = [
  { categoria: 'Sin elementos', orden: 0, total_llamadas: 45, prob_promedio: 8, porcentaje_del_total: 9 },
  { categoria: 'Solo oferta', orden: 1, total_llamadas: 120, prob_promedio: 22, porcentaje_del_total: 24 },
  { categoria: 'Oferta + alternativas', orden: 2, total_llamadas: 150, prob_promedio: 38, porcentaje_del_total: 30 },
  { categoria: 'Tres elementos', orden: 3, total_llamadas: 100, prob_promedio: 55, porcentaje_del_total: 20 },
  { categoria: 'Acuerdo completo', orden: 4, total_llamadas: 85, prob_promedio: 92, porcentaje_del_total: 17 }
]

export function ModulosOverview() {
  const { kpis, evolucion, agentes, elementos, loading, refetch } = useModulosOverview()

  // Procesar KPIs
  const kpiMap = (kpis || []).reduce((acc, k) => {
    acc[k.kpi] = { valor: k.valor, cambio: k.cambio }
    return acc
  }, {} as Record<string, { valor: number | null; cambio: number | null }>)

  const displayKPIs = {
    score_total: kpiMap.score_total || mockKPIs.score_total,
    score_contacto: kpiMap.score_contacto || mockKPIs.score_contacto,
    score_compromiso: kpiMap.score_compromiso || mockKPIs.score_compromiso,
    tasa_validacion: kpiMap.tasa_validacion || mockKPIs.tasa_validacion,
    tasa_abandono: kpiMap.tasa_abandono || mockKPIs.tasa_abandono,
    probabilidad: kpiMap.probabilidad || mockKPIs.probabilidad
  }

  const displayEvolucion = (evolucion && evolucion.length > 0) ? evolucion : mockEvolucion
  const displayAgentes = (agentes && agentes.length > 0) ? agentes : mockAgentes
  const displayElementos = (elementos && elementos.length > 0) ? elementos : mockElementos

  // Chart data
  const chartData = displayEvolucion.map(e => ({
    name: typeof e.semana === 'string' ? e.semana.slice(0, 10) : e.semana,
    value: e.score_total || 0,
    value2: e.prob_cumplimiento || 0
  }))

  return (
    <>
      <Header title="Modulos de Analisis" />
      
      <div className="p-6 space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white">
          <Badge variant="outline" className="bg-white/20 text-white border-white/30 mb-3">
            Vision General
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Tres Pilares para la Excelencia en Cobranza
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-3xl">
            Nuestra plataforma de Speech Analytics esta disenada especificamente para el sector financiero, 
            ofreciendo tres modulos complementarios que analizan cada aspecto critico de la gestion de cobranza.
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={refetch}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* 3 Pilares Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/modulos/contacto" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-1">Contacto Directo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Evalua la calidad de la comunicacion inicial, claridad informativa y efectividad en el manejo de objeciones.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{displayKPIs.score_contacto.valor}</p>
                    <p className="text-xs text-muted-foreground">Score promedio</p>
                  </div>
                  <Badge variant={displayKPIs.score_contacto.cambio && displayKPIs.score_contacto.cambio > 0 ? "default" : "destructive"}>
                    {displayKPIs.score_contacto.cambio && displayKPIs.score_contacto.cambio > 0 ? '+' : ''}{displayKPIs.score_contacto.cambio}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/modulos/compromiso" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-coral/10">
                    <UserCheck className="w-5 h-5 text-coral" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-coral transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-coral mb-1">Compromiso de Pago</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Analiza la presentacion de ofertas, opciones de pago disponibles y la respuesta del deudor ante propuestas.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{displayKPIs.score_compromiso.valor}</p>
                    <p className="text-xs text-muted-foreground">Score promedio</p>
                  </div>
                  <Badge variant={displayKPIs.score_compromiso.cambio && displayKPIs.score_compromiso.cambio > 0 ? "default" : "destructive"}>
                    {displayKPIs.score_compromiso.cambio && displayKPIs.score_compromiso.cambio > 0 ? '+' : ''}{displayKPIs.score_compromiso.cambio}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/modulos/abandono" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <PhoneOff className="w-5 h-5 text-amber-600" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-amber-600 mb-1">Abandono de Llamadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Identifica patrones de desconexion, puntos criticos del script y recurrencia para reducir perdidas.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{displayKPIs.tasa_abandono.valor}%</p>
                    <p className="text-xs text-muted-foreground">Tasa de abandono</p>
                  </div>
                  <Badge variant={displayKPIs.tasa_abandono.cambio && displayKPIs.tasa_abandono.cambio < 0 ? "default" : "destructive"}>
                    {displayKPIs.tasa_abandono.cambio && displayKPIs.tasa_abandono.cambio > 0 ? '+' : ''}{displayKPIs.tasa_abandono.cambio}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolucion Semanal</CardTitle>
              <CardDescription>Score total y probabilidad de cumplimiento</CardDescription>
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

          {/* Impact by Elements */}
          <ImpactoElementosChart 
            data={displayElementos}
            titulo="Impacto de Elementos en la Probabilidad"
          />
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ranking de Agentes por Modulo</CardTitle>
                <CardDescription>Ultimos 7 dias</CardDescription>
              </div>
              <Link to="/agentes">
                <Button variant="outline" size="sm">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Agente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Contacto</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Compromiso</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Abandono</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Score Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAgentes.slice(0, 5).map((agente, index) => (
                    <tr key={agente.agente_nombre} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                          index === 0 && "bg-amber-100 text-amber-700",
                          index === 1 && "bg-slate-100 text-slate-700",
                          index === 2 && "bg-orange-100 text-orange-700",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {agente.ranking_score || index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{agente.agente_nombre}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{agente.equipo}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "font-semibold",
                          (agente.score_contacto || 0) >= 75 ? "text-emerald-600" : 
                          (agente.score_contacto || 0) >= 60 ? "text-amber-600" : "text-red-500"
                        )}>
                          {agente.score_contacto}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "font-semibold",
                          (agente.score_compromiso || 0) >= 75 ? "text-emerald-600" : 
                          (agente.score_compromiso || 0) >= 60 ? "text-amber-600" : "text-red-500"
                        )}>
                          {agente.score_compromiso}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "font-semibold",
                          (agente.tasa_abandono || 0) <= 15 ? "text-emerald-600" : 
                          (agente.tasa_abandono || 0) <= 25 ? "text-amber-600" : "text-red-500"
                        )}>
                          {agente.tasa_abandono}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="font-bold">
                          {agente.score_total}
                        </Badge>
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




