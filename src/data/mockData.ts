import type { 
  Llamada, 
  AnalisisLlamada, 
  Agente, 
  AlertaAnomalia,
  Transcripcion,
  CoachingReport,
  DashboardMetrics,
  TendenciaDia
} from '@/types'

// Agentes
export const mockAgentes: Agente[] = [
  { agente_id: '1', nombre: 'Carlos Ramírez', email: 'carlos@360.com', estado: 'activo', equipo: 'Equipo A', created_at: '2025-01-01' },
  { agente_id: '2', nombre: 'María González', email: 'maria@360.com', estado: 'activo', equipo: 'Equipo A', created_at: '2025-01-01' },
  { agente_id: '3', nombre: 'José Pérez', email: 'jose@360.com', estado: 'activo', equipo: 'Equipo B', created_at: '2025-02-15' },
  { agente_id: '4', nombre: 'Ana Martínez', email: 'ana@360.com', estado: 'activo', equipo: 'Equipo B', created_at: '2025-03-01' },
  { agente_id: '5', nombre: 'Luis Torres', email: 'luis@360.com', estado: 'activo', equipo: 'Equipo A', created_at: '2025-01-15' },
]

// Llamadas
export const mockLlamadas: (Llamada & { agente_nombre: string })[] = [
  {
    llamada_id: 'call-001',
    audio_url: '/audio/call-001.mp3',
    duracion_segundos: 245,
    timestamp_inicio: '2026-01-30T14:23:15Z',
    timestamp_fin: '2026-01-30T14:27:20Z',
    agente_id: '2',
    agente_nombre: 'María González',
    cliente_id: 'CL-45632',
    campana: 'Recuperación Q1',
    tipo_deuda: 'Tarjeta de crédito',
    estado: 'analizado',
    created_at: '2026-01-30T14:23:15Z',
    updated_at: '2026-01-30T14:30:00Z',
  },
  {
    llamada_id: 'call-002',
    audio_url: '/audio/call-002.mp3',
    duracion_segundos: 312,
    timestamp_inicio: '2026-01-30T13:45:00Z',
    timestamp_fin: '2026-01-30T13:50:12Z',
    agente_id: '1',
    agente_nombre: 'Carlos Ramírez',
    cliente_id: 'CL-78901',
    campana: 'Recuperación Q1',
    tipo_deuda: 'Préstamo personal',
    estado: 'analizado',
    created_at: '2026-01-30T13:45:00Z',
    updated_at: '2026-01-30T13:55:00Z',
  },
  {
    llamada_id: 'call-003',
    audio_url: '/audio/call-003.mp3',
    duracion_segundos: 189,
    timestamp_inicio: '2026-01-30T12:30:00Z',
    timestamp_fin: '2026-01-30T12:33:09Z',
    agente_id: '3',
    agente_nombre: 'José Pérez',
    cliente_id: 'CL-23456',
    campana: 'Gestión temprana',
    tipo_deuda: 'Tarjeta de crédito',
    estado: 'analizado',
    created_at: '2026-01-30T12:30:00Z',
    updated_at: '2026-01-30T12:40:00Z',
  },
  {
    llamada_id: 'call-004',
    audio_url: '/audio/call-004.mp3',
    duracion_segundos: 156,
    timestamp_inicio: '2026-01-30T11:15:00Z',
    timestamp_fin: '2026-01-30T11:17:36Z',
    agente_id: '2',
    agente_nombre: 'María González',
    cliente_id: 'CL-34567',
    campana: 'Recuperación Q1',
    tipo_deuda: 'Préstamo personal',
    estado: 'analizado',
    created_at: '2026-01-30T11:15:00Z',
    updated_at: '2026-01-30T11:25:00Z',
  },
  {
    llamada_id: 'call-005',
    audio_url: '/audio/call-005.mp3',
    duracion_segundos: 278,
    timestamp_inicio: '2026-01-30T10:00:00Z',
    timestamp_fin: '2026-01-30T10:04:38Z',
    agente_id: '4',
    agente_nombre: 'Ana Martínez',
    cliente_id: 'CL-89012',
    campana: 'Gestión temprana',
    tipo_deuda: 'Tarjeta de crédito',
    estado: 'transcrito',
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:10:00Z',
  },
]

