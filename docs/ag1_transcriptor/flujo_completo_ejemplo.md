# Flujo Completo del Agente Transcriptor - Ejemplo E2E

## Input Inicial (desde Google Drive)

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=1abc123def456",
  "audio_id_externo": "1abc123def456",
  "agente_id": "a0000000-0000-0000-0000-000000000002",
  "cliente_ref": "CL-45632",
  "timestamp_inicio": "2026-01-30T14:23:15-05:00",
  "timestamp_fin": "2026-01-30T14:27:30-05:00",
  "campana": "Recuperación Q1",
  "tipo_deuda": "tarjeta_credito",
  "monto_deuda": 1450.00,
  "moneda": "PEN",
  "dias_mora": 45,
  "metadata_externa": {
    "ivr_session_id": "IVR-12345",
    "origen": "outbound"
  }
}
```

---

## PASO 3: Transcripción con Whisper

### Request a AI Studio

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=1abc123def456",
  "config": {
    "model": "whisper-large-v3",
    "language": "es",
    "task": "transcribe",
    "diarization": {
      "enabled": true,
      "min_speakers": 2,
      "max_speakers": 2
    },
    "timestamps": {
      "granularity": "word",
      "include_confidence": true
    },
    "output_format": "verbose_json"
  }
}
```

### Response de Whisper

```json
{
  "text": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama? Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta. ¿Me permite unos minutos? Sí, dígame. Señor García, tenemos registrado un saldo vencido de 1,450 soles que venció el 15 de diciembre. Actualmente tiene 45 días de mora y se están generando intereses adicionales. ¿Está al tanto de esta situación? Sí, lo sé, pero es que ahorita no tengo plata, estoy sin trabajo desde hace dos meses. Entiendo su situación señor García, lamento escuchar eso. Permítame ofrecerle algunas alternativas. Podemos establecer un plan de pago o quizás un pago parcial inicial. ¿Tiene alguna fecha en la que podría hacer un primer abono? Mire, lo que puedo hacer es pagar todo junto el 15 de febrero, cuando me paguen mi liquidación. Perfecto, entonces quedamos que va a realizar el pago completo de 1,450 soles el 15 de febrero. ¿Está de acuerdo? Sí, eso es lo que voy a hacer. Excelente señor García. Le recuerdo que puede pagar por nuestra página web, la app móvil, o en cualquier agencia. ¿Tiene alguna pregunta? No, está claro. Gracias. Muy bien. Muchas gracias por su tiempo señor García. Que tenga buen día. Igualmente, hasta luego.",
  "language": "es",
  "duration": 255.4,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.2,
      "text": "Buenos días, ¿hablo con el señor García?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 1,
      "start": 3.2,
      "end": 5.8,
      "text": "Sí, soy yo. ¿De dónde me llama?",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 2,
      "start": 5.8,
      "end": 15.5,
      "text": "Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta. ¿Me permite unos minutos?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 3,
      "start": 15.5,
      "end": 17.2,
      "text": "Sí, dígame.",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 4,
      "start": 17.2,
      "end": 35.8,
      "text": "Señor García, tenemos registrado un saldo vencido de 1,450 soles que venció el 15 de diciembre. Actualmente tiene 45 días de mora y se están generando intereses adicionales. ¿Está al tanto de esta situación?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 5,
      "start": 35.8,
      "end": 45.2,
      "text": "Sí, lo sé, pero es que ahorita no tengo plata, estoy sin trabajo desde hace dos meses.",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 6,
      "start": 45.2,
      "end": 65.5,
      "text": "Entiendo su situación señor García, lamento escuchar eso. Permítame ofrecerle algunas alternativas. Podemos establecer un plan de pago o quizás un pago parcial inicial. ¿Tiene alguna fecha en la que podría hacer un primer abono?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 7,
      "start": 65.5,
      "end": 78.3,
      "text": "Mire, lo que puedo hacer es pagar todo junto el 15 de febrero, cuando me paguen mi liquidación.",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 8,
      "start": 78.3,
      "end": 92.5,
      "text": "Perfecto, entonces quedamos que va a realizar el pago completo de 1,450 soles el 15 de febrero. ¿Está de acuerdo?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 9,
      "start": 92.5,
      "end": 95.8,
      "text": "Sí, eso es lo que voy a hacer.",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 10,
      "start": 95.8,
      "end": 115.2,
      "text": "Excelente señor García. Le recuerdo que puede pagar por nuestra página web, la app móvil, o en cualquier agencia. ¿Tiene alguna pregunta?",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 11,
      "start": 115.2,
      "end": 118.5,
      "text": "No, está claro. Gracias.",
      "speaker": "SPEAKER_01"
    },
    {
      "id": 12,
      "start": 118.5,
      "end": 125.8,
      "text": "Muy bien. Muchas gracias por su tiempo señor García. Que tenga buen día.",
      "speaker": "SPEAKER_00"
    },
    {
      "id": 13,
      "start": 125.8,
      "end": 128.2,
      "text": "Igualmente, hasta luego.",
      "speaker": "SPEAKER_01"
    }
  ]
}
```

