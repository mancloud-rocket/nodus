# Prompt para Gemini 2.0 Flash - Transcripción + Emociones

## System Prompt (Contexto)

```
Eres un experto transcriptor y analizador de llamadas de cobranza en español latinoamericano.

Tu tarea es:
1. Transcribir el audio con precisión
2. Identificar quién habla (agente vs cliente)
3. Segmentar la conversación con timestamps
4. Analizar las emociones de cada segmento basándote en el tono de voz y contenido
5. Extraer información clave de los participantes (nombres, empresa)
6. Calcular métricas conversacionales

CONTEXTO DEL NEGOCIO:
- Llamadas de gestión de cobranza de deudas
- Siempre hay 2 participantes: agente (call center) y cliente (deudor)
- El agente busca obtener un compromiso de pago

CATEGORÍAS DE EMOCIONES:
- neutral: Sin carga emocional evidente, tono normal
- positivo: Tono amable, colaborador, receptivo
- negativo: Molestia, enojo, rechazo
- frustrado: Frustración evidente, exasperación
- confundido: Duda, no entiende, pide repetir
- interesado: Atento, hace preguntas, muestra disposición
- ansioso: Nervioso, preocupado por la situación
- aliviado: Alivio al escuchar opciones o soluciones
```

---

## User Prompt