// Análisis de llamadas
export const mockAnalisis: Record<string, AnalisisLlamada> = {
  'call-001': {
    analisis_id: 'ana-001',
    llamada_id: 'call-001',
    transcripcion_id: 'trans-001',
    score_total: 72,
    score_contacto_directo: 85,
    score_compromiso_pago: 58,
    modulo_contacto_directo: {
      score: 85,
      desglose: {
        monto_mencionado: { presente: true, puntos: 25, evidencia: 'su saldo vencido de 1,450 soles' },
        fecha_vencimiento: { presente: true, puntos: 15, evidencia: 'vencido desde el 15 de enero' },
        consecuencias_impago: { presente: false, puntos: 0 },
        alternativas_pago: { presente: true, puntos: 15, evidencia: 'puede pagar por web, app o en agencia' },
        manejo_objeciones: { presente: true, puntos: 21, objeciones_detectadas: 2, calidad: 0.85 },
      }
    },
    modulo_compromiso_pago: {
      score: 58,
      desglose: {
        oferta_clara: { presente: true, puntos: 20 },
        alternativas_pago: { presente: true, puntos: 10 },
        fecha_especifica: { presente: true, puntos: 20, evidencia: 'el 15 de febrero' },
        validacion_cliente: { presente: false, puntos: 8, tipo: 'implicita', frase_exacta: 'ok, entiendo' },
      }
    },
    modulo_abandono: {
      hubo_abandono: false,
    },
    prediccion_cumplimiento: {
      probabilidad: 58,
      nivel: 'media',
      factores_positivos: ['Fecha específica acordada', 'Buena comunicación del agente', 'Cliente receptivo'],
      factores_negativos: ['Falta validación explícita (-30pts)', 'Cliente con 2 incumplimientos previos'],
      razonamiento: 'Aunque hay fecha y monto claro, la ausencia de validación explícita reduce el cumplimiento. Históricamente, sin validación solo 4 de 10 pagan.',
    },
    alertas: [
      { tipo: 'advertencia', codigo: 'FALTA_VALIDACION', mensaje: 'Cliente NO validó explícitamente el compromiso' },
    ],
    recomendaciones: [
      { prioridad: 'alta', destinatario: 'supervisor', accion: 'Llamar en 48hrs para reforzar compromiso con validación explícita' },
      { prioridad: 'media', destinatario: 'agente', accion: 'Practicar técnica de cierre con validación' },
    ],
    modelo_usado: 'claude-opus-4.5',
    version_prompt: '1.2.0',
    confianza_analisis: 0.89,
    created_at: '2026-01-30T14:30:00Z',
  },
  'call-002': {
    analisis_id: 'ana-002',
    llamada_id: 'call-002',
    transcripcion_id: 'trans-002',
    score_total: 89,
    score_contacto_directo: 92,
    score_compromiso_pago: 86,
    modulo_contacto_directo: {
      score: 92,
      desglose: {
        monto_mencionado: { presente: true, puntos: 25, evidencia: 'deuda total de 3,200 soles' },
        fecha_vencimiento: { presente: true, puntos: 15 },
        consecuencias_impago: { presente: true, puntos: 18, evidencia: 'podría afectar su historial crediticio' },
        alternativas_pago: { presente: true, puntos: 15 },
        manejo_objeciones: { presente: true, puntos: 19, objeciones_detectadas: 1, calidad: 0.95 },
      }
    },
    modulo_compromiso_pago: {
      score: 86,
      desglose: {
        oferta_clara: { presente: true, puntos: 20 },
        alternativas_pago: { presente: true, puntos: 10 },
        fecha_especifica: { presente: true, puntos: 20 },
        validacion_cliente: { presente: true, puntos: 36, tipo: 'explicita', frase_exacta: 'Sí, confirmo que pagaré el viernes 2 de febrero' },
      }
    },
    modulo_abandono: {
      hubo_abandono: false,
    },
    prediccion_cumplimiento: {
      probabilidad: 82,
      nivel: 'alta',
      factores_positivos: ['Validación explícita del cliente', 'Excelente manejo de objeciones', 'Fecha específica confirmada'],
      factores_negativos: ['Primera deuda del cliente'],
      razonamiento: 'Alta probabilidad de cumplimiento debido a la validación explícita y el compromiso verbal claro del cliente.',
    },
    alertas: [],
    recomendaciones: [
      { prioridad: 'baja', destinatario: 'agente', accion: 'Enviar recordatorio SMS 1 día antes' },
    ],
    modelo_usado: 'claude-opus-4.5',
    version_prompt: '1.2.0',
    confianza_analisis: 0.94,
    created_at: '2026-01-30T13:55:00Z',
  },
  'call-003': {
    analisis_id: 'ana-003',
    llamada_id: 'call-003',
    transcripcion_id: 'trans-003',
    score_total: 34,
    score_contacto_directo: 45,
    score_compromiso_pago: 22,
    modulo_contacto_directo: {
      score: 45,
      desglose: {
        monto_mencionado: { presente: true, puntos: 25 },
        fecha_vencimiento: { presente: false, puntos: 0 },
        consecuencias_impago: { presente: false, puntos: 0 },
        alternativas_pago: { presente: true, puntos: 12 },
        manejo_objeciones: { presente: false, puntos: 8, objeciones_detectadas: 3, calidad: 0.32 },
      }
    },
    modulo_compromiso_pago: {
      score: 22,
      desglose: {
        oferta_clara: { presente: true, puntos: 14 },
        alternativas_pago: { presente: false, puntos: 0 },
        fecha_especifica: { presente: false, puntos: 0 },
        validacion_cliente: { presente: false, puntos: 8, tipo: 'ausente' },
      }
    },
    modulo_abandono: {
      hubo_abandono: true,
      momento: 156,
      razon: 'Cliente colgó molesto',
      patron: 'abandono_por_frustracion',
    },
    prediccion_cumplimiento: {
      probabilidad: 12,
      nivel: 'baja',
      factores_positivos: [],
      factores_negativos: ['Abandono de llamada', 'Sin compromiso de fecha', 'Cliente frustrado', 'Mal manejo de objeciones'],
      razonamiento: 'Muy baja probabilidad debido al abandono y la falta de compromiso. Se requiere seguimiento urgente con otro enfoque.',
    },
    alertas: [
      { tipo: 'critica', codigo: 'ABANDONO_LLAMADA', mensaje: 'Cliente abandonó la llamada frustrado' },
      { tipo: 'critica', codigo: 'SCORE_BAJO', mensaje: 'Score por debajo del umbral mínimo (34/100)' },
    ],
    recomendaciones: [
      { prioridad: 'alta', destinatario: 'supervisor', accion: 'Reasignar cliente a agente senior' },
      { prioridad: 'alta', destinatario: 'agente', accion: 'Revisar llamada con supervisor para feedback' },
    ],
    modelo_usado: 'claude-opus-4.5',
    version_prompt: '1.2.0',
    confianza_analisis: 0.91,
    created_at: '2026-01-30T12:40:00Z',
  },
  'call-004': {
    analisis_id: 'ana-004',
    llamada_id: 'call-004',
    transcripcion_id: 'trans-004',
    score_total: 65,
    score_contacto_directo: 70,
    score_compromiso_pago: 60,
    modulo_contacto_directo: {
      score: 70,
      desglose: {
        monto_mencionado: { presente: true, puntos: 25 },
        fecha_vencimiento: { presente: true, puntos: 15 },
        consecuencias_impago: { presente: false, puntos: 0 },
        alternativas_pago: { presente: true, puntos: 15 },
        manejo_objeciones: { presente: true, puntos: 15, objeciones_detectadas: 1, calidad: 0.6 },
      }
    },
    modulo_compromiso_pago: {
      score: 60,
      desglose: {
        oferta_clara: { presente: true, puntos: 20 },
        alternativas_pago: { presente: true, puntos: 10 },
        fecha_especifica: { presente: true, puntos: 20 },
        validacion_cliente: { presente: false, puntos: 10, tipo: 'implicita' },
      }
    },
    modulo_abandono: {
      hubo_abandono: false,
    },
    prediccion_cumplimiento: {
      probabilidad: 45,
      nivel: 'media',
      factores_positivos: ['Fecha acordada', 'Alternativas de pago claras'],
      factores_negativos: ['Sin validación explícita', 'Tono del cliente indeciso'],
      razonamiento: 'Probabilidad media. Se recomienda llamada de seguimiento para confirmar compromiso.',
    },
    alertas: [
      { tipo: 'advertencia', codigo: 'FALTA_VALIDACION', mensaje: 'Validación del cliente fue implícita' },
    ],
    recomendaciones: [
      { prioridad: 'media', destinatario: 'supervisor', accion: 'Programar llamada de seguimiento en 24hrs' },
    ],
    modelo_usado: 'claude-opus-4.5',
    version_prompt: '1.2.0',
    confianza_analisis: 0.87,
    created_at: '2026-01-30T11:25:00Z',
  },
}

