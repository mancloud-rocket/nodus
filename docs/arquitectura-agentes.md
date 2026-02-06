# NODUS - Arquitectura de Agentes y Flujo de Datos

## 🎯 Visión General

El sistema NODUS está centrado en **6 agentes inteligentes** que procesan, analizan y generan insights sobre llamadas de cobranza. Las llamadas **no se almacenan** en el sistema - solo se guardan las transcripciones, análisis y métricas derivadas.

---

## 🔄 Flujo Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA EXTERNO                                    │
│                    (CRM, IVR, Grabador de llamadas)                         │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  │ POST /webhooks/nueva-llamada
                  │ {audio_url, metadata}
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENTE TRANSCRIPTOR                                   │
│  Trigger: Webhook | Tiempo: 1-3 min | Tech: Saturn Studio + AI Studio       │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT:  audio_url, agente_id, cliente_ref, timestamp                       │
│  PROCESO: Transcripción → Diarización → Emociones → Extracción entidades   │
│  OUTPUT: INSERT INTO transcripciones + UPDATE registro_llamadas             │
│  DISPARA: Webhook → Agente Analista                                         │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENTE ANALISTA                                      │
│  Trigger: Webhook (post-transcripción) | Tiempo: 30-60s | Tech: Claude Opus │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT:  transcripcion_id, datos_transcripcion, contexto_historico          │
│  PROCESO: Evaluar 3 módulos → Calcular scores → Predecir cumplimiento       │
│  OUTPUT: INSERT INTO analisis_llamadas                                       │
│  DISPARA: Webhook → Agente Detector (si hay alertas)                        │
└─────────────────┬───────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENTE DETECTOR                                      │
│  Trigger: Post-análisis + Cron (cada 30 min) | Tiempo: <10s                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT (individual): analisis_id con alertas                                │
│  INPUT (sistémico): Métricas últimas horas vs histórico                     │
│  PROCESO: Evaluar reglas → Detectar anomalías → Clasificar severidad        │
│  OUTPUT: INSERT INTO alertas_anomalias                                       │
│  DISPARA: Notificaciones (email, Slack, in-app)                             │
└─────────────────────────────────────────────────────────────────────────────┘

                           [PROCESOS BATCH]

┌─────────────────────────────────────────────────────────────────────────────┐
│                          AGENTE COACH                                        │
│  Trigger: Cron diario 08:00 AM | Tiempo: 5-10 min | Tech: Claude Opus       │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT:  Lista de agentes activos + sus últimos 25 análisis                 │
│  PROCESO: Agregar métricas → Comparar con benchmark → Generar plan          │
│  OUTPUT: INSERT INTO coaching_reports (1 por agente)                         │
│  DISPARA: Notificaciones a supervisores                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENTE ESTRATEGA                                     │
│  Trigger: Cron semanal (Domingos 22:00) | Tiempo: 15-30 min | Claude Opus   │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT:  Todas las métricas de la semana + comparativa histórica            │
│  PROCESO: Análisis temporal → Correlaciones → Optimización scripts          │
│  OUTPUT: INSERT INTO reportes_estrategia                                     │
│  DISPARA: Email con resumen ejecutivo a dirección                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       AGENTE CONVERSACIONAL                                  │
│  Trigger: Webhook on-demand | Tiempo: 2-5s | Tech: Claude Sonnet + RAG      │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT:  Pregunta del usuario en lenguaje natural                           │
│  PROCESO: Análisis intención → RAG (buscar en DB) → Generar respuesta       │
│  OUTPUT: Respuesta JSON via webhook (no persiste en DB)                      │
│  CONSULTA: SELECT FROM todas las tablas según necesidad                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Mapa de Agentes ↔ Tablas

| Agente | Lee de | Escribe en | Periodicidad | Volumen |
|--------|--------|------------|--------------|---------|
| **Transcriptor** | - | `registro_llamadas`, `transcripciones` | Por llamada | ~100-500/día |
| **Analista** | `transcripciones`, `agentes`, `analisis_llamadas` (histórico) | `analisis_llamadas` | Por transcripción | ~100-500/día |
| **Detector** | `analisis_llamadas`, `alertas_anomalias`, `metricas_agregadas` | `alertas_anomalias` | Post-análisis + 48x/día | ~10-50/día |
| **Coach** | `agentes`, `analisis_llamadas`, `coaching_reports` | `coaching_reports` | 1x/día (08:00) | ~10-50/día |
| **Estratega** | `analisis_llamadas`, `agentes`, `metricas_agregadas`, `alertas_anomalias` | `reportes_estrategia` | 1x/semana | 1/semana |
| **Conversacional** | **TODAS** (solo lectura) | - | On-demand | ~50-200/día |

