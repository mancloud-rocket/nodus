import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModuloHeader, PilarCard, ProbabilidadFlow, ImpactoElementosChart } from '@/components/modulos'
import { useCompromisoElementos, useFlujoProbabilidad, useAgentesModulos } from '@/hooks/useModulos'
import { RefreshCw, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockPilares = [
  { titulo: 'Oferta Clara', descripcion: 'Especificar monto exacto a pagar y origen detallado de la deuda.', peso: '20%', score: 72 },
  { titulo: 'Alternativas de Pago', descripcion: 'Ofrecer multiples canales: sucursales, web, transferencia.', peso: '10%', score: 68 },
  { titulo: 'Fecha Especifica', descripcion: 'Establecer fecha concreta de pago para crear urgencia.', peso: '20%', score: 75 },
  { titulo: 'Validacion del Cliente', descripcion: 'El deudor debe confirmar explicitamente las condiciones.', peso: '50%', score: 52 }
]

const mockFlujo = [
  { paso: 'Inicio', orden: 0, prob_teorica: 0, prob_real: 5, n: 45 },
  { paso: 'Oferta clara', orden: 1, prob_teorica: 20, prob_real: 22, n: 120 },
  { paso: 'Alternativas', orden: 2, prob_teorica: 30, prob_real: 35, n: 150 },
  { paso: 'Fecha especifica', orden: 3, prob_teorica: 50, prob_real: 48, n: 100 },
  { paso: 'Validacion cliente', orden: 4, prob_teorica: 100, prob_real: 92, n: 85 }
]

const mockElementos = [
  { categoria: 'Sin elementos', orden: 0, total_llamadas: 45, prob_promedio: 8, porcentaje_del_total: 9 },
  { categoria: 'Solo oferta', orden: 1, total_llamadas: 120, prob_promedio: 22, porcentaje_del_total: 24 },
  { categoria: 'Oferta + alternativas', orden: 2, total_llamadas: 150, prob_promedio: 38, porcentaje_del_total: 30 },
  { categoria: 'Tres elementos', orden: 3, total_llamadas: 100, prob_promedio: 55, porcentaje_del_total: 20 },
  { categoria: 'Acuerdo completo', orden: 4, total_llamadas: 85, prob_promedio: 92, porcentaje_del_total: 17 }
]

const mockAgentes = [
  { agente_nombre: 'Carlos Ramirez', equipo: 'Norte', score_compromiso: 88, pct_oferta: 95, pct_validacion: 78, ranking_score: 1 },
  { agente_nombre: 'Maria Gonzalez', equipo: 'Sur', score_compromiso: 82, pct_oferta: 90, pct_validacion: 65, ranking_score: 2 },
  { agente_nombre: 'Luis Torres', equipo: 'Norte', score_compromiso: 75, pct_oferta: 85, pct_validacion: 55, ranking_score: 3 },
  { agente_nombre: 'Ana Martinez', equipo: 'Centro', score_compromiso: 68, pct_oferta: 78, pct_validacion: 42, ranking_score: 4 },
  { agente_nombre: 'Jose Perez', equipo: 'Sur', score_compromiso: 62, pct_oferta: 70, pct_validacion: 35, ranking_score: 5 }
]

export function CompromisoPago() {
  const elementos = useCompromisoElementos()
  const flujo = useFlujoProbabilidad()
  const agentes = useAgentesModulos()

  const displayElementos = (elementos.data && elementos.data.length > 0) ? elementos.data : mockElementos
  const displayFlujo = (flujo.data && flujo.data.length > 0) ? flujo.data : mockFlujo
  const displayAgentes = (agentes.data && agentes.data.length > 0) ? agentes.data : mockAgentes

  const loading = elementos.loading || flujo.loading || agentes.loading

  const handleRefresh = () => {
    elementos.refetch()
    flujo.refetch()
    agentes.refetch()
  }

  return (
    <>
      <Header title="Compromiso de Pago" />
      
      <div className="p-6 space-y-6">
        {/* Module Header */}
        <ModuloHeader
          badge="Modulo 2"
          titulo="Calidad del Compromiso: Convirtiendo Conversaciones en Resultados"
          subtitulo="Lograr que el deudor acepte un compromiso de pago es el objetivo final de cada llamada. Este modulo analiza la efectividad con la que sus agentes presentan ofertas, explican opciones y cierran acuerdos."
          color="coral"
        />

        {/* 4 Pilares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockPilares.map((pilar, index) => (
            <PilarCard
              key={pilar.titulo}
              titulo={pilar.titulo}
              descripcion={pilar.descripcion}
              score={pilar.score}
              peso={pilar.peso}
              color={index === 3 ? 'coral' : 'primary'}
            />
          ))}
        </div>

        {/* Key Insight */}
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm">
                <strong>Dato clave:</strong> La validacion del cliente representa el 50% del exito total, 
                subrayando la importancia critica de obtener una confirmacion explicita durante la llamada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Flow and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Probability Flow */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Flujo de Probabilidad</CardTitle>
                  <CardDescription>Como se construye la probabilidad de cumplimiento</CardDescription>
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
              <ProbabilidadFlow pasos={displayFlujo} />
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Este diagrama ilustra como la presencia o ausencia de cada elemento impacta 
                  directamente en la probabilidad final de que el cliente concrete el pago.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Impact Chart */}
          <ImpactoElementosChart 
            data={displayElementos}
            titulo="Impacto Medible en el Desempeno"
          />
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transforme Datos en Accion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Nuestra herramienta de speech analytics identifica automaticamente la presencia 
              o ausencia de estos elementos en cada conversacion, permitiendo:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Retroalimentacion inmediata a ejecutivos sobre calidad de acuerdos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Identificacion de brechas de capacitacion especificas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Prediccion temprana de cumplimiento de compromisos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Optimizacion continua de scripts y protocolos</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Agentes - Compromiso de Pago</CardTitle>
            <CardDescription>Ordenado por score de compromiso</CardDescription>
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
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Oferta Clara</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Validacion</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAgentes
                    .sort((a, b) => (b.score_compromiso || 0) - (a.score_compromiso || 0))
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
                            (agente.score_compromiso || 0) >= 75 ? "border-emerald-500 text-emerald-600" : 
                            (agente.score_compromiso || 0) >= 60 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-500"
                          )}
                        >
                          {agente.score_compromiso}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{(agente as Record<string, unknown>).pct_oferta as number || '-'}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "font-semibold",
                          (agente.pct_validacion || 0) >= 60 ? "text-emerald-600" : 
                          (agente.pct_validacion || 0) >= 40 ? "text-amber-600" : "text-red-500"
                        )}>
                          {agente.pct_validacion || '-'}%
                        </span>
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