// Transcripción de ejemplo
export const mockTranscripcion: Transcripcion = {
  transcripcion_id: 'trans-001',
  llamada_id: 'call-001',
  transcripcion_completa: '...',
  segmentos: [
    { speaker: 'agente', timestamp_inicio: 0, texto: 'Buenos días, ¿hablo con el señor García?', emocion: 'neutral', velocidad_habla: 142 },
    { speaker: 'cliente', timestamp_inicio: 3, texto: 'Sí, soy yo. ¿De dónde me llama?', emocion: 'neutral', velocidad_habla: 138 },
    { speaker: 'agente', timestamp_inicio: 6, texto: 'Le llamo del área de recuperación. Quería hablarle sobre su saldo vencido de 1,450 soles en su tarjeta de crédito.', emocion: 'neutral', velocidad_habla: 145 },
    { speaker: 'cliente', timestamp_inicio: 15, texto: 'Ah sí, es que he tenido algunos problemas este mes.', emocion: 'negativo', velocidad_habla: 130 },
    { speaker: 'agente', timestamp_inicio: 20, texto: 'Entiendo perfectamente, todos podemos pasar por momentos difíciles. ¿Me podría comentar cuál es su situación actual?', emocion: 'positivo', velocidad_habla: 140 },
    { speaker: 'cliente', timestamp_inicio: 28, texto: 'Bueno, tuve un gasto imprevisto de salud y me quedé corto este mes.', emocion: 'negativo', velocidad_habla: 125 },
    { speaker: 'agente', timestamp_inicio: 35, texto: 'Lamento escuchar eso. Le cuento que tenemos varias opciones para ayudarle. Puede pagar por web, app o en cualquier agencia bancaria.', emocion: 'positivo', velocidad_habla: 148 },
    { speaker: 'cliente', timestamp_inicio: 45, texto: 'Mmm, ¿y no hay algún plan de pagos?', emocion: 'neutral', velocidad_habla: 135 },
    { speaker: 'agente', timestamp_inicio: 50, texto: 'Por supuesto, podemos ofrecerle un fraccionamiento. ¿Para cuándo podría comprometerse a realizar un primer pago?', emocion: 'positivo', velocidad_habla: 142 },
    { speaker: 'cliente', timestamp_inicio: 58, texto: 'Creo que para el 15 de febrero podría tener algo.', emocion: 'neutral', velocidad_habla: 128 },
    { speaker: 'agente', timestamp_inicio: 65, texto: 'Perfecto, entonces quedamos que el 15 de febrero realizará un pago. ¿Le parece bien?', emocion: 'positivo', velocidad_habla: 145 },
    { speaker: 'cliente', timestamp_inicio: 72, texto: 'Ok, entiendo.', emocion: 'neutral', velocidad_habla: 120 },
    { speaker: 'agente', timestamp_inicio: 75, texto: 'Excelente. Le estaremos enviando un recordatorio. ¿Algo más en lo que pueda ayudarle?', emocion: 'positivo', velocidad_habla: 150 },
    { speaker: 'cliente', timestamp_inicio: 82, texto: 'No, eso sería todo. Gracias.', emocion: 'neutral', velocidad_habla: 130 },
    { speaker: 'agente', timestamp_inicio: 86, texto: 'Gracias a usted, que tenga un excelente día.', emocion: 'positivo', velocidad_habla: 145 },
  ],
  entidades: {
    montos: [{ valor: 1450, moneda: 'PEN', contexto: 'deuda' }],
    fechas: [{ fecha: '2026-02-15', contexto: 'compromiso' }],
    metodos_pago: ['web', 'app', 'agencia'],
  },
  created_at: '2026-01-30T14:28:00Z',
}

