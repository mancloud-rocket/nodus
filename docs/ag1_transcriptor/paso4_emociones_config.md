# Paso 4: Análisis de Emociones

## Configuración de AI Studio - Emotion Analysis

### Request a AI Studio

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=FILE_ID",
  "segments": [
    {"start": 0.0, "end": 3.2, "speaker": "agente"},
    {"start": 3.2, "end": 5.8, "speaker": "cliente"},
    {"start": 5.8, "end": 12.4, "speaker": "agente"}
  ],
  "config": {
    "model": "emotion-recognition-v2",
    "granularity": "segment",
    "emotions": ["neutral", "positive", "negative", "frustrated", "confused", "interested"],
    "include_confidence": true,
    "include_intensity": true
  }
}
```

### Categorías de Emociones

| Emoción | Código | Descripción | Indicador en Cobranzas |
|---------|--------|-------------|------------------------|
| `neutral` | 😐 | Sin carga emocional | Estado base, normal |
| `positive` | 😊 | Tono positivo, amable | Buena receptividad |
| `negative` | 😠 | Molestia, enojo | Riesgo de abandono |
| `frustrated` | 😤 | Frustración evidente | Alta probabilidad de conflicto |
| `confused` | 😕 | Confusión, duda | Necesita más explicación |
| `interested` | 🤔 | Interés, atención | Oportunidad de cierre |

---

## Formato de Salida Esperado

```json
{
  "analysis_id": "emo-12345",
  "segments": [
    {
      "segment_id": 0,
      "start": 0.0,
      "end": 3.2,
      "speaker": "agente",
      "emotion": {
        "primary": "neutral",
        "confidence": 0.92,
        "intensity": 0.3,
        "secondary": null
      },
      "voice_features": {
        "pitch_mean": 145.2,
        "pitch_variance": 12.5,
        "energy": 0.65,
        "speech_rate": 148
      }
    },
    {
      "segment_id": 1,
      "start": 3.2,
      "end": 5.8,
      "speaker": "cliente",
      "emotion": {
        "primary": "neutral",
        "confidence": 0.88,
        "intensity": 0.25,
        "secondary": "confused"
      },
      "voice_features": {
        "pitch_mean": 165.8,
        "pitch_variance": 18.2,
        "energy": 0.58,
        "speech_rate": 135
      }
    },
    {
      "segment_id": 15,
      "start": 120.5,
      "end": 135.2,
      "speaker": "cliente",
      "emotion": {
        "primary": "frustrated",
        "confidence": 0.85,
        "intensity": 0.72,
        "secondary": "negative"
      },
      "voice_features": {
        "pitch_mean": 195.3,
        "pitch_variance": 45.8,
        "energy": 0.85,
        "speech_rate": 168
      }
    }
  ],
  "summary": {
    "agente": {
      "dominant_emotion": "neutral",
      "emotion_distribution": {
        "neutral": 0.75,
        "positive": 0.20,
        "negative": 0.05
      },
      "avg_intensity": 0.35,
      "speech_rate_avg": 148
    },
    "cliente": {
      "dominant_emotion": "neutral",
      "emotion_distribution": {
        "neutral": 0.55,
        "negative": 0.20,
        "frustrated": 0.15,
        "interested": 0.10
      },
      "avg_intensity": 0.45,
      "speech_rate_avg": 142
    }
  }
}
```

---

## Métricas de Voz Importantes

### Speech Rate (Palabras por Minuto)

| Rango | Interpretación |
|-------|----------------|
| < 100 | Muy lento, posible desinterés |
| 100-140 | Normal, relajado |
| 140-160 | Activo, comprometido |
| 160-180 | Rápido, posible ansiedad |
| > 180 | Muy rápido, agitación o molestia |

### Pitch Variance (Variación de Tono)

| Valor | Interpretación |
|-------|----------------|
| < 10 | Monótono, aburrido/desinteresado |
| 10-25 | Normal, conversación estándar |
| 25-40 | Expresivo, engaged |
| > 40 | Alta variación, posible emoción fuerte |

### Energy (Intensidad de Voz)

| Valor | Interpretación |
|-------|----------------|
| < 0.3 | Muy bajo, susurrando o desganado |
| 0.3-0.5 | Normal bajo |
| 0.5-0.7 | Normal, conversación activa |
| 0.7-0.85 | Alto, énfasis |
| > 0.85 | Muy alto, posible enojo o frustración |

---

## Post-Procesamiento: Detección de Momentos Críticos

### Patrones a Detectar

```python
# Pseudocódigo para detección de momentos críticos