```
Transcribe y analiza el siguiente audio de una llamada de cobranza.

## INSTRUCCIONES

### 1. Identificar Speakers y Extraer Información de Participantes
- Analiza quién es el agente y quién es el cliente basándote en:
  * Contenido del mensaje (términos de cobranza, identificación de empresa)
  * Orden de aparición (generalmente el agente habla primero en outbound)
  * Tipo de preguntas/respuestas
- Mapea los speakers a "agente" o "cliente"
- **EXTRAE** los siguientes datos si se mencionan:
  * Nombre completo del cliente
  * Nombre del agente
  * Empresa de cobranza (la que llama)
  * Empresa acreedora (a quien se le debe)

### 2. Estructurar Segmentos con Emociones
Cada segmento debe incluir:
- id (secuencial, empezando en 0)
- speaker ("agente" o "cliente")
- timestamp_inicio (número decimal en segundos)
- timestamp_fin (número decimal en segundos)
- texto (texto limpio del segmento)
- palabras (conteo de palabras)
- confianza (nivel de confianza de la transcripción, 0-1)
- emocion (emoción detectada: neutral, positivo, negativo, frustrado, confundido, interesado, ansioso, aliviado)
- emocion_intensidad (intensidad de la emoción, 0.0 a 1.0)

### 3. Analizar Emociones
Para cada segmento, evalúa:
- **Tono de voz**: velocidad, volumen, variación de tono
- **Contenido textual**: palabras usadas, signos de exclamación/interrogación
- **Contexto**: qué se dijo antes, reacción a información previa

Indicadores por emoción:
- **neutral**: Tono plano, respuestas cortas como "sí", "ok", "ajá"
- **positivo**: Tono animado, palabras como "perfecto", "gracias", "excelente"
- **negativo**: Tono cortante, palabras como "no puedo", "no quiero", suspiros
- **frustrado**: Voz elevada, repeticiones, "ya le dije", "no entiendo por qué"
- **confundido**: Preguntas, "¿cómo?", "¿perdón?", pausas largas
- **interesado**: Preguntas sobre opciones, "¿y si...?", "cuénteme más"
- **ansioso**: Voz temblorosa, preguntas sobre consecuencias
- **aliviado**: Suspiro de alivio, "ah, ok", "qué bueno", tono relajado

### 4. Detectar Momentos Críticos
Identifica cambios emocionales importantes:
- Transiciones de negativo a positivo (o viceversa)
- Momentos de alta tensión
- Momentos de aceptación/apertura

### 5. Calcular Métricas Conversacionales
- Total de segmentos y por speaker
- Palabras totales y por speaker
- **Ratio de habla** (palabras_agente / palabras_totales)
- **Interrupciones detectadas** (cuando un speaker corta al otro)
- **Silencios prolongados** (gaps > 3 segundos entre segmentos)
- Confianza promedio
- Distribución emocional por speaker

### 6. Validar
- Todos los segmentos deben tener speaker válido
- Timestamps deben ser crecientes
- Cada segmento debe tener emoción asignada

## FORMATO DE RESPUESTA (JSON)

{
  "transcripcion_completa": "texto completo de toda la llamada...",
  "duracion_segundos": 273.8,
  
  "participantes": {
    "cliente": {
      "nombre_completo": "Yessenia Andrea González Díaz",
      "nombre_corto": "Yessenia"
    },
    "agente": {
      "nombre_completo": "Silvano Machado",
      "nombre_corto": "Silvano"
    },
    "empresa_cobranza": "Redsap",
    "empresa_acreedora": "Caja Los Andes"
  },
  
  "segmentos_raw": [
    {
      "id": 0,
      "speaker": "agente",
      "timestamp_inicio": 0.0,
      "timestamp_fin": 1.5,
      "texto": "Buenas tardes.",
      "palabras": 2,
      "confianza": 0.99,
      "emocion": "neutral",
      "emocion_intensidad": 0.3
    },
    {
      "id": 1,
      "speaker": "cliente",
      "timestamp_inicio": 2.0,
      "timestamp_fin": 3.5,
      "texto": "Buenas tardes.",
      "palabras": 2,
      "confianza": 0.99,
      "emocion": "neutral",
      "emocion_intensidad": 0.25
    }
  ],
  
  "estadisticas_basicas": {
    "total_segmentos": 55,
    "segmentos_agente": 29,
    "segmentos_cliente": 26,
    "palabras_totales": 552,
    "palabras_agente": 415,
    "palabras_cliente": 137,
    "confianza_promedio": 0.97
  },
  
  "metricas_conversacion": {
    "ratio_habla_agente": 0.75,
    "turnos_conversacion": 55,
    "duracion_promedio_turno_agente": 6.2,
    "duracion_promedio_turno_cliente": 2.8,
    "interrupciones": [],
    "silencios_prolongados": [
      {
        "timestamp_inicio": 58.0,
        "duracion_segundos": 4.5,
        "contexto": "Después de presentar oferta, cliente procesa información"
      }
    ]
  },
  
  "analisis_emocional": {
    "agente": {
      "emocion_dominante": "neutral",
      "distribucion": {
        "neutral": 0.60,
        "positivo": 0.35,
        "negativo": 0.05
      },
      "intensidad_promedio": 0.35
    },
    "cliente": {
      "emocion_dominante": "neutral",
      "distribucion": {
        "neutral": 0.45,
        "positivo": 0.25,
        "interesado": 0.15,
        "ansioso": 0.10,
        "confundido": 0.05
      },
      "intensidad_promedio": 0.40
    },
    "evolucion_cliente": "mejoro",
    "momentos_criticos": [
      {
        "timestamp": 35.8,
        "tipo": "revelacion_situacion",
        "descripcion": "Cliente revela que está sin trabajo",
        "emocion_antes": "neutral",
        "emocion_despues": "ansioso",
        "impacto": "alto"
      },
      {
        "timestamp": 249.0,
        "tipo": "aceptacion",
        "descripcion": "Cliente acepta la oferta y confirma pago",
        "emocion_antes": "interesado",
        "emocion_despues": "positivo",
        "impacto": "alto"
      }
    ]
  },
  
  "speaker_mapping": {
    "SPEAKER_00": "agente",
    "SPEAKER_01": "cliente",
    "confidence": 0.99,
    "method": "first_speaker_identifies_company"
  }
}

Responde ÚNICAMENTE con el JSON, sin texto adicional.
```

---

## Ejemplo de Output Esperado

Para el audio de ejemplo (Silvana - Caja Los Andes), el output debería verse así:

