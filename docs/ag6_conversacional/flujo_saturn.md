# Flujo Saturn Studio - Agente Conversacional

## Diagrama del Flujo

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  START  │────▶│   Receive   │────▶│    Q&A      │────▶│  Response   │
│         │     │   Webhook   │     │   Agent     │     │  Webhook    │
└─────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │    Tool:    │
                                    │ filterTable │
                                    └─────────────┘
```

## Configuracion de Nodos

### Nodo 1: Receive Webhook

**Tipo**: webhooks > getWebhook

**Configuracion**:
```json
{
  "module_name": "webhooks",
  "module": "getWebhook",
  "var_": "wh_in",
  "method": "POST",
  "mode": 2
}
```

**Variable de salida**: `wh_in`

**Contenido de wh_in**:
```json
{
  "id": "task-id-para-response",
  "message": "Como esta Maria Lopez?",
  "conversation_id": "conv-123",
  "history": [...],
  "context": {...}
}
```

---

### Nodo 2: Q&A Agent

**Tipo**: AI > questionAnswerAgent

**Configuracion**:
```json
{
  "tools": "[herramientas con filterTable]",
  "credential_ai": "tu-credential-id",
  "model": "gpt-4o-mini",
  "result": "var_agent_res",
  "temperature": "0.2",
  "max_tokens": "400",
  "top_p": "0.9",
  "frequency_penalty": "0.3"
}
```

**IMPORTANTE - Configuracion del Modelo:**
- **Temperature:** 0.2 (CRITICO - evita tool calls multiples)
- **Max Tokens:** 400 (respuestas concisas)
- **Frequency Penalty:** 0.3 (evita repeticion)

**System Prompt** (copiar exactamente desde `prompt_completo.md`):
```
# AGENTE CONVERSACIONAL NODUS

Eres el asistente del sistema NODUS (analisis de llamadas de cobranza).

**Mensaje del usuario:** {var_message}

---

## REGLA #1: MAXIMO 1 TOOL CALL

**CRITICO:** Haz **MAXIMO 1 llamada** a filterTable por respuesta.

[... resto del prompt desde prompt_completo.md ...]
```

**User Message Variable** (reemplazar en el prompt):
- Variable: `var_message` 
- Valor: `{wh_in.message}`

**NOTA:** El prompt completo se pasa en el System Message. El User Message solo contiene el mensaje del usuario actual.

**Variable de salida**: `var_agent_res`

---

### Nodo 3: Tool - Filter Table (Supabase)

**Tipo**: supabase > filterTable

**Configuracion**:
```json
{
  "module_name": "supabase",
  "module": "filterTable",
  "result": "tbl",
  "credential": "tu-supabase-credential",
  "table_name": "${{$ai_tool_params}.table_name}",
  "filter_column": "${{$ai_tool_params}.filter_column}",
  "filter_value": "${{$ai_tool_params}.filter_value}"
}
```

**Variable de salida**: `tbl`

Este nodo se ejecuta cuando el Q&A Agent decide usar la herramienta.

---

### Nodo 4: Response Webhook

**Tipo**: webhooks > responseWebhook

**Configuracion**:
```json
{
  "module_name": "webhooks",
  "module": "responseWebhook",
  "result": "wh_out",
  "task_id": "${{wh_in}.id}"
}
```

**Body del Response** (configurar en Saturn):
```json
{
  "success": true,
  "response": {
    "message": "{var_agent_res.message}",
    "type": "{var_agent_res.type}",
    "data": "{var_agent_res.data}",
    "suggestions": "{var_agent_res.suggestions}"
  },
  "conversation_id": "{wh_in.conversation_id}",
  "timestamp": "{now}"
}
```

---

## Definicion de la Tool (filterTable)

**IMPORTANTE:** Esta descripcion es CRITICA para que el LLM no haga multiples llamadas.

### JSON Schema para Saturn Studio

```json
{
  "name": "filterTable",
  "description": "Consulta una tabla de Supabase con filtros opcionales. Devuelve array de objetos JSON. REGLA CRITICA: Solo llamar UNA VEZ por consulta del usuario - NO reintentar si el array esta vacio.",
  "parameters": {
    "type": "object",
    "properties": {
      "table_name": {
        "type": "string",
        "description": "Tabla a consultar",
        "enum": [
          "vista_resumen_agentes",
          "alertas_anomalias",
          "analisis_llamadas",
          "coaching_reports"
        ]
      },
      "filter_column": {
        "type": "string",
        "description": "Columna para filtrar. Dejar vacio ('') para obtener todos los registros.",
        "default": ""
      },
      "filter_value": {
        "type": "string",
        "description": "Valor del filtro. Dejar vacio ('') si filter_column esta vacio.",
        "default": ""
      }
    },
    "required": ["table_name"]
  }
}
```

### Puntos Clave de la Tool

1. **Description incluye "REGLA CRITICA"** - Esto ayuda al LLM a no reintentar
2. **enum en table_name** - Limita las opciones validas
3. **default en filter_column y filter_value** - Permite llamadas sin filtros
4. **Solo table_name es required** - Simplifica el uso

### Formato de Retorno Esperado

La tool **DEBE** devolver este formato:

```json
{
  "data": [
    { "nombre": "Maria Lopez", "score_semana": 78.5, ... }
  ],
  "count": 1
}
```

O si no hay datos:

```json
{
  "data": [],
  "count": 0
}
```

**NUNCA** devolver `null`, `undefined`, o lanzar error cuando no hay resultados.

---

## Conexiones del Flujo

```
START 
  └──▶ Receive Webhook (output_1)
         └──▶ Q&A Agent (input_1)
               ├──▶ Response Webhook (output_1) [respuesta final]
               └──▶ Filter Table (output_2) [cuando usa tool]
```

---

## Variables del Flujo

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `wh_in` | Payload del webhook entrante | `{message, history, ...}` |
| `wh_in.id` | Task ID para response | `"task-abc123"` |
| `var_agent_res` | Respuesta del Q&A Agent | `{message, data, ...}` |
| `ai_tool_params` | Parametros de la tool | `{table_name, filter_column, filter_value}` |
| `ai_tool_result` | Resultado de la tool | `{table: [...]}` |
| `tbl` | Alias del resultado | `{table: [...]}` |
| `wh_out` | Confirmacion del response | `{success: true}` |

---

## Webhook URL

Una vez desplegado el flujo en Saturn, obtendras una URL como:

```
https://saturn.rocketbot.com/webhook/AG006_livechat/abc123xyz
```

Esta URL se configura en el frontend para enviar los mensajes.

