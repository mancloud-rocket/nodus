import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, User, Calendar, Play, Pause, Volume2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatDuration, formatCurrency } from '@/lib/utils'
import { mockLlamadas, mockAnalisis, mockTranscripcion } from '@/data/mockData'

export function LlamadaDetalle() {
  const { id } = useParams<{ id: string }>()
  const [isPlaying, setIsPlaying] = useState(false)

  const llamada = mockLlamadas.find(l => l.llamada_id === id)
  const analisis = id ? mockAnalisis[id] : undefined
  const transcripcion = mockTranscripcion

  if (!llamada) {
    return (
      <>
        <Header title="Not Found" />
        <div className="p-6">
          <Link to="/llamadas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to calls
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">Call not found</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Call Detail" />
      
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/llamadas" className="text-muted-foreground hover:text-foreground">
            Calls
          </Link>
          <span className="text-muted-foreground">›</span>
          <span>{llamada.llamada_id}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {llamada.agente_nombre?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">{llamada.agente_nombre}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {llamada.cliente_id}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(llamada.duracion_segundos)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(llamada.timestamp_inicio).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {analisis && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Score</p>
                <p className={cn(
                  "text-3xl font-semibold",
                  analisis.score_total >= 70 ? "text-success" :
                  analisis.score_total >= 40 ? "text-warning" : "text-destructive"
                )}>
                  {analisis.score_total}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Prob. Pago</p>
                <p className={cn(
                  "text-3xl font-semibold",
                  analisis.prediccion_cumplimiento.probabilidad >= 60 ? "text-success" :
                  analisis.prediccion_cumplimiento.probabilidad >= 35 ? "text-warning" : "text-destructive"
                )}>
                  {analisis.prediccion_cumplimiento.probabilidad}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audio Player */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              
              <div className="flex-1">
                <div className="h-8 bg-secondary rounded flex items-center px-2">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 mx-px bg-primary/30 rounded-full"
                      style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
              </div>

              <span className="text-sm text-muted-foreground font-mono">
                0:00 / {formatDuration(llamada.duracion_segundos)}
              </span>

              <Button variant="ghost" size="icon-sm">
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="analysis">
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6 mt-6">
            {analisis ? (
              <>
                {/* Prediction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prediction</CardTitle>
                    <CardDescription>{analisis.prediccion_cumplimiento.razonamiento}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-success mb-2">Positive Factors</p>
                        <ul className="space-y-1">
                          {analisis.prediccion_cumplimiento.factores_positivos.map((f, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-success" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive mb-2">Negative Factors</p>
                        <ul className="space-y-1">
                          {analisis.prediccion_cumplimiento.factores_negativos.map((f, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modules */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Direct Contact</CardTitle>
                        <Badge variant={analisis.score_contacto_directo >= 70 ? 'success' : 'warning'}>
                          {analisis.score_contacto_directo}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(analisis.modulo_contacto_directo.desglose).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <Badge variant={value.presente ? 'success' : 'secondary'}>
                            {value.puntos} pts
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Payment Commitment</CardTitle>
                        <Badge variant={analisis.score_compromiso_pago >= 70 ? 'success' : 'warning'}>
                          {analisis.score_compromiso_pago}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(analisis.modulo_compromiso_pago.desglose).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <Badge variant={value.presente ? 'success' : 'secondary'}>
                            {value.puntos} pts
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Entities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Entities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm font-medium mb-2">Amounts</p>
                        {transcripcion.entidades.montos.map((m, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{m.contexto}</span>
                            <span className="font-medium">{formatCurrency(m.valor, m.moneda)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Dates</p>
                        {transcripcion.entidades.fechas.map((f, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{f.contexto}</span>
                            <span className="font-medium">{new Date(f.fecha).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Payment Methods</p>
                        <div className="flex flex-wrap gap-1">
                          {transcripcion.entidades.metodos_pago.map((m, i) => (
                            <Badge key={i} variant="secondary">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Analysis in progress...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcription" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-4">
                    {transcripcion.segmentos.map((seg, i) => (
                      <div key={i} className={cn(
                        "flex gap-3",
                        seg.speaker === 'agente' ? "" : "flex-row-reverse"
                      )}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(
                            "text-xs",
                            seg.speaker === 'agente' ? "bg-primary/10 text-primary" : "bg-secondary"
                          )}>
                            {seg.speaker === 'agente' ? 'AG' : 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[70%] rounded-xl px-4 py-2",
                          seg.speaker === 'agente' ? "bg-primary/10" : "bg-secondary"
                        )}>
                          <p className="text-sm">{seg.texto}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDuration(Math.floor(seg.timestamp_inicio))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            {analisis?.recomendaciones && analisis.recomendaciones.length > 0 ? (
              <div className="space-y-4">
                {analisis.recomendaciones.map((rec, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <Badge variant={
                        rec.prioridad === 'alta' ? 'destructive' : 
                        rec.prioridad === 'media' ? 'warning' : 'secondary'
                      }>
                        {rec.prioridad}
                      </Badge>
                      <div>
                        <p className="font-medium">{rec.accion}</p>
                        <p className="text-sm text-muted-foreground">Assignee: {rec.destinatario}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No recommendations for this call
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