// Alertas activas
export const mockAlertas: AlertaAnomalia[] = [
  {
    alerta_id: 'alert-001',
    tipo: 'individual',
    severidad: 'critica',
    descripcion: 'Score crítico en llamada de José Pérez (34/100). Cliente abandonó frustrado.',
    causa_probable: 'Mal manejo de objeciones',
    impacto_estimado: { llamadas_afectadas: 1, perdida_oportunidades: 1 },
    accion_recomendada: { urgencia: 'inmediata', destinatario: 'supervisor', accion: 'Revisar llamada y dar feedback' },
    agentes_relacionados: ['3'],
    estado: 'nueva',
    notificacion_enviada: false,
    created_at: '2026-01-30T12:42:00Z',
  },
  {
    alerta_id: 'alert-002',
    tipo: 'sistemica',
    severidad: 'alta',
    descripcion: 'Tasa de validación cayó 15% en las últimas 4 horas comparado con ayer.',
    causa_probable: 'Posible cambio en script o perfil de clientes',
    accion_recomendada: { urgencia: 'hoy', destinatario: 'supervisor', accion: 'Revisar las últimas 10 llamadas sin validación' },
    estado: 'nueva',
    notificacion_enviada: true,
    created_at: '2026-01-30T14:00:00Z',
  },
  {
    alerta_id: 'alert-003',
    tipo: 'patron',
    severidad: 'media',
    descripcion: 'María González no logra validación en 68% de sus llamadas esta semana.',
    accion_recomendada: { urgencia: 'esta_semana', destinatario: 'supervisor', accion: 'Sesión de coaching sobre técnica de cierre' },
    agentes_relacionados: ['2'],
    estado: 'en_revision',
    notificacion_enviada: true,
    created_at: '2026-01-30T08:00:00Z',
  },
]