```json
{
  "transcripcion_completa": "Buenas tardes. Buenas tardes. ¿Sí, buenas tardes? Hablo con la señora Yesenia Andrea González Díaz...",
  "duracion_segundos": 313.5,
  
  "segmentos_raw": [
    {
      "id": 0,
      "speaker": "agente",
      "timestamp_inicio": 0,
      "timestamp_fin": 1.5,
      "texto": "Buenas tardes.",
      "palabras": 2,
      "confianza": 0.99,
      "emocion": "neutral",
      "emocion_intensidad": 0.3
    },
    {
      "id": 1,
      "speaker": "cliente",
      "timestamp_inicio": 2,
      "timestamp_fin": 3.5,
      "texto": "Buenas tardes.",
      "palabras": 2,
      "confianza": 0.99,
      "emocion": "neutral",
      "emocion_intensidad": 0.25
    },
    {
      "id": 12,
      "speaker": "cliente",
      "timestamp_inicio": 125,
      "timestamp_fin": 129.5,
      "texto": "Ayer pagué uno de 16 que eran 10 mil y algo.",
      "palabras": 10,
      "confianza": 0.97,
      "emocion": "positivo",
      "emocion_intensidad": 0.5
    },
    {
      "id": 39,
      "speaker": "cliente",
      "timestamp_inicio": 249,
      "timestamp_fin": 254.5,
      "texto": "Yo creo que sí. Ese de 120... ¿cuánto me dijo? ¿128?",
      "palabras": 10,
      "confianza": 0.97,
      "emocion": "interesado",
      "emocion_intensidad": 0.6
    },
    {
      "id": 47,
      "speaker": "cliente",
      "timestamp_inicio": 291,
      "timestamp_fin": 296,
      "texto": "Sí, yo creo que el sábado cancelo esos 128 y ya me quedaría el otro nomás.",
      "palabras": 15,
      "confianza": 0.98,
      "emocion": "positivo",
      "emocion_intensidad": 0.65
    },
    {
      "id": 49,
      "speaker": "cliente",
      "timestamp_inicio": 299.6,
      "timestamp_fin": 302.5,
      "texto": "Poco a poco. Gracias.",
      "palabras": 4,
      "confianza": 0.99,
      "emocion": "aliviado",
      "emocion_intensidad": 0.55
    }
  ],
  
  "analisis_emocional": {
    "agente": {
      "emocion_dominante": "positivo",
      "distribucion": {
        "neutral": 0.40,
        "positivo": 0.55,
        "negativo": 0.05
      },
      "intensidad_promedio": 0.42
    },
    "cliente": {
      "emocion_dominante": "neutral",
      "distribucion": {
        "neutral": 0.50,
        "positivo": 0.30,
        "interesado": 0.12,
        "confundido": 0.05,
        "aliviado": 0.03
      },
      "intensidad_promedio": 0.38
    },
    "evolucion_cliente": "mejoro",
    "momentos_criticos": [
      {
        "timestamp": 125,
        "tipo": "informacion_positiva",
        "descripcion": "Cliente informa que ya pagó un crédito ayer",
        "emocion_antes": "neutral",
        "emocion_despues": "positivo",
        "impacto": "medio"
      },
      {
        "timestamp": 291,
        "tipo": "compromiso",
        "descripcion": "Cliente confirma que pagará el sábado",
        "emocion_antes": "interesado",
        "emocion_despues": "positivo",
        "impacto": "alto"
      }
    ]
  }
}
```

---

## Notas de Implementación

### Parámetros para Gemini

```json
{
  "model": "gemini-2.0-flash",
  "temperature": 0.1,
  "max_output_tokens": 8000,
  "response_mime_type": "application/json"
}
```

### Validación Post-Respuesta

```python
def validate_gemini_output(output):
    errors = []
    
    # 1. Verificar estructura básica
    required_keys = ['transcripcion_completa', 'duracion_segundos', 'segmentos_raw', 
                     'estadisticas_basicas', 'analisis_emocional', 'speaker_mapping']
    for key in required_keys:
        if key not in output:
            errors.append(f"Falta campo requerido: {key}")
    
    # 2. Verificar que cada segmento tiene emoción
    for seg in output.get('segmentos_raw', []):
        if 'emocion' not in seg:
            errors.append(f"Segmento {seg.get('id')} sin emoción")
        if seg.get('emocion') not in ['neutral', 'positivo', 'negativo', 'frustrado', 
                                       'confundido', 'interesado', 'ansioso', 'aliviado']:
            errors.append(f"Segmento {seg.get('id')} con emoción inválida: {seg.get('emocion')}")
    
    # 3. Verificar timestamps crecientes
    prev_end = 0
    for seg in output.get('segmentos_raw', []):
        if seg.get('timestamp_inicio', 0) < prev_end - 0.5:  # tolerancia de 0.5s
            errors.append(f"Segmento {seg.get('id')} con timestamp fuera de orden")
        prev_end = seg.get('timestamp_fin', 0)
    
    return {"valid": len(errors) == 0, "errors": errors}
```

---

## Diferencias vs Prompt Anterior

| Campo | Antes | Ahora |
|-------|-------|-------|
| `segmentos_raw[].emocion` | ❌ No incluido | ✅ Incluido |
| `segmentos_raw[].emocion_intensidad` | ❌ No incluido | ✅ Incluido |
| `analisis_emocional` | ❌ No incluido | ✅ Nuevo objeto completo |
| `analisis_emocional.momentos_criticos` | ❌ No incluido | ✅ Detecta cambios importantes |
| `analisis_emocional.evolucion_cliente` | ❌ No incluido | ✅ mejoro/empeoro/estable |

