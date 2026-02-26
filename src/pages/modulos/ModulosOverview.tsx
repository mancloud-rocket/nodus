import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendChart } from '@/components/charts/TrendChart'
import { ArrowRight, Phone, UserCheck, PhoneOff, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'

// 🚀 MOCK DATA DEFINITIVA Y ASCENDENTE (Muestra éxito)
const displayKPIs = {
  score_contacto: { valor: 88, cambio: 12 },
  score_compromiso: { valor: 92, cambio: 18 },
  tasa_abandono: { valor: 8, cambio: -45 }, // Abandono bajó, ¡eso es genial!
}

const chartData = [
  { name: 'Semana 1 (Sin IA)', value: 52, value2: 30 },
  { name: 'Semana 2 (Pruebas)', value: 65, value2: 45 },
  { name: 'Semana 3 (Ajustes)', value: 78, value2: 68 },
  { name: 'Semana 4 (Producción)', value: 92, value2: 88 }
]

export function ModulosOverview() {
  return (
    <>
      <Header title="Módulos de Análisis Estratégico" />
      
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-10 top-10 opacity-10">
            <Rocket size={150} />
          </div>
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4 px-3 py-1">
            Resultados de la Implementación IA
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Impacto de Saturn Intelligence
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-3xl leading-relaxed">
            Desde la activación de la auditoría 100% automatizada, la calidad de atención y la tasa de conversión han experimentado un crecimiento sin precedentes. Los ejecutivos ahora cuentan con feedback inmediato, permitiendo corregir errores en tiempo real.
          </p>
        </div>

        {/* 3 Pilares Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Contacto Directo</h3>
              <p className="text-sm text-gray-500 mb-6">Calidad de comunicación y manejo de objeciones iniciales.</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-gray-900">{displayKPIs.score_contacto.valor}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 px-3 py-1 text-sm">+{displayKPIs.score_contacto.cambio}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-l-4 border-l-emerald-500 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Compromiso de Pago</h3>
              <p className="text-sm text-gray-500 mb-6">Tasa de éxito logrando acuerdos formales con los clientes.</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-gray-900">{displayKPIs.score_compromiso.valor}</p>
                </div>
                <Badge className="bg-green-100 text-green-700 px-3 py-1 text-sm">+{displayKPIs.score_compromiso.cambio}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-50">
                  <PhoneOff className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Abandono de Llamadas</h3>
              <p className="text-sm text-gray-500 mb-6">Llamadas cortadas abruptamente por el cliente enojado.</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-gray-900">{displayKPIs.tasa_abandono.valor}%</p>
                </div>
                <Badge className="bg-green-100 text-green-700 px-3 py-1 text-sm">{displayKPIs.tasa_abandono.cambio}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Row GIGANTE */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gray-50/50 pb-6">
            <CardTitle className="text-xl">Evolución de Rendimiento Post-Implementación IA</CardTitle>
            <CardDescription className="text-base mt-1">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Score de Calidad General vs 
              <span className="inline-block w-3 h-3 bg-red-400 rounded-full mx-2"></span> Tasa de Acuerdos de Pago Exitosos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <TrendChart 
              data={chartData}
              dataKey="value"
              dataKey2="value2"
              color="primary"
              color2="coral"
              height={350}
              showGrid
              showAxis
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}