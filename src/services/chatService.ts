// ============================================
// NODUS - Chat Service
// Comunicacion con Saturn Studio Webhook
// ============================================

// URL del webhook de Saturn - configurar en .env
const WEBHOOK_URL = import.meta.env.VITE_SATURN_WEBHOOK_URL || ''

// ---------- Types ----------

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  data?: ChatResponseData
}

export interface ChatRequest {
  message: string
  conversation_id: string
  user_id?: string
  history: ChatMessage[]
  context?: {
    current_page?: string
    selected_agent_id?: string | null
    date_range?: {
      from: string
      to: string
    }
  }
}

export interface ChatResponseData {
  type: 'table' | 'metrics' | 'chart' | 'agent_card'
  title?: string
  columns?: string[]
  rows?: (string | number)[][]
  items?: Array<{
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'stable'
  }>
  labels?: string[]
  datasets?: Array<{
    label: string
    data: number[]
  }>
}

export interface ChatResponse {
  success: boolean
  response: {
    message: string
    type: 'text' | 'data' | 'metrics' | 'chart' | 'error'
    data?: ChatResponseData
    suggestions?: string[]
  }
  conversation_id: string
  timestamp: string
  error?: {
    code: string
    message: string
  }
}

// ---------- Response Normalizer ----------

/**
 * Normaliza diferentes formatos de respuesta de Saturn
 * Saturn puede enviar:
 * 1. Formato directo: { message, suggestions }
 * 2. Formato wrapped: { success, response: { message, suggestions } }
 * 3. Con output: { output: { message, suggestions } }
 */
function normalizeResponse(data: unknown, conversationId: string): ChatResponse {
  const timestamp = new Date().toISOString()
  
  // Si es null o undefined
  if (!data) {
    return {
      success: false,
      response: {
        message: 'No se recibio respuesta del servidor.',
        type: 'error'
      },
      conversation_id: conversationId,
      timestamp
    }
  }

  const obj = data as Record<string, unknown>

  // Formato 1: Respuesta ya normalizada { success, response }
  if (obj.success !== undefined && obj.response) {
    return data as ChatResponse
  }

  // Formato 2: Saturn output wrapper { output: { message, suggestions } }
  if (obj.output && typeof obj.output === 'object') {
    const output = obj.output as Record<string, unknown>
    return {
      success: true,
      response: {
        message: String(output.message || ''),
        type: 'text',
        suggestions: Array.isArray(output.suggestions) ? output.suggestions : undefined
      },
      conversation_id: conversationId,
      timestamp
    }
  }

  // Formato 3: Respuesta directa del LLM { message, suggestions }
  if (obj.message && typeof obj.message === 'string') {
    return {
      success: true,
      response: {
        message: obj.message,
        type: obj.data ? 'data' : 'text',
        data: obj.data as ChatResponseData | undefined,
        suggestions: Array.isArray(obj.suggestions) ? obj.suggestions : undefined
      },
      conversation_id: conversationId,
      timestamp
    }
  }

  // Formato 4: String directo (el LLM devolvio solo texto)
  if (typeof data === 'string') {
    // Intentar parsear como JSON
    try {
      const parsed = JSON.parse(data)
      return normalizeResponse(parsed, conversationId)
    } catch {
      // Es texto plano
      return {
        success: true,
        response: {
          message: data,
          type: 'text'
        },
        conversation_id: conversationId,
        timestamp
      }
    }
  }

  // Formato desconocido - intentar extraer algo util
  console.warn('Formato de respuesta desconocido:', data)
  return {
    success: true,
    response: {
      message: JSON.stringify(data),
      type: 'text'
    },
    conversation_id: conversationId,
    timestamp
  }
}

// ---------- Service ----------

/**
 * Verifica si el servicio de chat esta configurado
 */
export function isChatConfigured(): boolean {
  return !!WEBHOOK_URL && !WEBHOOK_URL.includes('placeholder')
}

