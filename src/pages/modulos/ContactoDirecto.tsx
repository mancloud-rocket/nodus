import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModuloHeader, CumplimientoBar } from '@/components/modulos'
import { useContactoDetalle, useAgentesModulos } from '@/hooks/useModulos'
import { RefreshCw, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockContacto = [
  { variable: 'Monto adeudado', peso_maximo: 25, puntos_promedio: 18, pct_cumplimiento: 72 },
  { variable: 'Fecha de vencimiento', peso_maximo: 15, puntos_promedio: 11, pct_cumplimiento: 73 },
  { variable: 'Consecuencias del impago', peso_maximo: 20, puntos_promedio: 12, pct_cumplimiento: 60 },
  { variable: 'Alternativas de pago', peso_maximo: 15, puntos_promedio: 10, pct_cumplimiento: 67 },
  { variable: 'Manejo de objeciones', peso_maximo: 25, puntos_promedio: 17, pct_cumplimiento: 68 }
]

const mockAgentes = [
  { agente_nombre: 'Carlos Ramirez', equipo: 'Norte', score_contacto: 85, pct_monto: 92, pct_fecha: 88, pct_buen_manejo: 80, ranking_score: 1 },
  { agente_nombre: 'Maria Gonzalez', equipo: 'Sur', score_contacto: 78, pct_monto: 85, pct_fecha: 80, pct_buen_manejo: 72, ranking_score: 2 },
  { agente_nombre: 'Luis Torres', equipo: 'Norte', score_contacto: 72, pct_monto: 78, pct_fecha: 75, pct_buen_manejo: 65, ranking_score: 3 },
  { agente_nombre: 'Ana Martinez', equipo: 'Centro', score_contacto: 65, pct_monto: 70, pct_fecha: 68, pct_buen_manejo: 58, ranking_score: 4 },
  { agente_nombre: 'Jose Perez', equipo: 'Sur', score_contacto: 58, pct_monto: 62, pct_fecha: 55, pct_buen_manejo: 48, ranking_score: 5 }
]

const variablesInfo = [
  {
    nombre: 'Claridad en la entrega de informacion',
    descripcion: 'Evalua si el agente comunica de forma precisa el monto adeudado, fechas de vencimiento y consecuencias del impago'
  },
  {
    nombre: 'Presentacion de alternativas de pago',
    descripcion: 'Verifica que se ofrezcan todas las opciones disponibles y se expliquen claramente'
  },
  {
    nombre: 'Manejo de objeciones',
    descripcion: 'Analiza tecnicas de respuesta, empatia demostrada y efectividad en la resolucion de dudas'
  }
]

export function ContactoDirecto() {
  const contacto = useContactoDetalle()
  const agentes = useAgentesModulos()

  const displayContacto = (contacto.data && contacto.data.length > 0) ? contacto.data : mockContacto
  const displayAgentes = (agentes.data && agentes.data.length > 0) ? agentes.data : mockAgentes

  const loading = contacto.loading || agentes.loading

  const handleRefresh = () => {
    contacto.refetch()
    agentes.refetch()
  }

  // Calcular score total del modulo
  const scoreTotal = Math.round(
    displayContacto.reduce((acc, v) => acc + (v.puntos_promedio || 0), 0)
  )

  return (
    <>
      <Header title="Contacto Directo" />
      
      <div className="p-6 space-y-6">
        {/* Module Header */}
        <ModuloHeader
          badge="Modulo 1"
          titulo="Analisis del Contacto Directo: La Primera Impresion es Definitiva"
          subtitulo="El primer contacto con el deudor determina el exito de toda la gestion. Nuestro modulo de analisis utiliza IA para evaluar sistematicamente cada conversacion."
          color="primary"
        />

        {/* Intro Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Los resultados se traducen en reportes detallados con recomendaciones especificas para cada agente, 
                  mejorando continuamente la calidad del contacto inicial.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-primary">Beneficio clave:</strong> Identifique en segundos que agentes 
                    requieren capacitacion adicional y en que aspectos especificos, optimizando su inversion en formacion.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variables Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Variables Analizadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variablesInfo.map((v, i) => (
                <div key={i} className="pb-4 border-b last:border-0 last:pb-0">
                  <p className="font-medium text-sm mb-1">{v.nombre}</p>
                  <p className="text-xs text-muted-foreground">{v.descripcion}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cumplimiento Bars */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cumplimiento por Variable</CardTitle>
                  <CardDescription>Ultimos 30 dias</CardDescription>
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
            <CardContent className="space-y-5">
              {displayContacto.map((item, index) => (
                <CumplimientoBar
                  key={item.variable}
                  variable={item.variable}
                  porcentaje={item.pct_cumplimiento || 0}
                  puntos={item.puntos_promedio || 0}
                  pesoMaximo={item.peso_maximo}
                  color={index % 2 === 0 ? 'primary' : 'coral'}
                />
              ))}

              {/* Total Score */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Score Total del Modulo</span>
                  <span className="text-2xl font-bold text-primary">{scoreTotal}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Agentes - Contacto Directo</CardTitle>
            <CardDescription>Ordenado por score de contacto directo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Agente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Score</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Monto</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Fecha</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Objeciones</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAgentes
                    .sort((a, b) => (b.score_contacto || 0) - (a.score_contacto || 0))
                    .slice(0, 10)
                    .map((agente, index) => (
                    <tr key={agente.agente_nombre} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                          index === 0 && "bg-amber-100 text-amber-700",
                          index === 1 && "bg-slate-100 text-slate-700",
                          index === 2 && "bg-orange-100 text-orange-700",
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
                            (agente.score_contacto || 0) >= 75 ? "border-emerald-500 text-emerald-600" : 
                            (agente.score_contacto || 0) >= 60 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-500"
                          )}
                        >
                          {agente.score_contacto}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{agente.pct_monto || '-'}%</td>
                      <td className="py-3 px-4 text-center text-sm">{agente.pct_fecha || '-'}%</td>
                      <td className="py-3 px-4 text-center text-sm">{agente.pct_buen_manejo || '-'}%</td>
                      <td className="py-3 px-4 text-center">
                        {index < 2 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : index > 3 ? (
                          <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
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




