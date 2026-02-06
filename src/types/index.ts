// ============================================
// NODUS - Type Definitions
// Sistema de Análisis Inteligente de Cobranza
// ============================================

// ---------- Enums ----------

export type EstadoLlamada = 'pendiente' | 'transcrito' | 'analizado' | 'error'
export type NivelCumplimiento = 'baja' | 'media' | 'alta'
export type Severidad = 'critica' | 'alta' | 'media' | 'baja'
export type EstadoAlerta = 'nueva' | 'en_revision' | 'resuelta' | 'falso_positivo'
export type Speaker = 'agente' | 'cliente'
export type Emocion = 'neutral' | 'positivo' | 'negativo'

// ---------- Llamadas ----------

export interface Llamada {
  llamada_id: string
  audio_url: string
  audio_format?: string
  duracion_segundos: number
  timestamp_inicio: string
  timestamp_fin: string
  agente_id: string
  agente_nombre?: string
  cliente_id: string
  deuda_id?: string
  campana?: string
  tipo_deuda?: string
  estado: EstadoLlamada
  created_at: string
  updated_at: string
}

// ---------- Transcripciones ----------

export interface Segmento {
  speaker: Speaker
  timestamp_inicio: number
  timestamp_fin?: number
  texto: string
  emocion: Emocion
  velocidad_habla?: number
}

export interface EntidadMonto {
  valor: number
  moneda: string
  contexto: string
}

export interface EntidadFecha {
  fecha: string
  contexto: string
}

export interface EntidadesDetectadas {
  montos: EntidadMonto[]
  fechas: EntidadFecha[]
  metodos_pago: string[]
}

export interface Transcripcion {
  transcripcion_id: string
  llamada_id: string
  transcripcion_completa: string
  segmentos: Segmento[]
  entidades: EntidadesDetectadas
  analisis_conversacion?: {
    interrupciones: number
    silencios: number
    palabras_clave: string[]
  }
  metricas_audio?: {
    calidad: number
    ruido: number
    inaudibles: number
  }
  created_at: string
}

// ---------- Análisis ----------

export interface DesgloseItem {
  presente: boolean
  puntos: number
  evidencia?: string
}

export interface ModuloContactoDirecto {
  score: number
  desglose: {
    monto_mencionado: DesgloseItem
    fecha_vencimiento: DesgloseItem
    consecuencias_impago: DesgloseItem
    alternativas_pago: DesgloseItem
    manejo_objeciones: DesgloseItem & {
      objeciones_detectadas?: number
      calidad?: number
    }
  }
}

export interface ModuloCompromisoPago {
  score: number
  desglose: {
    oferta_clara: DesgloseItem
    alternativas_pago: DesgloseItem
    fecha_especifica: DesgloseItem
    validacion_cliente: DesgloseItem & {
      tipo?: 'explicita' | 'implicita' | 'ausente'
      frase_exacta?: string
    }
  }
}

export interface ModuloAbandono {
  hubo_abandono: boolean
  momento?: number
  razon?: string
  patron?: string
}

export interface PrediccionCumplimiento {
  probabilidad: number
  nivel: NivelCumplimiento
  factores_positivos: string[]
  factores_negativos: string[]
  razonamiento: string
}

export interface Alerta {
  tipo: 'advertencia' | 'critica' | 'info'
  codigo: string
  mensaje: string
}

export interface Recomendacion {
  prioridad: 'alta' | 'media' | 'baja'
  destinatario: 'supervisor' | 'agente' | 'ti'
  accion: string
}

export interface AnalisisLlamada {
  analisis_id: string
  llamada_id: string
  transcripcion_id: string
  score_total: number
  score_contacto_directo: number
  score_compromiso_pago: number
  modulo_contacto_directo: ModuloContactoDirecto
  modulo_compromiso_pago: ModuloCompromisoPago
  modulo_abandono: ModuloAbandono
  prediccion_cumplimiento: PrediccionCumplimiento
  alertas: Alerta[]
  recomendaciones: Recomendacion[]
  modelo_usado?: string
  version_prompt?: string
  confianza_analisis?: number
  created_at: string
}

// ---------- Agentes ----------