### Post-proceso: Mapeo de Speakers

```json
{
  "speaker_mapping": {
    "SPEAKER_00": "agente",
    "SPEAKER_01": "cliente"
  },
  "method": "first_speaker_identifies_company",
  "confidence": 0.98
}
```

---

## PASO 4: Análisis de Emociones

### Request a AI Studio

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=1abc123def456",
  "segments": [
    {"id": 0, "start": 0.0, "end": 3.2, "speaker": "agente"},
    {"id": 1, "start": 3.2, "end": 5.8, "speaker": "cliente"},
    {"id": 2, "start": 5.8, "end": 15.5, "speaker": "agente"},
    {"id": 3, "start": 15.5, "end": 17.2, "speaker": "cliente"},
    {"id": 4, "start": 17.2, "end": 35.8, "speaker": "agente"},
    {"id": 5, "start": 35.8, "end": 45.2, "speaker": "cliente"},
    {"id": 6, "start": 45.2, "end": 65.5, "speaker": "agente"},
    {"id": 7, "start": 65.5, "end": 78.3, "speaker": "cliente"},
    {"id": 8, "start": 78.3, "end": 92.5, "speaker": "agente"},
    {"id": 9, "start": 92.5, "end": 95.8, "speaker": "cliente"},
    {"id": 10, "start": 95.8, "end": 115.2, "speaker": "agente"},
    {"id": 11, "start": 115.2, "end": 118.5, "speaker": "cliente"},
    {"id": 12, "start": 118.5, "end": 125.8, "speaker": "agente"},
    {"id": 13, "start": 125.8, "end": 128.2, "speaker": "cliente"}
  ],
  "config": {
    "model": "emotion-recognition-v2",
    "emotions": ["neutral", "positive", "negative", "frustrated", "confused", "interested"]
  }
}
```

### Response de Emociones

```json
{
  "segments": [
    {"id": 0, "emotion": "neutral", "confidence": 0.92, "intensity": 0.3, "speech_rate": 145},
    {"id": 1, "emotion": "neutral", "confidence": 0.88, "intensity": 0.35, "speech_rate": 140},
    {"id": 2, "emotion": "positive", "confidence": 0.85, "intensity": 0.45, "speech_rate": 148},
    {"id": 3, "emotion": "neutral", "confidence": 0.90, "intensity": 0.25, "speech_rate": 130},
    {"id": 4, "emotion": "neutral", "confidence": 0.88, "intensity": 0.40, "speech_rate": 152},
    {"id": 5, "emotion": "negative", "confidence": 0.82, "intensity": 0.65, "speech_rate": 125},
    {"id": 6, "emotion": "positive", "confidence": 0.86, "intensity": 0.50, "speech_rate": 145},
    {"id": 7, "emotion": "neutral", "confidence": 0.80, "intensity": 0.45, "speech_rate": 138},
    {"id": 8, "emotion": "positive", "confidence": 0.88, "intensity": 0.55, "speech_rate": 150},
    {"id": 9, "emotion": "positive", "confidence": 0.85, "intensity": 0.50, "speech_rate": 142},
    {"id": 10, "emotion": "positive", "confidence": 0.90, "intensity": 0.48, "speech_rate": 148},
    {"id": 11, "emotion": "positive", "confidence": 0.87, "intensity": 0.40, "speech_rate": 135},
    {"id": 12, "emotion": "positive", "confidence": 0.92, "intensity": 0.52, "speech_rate": 145},
    {"id": 13, "emotion": "positive", "confidence": 0.88, "intensity": 0.45, "speech_rate": 140}
  ]
}
```

---

## PASO 5-6: Prompt LLM (Claude Sonnet)

### Request al LLM

**System Prompt:**
```
Eres un experto analizador de llamadas de cobranzas. Tu tarea es extraer información estructurada de transcripciones de llamadas entre agentes de cobranza y clientes deudores.

