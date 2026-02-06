# Agente 2: Analista

## Visión General

El Agente Analista evalúa la calidad de cada llamada usando 3 módulos de scoring, calcula la probabilidad de cumplimiento del compromiso de pago y genera alertas/recomendaciones.

## Pipeline de Procesamiento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AGENTE ANALISTA                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Webhook desde Agente Transcriptor                                   │
│  {registro_id, transcripcion_id}                                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 1: Obtener Contexto (Supabase)                                  │   │
│  │ - SELECT transcripcion completa desde transcripciones                │   │
│  │ - SELECT info del agente desde agentes                               │   │
│  │ - SELECT historial del cliente (llamadas previas)                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 2: Evaluar Módulos (Claude Opus 4.5)                            │   │
│  │                                                                       │   │
│  │ MÓDULO 1: CONTACTO DIRECTO (0-100 pts)                               │   │
│  │ ├─ Monto mencionado claramente (25 pts)                              │   │
│  │ ├─ Fecha vencimiento explicada (15 pts)                              │   │
│  │ ├─ Consecuencias impago mencionadas (20 pts)                         │   │
│  │ ├─ Alternativas de pago ofrecidas (15 pts)                           │   │
│  │ └─ Manejo de objeciones (25 pts)                                     │   │
│  │                                                                       │   │
│  │ MÓDULO 2: COMPROMISO DE PAGO (0-100 pts)                             │   │
│  │ ├─ Oferta clara (20 pts)                                             │   │
│  │ ├─ Alternativas de pago (10 pts)                                     │   │
│  │ ├─ Fecha específica (20 pts)                                         │   │
│  │ └─ VALIDACIÓN EXPLÍCITA del cliente (50 pts) ← CRÍTICO               │   │
│  │                                                                       │   │
│  │ MÓDULO 3: ABANDONO                                                   │   │
│  │ ├─ ¿Hubo abandono?                                                   │   │
│  │ ├─ ¿Quién lo inició?                                                 │   │
│  │ └─ ¿Razón probable?                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 3: Calcular Probabilidad de Cumplimiento (Claude Opus 4.5)      │   │
│  │ - Peso de la validación explícita                                    │   │
│  │ - Historial del cliente                                              │   │
│  │ - Calidad de la gestión del agente                                   │   │
│  │ - Factores contextuales (monto, días mora, tipo deuda)               │   │
│  │ - Output: 0-100% con nivel (baja/media/alta)                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 4: Generar Alertas y Recomendaciones                            │   │
│  │ - Alertas si score < 40 o sin validación                             │   │
│  │ - Recomendaciones accionables por prioridad                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 5: INSERT en Supabase                                           │   │
│  │ - INSERT INTO analisis_llamadas                                      │   │
│  │ - UPDATE registro_llamadas SET estado = 'analizado'                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 6: Trigger Condicional                                          │   │
│  │ - Si alertas críticas → Webhook → Agente Detector                    │   │
│  │ - Si todo OK → Fin del flujo                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Archivos de Prompts

| Archivo | Descripción | Tecnología |
|---------|-------------|------------|
| `prompt_modulos.md` | Evaluación de los 3 módulos de scoring | Claude Opus 4.5 |
| `prompt_prediccion.md` | Cálculo de probabilidad de cumplimiento | Claude Opus 4.5 |
| `reglas_alertas.md` | Reglas para generación de alertas | Lógica |

## Input del Agente

### Webhook desde Transcriptor
```json
{
  "registro_id": "uuid-del-registro",
  "transcripcion_id": "uuid-de-transcripcion"
}
```

### Datos que obtiene de Supabase

```sql
-- Transcripción completa
SELECT * FROM transcripciones WHERE transcripcion_id = $1;

-- Info del agente
SELECT * FROM agentes WHERE agente_id = $1;

-- Historial del cliente (últimas 5 llamadas)
SELECT al.* FROM analisis_llamadas al
JOIN registro_llamadas rl ON al.registro_id = rl.registro_id
WHERE rl.cliente_nombre = $1
ORDER BY al.created_at DESC
LIMIT 5;
```

## Output del Agente

### Estructura de `analisis_llamadas`
```json
{
  "registro_id": "uuid",
  "transcripcion_id": "uuid",
  "agente_id": "uuid",
  
  "score_total": 72,
  "score_contacto_directo": 85,
  "score_compromiso_pago": 58,
  
  "modulo_contacto_directo": {
    "score": 85,
    "desglose": {
      "monto_mencionado": {"presente": true, "puntos": 25, "max": 25, "evidencia": "deuda de 405,302 pesos"},
      "fecha_vencimiento": {"presente": true, "puntos": 15, "max": 15, "evidencia": "antes del viernes"},
      "consecuencias_impago": {"presente": false, "puntos": 0, "max": 20, "evidencia": ""},
      "alternativas_pago": {"presente": true, "puntos": 15, "max": 15, "evidencia": "por la APP, web"},
      "manejo_objeciones": {"calidad": 1.0, "puntos": 25, "max": 25, "objeciones_detectadas": 0}
    }
  },
  
  "modulo_compromiso_pago": {
    "score": 58,
    "desglose": {
      "oferta_clara": {"presente": true, "puntos": 20, "max": 20},
      "alternativas_pago": {"presente": true, "puntos": 10, "max": 10},
      "fecha_especifica": {"presente": true, "puntos": 20, "max": 20, "fecha": "el sábado"},
      "validacion_cliente": {
        "presente": true,
        "tipo": "implicita",
        "puntos": 8,
        "max": 50,
        "frase_exacta": "yo creo que el sábado cancelo"
      }
    }
  },
  
  "modulo_abandono": {
    "hubo_abandono": false,
    "momento_segundos": null,
    "iniciado_por": null,
    "razon": null,
    "senales_previas": []
  },
  
  "probabilidad_cumplimiento": 78,
  "nivel_cumplimiento": "alta",
  
  "factores_prediccion": {
    "factores_positivos": [
      "Cliente ya pagó un crédito ayer",
      "Validación explícita del compromiso",
      "Fecha específica acordada",
      "Actitud colaborativa del cliente"
    ],
    "factores_negativos": [
      "Múltiples créditos pendientes"
    ],
    "razonamiento": "La cliente demuestra compromiso activo de pago...",
    "historial_cliente_considerado": true
  },
  
  "alertas": [],
  
  "recomendaciones": [
    {
      "prioridad": "media",
      "destinatario": "sistema",
      "accion": "Programar recordatorio para el viernes",
      "cuando": "48 horas antes"
    },
    {
      "prioridad": "media",
      "destinatario": "agente",
      "accion": "Contactar lunes para confirmar pagos",
      "cuando": "post-sábado"
    }
  ],
  
  "modelo_usado": "claude-opus-4-5-20250514",
  "version_prompt": "v1.0",
  "confianza_analisis": 0.92,
  "tiempo_procesamiento_ms": 2500,
  "fecha_llamada": "2026-01-31"
}
```