export interface Agente {
  agente_id: string
  nombre: string
  email?: string
  fecha_ingreso?: string
  estado: 'activo' | 'inactivo' | 'vacaciones'
  equipo?: string
  supervisor_id?: string
  avatar_url?: string
  created_at: string
}

export interface MetricasAgente {
  total_llamadas: number
  score_promedio: number
  tasa_validacion: number
  probabilidad_cumplimiento_promedio: number
  tendencia: 'mejorando' | 'estable' | 'decayendo'
  ranking?: number
  percentil?: number
}

// ---------- Coaching ----------

export interface Fortaleza {
  area: string
  descripcion: string
  evidencia: string
}

export interface GapCritico {
  area: string
  descripcion: string
  impacto: string
  ejemplos_llamadas: string[]
}

export interface AccionMejora {
  accion: string
  como: string
  prioridad: 'alta' | 'media' | 'baja'
}

export interface LlamadaParaRevisar {
  llamada_id: string
  razon: string
  que_observar: string
}

export interface PlanMejora {
  objetivo_semana: string
  acciones: AccionMejora[]
  llamadas_para_revisar: LlamadaParaRevisar[]
}

export interface CoachingReport {
  reporte_id: string
  agente_id: string
  nombre_agente: string
  fecha_reporte: string
  periodo_inicio: string
  periodo_fin: string
  total_llamadas_analizadas: number
  metricas_periodo: MetricasAgente
  comparativa_equipo?: {
    score_equipo: number
    validacion_equipo: number
  }
  fortalezas: Fortaleza[]
  gap_critico: GapCritico
  plan_mejora: PlanMejora
  created_at: string
}

// ---------- Alertas/Anomalías ----------

export interface AlertaAnomalia {
  alerta_id: string
  tipo: 'individual' | 'sistemica' | 'patron'
  severidad: Severidad
  categoria?: string
  descripcion: string
  datos_soporte?: Record<string, unknown>
  causa_probable?: string
  impacto_estimado?: {
    llamadas_afectadas: number
    perdida_oportunidades?: number
  }
  accion_recomendada?: {
    urgencia: 'inmediata' | 'hoy' | 'esta_semana'
    destinatario: string
    accion: string
  }
  llamadas_relacionadas?: string[]
  agentes_relacionados?: string[]
  estado: EstadoAlerta
  notificacion_enviada: boolean
  created_at: string
}

// ---------- Chat ----------

export interface ChatMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  visualizaciones?: ChatVisualizacion[]
  acciones_sugeridas?: ChatAccion[]
  preguntas_relacionadas?: string[]
}

export interface ChatVisualizacion {
  tipo: 'chart' | 'table' | 'metric'
  data: Record<string, unknown>
}

export interface ChatAccion {
  tipo: string
  label: string
  accion: string
  parametros?: Record<string, unknown>
}

// ---------- Dashboard ----------

export interface DashboardMetrics {
  total_llamadas: number
  llamadas_hoy: number
  score_promedio: number
  cambio_score: number
  tasa_validacion: number
  cambio_validacion: number
  probabilidad_promedio: number
  cambio_probabilidad: number
  alertas_activas: number
  monto_comprometido: number
}

export interface TendenciaDia {
  fecha: string
  llamadas: number
  score: number
  validacion: number
}

// ---------- Estrategia ----------

export interface HallazgoEstrategico {
  titulo: string
  categoria: 'temporal' | 'script' | 'agente' | 'cliente'
  descripcion: string
  hipotesis?: string
  recomendacion: string
  impacto_proyectado: {
    metrica: string
    mejora_esperada: number
    confianza: 'alta' | 'media' | 'baja'
  }
}

export interface ReporteEstrategia {
  fecha_reporte: string
  periodo: {
    inicio: string
    fin: string
    dias: number
  }
  resumen_ejecutivo: {
    total_llamadas: number
    score_promedio: number
    cambio_vs_anterior: number
    logros: string[]
    preocupaciones: string[]
  }
  hallazgos_estrategicos: HallazgoEstrategico[]
  analisis_temporal: {
    mejor_dia: string
    peor_dia: string
    mejor_hora: string
  }
  top_performers: Array<{
    agente: string
    score: number
    patron_clave: string
  }>
}

