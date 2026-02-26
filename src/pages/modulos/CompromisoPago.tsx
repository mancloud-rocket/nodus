import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModuloHeader, PilarCard, ProbabilidadFlow, ImpactoElementosChart } from '@/components/modulos'
import { RefreshCw, CheckCircle, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

// 🚀 MOCK DATA PREMIUM PARA LA DEMO
const mockPilares = [
  { titulo: 'Validación Económica', descripcion: 'El ejecutivo indaga la razón real del no pago antes de cobrar.', peso: '35%', score: 84 },
  { titulo: 'Cierre Doble Alternativa', descripcion: 'Ofrecer dos opciones de fecha/monto en lugar de preguntas abiertas.', peso: '25%', score: 62 },
  { titulo: 'Canalización Digital', descripcion: 'Derivación exitosa a la App o portal web para el pago.', peso: '20%', score: 75 },
  { titulo: 'Confirmación Explícita', descripcion: 'El cliente repite y confirma el acuerdo al finalizar.', peso: '20%', score: 58 }
]

const mockFlujo = [
  { paso: 'Inicio de Gestión', orden: 0, prob_teorica: 0, prob_real: 5, n: 850 },
  { paso: 'Cobro Directo (Sin indagar)', orden: 1, prob_teorica: 15, prob_real: 12, n: 420 },
  { paso: 'Indagación + Oferta', orden: 2, prob_teorica: 45, prob_real: 48, n: 280 },
  { paso: 'Empatía + Doble Alternativa', orden: 3, prob_teorica: 85, prob_real: 88, n: 115 },
  { paso: 'Acuerdo Blindado (Confirmación)', orden: 4, prob_teorica: 100, prob_real: 94, n: 95 }
]

const mockElementos = [
  { categoria: 'Solo cobro agresivo', orden: 0, total_llamadas: 420, prob_promedio: 12, porcentaje_del_total: 45 },
  { categoria: 'Oferta estándar + Fecha', orden: 1, total_llamadas: 280, prob_promedio: 48, porcentaje_del_total: 35 },
  { categoria: 'Uso de Cierre Doble Alternativa', orden: 2, total_llamadas: 115, prob_promedio: 88, porcentaje_del_total: 15 },
  { categoria: 'Empatía profunda + Confirmación', orden: 3, total_llamadas: 95, prob_promedio: 94, porcentaje_del_total: 5 }
]

const mockAgentes = [
  { agente_nombre: 'Fernando Chacana (IA Coach)', equipo: 'Ventas Elite', score_compromiso: 96, pct_oferta: 98, pct_validacion: 94, ranking_score: 1 },
  { agente_nombre: 'Carlos Ramirez', equipo: 'Norte', score_compromiso: 82, pct_oferta: 90, pct_validacion: 65, ranking_score: 2 },
  { agente_nombre: 'Luis Torres', equipo: 'Norte', score_compromiso: 75, pct_oferta: 85, pct_validacion: 55, ranking_score: 3 },
  { agente_nombre: 'Ana Martinez', equipo: 'Centro', score_compromiso: 68, pct_oferta: 78, pct_validacion: 42, ranking_score: 4 },
  { agente_nombre: 'Jose Perez', equipo: 'Sur', score_compromiso: 42, pct_oferta: 50, pct_validacion: 25, ranking_score: 5 }
]

export function CompromisoPago() {
  // 🔌 FORZAMOS LA DATA MOCK PARA LA DEMO (Bypass a la DB)
  const displayElementos = mockElementos
  const displayFlujo = mockFlujo
  const displayAgentes = mockAgentes
  const loading = false

  return (
    <>
      <Header title="Compromiso de Pago" />
      
      <div className="p-6 space-y-6">
        <ModuloHeader
          badge="Módulo Estratégico"
          titulo="Inteligencia de Conversión: Optimizando Promesas de Pago"
          subtitulo="Nuestra IA ha analizado miles de interacciones para descubrir exactamente qué frases y actitudes generan un compromiso de pago real. Descubre la ciencia detrás del cierre perfecto."
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

        {/* Key Insight Generado por IA */}
        <Card className="border-indigo-300 bg-indigo-50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 shrink-0">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 mb-1">Insight Estratégico Detectado por Saturn IA</h4>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  Tras analizar las llamadas de esta semana, hemos detectado que <strong>forzar el cobro sin validar la situación económica del cliente reduce el éxito al 12%</strong>. Sin embargo, los ejecutivos que aplican la técnica de <em>"Cierre de Doble Alternativa"</em> aumentan la probabilidad de pago efectivo a un extraordinario <strong>88%</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Embudo de Conversión Emocional</CardTitle>
                  <CardDescription>Cómo evoluciona la intención de pago según la técnica usada</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProbabilidadFlow pasos={displayFlujo} />
            </CardContent>
          </Card>

          <ImpactoElementosChart 
            data={displayElementos}
            titulo="Impacto de las Técnicas en el Cierre"
          />
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Efectividad en Cierres</CardTitle>
            <CardDescription>Ejecutivos con mayor tasa de promesas de pago reales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Agente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Score Cierre</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Uso Doble Alternativa</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">% Promesas Exitosas</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAgentes.map((agente, index) => (
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
                            (agente.score_compromiso || 0) >= 75 ? "border-emerald-500 text-emerald-600 bg-emerald-50" : 
                            (agente.score_compromiso || 0) >= 60 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-500"
                          )}
                        >
                          {agente.score_compromiso}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-medium">{agente.pct_oferta}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "font-bold",
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