# NODUS - Flujo de Datos End-to-End

## Especificación Técnica de Integración
**Versión**: 1.0  
**Fecha**: Enero 2026

---

## 📋 Índice

1. [Visión General del Flujo](#vision-general)
2. [Fuente de Datos: Google Drive](#fuente-datos)
3. [Agente Transcriptor](#agente-transcriptor)
4. [Agente Analista](#agente-analista)
5. [Agente Detector](#agente-detector)
6. [Agente Coach](#agente-coach)
7. [Agente Estratega](#agente-estratega)
8. [Agente Conversacional](#agente-conversacional)
9. [Integración Supabase Realtime](#supabase-realtime)
10. [Webhooks de Saturn Studio](#webhooks-saturn)
11. [Diagrama de Secuencia Completo](#diagrama-secuencia)

---

<a name="vision-general"></a>
## 1. Visión General del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FLUJO E2E NODUS                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  GOOGLE DRIVE          SATURN STUDIO              SUPABASE                 WEB APP
  ═══════════          ══════════════             ═════════                ═════════
       │                     │                        │                        │
       │   1. Audio nuevo    │                        │                        │
       ├────────────────────►│                        │                        │
       │                     │                        │                        │
       │              ┌──────┴──────┐                 │                        │
       │              │ TRANSCRIPTOR │                │                        │
       │              └──────┬──────┘                 │                        │
       │                     │                        │                        │
       │                     │  2. INSERT             │   Realtime             │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │   (registro_llamadas)  │
       │                     │                        │   (transcripciones)    │
       │                     │                        │                        │
       │              ┌──────┴──────┐                 │                        │
       │              │   ANALISTA  │                 │                        │
       │              └──────┬──────┘                 │                        │
       │                     │                        │                        │
       │                     │  3. INSERT             │   Realtime             │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │   (analisis_llamadas)  │
       │                     │                        │                        │
       │              ┌──────┴──────┐                 │                        │
       │              │   DETECTOR  │◄────────────────┤                        │
       │              └──────┬──────┘   (si alertas)  │                        │
       │                     │                        │                        │
       │                     │  4. INSERT             │   Realtime             │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │   (alertas_anomalias)  │
       │                     │                        │                        │
       │              ┌──────┴──────┐                 │                        │
       │              │    COACH    │ (08:00 diario)  │                        │
       │              └──────┬──────┘                 │                        │
       │                     │                        │                        │
       │                     │  5. INSERT             │   Realtime             │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │   (coaching_reports)   │
       │                     │                        │                        │
       │              ┌──────┴──────┐                 │                        │
       │              │  ESTRATEGA  │ (DOM 22:00)     │                        │
       │              └──────┬──────┘                 │                        │
       │                     │                        │                        │
       │                     │  6. INSERT             │   Realtime             │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │  (reportes_estrategia) │
       │                     │                        │                        │
       │                     │                        │◄──────────────────────┤
       │              ┌──────┴──────┐                 │   7. Pregunta usuario  │
       │              │CONVERSACIONAL│                │                        │
       │              └──────┬──────┘                 │                        │
       │                     │                        │   8. Respuesta         │
       │                     ├───────────────────────►├───────────────────────►│
       │                     │                        │                        │
```

---

<a name="fuente-datos"></a>
## 2. Fuente de Datos: Google Drive

### Configuración del Trigger

El sistema externo (CRM/IVR) sube los audios a Google Drive y dispara el webhook.

**Opción A: Google Apps Script (Trigger en Drive)**
```javascript
// Trigger cuando se sube un archivo a la carpeta
function onFileUpload(e) {
  const file = e.file;
  const metadata = extractMetadata(file.getName()); // Parsear nombre del archivo
  
  const payload = {
    audio_url: file.getDownloadUrl(),
    audio_id_externo: file.getId(),
    agente_id: metadata.agente_id,
    cliente_ref: metadata.cliente_ref,
    timestamp_inicio: metadata.timestamp_inicio,
    timestamp_fin: metadata.timestamp_fin,
    campana: metadata.campana,
    tipo_deuda: metadata.tipo_deuda,
    monto_deuda: metadata.monto_deuda,
    dias_mora: metadata.dias_mora
  };
  
  UrlFetchApp.fetch('https://saturn.rocketbot.com/webhooks/nodus-transcriptor', {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
```

**Opción B: Integración directa desde CRM**
```
POST https://saturn.rocketbot.com/webhooks/nodus-transcriptor
```

### Formato del Archivo de Audio

| Propiedad | Valor |
|-----------|-------|
| Formato | MP3, WAV, M4A, OGG |
| Duración máxima | 30 minutos |
| Calidad mínima | 16kHz, mono |
| Naming convention | `{agente_id}_{cliente_ref}_{timestamp}.mp3` |

---

<a name="agente-transcriptor"></a>
## 3. Agente Transcriptor

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-transcriptor` |
| **Trigger** | Webhook (cuando llega audio nuevo) |
| **Tiempo esperado** | 1-3 minutos |
| **Tecnología** | Saturn Studio + AI Studio (Whisper) |
| **Timeout** | 5 minutos |
| **Retries** | 2 |

### Input Format

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=FILE_ID",
  "audio_id_externo": "1abc123def456",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "cliente_ref": "CL-45632",
  "timestamp_inicio": "2026-01-30T14:23:15-05:00",
  "timestamp_fin": "2026-01-30T14:27:30-05:00",
  "campana": "Recuperación Q1",
  "tipo_deuda": "tarjeta_credito",
  "monto_deuda": 1450.00,
  "dias_mora": 45,
  "metadata_externa": {
    "ivr_session_id": "IVR-12345",
    "origen": "outbound"
  }
}
```

### Procesamiento Interno (Saturn Studio Flow)

```
1. Validar input (schema, URL accesible)
2. Descargar audio temporalmente
3. AI Studio: Transcribir (Whisper large-v3)
   - Diarización activa (separar speakers)
   - Idioma: español
4. AI Studio: Analizar emociones por segmento
5. LLM (Claude Sonnet): Extraer entidades
   - Montos mencionados
   - Fechas mencionadas
   - Métodos de pago
   - Objeciones del cliente
   - Compromisos verbales
6. Calcular métricas conversacionales
7. INSERT en Supabase: registro_llamadas
8. INSERT en Supabase: transcripciones
9. UPDATE registro_llamadas con transcripcion_id
10. Trigger webhook → Agente Analista
```

### Output Format (INSERT en Supabase)

**Tabla: `registro_llamadas`**
```json
{
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "audio_url": "https://drive.google.com/...",
  "audio_id_externo": "1abc123def456",
  "timestamp_inicio": "2026-01-30T14:23:15-05:00",
  "timestamp_fin": "2026-01-30T14:27:30-05:00",
  "duracion_segundos": 255,
  "timestamp_fecha": "2026-01-30",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "cliente_ref": "CL-45632",
  "campana": "Recuperación Q1",
  "tipo_deuda": "tarjeta_credito",
  "monto_deuda": 1450.00,
  "dias_mora": 45,
  "estado": "transcrito",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "metadata_externa": {"ivr_session_id": "IVR-12345", "origen": "outbound"}
}
```

**Tabla: `transcripciones`**
```json
{
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "transcripcion_completa": "Buenos días, ¿hablo con el señor García? Sí, soy yo...",
  "segmentos": [
    {
      "speaker": "agente",
      "timestamp_inicio": 0.0,
      "timestamp_fin": 3.2,
      "texto": "Buenos días, ¿hablo con el señor García?",
      "emocion": "neutral",
      "velocidad_habla": 145
    },
    {
      "speaker": "cliente",
      "timestamp_inicio": 3.2,
      "timestamp_fin": 5.8,
      "texto": "Sí, soy yo. ¿De dónde me llama?",
      "emocion": "neutral",
      "velocidad_habla": 140
    }
  ],
  "entidades": {
    "montos": [
      {"valor": 1450, "moneda": "PEN", "contexto": "deuda_principal"}
    ],
    "fechas": [
      {"fecha": "2025-12-15", "contexto": "vencimiento"},
      {"fecha": "2026-02-15", "contexto": "compromiso_sugerido"}
    ],
    "metodos_pago": ["web", "app", "agencia"],
    "objeciones": [],
    "compromisos": [
      {"tipo": "implicito", "fecha": "2026-02-15", "monto": 1450}
    ]
  },
  "metricas_conversacion": {
    "palabras_agente": 65,
    "palabras_cliente": 18,
    "ratio_habla": 0.78,
    "interrupciones": 0,
    "silencios_largos": 0,
    "velocidad_promedio_agente": 148,
    "velocidad_promedio_cliente": 135
  },
  "calidad_audio": {
    "score": 85,
    "ruido_fondo": false,
    "cortes": 0,
    "inaudibles": 0
  },
  "modelo_transcripcion": "whisper-large-v3",
  "modelo_emociones": "ai-studio-emotions-v1",
  "modelo_entidades": "claude-sonnet-4-5-20250514",
  "tiempo_procesamiento_ms": 45000
}
```

### Webhook de Salida (→ Agente Analista)

```
POST https://saturn.rocketbot.com/webhooks/nodus-analista
Content-Type: application/json

{
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "timestamp": "2026-01-30T14:28:45Z"
}
```

### Response al Caller

```json
{
  "status": "success",
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "tiempo_procesamiento_ms": 45000,
  "siguiente_agente": "analista"
}
```

---

<a name="agente-analista"></a>
## 4. Agente Analista

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-analista` |
| **Trigger** | Webhook (desde Transcriptor) |
| **Tiempo esperado** | 30-60 segundos |
| **Tecnología** | Saturn Studio + Claude Opus 4.5 |
| **Timeout** | 2 minutos |
| **Retries** | 2 |

### Input Format

```json
{
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "timestamp": "2026-01-30T14:28:45Z"
}
```

### Procesamiento Interno (Saturn Studio Flow)

```
1. Validar input
2. SELECT FROM transcripciones WHERE transcripcion_id = ?
3. SELECT FROM agentes WHERE agente_id = ?
4. SELECT FROM analisis_llamadas WHERE cliente_ref = ? (historial)
5. Preparar prompt con template + datos
6. LLM (Claude Opus 4.5): Analizar llamada
   - Evaluar Módulo 1: Contacto Directo
   - Evaluar Módulo 2: Compromiso de Pago
   - Evaluar Módulo 3: Abandono
   - Calcular predicción de cumplimiento
   - Generar alertas si aplica
   - Generar recomendaciones
7. Validar output (schema JSON)
8. INSERT en Supabase: analisis_llamadas
9. UPDATE registro_llamadas SET analisis_id = ?, estado = 'analizado'
10. SI hay alertas críticas → Trigger webhook → Agente Detector
```

### Prompt Template (Extracto)

```markdown
Eres un experto analista de cobranzas. Analiza esta llamada según 3 módulos:

## MÓDULO 1: CONTACTO DIRECTO (0-100 pts)
- Monto mencionado claramente (25 pts)
- Fecha vencimiento explicada (15 pts)
- Consecuencias impago mencionadas (20 pts)
- Alternativas de pago ofrecidas (15 pts)
- Manejo de objeciones (25 pts)

## MÓDULO 2: COMPROMISO DE PAGO (0-100 pts)
- Oferta clara: 20%
- Alternativas pago: 10%
- Fecha específica: 20%
- Validación EXPLÍCITA del cliente: 50% ← CRÍTICO

## MÓDULO 3: ABANDONO
- ¿Hubo abandono? ¿Cuándo? ¿Por qué? ¿Señales previas?

## DATOS DE LA LLAMADA:
Transcripción: {transcripcion_completa}
Segmentos: {segmentos}
Entidades detectadas: {entidades}
Métricas: {metricas_conversacion}

## TAREAS:
1. Evalúa cada módulo objetivamente con evidencia textual
2. Predice probabilidad de cumplimiento (0-100) basándote en:
   - Presencia de 4 pilares (especialmente validación explícita)
   - Calidad de la gestión del agente
3. Genera alertas si: score < 40, abandono, falta validación en cliente importante
4. Genera 2-3 recomendaciones accionables

Responde SOLO en JSON según el schema adjunto.
```

### Output Format (INSERT en Supabase)

**Tabla: `analisis_llamadas`**
```json
{
  "analisis_id": "an000000-0000-0000-0000-000000000001",
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "fecha_llamada": "2026-01-30",
  
  "score_total": 72,
  "score_contacto_directo": 85,
  "score_compromiso_pago": 58,
  
  "modulo_contacto_directo": {
    "score": 85,
    "desglose": {
      "monto_mencionado": {
        "presente": true,
        "puntos": 25,
        "max": 25,
        "evidencia": "su saldo vencido de 1,450 soles"
      },
      "fecha_vencimiento": {
        "presente": true,
        "puntos": 15,
        "max": 15,
        "evidencia": "vencimiento fue el 15 de diciembre"
      },
      "consecuencias_impago": {
        "presente": true,
        "puntos": 12,
        "max": 20,
        "evidencia": "evitar intereses adicionales"
      },
      "alternativas_pago": {
        "presente": true,
        "puntos": 15,
        "max": 15,
        "evidencia": "web, app móvil o agencia"
      },
      "manejo_objeciones": {
        "calidad": 0.8,
        "puntos": 18,
        "max": 25,
        "objeciones_detectadas": 0
      }
    }
  },
  
  "modulo_compromiso_pago": {
    "score": 58,
    "desglose": {
      "oferta_clara": {"presente": true, "puntos": 20, "max": 20},
      "alternativas_pago": {"presente": true, "puntos": 10, "max": 10},
      "fecha_especifica": {"presente": true, "puntos": 20, "max": 20, "fecha": "2026-02-15"},
      "validacion_cliente": {
        "presente": false,
        "tipo": "implicita",
        "puntos": 8,
        "max": 50,
        "frase_exacta": "lo voy a revisar"
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
  
  "probabilidad_cumplimiento": 58,
  "nivel_cumplimiento": "media",
  
  "factores_prediccion": {
    "factores_positivos": [
      "Fecha específica acordada",
      "Buena explicación de alternativas",
      "Monto claramente comunicado"
    ],
    "factores_negativos": [
      "Falta validación explícita (-30pts)",
      "Cliente no confirmó compromiso verbalmente"
    ],
    "razonamiento": "Aunque hay fecha clara y alternativas bien explicadas, la ausencia de validación explícita reduce significativamente la probabilidad de cumplimiento basado en patrones históricos.",
    "historial_cliente_considerado": false
  },
  
  "alertas": [
    {
      "tipo": "advertencia",
      "codigo": "FALTA_VALIDACION",
      "mensaje": "Cliente NO validó explícitamente el compromiso de pago",
      "severidad": "alta"
    }
  ],
  
  "recomendaciones": [
    {
      "prioridad": "alta",
      "destinatario": "supervisor",
      "accion": "Llamar en 48hrs para reforzar compromiso con validación explícita",
      "cuando": "antes de fecha compromiso"
    },
    {
      "prioridad": "media",
      "destinatario": "agente",
      "accion": "Revisar técnica de cierre - usar frase de confirmación",
      "cuando": "próxima llamada"
    }
  ],
  
  "modelo_usado": "claude-opus-4-5-20250514",
  "version_prompt": "v1.2",
  "confianza_analisis": 0.89,
  "tiempo_procesamiento_ms": 35000
}
```

### Webhook de Salida (→ Agente Detector) - Condicional

Solo se dispara si hay alertas con severidad "critica" o "alta":

```
POST https://saturn.rocketbot.com/webhooks/nodus-detector
Content-Type: application/json

{
  "trigger_type": "post_analisis",
  "analisis_id": "an000000-0000-0000-0000-000000000001",
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "alertas": [
    {
      "tipo": "advertencia",
      "codigo": "FALTA_VALIDACION",
      "severidad": "alta"
    }
  ],
  "score_total": 72,
  "timestamp": "2026-01-30T14:29:30Z"
}
```

### Response al Caller

```json
{
  "status": "success",
  "analisis_id": "an000000-0000-0000-0000-000000000001",
  "score_total": 72,
  "probabilidad_cumplimiento": 58,
  "alertas_generadas": 1,
  "tiempo_procesamiento_ms": 35000,
  "detector_triggered": true
}
```

---

<a name="agente-detector"></a>
## 5. Agente Detector

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-detector` |
| **Trigger 1** | Webhook (desde Analista, si hay alertas) |
| **Trigger 2** | Cron cada 30 minutos (análisis sistémico) |
| **Tiempo esperado** | < 10 segundos |
| **Tecnología** | Saturn Studio + Reglas + LLM opcional |
| **Timeout** | 30 segundos |
| **Retries** | 1 |

### Input Format - Trigger Individual (Post-Análisis)

```json
{
  "trigger_type": "post_analisis",
  "analisis_id": "an000000-0000-0000-0000-000000000001",
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000001",
  "alertas": [
    {"tipo": "advertencia", "codigo": "FALTA_VALIDACION", "severidad": "alta"}
  ],
  "score_total": 72,
  "timestamp": "2026-01-30T14:29:30Z"
}
```

### Input Format - Trigger Sistémico (Cron)

```json
{
  "trigger_type": "cron_sistemico",
  "timestamp": "2026-01-30T15:00:00Z"
}
```

### Procesamiento Interno (Saturn Studio Flow)

**Para trigger individual:**
```
1. Evaluar alertas del análisis
2. Verificar reglas de escalamiento:
   - Score < 30 → Alerta CRÍTICA
   - Abandono + score bajo → Alerta CRÍTICA
   - Falta validación + monto > 5000 → Alerta ALTA
3. Verificar si alerta similar ya existe (evitar duplicados)
4. INSERT en Supabase: alertas_anomalias
5. Disparar notificación (Slack/Email)
```

**Para trigger sistémico (cron):**
```
1. SELECT métricas última hora vs promedio histórico
2. Evaluar reglas sistémicas:
   - Tasa abandono > 50% última hora → CRÍTICA
   - Caída score > 30% vs ayer → ALTA
   - Agente con > 5 abandonos seguidos → MEDIA
   - Validación < 20% equipo última hora → ALTA
3. SELECT patrones por agente (últimas 10 llamadas)
4. INSERT alertas detectadas
5. Disparar notificaciones según severidad
```

### Reglas de Detección

| Condición | Severidad | Tipo | Notifica a |
|-----------|-----------|------|------------|
| Score < 30 | CRÍTICA | individual | Supervisor + Slack |
| Abandono + cliente VIP | CRÍTICA | individual | Supervisor + Email |
| Tasa abandono > 50% (1h) | CRÍTICA | sistémica | Gerencia + Slack |
| Caída score > 30% vs ayer | ALTA | sistémica | Supervisor |
| Sin validación + monto > 5000 | ALTA | individual | Supervisor |
| Agente > 5 abandonos seguidos | MEDIA | patrón | Supervisor |
| Validación < 20% (agente, 10 llamadas) | ALTA | patrón | Coach |

### Output Format (INSERT en Supabase)

**Tabla: `alertas_anomalias`**
```json
{
  "alerta_id": "al000000-0000-0000-0000-000000000001",
  "tipo": "individual",
  "severidad": "alta",
  "categoria": "performance",
  "codigo": "FALTA_VALIDACION",
  
  "descripcion": "Llamada sin validación explícita con monto de deuda de S/. 1,450. Cliente solo respondió 'lo voy a revisar'.",
  "causa_probable": "Agente no utilizó técnica de cierre con pregunta de confirmación",
  
  "datos_soporte": {
    "score_total": 72,
    "monto_deuda": 1450,
    "frase_cliente": "lo voy a revisar",
    "duracion_llamada": 255
  },
  
  "impacto_estimado": {
    "llamadas_afectadas": 1,
    "perdida_oportunidades": 1,
    "monto_en_riesgo": 1450
  },
  
  "accion_recomendada": {
    "urgencia": "48_horas",
    "destinatario": "supervisor",
    "accion": "Contactar nuevamente al cliente para obtener validación explícita",
    "deadline": "2026-02-01T18:00:00Z"
  },
  
  "registro_id": "r0000000-0000-0000-0000-000000000001",
  "agentes_relacionados": ["a0000000-0000-0000-0000-000000000002"],
  
  "estado": "nueva",
  "notificacion_enviada": true
}
```

### Webhook de Notificación (→ Slack/Email)

```
POST https://hooks.slack.com/services/xxx/yyy/zzz
Content-Type: application/json

{
  "text": "🚨 *ALERTA NODUS* - Severidad: ALTA",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Tipo:* Falta Validación\n*Agente:* María González\n*Score:* 72/100\n*Monto en riesgo:* S/. 1,450"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Ver Llamada"},
          "url": "https://nodus.app/llamadas/r0000000-0000-0000-0000-000000000001"
        }
      ]
    }
  ]
}
```

### Response al Caller

```json
{
  "status": "success",
  "alertas_creadas": 1,
  "alertas_ids": ["al000000-0000-0000-0000-000000000001"],
  "notificaciones_enviadas": ["slack", "email"],
  "tiempo_procesamiento_ms": 850
}
```

---

<a name="agente-coach"></a>
## 6. Agente Coach

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-coach` |
| **Trigger** | Cron diario a las 08:00 AM (hora local) |
| **Tiempo esperado** | 5-10 minutos |
| **Tecnología** | Saturn Studio + Claude Opus 4.5 |
| **Timeout** | 15 minutos |
| **Retries** | 1 |

### Input Format (Cron Trigger)

```json
{
  "trigger_type": "cron_diario",
  "fecha_reporte": "2026-01-30",
  "periodo_dias": 5,
  "timestamp": "2026-01-30T08:00:00-05:00"
}
```

### Procesamiento Interno (Saturn Studio Flow)

```
1. SELECT FROM agentes WHERE estado = 'activo'
2. PARA CADA agente:
   a. SELECT últimos 25 análisis del agente
   b. Calcular métricas del período
   c. SELECT benchmark del equipo
   d. SELECT reporte anterior (para tracking progreso)
   e. LLM (Claude Opus): Generar análisis y plan
   f. INSERT en Supabase: coaching_reports
3. Calcular insights globales del equipo
4. Enviar notificaciones a supervisores
5. Enviar notificaciones individuales a agentes
```

### Prompt Template (Extracto)

```markdown
Eres un coach de cobranzas experto. Analiza el desempeño de {nombre}:

## DATOS DEL AGENTE (últimas 25 llamadas):
- Score promedio: {score_promedio}
- Score mínimo: {score_min}
- Score máximo: {score_max}
- Tasa de validación: {tasa_validacion}%
- Probabilidad cumplimiento promedio: {prob_cumplimiento}%
- Llamadas con abandono: {abandonos}

## BENCHMARK DEL EQUIPO:
- Score promedio equipo: {score_equipo}
- Tasa validación equipo: {validacion_equipo}%
- Ranking actual: {ranking}/{total_agentes}

## ANÁLISIS DETALLADO POR LLAMADA:
{lista_analisis}

## REPORTE ANTERIOR:
- Objetivo anterior: {objetivo_anterior}
- ¿Cumplido?: {cumplido}
- Gap crítico anterior: {gap_anterior}

## TAREAS:
1. Identifica 2-3 fortalezas principales con evidencia
2. Identifica el GAP MÁS CRÍTICO (mayor impacto en resultados)
3. Detecta patrones recurrentes (positivos y negativos)
4. Genera plan de mejora de 1 semana con:
   - Objetivo específico y medible
   - 3 acciones concretas con prioridad
   - Llamadas propias para revisar como ejemplo
5. Compara con reporte anterior y evalúa progreso

Responde en JSON según schema adjunto.
```

### Output Format (INSERT en Supabase)

**Tabla: `coaching_reports`**
```json
{
  "reporte_id": "cr000000-0000-0000-0000-000000000001",
  "agente_id": "a0000000-0000-0000-0000-000000000002",
  "fecha_reporte": "2026-01-30",
  "periodo_inicio": "2026-01-25",
  "periodo_fin": "2026-01-30",
  "total_llamadas_analizadas": 23,
  
  "metricas_periodo": {
    "score_promedio": 72,
    "score_min": 58,
    "score_max": 85,
    "tasa_validacion": 0.32,
    "probabilidad_cumplimiento_promedio": 48,
    "tasa_abandono": 0.04,
    "duracion_promedio": 245
  },
  
  "comparativa_equipo": {
    "score_equipo": 78,
    "validacion_equipo": 0.61,
    "ranking": 8,
    "total_agentes": 12,
    "percentil": 65,
    "diferencia_vs_promedio": -6
  },
  
  "fortalezas": [
    {
      "area": "manejo_objeciones",
      "descripcion": "Excelente técnica de empatía al escuchar problemas del cliente",
      "evidencia": "92% de objeciones bien manejadas en las 23 llamadas",
      "impacto": "Reduce abandono en aproximadamente 15%"
    },
    {
      "area": "comunicacion_alternativas",
      "descripcion": "Siempre presenta múltiples opciones de pago",
      "evidencia": "100% de llamadas incluyen al menos 2 alternativas",
      "impacto": "Aumenta flexibilidad percibida por el cliente"
    }
  ],
  
  "gap_critico": {
    "area": "validacion_cliente",
    "descripcion": "En 18 de 25 llamadas (72%) no logra validación explícita del compromiso",
    "impacto": "Reduce cumplimiento real en aproximadamente 35%",
    "ejemplos_registros": [
      "r0000000-0000-0000-0000-000000000001",
      "r0000000-0000-0000-0000-000000000004"
    ],
    "frecuencia": "Casi todas las llamadas con compromiso"
  },
  
  "patrones": [
    {
      "tipo": "negativo",
      "descripcion": "Cierra llamadas diciendo 'lo esperamos' en lugar de pedir confirmación",
      "frecuencia": "15 de 23 llamadas",
      "impacto": "Validación implícita no genera compromiso real"
    }
  ],
  
  "plan_mejora": {
    "objetivo_semana": "Lograr validación explícita en más del 75% de los compromisos",
    "meta_cuantitativa": "Subir tasa de validación de 32% a 75% (+43 puntos)",
    "acciones": [
      {
        "accion": "Role-play de técnica de cierre",
        "como": "15 minutos diarios con supervisor usando el script: '¿Me confirma que realizará el pago de X soles el día Y?'",
        "prioridad": "alta",
        "duracion": "15 min/día"
      },
      {
        "accion": "Revisar 3 llamadas exitosas de Carlos Ramírez",
        "como": "Observar cómo obtiene validación de forma natural y fluida",
        "prioridad": "media",
        "duracion": "30 min total"
      },
      {
        "accion": "Usar checklist de cierre antes de colgar",
        "como": "Verificar: ¿El cliente DIJO que va a pagar? ¿Fecha específica? ¿Monto confirmado?",
        "prioridad": "alta",
        "duracion": "30 seg/llamada"
      }
    ],
    "registros_para_revisar": [
      {
        "registro_id": "r0000000-0000-0000-0000-000000000001",
        "razon": "ejemplo_negativo",
        "que_observar": "Minuto 3:45 - Cliente dice 'ok' pero no hay validación explícita"
      },
      {
        "registro_id": "an000000-0000-0000-0000-000000000002",
        "razon": "ejemplo_positivo_otro_agente",
        "que_observar": "Minuto 2:30 - Carlos obtiene confirmación clara del cliente"
      }
    ],
    "recursos_sugeridos": [
      "Video: Técnicas de cierre efectivas en cobranzas",
      "Documento: 10 frases de validación que funcionan"
    ]
  },
  
  "progreso_vs_anterior": {
    "score_cambio": 3,
    "validacion_cambio": -5,
    "objetivo_anterior_cumplido": false,
    "notas": "Score mejoró pero validación empeoró. El foco de esta semana debe ser 100% en técnica de cierre."
  },
  
  "generado_por": "agente_coach",
  "modelo_usado": "claude-opus-4-5-20250514"
}
```

### Notificación al Agente (Email/In-App)

```json
{
  "to": "maria.gonzalez@360.com",
  "subject": "📊 Tu reporte de coaching - 30 Ene 2026",
  "template": "coaching_daily",
  "data": {
    "nombre": "María",
    "score_semana": 72,
    "ranking": "8/12",
    "fortaleza_principal": "Excelente manejo de objeciones",
    "gap_critico": "Validación de compromisos",
    "objetivo_semana": "Lograr validación en >75% de compromisos",
    "link_dashboard": "https://nodus.app/mi-coaching"
  }
}
```

### Response

```json
{
  "status": "success",
  "reportes_generados": 12,
  "agentes_procesados": ["a0000000-...", "a0000001-...", ...],
  "notificaciones_enviadas": {
    "supervisores": 2,
    "agentes": 12
  },
  "tiempo_procesamiento_ms": 485000
}
```

---

<a name="agente-estratega"></a>
## 7. Agente Estratega

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-estratega` |
| **Trigger** | Cron semanal - Domingos 22:00 (hora local) |
| **Tiempo esperado** | 15-30 minutos |
| **Tecnología** | Saturn Studio + Claude Opus 4.5 |
| **Timeout** | 45 minutos |
| **Retries** | 1 |

### Input Format (Cron Trigger)

```json
{
  "trigger_type": "cron_semanal",
  "fecha_reporte": "2026-01-26",
  "semana_numero": 4,
  "periodo_inicio": "2026-01-20",
  "periodo_fin": "2026-01-26",
  "timestamp": "2026-01-26T22:00:00-05:00"
}
```

### Procesamiento Interno (Saturn Studio Flow)

```
1. SELECT todos los análisis de la semana
2. SELECT métricas agregadas diarias
3. SELECT alertas de la semana
4. SELECT top/bottom performers
5. Calcular tendencias temporales (por día, por hora)
6. Calcular correlaciones (campañas, tipos de deuda)
7. LLM (Claude Opus): Análisis estratégico profundo
8. INSERT en Supabase: reportes_estrategia
9. Enviar resumen ejecutivo a dirección
```

### Output Format (INSERT en Supabase)

**Tabla: `reportes_estrategia`**
```json
{
  "reporte_id": "rs000000-0000-0000-0000-000000000001",
  "fecha_reporte": "2026-01-26",
  "semana_numero": 4,
  "periodo_inicio": "2026-01-20",
  "periodo_fin": "2026-01-26",
  
  "resumen_ejecutivo": {
    "total_llamadas": 2847,
    "total_agentes_activos": 12,
    "score_promedio": 72,
    "cambio_vs_anterior": 5,
    "tasa_validacion": 0.52,
    "probabilidad_cumplimiento_promedio": 54,
    "monto_comprometido": 1250000,
    "logros": [
      "Score subió 5 puntos vs semana anterior",
      "3 agentes superaron el 80% de score"
    ],
    "preocupaciones": [
      "Validación sigue en 52% (meta: 70%)",
      "Abandonos aumentaron 8% el viernes"
    ]
  },
  
  "hallazgos_estrategicos": [
    {
      "titulo": "Horario óptimo identificado: 18:00-20:00",
      "categoria": "temporal",
      "descripcion": "Las llamadas entre 18:00 y 20:00 tienen +23% mejor performance que el promedio",
      "hipotesis": "Clientes más receptivos fuera de horario laboral, menos distracciones",
      "recomendacion": "Redistribuir 40% de las llamadas actuales de 10:00-12:00 a 18:00-20:00",
      "impacto_proyectado": {
        "metrica": "score_promedio",
        "mejora_esperada": 8,
        "confianza": "alta"
      }
    },
    {
      "titulo": "Mención de 'consecuencias legales' aumenta abandono",
      "categoria": "script",
      "descripcion": "Llamadas donde se menciona 'consecuencias legales' tienen 45% más abandono",
      "hipotesis": "Genera reacción defensiva en lugar de colaborativa",
      "recomendacion": "Reformular como 'opciones para regularizar su situación'",
      "impacto_proyectado": {
        "metrica": "tasa_abandono",
        "mejora_esperada": -18,
        "confianza": "alta"
      }
    },
    {
      "titulo": "Campaña 'Gestión Temprana' supera a 'Recuperación'",
      "categoria": "campana",
      "descripcion": "Score promedio 78 vs 68. Validación 65% vs 45%",
      "hipotesis": "Clientes con menos mora son más receptivos",
      "recomendacion": "Priorizar contacto temprano. Replicar scripts de Gestión Temprana en Recuperación",
      "impacto_proyectado": {
        "metrica": "cumplimiento_real",
        "mejora_esperada": 15,
        "confianza": "media"
      }
    }
  ],
  
  "analisis_temporal": {
    "mejor_dia": "Miércoles",
    "mejor_dia_score": 75,
    "peor_dia": "Lunes",
    "peor_dia_score": 68,
    "mejor_hora": "18:00-20:00",
    "mejor_hora_score": 78,
    "tendencias_por_dia": [
      {"dia": "Lunes", "llamadas": 420, "score": 68},
      {"dia": "Martes", "llamadas": 445, "score": 71},
      {"dia": "Miércoles", "llamadas": 412, "score": 75},
      {"dia": "Jueves", "llamadas": 438, "score": 73},
      {"dia": "Viernes", "llamadas": 398, "score": 70},
      {"dia": "Sábado", "llamadas": 380, "score": 74},
      {"dia": "Domingo", "llamadas": 354, "score": 72}
    ],
    "tendencias_por_hora": [
      {"hora": "09:00-10:00", "score": 67},
      {"hora": "10:00-12:00", "score": 70},
      {"hora": "12:00-14:00", "score": 68},
      {"hora": "14:00-16:00", "score": 71},
      {"hora": "16:00-18:00", "score": 73},
      {"hora": "18:00-20:00", "score": 78},
      {"hora": "20:00-21:00", "score": 74}
    ]
  },
  
  "top_performers": [
    {
      "agente_id": "a0000000-0000-0000-0000-000000000001",
      "nombre": "Carlos Ramírez",
      "score": 89,
      "llamadas": 45,
      "tasa_validacion": 0.94,
      "patron_clave": "Cierre con pregunta directa + pausa para respuesta",
      "recomendacion": "Usar como mentor para técnica de validación"
    },
    {
      "agente_id": "a0000000-0000-0000-0000-000000000005",
      "nombre": "Luis Torres",
      "score": 85,
      "llamadas": 42,
      "tasa_validacion": 0.88,
      "patron_clave": "Excelente manejo de objeciones económicas",
      "recomendacion": "Crear material de capacitación basado en sus llamadas"
    }
  ],
  
  "agentes_en_riesgo": [
    {
      "agente_id": "a0000000-0000-0000-0000-000000000003",
      "nombre": "José Pérez",
      "score": 45,
      "llamadas": 38,
      "tasa_validacion": 0.15,
      "gap_principal": "Manejo de objeciones y técnica de cierre",
      "accion_urgente": "Sesión de coaching intensivo esta semana"
    }
  ],
  
  "analisis_campanas": [
    {
      "campana": "Gestión Temprana",
      "llamadas": 1245,
      "score_promedio": 78,
      "tasa_validacion": 0.65,
      "insights": "Mejor rendimiento global. Clientes más receptivos.",
      "recomendaciones": "Modelo a seguir para otras campañas"
    },
    {
      "campana": "Recuperación Q1",
      "llamadas": 1602,
      "score_promedio": 68,
      "tasa_validacion": 0.45,
      "insights": "Más volumen pero menor efectividad. Alta tasa de abandono.",
      "recomendaciones": "Revisar script y considerar segmentación por mora"
    }
  ],
  
  "recomendaciones_estrategicas": [
    {
      "prioridad": "alta",
      "area": "operaciones",
      "recomendacion": "Redistribuir 40% de llamadas al horario 18:00-20:00",
      "impacto_esperado": "+8 puntos en score promedio",
      "recursos_necesarios": "Ajuste de turnos, posible incentivo nocturno",
      "deadline": "2026-02-03"
    },
    {
      "prioridad": "alta",
      "area": "scripts",
      "recomendacion": "Eliminar menciones de 'consecuencias legales' del script",
      "impacto_esperado": "-18% en tasa de abandono",
      "recursos_necesarios": "Revisión y aprobación de nuevo script",
      "deadline": "2026-01-31"
    },
    {
      "prioridad": "media",
      "area": "coaching",
      "recomendacion": "Programa de mentoría: Carlos y Luis como mentores",
      "impacto_esperado": "+15% en validación del equipo",
      "recursos_necesarios": "2 horas semanales de Carlos y Luis",
      "deadline": "2026-02-15"
    }
  ],
  
  "proyecciones": {
    "score_proyectado_siguiente_semana": 75,
    "cumplimiento_proyectado": 58,
    "riesgos_identificados": [
      "José Pérez podría afectar métricas del equipo si no mejora",
      "Fin de mes puede generar más abandonos por presión"
    ],
    "oportunidades": [
      "Horario nocturno sin explotar completamente",
      "2 agentes cerca de superar 85 de score"
    ]
  },
  
  "generado_por": "agente_estratega",
  "modelo_usado": "claude-opus-4-5-20250514"
}
```

### Email Resumen Ejecutivo (→ Dirección)

```json
{
  "to": ["direccion@360consultores.com", "fernando@360consultores.com"],
  "subject": "📈 NODUS - Resumen Semanal | Semana 4",
  "template": "estrategia_semanal",
  "data": {
    "semana": 4,
    "total_llamadas": 2847,
    "score_promedio": 72,
    "cambio": "+5",
    "monto_comprometido": "S/. 1,250,000",
    "top_hallazgo": "Horario 18:00-20:00 tiene +23% mejor performance",
    "top_recomendacion": "Redistribuir 40% de llamadas a horario nocturno",
    "top_performer": "Carlos Ramírez (89/100)",
    "link_reporte": "https://nodus.app/estrategia/semana-4"
  }
}
```

---

<a name="agente-conversacional"></a>
## 8. Agente Conversacional

### Información General

| Propiedad | Valor |
|-----------|-------|
| **Webhook URL** | `POST /webhooks/nodus-chat` |
| **Trigger** | On-demand (usuario envía pregunta) |
| **Tiempo esperado** | 2-5 segundos |
| **Tecnología** | Saturn Studio + Claude Sonnet 4.5 + RAG |
| **Timeout** | 30 segundos |
| **Retries** | 1 |

### Input Format

```json
{
  "user_id": "a0000000-0000-0000-0000-000000000006",
  "session_id": "sess-123456",
  "pregunta": "¿Cómo le fue a María esta semana?",
  "contexto_conversacion": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": "2026-01-30T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "¡Hola! Soy el asistente de NODUS. ¿En qué puedo ayudarte?",
      "timestamp": "2026-01-30T10:00:02Z"
    }
  ]
}
```

### Procesamiento Interno (Saturn Studio Flow)

```
1. Analizar intención de la pregunta
2. Identificar entidades (agentes, fechas, métricas)
3. RAG: Buscar datos relevantes en Supabase
   - Si pregunta por agente → SELECT agente + métricas + coaching
   - Si pregunta por alertas → SELECT alertas activas
   - Si pregunta por tendencias → SELECT métricas agregadas
   - Si pregunta estratégica → SELECT reporte_estrategia
4. LLM (Claude Sonnet): Generar respuesta natural
5. Enriquecer respuesta (sugerir visualizaciones, acciones)
6. Retornar respuesta
```

### Ejemplos de Preguntas y RAG

| Pregunta | Queries RAG |
|----------|-------------|
| "¿Cómo le fue a María?" | `get_agente_metrics(maria_id)`, `SELECT FROM coaching_reports WHERE agente_id = ?` |
| "¿Hay alertas críticas?" | `get_alertas_activas('critica')` |
| "¿Cuál es el mejor horario?" | `SELECT FROM reportes_estrategia ORDER BY fecha DESC LIMIT 1` |
| "Muéstrame las últimas llamadas" | `search_registros(limit=10)` |
| "¿Por qué bajó el score ayer?" | `get_tendencias_diarias()`, `SELECT alertas WHERE fecha = ayer` |

### Output Format (Response)

```json
{
  "message_id": "msg-789012",
  "session_id": "sess-123456",
  
  "respuesta": {
    "texto": "María González realizó **23 llamadas** en los últimos 5 días.\n\n📊 **Métricas:**\n- Score promedio: **72/100** (sobre el promedio del equipo de 78)\n- Tasa de validación: **32%** (muy por debajo del equipo: 61%)\n- Probabilidad de cumplimiento: **48%**\n\n⚠️ **Gap identificado:** Validación de compromisos\n\nSu plan de mejora esta semana se enfoca en lograr validación explícita en más del 75% de sus llamadas.",
    
    "visualizaciones": [
      {
        "tipo": "line_chart",
        "titulo": "Score de María - Últimos 7 días",
        "data": {
          "labels": ["24 Ene", "25 Ene", "26 Ene", "27 Ene", "28 Ene", "29 Ene", "30 Ene"],
          "datasets": [
            {"label": "María", "data": [68, 70, 72, 75, 71, 73, 72]},
            {"label": "Equipo", "data": [76, 77, 78, 78, 79, 78, 78]}
          ]
        }
      },
      {
        "tipo": "progress_bar",
        "titulo": "Validación vs Meta",
        "data": {"actual": 32, "meta": 75, "equipo": 61}
      }
    ],
    
    "acciones_sugeridas": [
      {
        "tipo": "ver_detalle",
        "label": "Ver perfil completo de María",
        "accion": "navigate",
        "url": "/agentes/a0000000-0000-0000-0000-000000000002"
      },
      {
        "tipo": "ver_coaching",
        "label": "Ver plan de coaching",
        "accion": "navigate",
        "url": "/coaching/a0000000-0000-0000-0000-000000000002"
      },
      {
        "tipo": "ver_llamadas",
        "label": "Ver sus llamadas",
        "accion": "filter",
        "params": {"agente_id": "a0000000-0000-0000-0000-000000000002"}
      }
    ],
    
    "preguntas_relacionadas": [
      "¿Qué llamadas debería revisar María?",
      "¿Cómo se compara con el mes pasado?",
      "¿Quién es el mejor agente del equipo?"
    ]
  },
  
  "metadata": {
    "queries_ejecutadas": 3,
    "tokens_usados": 450,
    "tiempo_procesamiento_ms": 2800
  }
}
```

---

<a name="supabase-realtime"></a>
## 9. Integración Supabase Realtime

### Configuración en la Web App

```typescript
// src/lib/supabase-realtime.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ===== SUSCRIPCIONES REALTIME =====

// 1. Nuevos registros de llamadas (para dashboard)
export function subscribeToNewRegistros(callback: (payload: any) => void) {
  return supabase
    .channel('registro_llamadas_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'registro_llamadas'
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// 2. Actualizaciones de análisis (cuando se completa)
export function subscribeToAnalisisUpdates(callback: (payload: any) => void) {
  return supabase
    .channel('analisis_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'analisis_llamadas'
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// 3. Nuevas alertas (para notificaciones en tiempo real)
export function subscribeToAlertas(callback: (payload: any) => void) {
  return supabase
    .channel('alertas_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alertas_anomalias',
        filter: 'estado=eq.nueva'
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// 4. Actualizaciones de coaching (para agentes)
export function subscribeToCoaching(agenteId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`coaching_${agenteId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'coaching_reports',
        filter: `agente_id=eq.${agenteId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

// 5. Reportes de estrategia (para dirección)
export function subscribeToEstrategia(callback: (payload: any) => void) {
  return supabase
    .channel('estrategia_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reportes_estrategia'
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
```

### Uso en Componentes React

```typescript
// src/components/Dashboard.tsx
import { useEffect, useState } from 'react'
import { subscribeToNewRegistros, subscribeToAlertas } from '@/lib/supabase-realtime'

export function Dashboard() {
  const [llamadasHoy, setLlamadasHoy] = useState(0)
  const [alertasActivas, setAlertasActivas] = useState([])

  useEffect(() => {
    // Suscribirse a nuevos registros
    const registrosSub = subscribeToNewRegistros((nuevoRegistro) => {
      setLlamadasHoy(prev => prev + 1)
      // Mostrar toast de nueva llamada
      toast.info(`Nueva llamada de ${nuevoRegistro.cliente_ref}`)
    })

    // Suscribirse a alertas
    const alertasSub = subscribeToAlertas((nuevaAlerta) => {
      setAlertasActivas(prev => [nuevaAlerta, ...prev])
      // Notificación según severidad
      if (nuevaAlerta.severidad === 'critica') {
        toast.error(`🚨 ALERTA CRÍTICA: ${nuevaAlerta.descripcion}`)
      }
    })

    return () => {
      registrosSub.unsubscribe()
      alertasSub.unsubscribe()
    }
  }, [])

  return (
    // ... UI del dashboard
  )
}
```

### Eventos Realtime por Tabla

| Tabla | Eventos | Uso en Web |
|-------|---------|------------|
| `registro_llamadas` | INSERT, UPDATE | Contador en dashboard, lista de llamadas |
| `transcripciones` | INSERT | Indicador de procesamiento |
| `analisis_llamadas` | INSERT | Actualizar scores, métricas |
| `alertas_anomalias` | INSERT, UPDATE | Notificaciones, badge de alertas |
| `coaching_reports` | INSERT | Notificación a agentes |
| `reportes_estrategia` | INSERT | Notificación a dirección |
| `metricas_agregadas` | UPDATE | Refrescar gráficos de tendencias |

---

<a name="webhooks-saturn"></a>
## 10. Webhooks de Saturn Studio

### Resumen de Endpoints

| Agente | Método | URL | Trigger |
|--------|--------|-----|---------|
| Transcriptor | POST | `/webhooks/nodus-transcriptor` | Nuevo audio |
| Analista | POST | `/webhooks/nodus-analista` | Post-transcripción |
| Detector | POST | `/webhooks/nodus-detector` | Post-análisis + Cron 30min |
| Coach | POST | `/webhooks/nodus-coach` | Cron diario 08:00 |
| Estratega | POST | `/webhooks/nodus-estratega` | Cron semanal DOM 22:00 |
| Conversacional | POST | `/webhooks/nodus-chat` | On-demand |

### Headers Comunes

```
Content-Type: application/json
X-Nodus-Version: 1.0
X-Nodus-Timestamp: 2026-01-30T14:30:00Z
X-Nodus-Signature: sha256=abc123... (opcional, para verificación)
```

### Respuestas Estándar

**Success (2xx)**
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-01-30T14:30:05Z"
}
```

**Error (4xx/5xx)**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campo audio_url es requerido",
    "details": { ... }
  },
  "timestamp": "2026-01-30T14:30:05Z"
}
```

### Configuración de Cron en Saturn Studio

```yaml
# cron-config.yaml
schedules:
  - name: detector_sistemico
    webhook: /webhooks/nodus-detector
    cron: "*/30 * * * *"  # Cada 30 minutos
    payload:
      trigger_type: cron_sistemico
    
  - name: coach_diario
    webhook: /webhooks/nodus-coach
    cron: "0 8 * * *"  # 08:00 todos los días
    timezone: America/Lima
    payload:
      trigger_type: cron_diario
      periodo_dias: 5
    
  - name: estratega_semanal
    webhook: /webhooks/nodus-estratega
    cron: "0 22 * * 0"  # Domingos 22:00
    timezone: America/Lima
    payload:
      trigger_type: cron_semanal
```

---

<a name="diagrama-secuencia"></a>
## 11. Diagrama de Secuencia Completo

```
┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  DRIVE   │ │ TRANSCRIPTOR │ │  ANALISTA  │ │ DETECTOR │ │  COACH   │ │ESTRATEGA│ │SUPABASE │ │   WEB   │
└────┬─────┘ └──────┬───────┘ └─────┬──────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │              │               │             │            │            │           │           │
     │ 1. Audio     │               │             │            │            │           │           │
     │─────────────>│               │             │            │            │           │           │
     │              │               │             │            │            │           │           │
     │              │ 2. INSERT     │             │            │            │           │           │
     │              │───────────────┼─────────────┼────────────┼────────────┼──────────>│ Realtime  │
     │              │               │             │            │            │           │──────────>│
     │              │ 3. Webhook    │             │            │            │           │           │
     │              │──────────────>│             │            │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │ 4. INSERT   │            │            │           │           │
     │              │               │─────────────┼────────────┼────────────┼──────────>│ Realtime  │
     │              │               │             │            │            │           │──────────>│
     │              │               │             │            │            │           │           │
     │              │               │ 5. Webhook  │            │            │           │           │
     │              │               │ (si alerta) │            │            │           │           │
     │              │               │────────────>│            │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │             │ 6. INSERT  │            │           │           │
     │              │               │             │────────────┼────────────┼──────────>│ Realtime  │
     │              │               │             │            │            │           │──────────>│
     │              │               │             │            │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │      [CRON 08:00]       │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │             │ 7. SELECT  │            │           │           │
     │              │               │             │<───────────┼────────────┼───────────│           │
     │              │               │             │            │            │           │           │
     │              │               │             │            │ 8. INSERT  │           │           │
     │              │               │             │            │────────────┼──────────>│ Realtime  │
     │              │               │             │            │            │           │──────────>│
     │              │               │             │            │            │           │           │
     │              │               │      [CRON DOM 22:00]   │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │             │            │ 9. SELECT  │           │           │
     │              │               │             │            │<───────────┼───────────│           │
     │              │               │             │            │            │           │           │
     │              │               │             │            │ 10. INSERT │           │           │
     │              │               │             │            │───────────>│──────────>│ Realtime  │
     │              │               │             │            │            │           │──────────>│
     │              │               │             │            │            │           │           │
     │              │               │             │            │            │           │           │
     │              │               │             │            │            │           │  Usuario  │
     │              │               │             │            │            │           │<──────────│
     │              │               │             │            │            │           │ pregunta  │
     │              │               │             │            │            │           │           │
     │              │               │ 11. CHAT    │            │            │           │           │
     │              │               │<────────────┼────────────┼────────────┼───────────│           │
     │              │               │             │            │            │           │           │
     │              │               │ 12. SELECT  │            │            │           │           │
     │              │               │────────────>│────────────┼────────────┼──────────>│           │
     │              │               │             │            │            │           │           │
     │              │               │ 13. Response│            │            │           │           │
     │              │               │─────────────┼────────────┼────────────┼──────────>│──────────>│
     │              │               │             │            │            │           │           │
     ▼              ▼               ▼             ▼            ▼            ▼           ▼           ▼
```

---

## 📋 Checklist de Implementación

### Saturn Studio
- [ ] Crear webhook `/webhooks/nodus-transcriptor`
- [ ] Crear webhook `/webhooks/nodus-analista`
- [ ] Crear webhook `/webhooks/nodus-detector`
- [ ] Crear webhook `/webhooks/nodus-coach`
- [ ] Crear webhook `/webhooks/nodus-estratega`
- [ ] Crear webhook `/webhooks/nodus-chat`
- [ ] Configurar crons (Detector 30min, Coach 08:00, Estratega DOM 22:00)
- [ ] Conectar AI Studio para transcripción/emociones
- [ ] Configurar LLM (Claude Opus/Sonnet)

### Supabase
- [ ] Ejecutar `schema.sql`
- [ ] Ejecutar `functions.sql`
- [ ] Configurar Realtime para tablas principales
- [ ] Crear service role key para Saturn Studio
- [ ] (Opcional) Configurar RLS

### Web App
- [ ] Implementar suscripciones Realtime
- [ ] Crear componentes de notificación
- [ ] Integrar chat conversacional

### Integraciones Externas
- [ ] Configurar trigger de Google Drive
- [ ] Configurar Slack webhook para alertas
- [ ] Configurar email para notificaciones

---

**Documento creado**: Enero 2026  
**Versión**: 1.0  
**Autor**: Sistema NODUS