/**
 * Envia un mensaje al agente conversacional via webhook
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // Si no hay webhook configurado, usar respuesta mock
  if (!isChatConfigured()) {
    return getMockResponse(request.message)
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Normalizar respuesta - Saturn puede enviar diferentes formatos
    return normalizeResponse(data, request.conversation_id)

  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return {
        success: false,
        response: {
          message: 'La consulta tardo demasiado. Por favor intenta de nuevo.',
          type: 'error'
        },
        conversation_id: request.conversation_id,
        timestamp: new Date().toISOString(),
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out'
        }
      }
    }

    console.error('Chat service error:', error)
    return {
      success: false,
      response: {
        message: 'Hubo un problema al conectar con el asistente. Verifica tu conexion.',
        type: 'error'
      },
      conversation_id: request.conversation_id,
      timestamp: new Date().toISOString(),
      error: {
        code: 'CONNECTION_ERROR',
        message: (error as Error).message
      }
    }
  }
}

// ---------- Mock Responses (cuando no hay webhook) ----------

function getMockResponse(message: string): ChatResponse {
  const lowerMessage = message.toLowerCase()
  
  // Respuestas mock basadas en keywords
  if (lowerMessage.includes('maria') || lowerMessage.includes('lopez')) {
    return {
      success: true,
      response: {
        message: 'Maria Lopez tiene un **score promedio de 82** esta semana, con **12 llamadas** analizadas.\n\n**Metricas destacadas:**\n- Ranking: #1 en Equipo Norte\n- Tasa de validacion: 100%\n- Probabilidad cumplimiento: 75.6%\n\nExcelente rendimiento!',
        type: 'text',
        suggestions: [
          'Ver detalle del coaching de Maria',
          'Comparar con otros agentes',
          'Ver sus mejores llamadas'
        ]
      },
      conversation_id: 'mock',
      timestamp: new Date().toISOString()
    }
  }

  if (lowerMessage.includes('alerta') || lowerMessage.includes('critica')) {
    return {
      success: true,
      response: {
        message: 'Actualmente hay **3 alertas activas**:',
        type: 'data',
        data: {
          type: 'table',
          title: 'Alertas Activas',
          columns: ['Severidad', 'Descripcion', 'Estado'],
          rows: [
            ['Critica', 'Score bajo en llamada de Jose Perez', 'Nueva'],
            ['Alta', 'Tasa de validacion cayo 15%', 'Nueva'],
            ['Media', 'Maria no logra validacion en 68%', 'En revision']
          ]
        },
        suggestions: [
          'Ver detalle de la alerta critica',
          'Quien es Jose Perez?',
          'Resolver la primera alerta'
        ]
      },
      conversation_id: 'mock',
      timestamp: new Date().toISOString()
    }
  }

  if (lowerMessage.includes('score') || lowerMessage.includes('metrica')) {
    return {
      success: true,
      response: {
        message: 'Aqui estan las metricas principales de hoy:',
        type: 'metrics',
        data: {
          type: 'metrics',
          items: [
            { label: 'Score Promedio', value: '72', change: '+5', trend: 'up' },
            { label: 'Llamadas Hoy', value: '127', change: '+12', trend: 'up' },
            { label: 'Validacion', value: '52%', change: '-3', trend: 'down' },
            { label: 'Alertas', value: '3', change: '0', trend: 'stable' }
          ]
        },
        suggestions: [
          'Por que bajo la validacion?',
          'Quien tiene mejor score?',
          'Tendencia de la semana'
        ]
      },
      conversation_id: 'mock',
      timestamp: new Date().toISOString()
    }
  }

  if (lowerMessage.includes('agente') || lowerMessage.includes('equipo') || lowerMessage.includes('mejor')) {
    return {
      success: true,
      response: {
        message: 'Top 5 agentes por score esta semana:',
        type: 'data',
        data: {
          type: 'table',
          title: 'Ranking de Agentes',
          columns: ['#', 'Agente', 'Score', 'Llamadas', 'Validacion'],
          rows: [
            ['1', 'Carlos Ramirez', '89', '145', '78%'],
            ['2', 'Luis Torres', '82', '132', '71%'],
            ['3', 'Maria Lopez', '82', '12', '100%'],
            ['4', 'Ana Martinez', '78', '128', '65%'],
            ['5', 'Jose Perez', '58', '98', '38%']
          ]
        },
        suggestions: [
          'Como puedo ayudar a Jose Perez?',
          'Ver coaching de Carlos',
          'Comparar Equipo Norte vs Sur'
        ]
      },
      conversation_id: 'mock',
      timestamp: new Date().toISOString()
    }
  }

  // Respuesta generica
  return {
    success: true,
    response: {
      message: 'Entiendo tu consulta. Puedo ayudarte con:\n\n- **Metricas**: Score, validacion, llamadas\n- **Agentes**: Rendimiento individual o de equipo\n- **Alertas**: Estado actual y detalles\n- **Coaching**: Reportes y planes de mejora\n- **Tendencias**: Analisis temporal\n\nPuedes ser mas especifico?',
      type: 'text',
      suggestions: [
        'Como esta Maria Lopez?',
        'Hay alertas criticas?',
        'Cual es el score promedio?',
        'Quien necesita coaching?'
      ]
    },
    conversation_id: 'mock',
    timestamp: new Date().toISOString()
  }
}

// ---------- Helper ----------

/**
 * Genera un ID unico para conversaciones
 */
export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