CONTEXTO DEL NEGOCIO:
- Las llamadas son de gestión de cobranza de deudas (tarjetas de crédito, préstamos, etc.)
- El objetivo del agente es lograr un compromiso de pago del cliente
- Un "compromiso válido" requiere: monto específico + fecha específica + VALIDACIÓN EXPLÍCITA del cliente

REGLAS DE ANÁLISIS:
1. Sé objetivo y basa todo en evidencia textual exacta
2. Si algo no está claro, indica "no_detectado" en lugar de inferir
3. Los montos deben estar en la moneda mencionada (PEN, USD, etc.)
4. Las fechas deben convertirse a formato ISO (YYYY-MM-DD)
5. Una validación es EXPLÍCITA solo si el cliente dice claramente "sí voy a pagar", "confirmo", "de acuerdo, pagaré", etc.
6. "ok", "entiendo", "lo voy a revisar" NO son validaciones explícitas

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.
```

**User Prompt:**
```
Analiza la siguiente transcripción de una llamada de cobranza y extrae la información en el formato JSON especificado.

## DATOS DE LA LLAMADA
- Fecha de la llamada: 2026-01-30
- Agente: María González
- Cliente (referencia): CL-45632
- Tipo de deuda: tarjeta_credito
- Monto de deuda registrado: 1450.00 PEN
- Días de mora: 45

## TRANSCRIPCIÓN COMPLETA
Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama? Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta. ¿Me permite unos minutos? Sí, dígame. Señor García, tenemos registrado un saldo vencido de 1,450 soles que venció el 15 de diciembre. Actualmente tiene 45 días de mora y se están generando intereses adicionales. ¿Está al tanto de esta situación? Sí, lo sé, pero es que ahorita no tengo plata, estoy sin trabajo desde hace dos meses. Entiendo su situación señor García, lamento escuchar eso. Permítame ofrecerle algunas alternativas. Podemos establecer un plan de pago o quizás un pago parcial inicial. ¿Tiene alguna fecha en la que podría hacer un primer abono? Mire, lo que puedo hacer es pagar todo junto el 15 de febrero, cuando me paguen mi liquidación. Perfecto, entonces quedamos que va a realizar el pago completo de 1,450 soles el 15 de febrero. ¿Está de acuerdo? Sí, eso es lo que voy a hacer. Excelente señor García. Le recuerdo que puede pagar por nuestra página web, la app móvil, o en cualquier agencia. ¿Tiene alguna pregunta? No, está claro. Gracias. Muy bien. Muchas gracias por su tiempo señor García. Que tenga buen día. Igualmente, hasta luego.

