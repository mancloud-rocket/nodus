# Agente 1: Transcriptor

## Visión General

El Agente Transcriptor convierte audio de llamadas en datos estructurados listos para análisis.

## Pipeline de Procesamiento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENTE TRANSCRIPTOR                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Audio (MP3/WAV) desde Google Drive + Metadata básica                │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 1: Transcripción + Emociones (Gemini 2.0 Flash)                 │   │
│  │ - Transcripción con diarización                                      │   │
│  │ - Identificación de speakers (agente/cliente)                        │   │
│  │ - Extracción de participantes (nombres, empresas)                    │   │
│  │ - Análisis de emociones por segmento                                 │   │
│  │ - Métricas conversacionales (ratio habla, interrupciones, silencios) │   │
│  │ - Output: JSON estructurado                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 2: Extracción de Entidades (Claude Sonnet 4.5)                  │   │
│  │ - Montos mencionados (deudas, ofertas, pagos)                        │   │
│  │ - Fechas (compromisos, plazos)                                       │   │
│  │ - Métodos de pago                                                    │   │
│  │ - Referencias de créditos                                            │   │
│  │ - Objeciones y compromisos                                           │   │
│  │ - Patrones de script                                                 │   │
│  │ - Resultado preliminar y seguimiento                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 3: INSERT en Supabase                                           │   │
│  │ - registro_llamadas (metadata de la llamada)                         │   │
│  │ - transcripciones (toda la información extraída)                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PASO 4: Trigger Webhook → Agente Analista                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Archivos de Prompts

| Archivo | Descripción | Tecnología |
|---------|-------------|------------|
| `prompt_gemini_transcripcion.md` | Transcripción + emociones + participantes | Gemini 2.0 Flash |
| `paso5_6_prompt_llm.md` | Extracción de entidades y análisis preliminar | Claude Sonnet 4.5 |

## Outputs del Agente

### Output de Gemini (Paso 1)
```json
{
  "transcripcion_completa": "...",
  "duracion_segundos": 268,
  "participantes": {
    "cliente": {"nombre_completo": "Yessenia González", ...},
    "agente": {"nombre_completo": "Silvano Machado", ...},
    "empresa_cobranza": "Redsap",
    "empresa_acreedora": "Caja Los Andes"
  },
  "segmentos_raw": [...],
  "estadisticas_basicas": {...},
  "metricas_conversacion": {...},
  "analisis_emocional": {...}
}
```

### Output de Claude (Paso 2)
```json
{
  "entidades": {
    "montos": [...],
    "fechas": [...],
    "metodos_pago": [...],
    "referencias_creditos": [...],
    "objeciones": [...],
    "compromisos": [...]
  },
  "patrones_script": {...},
  "resultado_llamada": {...},
  "seguimiento": {...},
  "resumen_ejecutivo": {...}
}
```

## Tablas de Supabase Afectadas

### `registro_llamadas`
| Campo | Fuente | Notas |
|-------|--------|-------|
| `audio_url` | Webhook/Drive | URL del audio |
| `duracion_segundos` | Gemini | Calculado |
| `agente_nombre` | Gemini `participantes.agente.nombre_completo` | Extraído |
| `cliente_nombre` | Gemini `participantes.cliente.nombre_completo` | Extraído |
| `empresa_acreedora` | Gemini `participantes.empresa_acreedora` | Extraído |
| `empresa_cobranza` | Gemini `participantes.empresa_cobranza` | Extraído |
| `estado` | Calculado | "transcrito" → "analizado" |

### `transcripciones`
| Campo | Fuente |
|-------|--------|
| `transcripcion_completa` | Gemini |
| `segmentos` | Gemini `segmentos_raw` |
| `entidades` | Claude |
| `metricas_conversacion` | Gemini `metricas_conversacion` + `estadisticas_basicas` |
| `analisis_emocional` | Gemini |
| `patrones_script` | Claude |
| `resultado_preliminar` | Claude `resultado_llamada` |
| `resumen_ejecutivo` | Claude |
| `referencias_creditos` | Claude |
| `seguimiento` | Claude |

## Tiempo de Procesamiento Esperado

| Paso | Tiempo | Notas |
|------|--------|-------|
| Gemini (transcripción + emociones) | 15-30s | Depende de duración del audio |
| Claude (extracción) | 5-10s | Un request |
| INSERT Supabase | <1s | - |
| **Total** | **20-40s** | Para llamada de ~5 min |

## Siguiente Agente

El **Agente Analista** (ag2) recibe el webhook con:
```json
{
  "registro_id": "uuid",
  "transcripcion_id": "uuid",
  "agente_id": "uuid",
  "resultado_preliminar": {...}
}
```

Y se encarga de:
- Calcular scores de módulos (contacto directo, compromiso, abandono)
- Calcular probabilidad de cumplimiento
- Generar alertas si es necesario
- Trigger al Agente Detector si hay alertas críticas