## Reglas de Scoring

### Módulo 1: Contacto Directo (100 pts máximo)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Monto mencionado | 25 | El agente menciona claramente el monto de la deuda |
| Fecha vencimiento | 15 | Se explica cuándo vence o venció la deuda |
| Consecuencias impago | 20 | Se mencionan consecuencias de no pagar (reportes, intereses) |
| Alternativas pago | 15 | Se ofrecen múltiples formas de pago |
| Manejo objeciones | 25 | Calidad en responder dudas/resistencia del cliente |

### Módulo 2: Compromiso de Pago (100 pts máximo)

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| Oferta clara | 20 | Se presenta una oferta concreta (descuento, plan) |
| Alternativas pago | 10 | Se ofrecen opciones de pago |
| Fecha específica | 20 | Se acuerda una fecha concreta de pago |
| **Validación cliente** | **50** | **El cliente confirma EXPLÍCITAMENTE el compromiso** |

#### Tipos de Validación

| Tipo | Puntos | Ejemplo |
|------|--------|---------|
| **Explícita** | 50 | "Sí, confirmo que pagaré el viernes" |
| **Implícita** | 8-15 | "ok", "ya", "entiendo" |
| **Ninguna** | 0 | Cliente no confirma nada |

### Módulo 3: Abandono

- **Sin abandono**: Llamada completada normalmente
- **Abandono por cliente**: Cliente cuelga antes de finalizar
- **Abandono por agente**: Agente termina sin cierre apropiado
- **Abandono técnico**: Corte de llamada, problemas de audio

## Cálculo de Probabilidad de Cumplimiento

```
Probabilidad = Base + Ajustes

Base (según validación):
- Validación explícita: 60%
- Validación implícita: 35%
- Sin validación: 15%

Ajustes positivos:
- Historial cliente positivo: +15%
- Fecha específica: +10%
- Monto menor a promedio: +5%
- Múltiples alternativas ofrecidas: +5%
- Tono emocional positivo: +5%

Ajustes negativos:
- Historial cliente negativo: -20%
- Objeciones no resueltas: -15%
- Días mora > 90: -10%
- Abandono previo: -10%
- Tono emocional negativo: -10%
```

## Tablas de Supabase Afectadas

### Lee de:
| Tabla | Campos | Propósito |
|-------|--------|-----------|
| `transcripciones` | Todos | Datos completos de la llamada |
| `agentes` | `agente_id`, `nombre`, `equipo` | Info del agente |
| `analisis_llamadas` | Historial por cliente | Contexto histórico |

### Escribe en:
| Tabla | Campos | Propósito |
|-------|--------|-----------|
| `analisis_llamadas` | Todos los campos del output | Análisis completo |
| `registro_llamadas` | `estado`, `analisis_id` | Actualizar estado |

## Tiempo de Procesamiento Esperado

| Paso | Tiempo | Notas |
|------|--------|-------|
| Obtener contexto (Supabase) | <500ms | 3 queries paralelas |
| Claude (evaluación módulos) | 2-4s | Un request con todo |
| INSERT/UPDATE Supabase | <200ms | 2 operaciones |
| Webhook a Detector (si aplica) | <100ms | Async |
| **Total** | **3-5s** | Para una llamada |

## Triggers de Alerta

El agente dispara webhook al **Agente Detector** si:

| Condición | Severidad |
|-----------|-----------|
| `score_total < 30` | CRÍTICA |
| `score_total < 50` | ALTA |
| `hubo_abandono = true` | ALTA |
| `validacion_cliente.tipo = 'ninguna'` y monto > $100k | ALTA |
| `probabilidad_cumplimiento < 30` | MEDIA |

## Siguiente Agente

El **Agente Detector** (ag3) recibe (si hay alertas):
```json
{
  "analisis_id": "uuid",
  "registro_id": "uuid",
  "alertas": [...],
  "trigger_reason": "score_bajo"
}
```

## Métricas de Monitoreo

| Métrica | Target | Alerta si |
|---------|--------|-----------|
| Tiempo procesamiento | < 5s | > 10s |
| Tasa de éxito | > 99% | < 95% |
| Errores/día | < 5 | > 10 |
| Llamadas analizadas/hora | ~50 | < 20 |