momentos_criticos = []

for i, seg in enumerate(segments):
    # 1. Cambio emocional brusco del cliente
    if seg.speaker == "cliente" and i > 0:
        prev = segments[i-1]
        if prev.speaker == "cliente":
            if prev.emotion.primary == "neutral" and seg.emotion.primary in ["negative", "frustrated"]:
                momentos_criticos.append({
                    "tipo": "cambio_emocional_negativo",
                    "timestamp": seg.start,
                    "descripcion": f"Cliente pasó de neutral a {seg.emotion.primary}",
                    "severidad": "alta"
                })
    
    # 2. Frustración alta
    if seg.emotion.primary == "frustrated" and seg.emotion.intensity > 0.7:
        momentos_criticos.append({
            "tipo": "frustracion_alta",
            "timestamp": seg.start,
            "speaker": seg.speaker,
            "severidad": "critica"
        })
    
    # 3. Silencio prolongado después de pregunta del agente
    if seg.speaker == "agente" and "?" in seg.texto:
        next_seg = segments[i+1] if i+1 < len(segments) else None
        if next_seg and (next_seg.start - seg.end) > 3.0:  # más de 3 segundos
            momentos_criticos.append({
                "tipo": "silencio_prolongado",
                "timestamp": seg.end,
                "duracion": next_seg.start - seg.end,
                "severidad": "media"
            })
```

---

## Formato Final Combinado con Transcripción

Después de pasos 3 y 4, combinar en:

```json
{
  "segmentos": [
    {
      "id": 0,
      "speaker": "agente",
      "timestamp_inicio": 0.0,
      "timestamp_fin": 3.2,
      "texto": "Buenos días, ¿hablo con el señor García?",
      "palabras": 7,
      "confianza_transcripcion": 0.98,
      "emocion": "neutral",
      "emocion_confianza": 0.92,
      "emocion_intensidad": 0.3,
      "velocidad_habla": 148
    },
    {
      "id": 1,
      "speaker": "cliente",
      "timestamp_inicio": 3.2,
      "timestamp_fin": 5.8,
      "texto": "Sí, soy yo. ¿De dónde me llama?",
      "palabras": 7,
      "confianza_transcripcion": 0.98,
      "emocion": "neutral",
      "emocion_confianza": 0.88,
      "emocion_intensidad": 0.25,
      "velocidad_habla": 135
    }
  ],
  "momentos_criticos": [
    {
      "tipo": "cambio_emocional_negativo",
      "timestamp": 120.5,
      "descripcion": "Cliente pasó de neutral a frustrated",
      "severidad": "alta"
    }
  ],
  "resumen_emocional": {
    "agente": {
      "emocion_dominante": "neutral",
      "distribucion": {"neutral": 0.75, "positive": 0.20, "negative": 0.05},
      "velocidad_promedio": 148
    },
    "cliente": {
      "emocion_dominante": "neutral",
      "distribucion": {"neutral": 0.55, "negative": 0.20, "frustrated": 0.15, "interested": 0.10},
      "velocidad_promedio": 142
    }
  }
}
```

---

## Alternativa: Análisis con LLM

Si AI Studio no tiene análisis de emociones, se puede usar el LLM en el paso 5-6 para inferir emociones basándose en:
- Texto de la transcripción
- Puntuación y signos (¿!, ...)
- Palabras clave emocionales
- Contexto de la conversación

Ver `paso5_6_prompt_llm.md` para el prompt que incluye análisis emocional basado en texto.