// Dashboard metrics
export const mockDashboardMetrics: DashboardMetrics = {
  total_llamadas: 2847,
  llamadas_hoy: 127,
  score_promedio: 72,
  cambio_score: 5,
  tasa_validacion: 0.52,
  cambio_validacion: -3,
  probabilidad_promedio: 54,
  cambio_probabilidad: 2,
  alertas_activas: 3,
  monto_comprometido: 1250000,
}

// Tendencias
export const mockTendencias: TendenciaDia[] = [
  { fecha: 'Lun', llamadas: 412, score: 68, validacion: 48 },
  { fecha: 'Mar', llamadas: 445, score: 71, validacion: 51 },
  { fecha: 'Mié', llamadas: 398, score: 75, validacion: 55 },
  { fecha: 'Jue', llamadas: 467, score: 73, validacion: 53 },
  { fecha: 'Vie', llamadas: 489, score: 72, validacion: 52 },
  { fecha: 'Sáb', llamadas: 312, score: 74, validacion: 54 },
  { fecha: 'Hoy', llamadas: 127, score: 72, validacion: 52 },
]

// Top performers
export const mockTopPerformers = [
  { agente_id: '1', nombre: 'Carlos Ramírez', score: 89, llamadas: 145, validacion: 78, trend: 'up' as const },
  { agente_id: '5', nombre: 'Luis Torres', score: 82, llamadas: 132, validacion: 71, trend: 'stable' as const },
  { agente_id: '4', nombre: 'Ana Martínez', score: 78, llamadas: 128, validacion: 65, trend: 'up' as const },
  { agente_id: '2', nombre: 'María González', score: 72, llamadas: 156, validacion: 52, trend: 'down' as const },
  { agente_id: '3', nombre: 'José Pérez', score: 58, llamadas: 98, validacion: 38, trend: 'down' as const },
]