---

## 🗄️ Detalle de Interacciones por Agente

### 1. AGENTE TRANSCRIPTOR

**Recibe via Webhook:**
```json
{
  "audio_url": "https://storage.externo.com/call_xyz.mp3",
  "agente_id": "uuid",
  "cliente_ref": "CL-12345",
  "campana": "Recuperación Q1",
  "timestamp_inicio": "2026-01-30T14:23:15Z",
  "timestamp_fin": "2026-01-30T14:27:30Z",
  "metadata": {
    "tipo_deuda": "tarjeta_credito",
    "monto_deuda": 1450.00,
    "dias_mora": 45
  }
}
```

**Escribe en `registro_llamadas`:**
- Crea registro con referencia al audio externo
- Estado inicial: `procesando`

**Escribe en `transcripciones`:**
- Transcripción completa
- Segmentos con speaker/timestamp/emoción
- Entidades extraídas (montos, fechas, métodos pago)

**Actualiza `registro_llamadas`:**
- Estado: `transcrito`
- `transcripcion_id`: referencia

---

### 2. AGENTE ANALISTA

**Recibe via Webhook (desde Transcriptor):**
```json
{
  "registro_id": "uuid",
  "transcripcion_id": "uuid"
}
```

**Lee de:**
- `transcripciones`: datos completos de la transcripción
- `agentes`: información del agente
- `analisis_llamadas`: historial del cliente (si existe)

**Escribe en `analisis_llamadas`:**
- Score total (0-100)
- Score por módulo (contacto_directo, compromiso_pago)
- Desglose detallado en JSON
- Predicción de cumplimiento
- Alertas detectadas
- Recomendaciones

**Actualiza `registro_llamadas`:**
- Estado: `analizado`

**Dispara Webhook a Detector si:**
- Score < 40
- Hay alertas críticas
- Abandono detectado

---

### 3. AGENTE DETECTOR

**Trigger Individual (post-análisis):**
```json
{
  "analisis_id": "uuid",
  "alertas_detectadas": [...]
}
```

**Trigger Sistémico (Cron cada 30 min):**
Ejecuta automáticamente.

**Lee de:**
- `analisis_llamadas`: métricas recientes
- `metricas_agregadas`: comparativa histórica
- `alertas_anomalias`: alertas existentes (evitar duplicados)

**Escribe en `alertas_anomalias`:**
- Tipo: individual | sistémica | patrón
- Severidad: crítica | alta | media | baja
- Descripción y causa probable
- Agentes/llamadas relacionados
- Acción recomendada

**Reglas de Detección:**

| Condición | Severidad | Tipo |
|-----------|-----------|------|
| Score < 30 | CRÍTICA | Individual |
| Abandono + cliente VIP | ALTA | Individual |
| Tasa abandono > 50% (última hora) | CRÍTICA | Sistémica |
| Caída score > 30% vs ayer | ALTA | Sistémica |
| Agente con > 5 abandonos seguidos | MEDIA | Patrón |
| Validación < 20% (agente, 10 llamadas) | ALTA | Patrón |

---

### 4. AGENTE COACH

**Trigger:** Cron diario a las 08:00 AM

**Lee de:**
- `agentes`: lista de agentes activos
- `analisis_llamadas`: últimos 25 análisis por agente
- `coaching_reports`: reportes anteriores (para tracking)

**Escribe en `coaching_reports` (1 por agente):**
```json
{
  "agente_id": "uuid",
  "fecha_reporte": "2026-01-30",
  "metricas_periodo": {
    "score_promedio": 72,
    "tasa_validacion": 0.32,
    "total_llamadas": 25
  },
  "comparativa_equipo": {
    "score_equipo": 78,
    "ranking": 8,
    "percentil": 65
  },
  "fortalezas": [...],
  "gap_critico": {
    "area": "validacion_cliente",
    "impacto": "Reduce cumplimiento en 35%"
  },
  "plan_mejora": {
    "objetivo_semana": "Lograr validación en >75%",
    "acciones": [...]
  }
}
```

---

### 5. AGENTE ESTRATEGA

**Trigger:** Cron semanal (Domingos 22:00)

