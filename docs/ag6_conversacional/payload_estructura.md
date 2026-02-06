# Estructura de Payloads - Agente Conversacional

## 1. Request: Frontend → Saturn (Webhook POST)

```json
{
  "message": "Como esta Maria Lopez esta semana?",
  "conversation_id": "conv-123456",
  "user_id": "supervisor-001",
  "timestamp": "2026-02-04T10:30:00Z",
  "history": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": "2026-02-04T10:28:00Z"
    },
    {
      "role": "assistant", 
      "content": "Hola! Soy el asistente de NODUS. En que puedo ayudarte?",
      "timestamp": "2026-02-04T10:28:05Z"
    }
  ],
  "context": {
    "current_page": "dashboard",
    "selected_agent_id": null,
    "date_range": {
      "from": "2026-01-28",
      "to": "2026-02-04"
    }
  }
}
```

### Campos del Request

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `message` | string | Si | Mensaje actual del usuario |
| `conversation_id` | string | Si | ID unico de la conversacion |
| `user_id` | string | No | ID del usuario (supervisor/agente) |
| `timestamp` | string | Si | Timestamp ISO del mensaje |
| `history` | array | No | Historial de mensajes previos |
| `context` | object | No | Contexto adicional del frontend |

### Estructura del History

```json
{
  "role": "user" | "assistant",
  "content": "Texto del mensaje",
  "timestamp": "2026-02-04T10:28:00Z",
  "data": {} // Opcional: datos adjuntos de respuestas anteriores
}
```

---

## 2. Response: Saturn → Frontend (Webhook Response)

### Respuesta Simple (solo texto)

```json
{
  "success": true,
  "response": {
    "message": "Maria Lopez tiene un score promedio de 82 esta semana, con 12 llamadas analizadas. Esta en el puesto #1 de su equipo con una tasa de validacion del 100%.",
    "type": "text"
  },
  "conversation_id": "conv-123456",
  "timestamp": "2026-02-04T10:30:02Z"
}
```

### Respuesta con Datos (tabla/metricas)

```json
{
  "success": true,
  "response": {
    "message": "Aqui estan las alertas criticas activas:",
    "type": "data",
    "data": {
      "type": "table",
      "title": "Alertas Criticas",
      "columns": ["ID", "Descripcion", "Agente", "Creada"],
      "rows": [
        ["ALT-001", "Score bajo en llamada", "Jose Perez", "Hace 2 horas"],
        ["ALT-002", "Abandono de llamada", "Ana Martinez", "Hace 4 horas"]
      ]
    },
    "suggestions": [
      "Ver detalle de la primera alerta",
      "Filtrar por agente",
      "Mostrar alertas de las ultimas 24 horas"
    ]
  },
  "conversation_id": "conv-123456",
  "timestamp": "2026-02-04T10:30:02Z"
}
```

### Respuesta con Metricas

```json
{
  "success": true,
  "response": {
    "message": "Estas son las metricas del equipo hoy:",
    "type": "metrics",
    "data": {
      "type": "metrics",
      "items": [
        { "label": "Score Promedio", "value": "72", "change": "+5", "trend": "up" },
        { "label": "Llamadas", "value": "127", "change": "+12", "trend": "up" },
        { "label": "Validacion", "value": "52%", "change": "-3", "trend": "down" },
        { "label": "Alertas", "value": "3", "change": "0", "trend": "stable" }
      ]
    }
  },
  "conversation_id": "conv-123456",
  "timestamp": "2026-02-04T10:30:02Z"
}
```

### Respuesta con Grafico

```json
{
  "success": true,
  "response": {
    "message": "Tendencia del score en los ultimos 7 dias:",
    "type": "chart",
    "data": {
      "type": "line",
      "title": "Score Semanal",
      "labels": ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
      "datasets": [
        {
          "label": "Score",
          "data": [68, 71, 75, 73, 72, 74, 72]
        }
      ]
    }
  },
  "conversation_id": "conv-123456",
  "timestamp": "2026-02-04T10:30:02Z"
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "QUERY_FAILED",
    "message": "No se pudo consultar la base de datos"
  },
  "response": {
    "message": "Lo siento, hubo un problema al consultar los datos. Por favor intenta de nuevo.",
    "type": "error"
  },
  "conversation_id": "conv-123456",
  "timestamp": "2026-02-04T10:30:02Z"
}
```

---

## 3. Tipos de Respuesta

| Type | Descripcion | Renderizado Frontend |
|------|-------------|---------------------|
| `text` | Solo texto | Mensaje simple |
| `data` | Datos estructurados | Tabla con columnas |
| `metrics` | KPIs | Tarjetas de metricas |
| `chart` | Grafico | Chart (linea, barra) |
| `agent_card` | Info de agente | Tarjeta de perfil |
| `error` | Error | Mensaje de error |

---

## 4. Variables en Saturn

### Variables de Entrada (wh_in)
```
{wh_in} = payload completo del webhook
{wh_in.message} = mensaje del usuario
{wh_in.history} = historial de conversacion
{wh_in.conversation_id} = ID de conversacion
```

### Variables de Salida (var_agent_res)
```
{var_agent_res} = respuesta del Q&A Agent
{var_agent_res.message} = texto de respuesta
{var_agent_res.data} = datos estructurados (si hay)
```

### Variable de Tool Result
```
{ai_tool_result} = resultado de filterTable
{ai_tool_result.table} = array de filas
```