## SEGMENTOS CON TIMESTAMPS Y EMOCIONES
[
  {"id": 0, "speaker": "agente", "start": 0.0, "end": 3.2, "text": "Buenos días, ¿hablo con el señor García?", "emotion": "neutral", "speech_rate": 145},
  {"id": 1, "speaker": "cliente", "start": 3.2, "end": 5.8, "text": "Sí, soy yo. ¿De dónde me llama?", "emotion": "neutral", "speech_rate": 140},
  {"id": 2, "speaker": "agente", "start": 5.8, "end": 15.5, "text": "Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta. ¿Me permite unos minutos?", "emotion": "positive", "speech_rate": 148},
  {"id": 3, "speaker": "cliente", "start": 15.5, "end": 17.2, "text": "Sí, dígame.", "emotion": "neutral", "speech_rate": 130},
  {"id": 4, "speaker": "agente", "start": 17.2, "end": 35.8, "text": "Señor García, tenemos registrado un saldo vencido de 1,450 soles que venció el 15 de diciembre. Actualmente tiene 45 días de mora y se están generando intereses adicionales. ¿Está al tanto de esta situación?", "emotion": "neutral", "speech_rate": 152},
  {"id": 5, "speaker": "cliente", "start": 35.8, "end": 45.2, "text": "Sí, lo sé, pero es que ahorita no tengo plata, estoy sin trabajo desde hace dos meses.", "emotion": "negative", "speech_rate": 125},
  {"id": 6, "speaker": "agente", "start": 45.2, "end": 65.5, "text": "Entiendo su situación señor García, lamento escuchar eso. Permítame ofrecerle algunas alternativas. Podemos establecer un plan de pago o quizás un pago parcial inicial. ¿Tiene alguna fecha en la que podría hacer un primer abono?", "emotion": "positive", "speech_rate": 145},
  {"id": 7, "speaker": "cliente", "start": 65.5, "end": 78.3, "text": "Mire, lo que puedo hacer es pagar todo junto el 15 de febrero, cuando me paguen mi liquidación.", "emotion": "neutral", "speech_rate": 138},
  {"id": 8, "speaker": "agente", "start": 78.3, "end": 92.5, "text": "Perfecto, entonces quedamos que va a realizar el pago completo de 1,450 soles el 15 de febrero. ¿Está de acuerdo?", "emotion": "positive", "speech_rate": 150},
  {"id": 9, "speaker": "cliente", "start": 92.5, "end": 95.8, "text": "Sí, eso es lo que voy a hacer.", "emotion": "positive", "speech_rate": 142},
  {"id": 10, "speaker": "agente", "start": 95.8, "end": 115.2, "text": "Excelente señor García. Le recuerdo que puede pagar por nuestra página web, la app móvil, o en cualquier agencia. ¿Tiene alguna pregunta?", "emotion": "positive", "speech_rate": 148},
  {"id": 11, "speaker": "cliente", "start": 115.2, "end": 118.5, "text": "No, está claro. Gracias.", "emotion": "positive", "speech_rate": 135},
  {"id": 12, "speaker": "agente", "start": 118.5, "end": 125.8, "text": "Muy bien. Muchas gracias por su tiempo señor García. Que tenga buen día.", "emotion": "positive", "speech_rate": 145},
  {"id": 13, "speaker": "cliente", "start": 125.8, "end": 128.2, "text": "Igualmente, hasta luego.", "emotion": "positive", "speech_rate": 140}
]

## INSTRUCCIONES
Extrae: entidades (montos, fechas, métodos pago, objeciones, compromisos), métricas conversacionales, análisis emocional, y patrones detectados.