**Lee de:**
- `analisis_llamadas`: todos los análisis de la semana
- `agentes`: información de agentes
- `metricas_agregadas`: tendencias históricas
- `alertas_anomalias`: patrones de alertas

**Escribe en `reportes_estrategia`:**
```json
{
  "periodo": "2026-01-23 a 2026-01-30",
  "resumen_ejecutivo": {
    "total_llamadas": 2847,
    "score_promedio": 72,
    "cambio_vs_anterior": +5
  },
  "hallazgos_estrategicos": [
    {
      "titulo": "Horario óptimo identificado",
      "recomendacion": "Redistribuir 40% llamadas a 18:00-20:00",
      "impacto_proyectado": "+8 puntos score"
    }
  ],
  "top_performers": [...],
  "recomendaciones_estrategicas": [...]
}
```

---

### 6. AGENTE CONVERSACIONAL

**Trigger:** Webhook on-demand (usuario escribe pregunta)

**Recibe:**
```json
{
  "user_id": "uuid",
  "pregunta": "¿Cómo le fue a María esta semana?"
}
```

**Lee de (RAG - según la pregunta):**
- `agentes`: información de agentes
- `analisis_llamadas`: análisis individuales
- `coaching_reports`: reportes de coaching
- `alertas_anomalias`: alertas activas
- `reportes_estrategia`: insights estratégicos
- `metricas_agregadas`: métricas rápidas

**Responde via Webhook (no persiste):**
```json
{
  "respuesta": "María realizó 23 llamadas...",
  "visualizaciones": [...],
  "acciones_sugeridas": [...]
}
```

---

## ⏰ Cronograma de Ejecución

| Hora | Agente | Acción |
|------|--------|--------|
| 24/7 | Transcriptor | Por cada llamada nueva |
| 24/7 | Analista | Por cada transcripción |
| 24/7 | Detector | Post-análisis (si hay alertas) |
| XX:00, XX:30 | Detector | Análisis sistémico cada 30 min |
| 08:00 | Coach | Generar reportes diarios |
| DOM 22:00 | Estratega | Generar reporte semanal |
| On-demand | Conversacional | Responder preguntas |

---

## 📈 Métricas de Monitoreo

### Por Agente

| Métrica | Transcriptor | Analista | Detector | Coach | Estratega |
|---------|--------------|----------|----------|-------|-----------|
| Tiempo promedio | < 2 min | < 45s | < 10s | < 10 min | < 30 min |
| Tasa de éxito | > 98% | > 99% | > 99.5% | 100% | 100% |
| Errores/día | < 5 | < 2 | < 1 | 0 | 0 |

### Volumen Esperado

| Agente | Llamadas/día | Pico horario |
|--------|--------------|--------------|
| Transcriptor | 100-500 | 10:00-12:00, 16:00-19:00 |
| Analista | 100-500 | +2min post-transcripción |
| Detector | 10-50 alertas | Variable |
| Coach | 10-50 reportes | 08:00-08:10 |
| Estratega | 1 | Domingo 22:00 |

---

## 🔧 Configuración Recomendada en Saturn Studio

### Variables de Entorno

```
# AI Studio
AI_STUDIO_URL=https://api.aistudio.rocketbot.com
AI_STUDIO_KEY=xxx

# LLM
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_MODEL_ANALYSIS=claude-opus-4-5-20250514
CLAUDE_MODEL_CHAT=claude-sonnet-4-5-20250514

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# Notificaciones
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
EMAIL_SMTP_HOST=smtp.xxx.com
```

### Timeouts Recomendados

| Agente | Timeout | Retry |
|--------|---------|-------|
| Transcriptor | 5 min | 2 |
| Analista | 2 min | 2 |
| Detector | 30s | 1 |
| Coach | 15 min | 1 |
| Estratega | 45 min | 1 |
| Conversacional | 30s | 1 |

---

## 📋 Checklist de Implementación

- [ ] Configurar webhook `/webhooks/nueva-llamada`
- [ ] Implementar flujo Transcriptor en Saturn Studio
- [ ] Conectar AI Studio para transcripción/emociones
- [ ] Implementar flujo Analista con prompts
- [ ] Configurar reglas del Detector
- [ ] Crear cron para Coach (08:00 diario)
- [ ] Crear cron para Estratega (DOM 22:00)
- [ ] Implementar endpoint Conversacional con RAG
- [ ] Configurar notificaciones (Slack/Email)
- [ ] Dashboard para monitoreo de agentes

