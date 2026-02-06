# Plan de Implementacion - Agente Conversacional

## Resumen

| Componente | Tecnologia | Tiempo Estimado |
|------------|------------|-----------------|
| Flujo Saturn | Saturn Studio | 1-2 horas |
| Prompt Q&A Agent | Texto | 30 min |
| Frontend Chat | React + TypeScript | 2-3 horas |
| Integracion Webhook | Fetch API | 1 hora |
| **Total** | | **5-6 horas** |

---

## Fase 1: Configurar Flujo en Saturn Studio

### Paso 1.1: Crear nuevo flujo
- [ ] Crear flujo "AG006_livechat"
- [ ] Agregar nodo: Receive Webhook (POST)
- [ ] Configurar variable de salida: `wh_in`

### Paso 1.2: Configurar Q&A Agent
- [ ] Agregar nodo: Q&A Agent
- [ ] Seleccionar modelo: `gpt-4o-mini` o `gpt-4o`
- [ ] Configurar temperatura: `0.7`
- [ ] Pegar System Prompt completo (de prompt_completo.md)
- [ ] Configurar User Message con variables: `{wh_in.message}`, `{wh_in.history}`
- [ ] Variable de salida: `var_agent_res`

### Paso 1.3: Agregar Tool (filterTable)
- [ ] Agregar nodo: supabase > filterTable
- [ ] Conectar credencial de Supabase
- [ ] Configurar parametros dinamicos:
  - table_name: `${{$ai_tool_params}.table_name}`
  - filter_column: `${{$ai_tool_params}.filter_column}`
  - filter_value: `${{$ai_tool_params}.filter_value}`
- [ ] Conectar output_2 del Q&A Agent a este nodo

### Paso 1.4: Response Webhook
- [ ] Agregar nodo: Response Webhook
- [ ] Configurar task_id: `${{wh_in}.id}`
- [ ] Configurar body de respuesta con `{var_agent_res}`

### Paso 1.5: Conectar y probar
- [ ] Conectar todos los nodos
- [ ] Publicar flujo
- [ ] Obtener URL del webhook
- [ ] Probar con Postman/curl

---

## Fase 2: Actualizar Frontend

### Paso 2.1: Crear servicio de chat
- [ ] Crear `src/services/chatService.ts`
- [ ] Implementar funcion `sendMessage()`
- [ ] Manejar timeout y reintentos

### Paso 2.2: Crear store de chat
- [ ] Crear `src/stores/chatStore.ts`
- [ ] Estado: messages, loading, error
- [ ] Acciones: sendMessage, clearChat

### Paso 2.3: Actualizar Chat.tsx
- [ ] Integrar chatStore
- [ ] Implementar indicador de typing
- [ ] Renderizar diferentes tipos de respuesta
- [ ] Agregar sugerencias clickeables

### Paso 2.4: Componentes auxiliares
- [ ] ChatMessage (texto, data, error)
- [ ] ChatMetrics (tarjetas de KPIs)
- [ ] ChatTable (tabla de datos)
- [ ] TypingIndicator (dots animados)

---

## Fase 3: Testing

### Paso 3.1: Pruebas del flujo
- [ ] Pregunta simple: "Hola"
- [ ] Consulta de agente: "Como esta Maria Lopez?"
- [ ] Consulta de alertas: "Hay alertas criticas?"
- [ ] Consulta de metricas: "Cual es el score promedio?"
- [ ] Pregunta fuera de scope: "Cual es la capital de Francia?"

### Paso 3.2: Pruebas de frontend
- [ ] Envio de mensaje
- [ ] Indicador de typing visible
- [ ] Respuesta renderizada correctamente
- [ ] Historial persistido
- [ ] Manejo de errores

---

## Archivos a Crear/Modificar

### Nuevos Archivos

```
src/
├── services/
│   └── chatService.ts       # Servicio para webhook
├── stores/
│   └── chatStore.ts         # Estado del chat
└── components/
    └── chat/
        ├── ChatMessage.tsx  # Componente de mensaje
        ├── ChatInput.tsx    # Input con boton
        ├── TypingIndicator.tsx
        └── ChatDataCard.tsx # Renderizado de datos
```

### Archivos a Modificar

```
src/
└── pages/
    └── Chat.tsx             # Integracion completa
```

---

## Configuracion de Variables de Entorno

Agregar al `.env`:

```env
VITE_SATURN_WEBHOOK_URL=https://saturn.rocketbot.com/webhook/AG006_livechat/xxx
```

---

## Codigo de Referencia

### chatService.ts

```typescript
const WEBHOOK_URL = import.meta.env.VITE_SATURN_WEBHOOK_URL

interface ChatRequest {
  message: string
  conversation_id: string
  history: ChatMessage[]
  context?: Record<string, unknown>
}

interface ChatResponse {
  success: boolean
  response: {
    message: string
    type: 'text' | 'data' | 'metrics' | 'chart' | 'error'
    data?: unknown
    suggestions?: string[]
  }
  conversation_id: string
  timestamp: string
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...request,
      timestamp: new Date().toISOString()
    })
  })

  if (!response.ok) {
    throw new Error('Error al enviar mensaje')
  }

  return response.json()
}
```

### TypingIndicator.tsx

```typescript
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3">
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
```

---

## Checklist Final

- [ ] Flujo Saturn publicado y URL obtenida
- [ ] Variable de entorno configurada en frontend
- [ ] Chat.tsx integrado con webhook
- [ ] Typing indicator funcionando
- [ ] Respuestas renderizadas correctamente
- [ ] Historial de conversacion persistido
- [ ] Manejo de errores implementado
- [ ] Pruebas completas realizadas