Responde con el JSON según el schema proporcionado.
```

### Response del LLM

```json
{
  "entidades": {
    "montos": [
      {
        "valor": 1450.00,
        "moneda": "PEN",
        "contexto": "deuda_principal",
        "timestamp_mencion": 17.2,
        "frase_exacta": "un saldo vencido de 1,450 soles"
      },
      {
        "valor": 1450.00,
        "moneda": "PEN",
        "contexto": "total_a_pagar",
        "timestamp_mencion": 78.3,
        "frase_exacta": "el pago completo de 1,450 soles"
      }
    ],
    "fechas": [
      {
        "fecha": "2025-12-15",
        "contexto": "vencimiento_original",
        "timestamp_mencion": 17.2,
        "frase_exacta": "venció el 15 de diciembre"
      },
      {
        "fecha": "2026-02-15",
        "contexto": "compromiso_pago",
        "timestamp_mencion": 65.5,
        "frase_exacta": "el 15 de febrero, cuando me paguen mi liquidación"
      }
    ],
    "metodos_pago": [
      {
        "metodo": "web",
        "mencionado_por": "agente",
        "frase_exacta": "puede pagar por nuestra página web"
      },
      {
        "metodo": "app_movil",
        "mencionado_por": "agente",
        "frase_exacta": "la app móvil"
      },
      {
        "metodo": "agencia",
        "mencionado_por": "agente",
        "frase_exacta": "en cualquier agencia"
      }
    ],
    "objeciones": [
      {
        "tipo": "economica",
        "descripcion": "Cliente indica que no tiene liquidez y está sin empleo",
        "timestamp_inicio": 35.8,
        "frase_exacta": "ahorita no tengo plata, estoy sin trabajo desde hace dos meses",
        "fue_manejada": true,
        "resultado_manejo": "resuelta"
      }
    ],
    "compromisos": [
      {
        "tipo": "pago_total",
        "monto": 1450.00,
        "fecha": "2026-02-15",
        "validacion": "explicita",
        "frase_validacion": "Sí, eso es lo que voy a hacer",
        "confianza": 0.85
      }
    ]
  },
  "metricas_conversacion": {
    "palabras_totales": 285,
    "palabras_agente": 195,
    "palabras_cliente": 90,
    "ratio_habla_agente": 0.68,
    "turnos_conversacion": 14,
    "duracion_turno_promedio_agente": 7.8,
    "duracion_turno_promedio_cliente": 4.5,
    "interrupciones": [],
    "silencios_prolongados": [],
    "palabras_clave": {
      "positivas": ["perfecto", "excelente", "gracias", "de acuerdo"],
      "negativas": ["no tengo plata", "sin trabajo"],
      "cobranza": ["saldo vencido", "mora", "intereses", "pago", "compromiso", "liquidación"]
    },
    "preguntas_agente": 5,
    "preguntas_cliente": 1
  },
  "analisis_emocional": {
    "tono_general_agente": "profesional",
    "tono_general_cliente": "colaborador",
    "evolucion_cliente": "mejoro",
    "momentos_tension": [
      {
        "timestamp": 35.8,
        "descripcion": "Cliente revela situación económica difícil y desempleo",
        "desencadenante": "Pregunta sobre conocimiento de la deuda",
        "resolucion": "Agente muestra empatía y ofrece alternativas"
      }
    ],
    "senales_receptividad": [
      "Cliente propone él mismo una fecha de pago",
      "Responde afirmativamente a la validación",
      "Agradece al final de la llamada"
    ],
    "senales_rechazo": []
  },
  "patrones_detectados": {
    "saludo_correcto": true,
    "identificacion_empresa": true,
    "verificacion_identidad": true,
    "explicacion_motivo": true,
    "mencion_monto_deuda": true,
    "mencion_consecuencias": true,
    "oferta_alternativas": true,
    "intento_cierre": true,
    "despedida_correcta": true,
    "hubo_abandono": false,
    "abandono_info": null,
    "tipo_cierre": "compromiso_explicito"
  },
  "resumen": {
    "duracion_efectiva_segundos": 128,
    "resultado_llamada": "compromiso_logrado",
    "monto_comprometido": 1450.00,
    "fecha_compromiso": "2026-02-15",
    "requiere_seguimiento": true,
    "notas_importantes": [
      "Cliente sin empleo - situación económica sensible",
      "Compromiso depende de recibir su liquidación",
      "VALIDACIÓN EXPLÍCITA obtenida: 'Sí, eso es lo que voy a hacer'",
      "Recomendado: llamada de confirmación 1 semana antes (08-Feb)"
    ]
  }
}
```

---

## OUTPUT FINAL: INSERT en Supabase

### Tabla: `registro_llamadas`

```json
{
  "registro_id": "r0000000-0000-0000-0000-000000000099",
  "audio_url": "https://drive.google.com/uc?export=download&id=1abc123def456",
  "audio_id_externo": "1abc123def456",
  "timestamp_inicio": "2026-01-30T14:23:15-05:00",
  "timestamp_fin": "2026-01-30T14:27:30-05:00",
  "duracion_segundos": 255,
  "timestamp_fecha": "2026-01-30",
  "agente_id": "a0000000-0000-0000-0000-000000000002",
  "cliente_ref": "CL-45632",
  "campana": "Recuperación Q1",
  "tipo_deuda": "tarjeta_credito",
  "monto_deuda": 1450.00,
  "dias_mora": 45,
  "estado": "transcrito",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000099",
  "metadata_externa": {
    "ivr_session_id": "IVR-12345",
    "origen": "outbound"
  }
}
```

### Tabla: `transcripciones`

```json
{
  "transcripcion_id": "t0000000-0000-0000-0000-000000000099",
  "registro_id": "r0000000-0000-0000-0000-000000000099",
  
  "transcripcion_completa": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama? Buenos días señor García, le habla María González del banco Central...[texto completo]",
  
  "segmentos": [
    {
      "id": 0,
      "speaker": "agente",
      "timestamp_inicio": 0.0,
      "timestamp_fin": 3.2,
      "texto": "Buenos días, ¿hablo con el señor García?",
      "emocion": "neutral",
      "emocion_confianza": 0.92,
      "velocidad_habla": 145
    },
    {
      "id": 1,
      "speaker": "cliente",
      "timestamp_inicio": 3.2,
      "timestamp_fin": 5.8,
      "texto": "Sí, soy yo. ¿De dónde me llama?",
      "emocion": "neutral",
      "emocion_confianza": 0.88,
      "velocidad_habla": 140
    }
  ],
  
  "entidades": {
    "montos": [
      {"valor": 1450.00, "moneda": "PEN", "contexto": "deuda_principal", "frase_exacta": "un saldo vencido de 1,450 soles"}
    ],
    "fechas": [
      {"fecha": "2025-12-15", "contexto": "vencimiento_original"},
      {"fecha": "2026-02-15", "contexto": "compromiso_pago"}
    ],
    "metodos_pago": ["web", "app_movil", "agencia"],
    "objeciones": [
      {"tipo": "economica", "descripcion": "Sin liquidez por desempleo", "manejada": true}
    ],
    "compromisos": [
      {"tipo": "pago_total", "monto": 1450.00, "fecha": "2026-02-15", "validacion": "explicita", "confianza": 0.85}
    ]
  },
  
  "metricas_conversacion": {
    "palabras_totales": 285,
    "palabras_agente": 195,
    "palabras_cliente": 90,
    "ratio_habla_agente": 0.68,
    "turnos_conversacion": 14,
    "interrupciones": 0,
    "silencios_prolongados": 0,
    "preguntas_agente": 5,
    "preguntas_cliente": 1
  },
  
  "analisis_emocional": {
    "tono_agente": "profesional",
    "tono_cliente": "colaborador",
    "evolucion_cliente": "mejoro",
    "momentos_tension": [
      {"timestamp": 35.8, "descripcion": "Revelación de desempleo", "resolucion": "Empatía y alternativas"}
    ]
  },
  
  "patrones_detectados": {
    "saludo_correcto": true,
    "identificacion_empresa": true,
    "verificacion_identidad": true,
    "mencion_monto": true,
    "mencion_consecuencias": true,
    "oferta_alternativas": true,
    "intento_cierre": true,
    "despedida_correcta": true,
    "hubo_abandono": false,
    "tipo_cierre": "compromiso_explicito"
  },
  
  "calidad_audio": {
    "score": 95,
    "ruido_fondo": false,
    "inaudibles": 0
  },
  
  "modelo_transcripcion": "whisper-large-v3",
  "modelo_emociones": "emotion-recognition-v2",
  "modelo_extraccion": "claude-sonnet-4-5-20250514",
  "tiempo_procesamiento_ms": 48500
}
```

---

## Trigger Webhook → Agente Analista

```json
POST https://saturn.rocketbot.com/webhooks/nodus-analista

{
  "registro_id": "r0000000-0000-0000-0000-000000000099",
  "transcripcion_id": "t0000000-0000-0000-0000-000000000099",
  "agente_id": "a0000000-0000-0000-0000-000000000002",
  "timestamp": "2026-01-30T14:28:45Z",
  "resumen_rapido": {
    "duracion": 255,
    "compromiso_logrado": true,
    "validacion_explicita": true,
    "monto_comprometido": 1450.00,
    "fecha_compromiso": "2026-02-15"
  }
}
```

---

## Tiempos de Procesamiento (Este Ejemplo)

| Paso | Tiempo | Acumulado |
|------|--------|-----------|
| Paso 3: Whisper | 32s | 32s |
| Paso 4: Emociones | 8s | 40s |
| Paso 5-6: LLM | 8.5s | 48.5s |
| Total | **48.5s** | - |

✅ Dentro del objetivo de < 95 segundos para el agente transcriptor.



