# Paso 3: Transcripción con Whisper

## Configuración de AI Studio / Whisper

### Request a AI Studio

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=FILE_ID",
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
  },
  "prompt": "Ver sección PROMPT DE CONTEXTO abajo"
}
```

---

## Prompt de Contexto para Transcripción

Whisper y servicios similares aceptan un **prompt de contexto** que mejora significativamente la precisión de la transcripción, especialmente para:
- Vocabulario técnico del dominio
- Nombres propios y de empresas
- Formatos específicos (montos, fechas)
- Estilo de puntuación deseado

### Prompt de Contexto (Español - Cobranzas)

```
CONTEXTO: Llamada telefónica de gestión de cobranza entre un agente de call center y un cliente deudor en Perú/Latinoamérica.

VOCABULARIO DEL DOMINIO:
- Términos financieros: saldo vencido, mora, intereses moratorios, capital, cuota, refinanciamiento, reestructuración, pago parcial, pago total, abono, liquidación
- Documentos: estado de cuenta, carta de cobranza, notificación, acuerdo de pago
- Consecuencias: central de riesgo, infocorp, reporte negativo, acción legal, embargo
- Métodos de pago: transferencia, depósito, agencia, app móvil, banca por internet, Yape, Plin
- Moneda: soles, PEN, dólares, USD

NOMBRES COMUNES:
- Banco Central, Banco de Crédito, Interbank, BBVA, Scotiabank
- Señor/Señora + apellidos peruanos comunes

FORMATO DE TRANSCRIPCIÓN:
- Usar signos de interrogación (¿?) y exclamación (¡!) correctamente en español
- Escribir números en palabras cuando se mencionan montos: "mil cuatrocientos cincuenta soles" → "1,450 soles"
- Mantener muletillas naturales del habla: "este...", "eh...", "mire..."
- Separar claramente turnos de conversación

CONTEXTO DE LA LLAMADA:
Esta es una llamada de cobranza donde el agente intenta obtener un compromiso de pago del cliente. El agente sigue un script que incluye: saludo, identificación, verificación de identidad, explicación de la deuda, manejo de objeciones, negociación y cierre.
```

### Prompt Corto (Si hay límite de caracteres)

```
Llamada de cobranza en español (Perú). Vocabulario: saldo vencido, mora, intereses, cuota, refinanciamiento, central de riesgo, Infocorp. Montos en soles (PEN). Usar puntuación española correcta (¿?¡!). Dos speakers: agente de cobranza y cliente deudor.
```

### Variables Dinámicas en el Prompt

Si el servicio permite, incluir datos específicos de la llamada:

```
DATOS DE ESTA LLAMADA:
- Agente: {nombre_agente}
- Empresa: {nombre_empresa}
- Cliente: {nombre_cliente} (si se conoce)
- Tipo de deuda: {tipo_deuda}
- Monto aproximado: {monto_deuda} {moneda}
```

---

## Request Completo con Prompt

```json
{
  "audio_url": "https://drive.google.com/uc?export=download&id=FILE_ID",
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
  },
  "prompt": "Llamada de cobranza en español (Perú). Vocabulario: saldo vencido, mora, intereses moratorios, cuota, refinanciamiento, central de riesgo, Infocorp, acuerdo de pago. Métodos: Yape, Plin, transferencia, agencia. Montos en soles (PEN). Usar puntuación española (¿?¡!). Dos speakers: agente de call center y cliente deudor. Agente: María González, Banco Central. Monto: 1,450 soles."
}
```

### Parámetros Importantes

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| `model` | `whisper-large-v3` | Mejor precisión en español |
| `language` | `es` | Forzar español (no auto-detect) |
| `diarization.enabled` | `true` | Separar agente de cliente |
| `diarization.min_speakers` | `2` | Siempre hay 2 speakers |
| `timestamps.granularity` | `word` | Precisión para emociones |
| `prompt` | Ver arriba | Mejora precisión con vocabulario del dominio |

---

## (Opcional) Post-Procesamiento con LLM

Si la transcripción de Whisper tiene errores o necesita corrección, se puede usar un LLM para limpiarla:

### Prompt de Corrección de Transcripción

**System Prompt:**
```
Eres un corrector de transcripciones de llamadas de cobranza en español latinoamericano (Perú).

Tu tarea es corregir errores de transcripción automática SIN cambiar el significado ni las palabras dichas. Solo debes:

1. Corregir errores ortográficos obvios causados por la transcripción automática
2. Corregir puntuación (agregar ¿? y ¡! donde corresponda)
3. Corregir capitalización (nombres propios, inicio de oración)
4. Corregir números mal transcritos (ej: "mil cuatrocientos" → "1,400")
5. Mantener muletillas y expresiones naturales del habla
6. NO agregar ni quitar palabras
7. NO cambiar el orden de las palabras
8. NO "mejorar" el estilo

VOCABULARIO CORRECTO DEL DOMINIO:
- Infocorp (no "info corp", "infocorps")
- soles (moneda peruana)
- mora (no "demora" si se refiere a estado de deuda)
- refinanciamiento (no "refinanciación")
- Yape, Plin (apps de pago)
```

**User Prompt:**
```
Corrige la siguiente transcripción de una llamada de cobranza. Mantén el formato de segmentos.

TRANSCRIPCIÓN ORIGINAL:
{transcripcion_whisper}

CONTEXTO:
- Agente: {nombre_agente}
- Empresa: {nombre_empresa}
- Monto de deuda: {monto_deuda} soles

Devuelve la transcripción corregida en el mismo formato JSON, indicando qué correcciones hiciste.
```

**Formato de Respuesta:**
```json
{
  "transcripcion_corregida": {
    "text": "...",
    "segments": [...]
  },
  "correcciones_realizadas": [
    {
      "original": "infocorps",
      "corregido": "Infocorp",
      "tipo": "ortografia_dominio"
    },
    {
      "original": "mil cuatrocientos soles",
      "corregido": "1,400 soles",
      "tipo": "formato_numero"
    }
  ],
  "confianza_correccion": 0.95
}
```

### Cuándo Usar Post-Procesamiento

| Condición | Acción |
|-----------|--------|
| Confianza Whisper > 0.9 | No necesita corrección |
| Confianza Whisper 0.7-0.9 | Corrección opcional |
| Confianza Whisper < 0.7 | Corrección recomendada |
| Audio con ruido | Corrección recomendada |
| Términos técnicos detectados | Verificar vocabulario |

---

## Formato de Salida Esperado (Whisper)

```json
{
  "text": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama?...",
  "language": "es",
  "duration": 255.4,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.2,
      "text": "Buenos días, ¿hablo con el señor García?",
      "speaker": "SPEAKER_00",
      "words": [
        {"word": "Buenos", "start": 0.0, "end": 0.4, "confidence": 0.98},
        {"word": "días", "start": 0.4, "end": 0.8, "confidence": 0.99},
        {"word": "¿hablo", "start": 0.9, "end": 1.3, "confidence": 0.97},
        {"word": "con", "start": 1.3, "end": 1.5, "confidence": 0.99},
        {"word": "el", "start": 1.5, "end": 1.6, "confidence": 0.99},
        {"word": "señor", "start": 1.6, "end": 2.1, "confidence": 0.98},
        {"word": "García?", "start": 2.1, "end": 3.2, "confidence": 0.96}
      ],
      "avg_confidence": 0.98
    },
    {
      "id": 1,
      "start": 3.2,
      "end": 5.8,
      "text": "Sí, soy yo. ¿De dónde me llama?",
      "speaker": "SPEAKER_01",
      "words": [
        {"word": "Sí,", "start": 3.2, "end": 3.5, "confidence": 0.99},
        {"word": "soy", "start": 3.5, "end": 3.8, "confidence": 0.99},
        {"word": "yo.", "start": 3.8, "end": 4.2, "confidence": 0.99},
        {"word": "¿De", "start": 4.4, "end": 4.7, "confidence": 0.98},
        {"word": "dónde", "start": 4.7, "end": 5.1, "confidence": 0.97},
        {"word": "me", "start": 5.1, "end": 5.3, "confidence": 0.99},
        {"word": "llama?", "start": 5.3, "end": 5.8, "confidence": 0.98}
      ],
      "avg_confidence": 0.98
    }
  ]
}
```

---

## Post-Procesamiento: Mapear Speakers

Después de recibir la transcripción, debemos identificar quién es el agente y quién es el cliente.

### Lógica de Identificación

```
REGLA 1: El que habla primero generalmente es el AGENTE (llamadas outbound)
REGLA 2: El que menciona el nombre de la empresa es el AGENTE
REGLA 3: El que pregunta "¿hablo con...?" es el AGENTE
REGLA 4: El que confirma su identidad es el CLIENTE
```

### Mapeo Final

```json
{
  "speaker_mapping": {
    "SPEAKER_00": "agente",
    "SPEAKER_01": "cliente"
  },
  "confidence": 0.95,
  "method": "first_speaker_rule"
}
```

---

## Formato Transformado (Para Paso 5-6)

Después del mapeo de speakers, transformar a este formato:

```json
{
  "transcripcion_completa": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama?...",
  "duracion_segundos": 255,
  "segmentos_raw": [
    {
      "id": 0,
      "speaker": "agente",
      "timestamp_inicio": 0.0,
      "timestamp_fin": 3.2,
      "texto": "Buenos días, ¿hablo con el señor García?",
      "palabras": 7,
      "confianza": 0.98
    },
    {
      "id": 1,
      "speaker": "cliente",
      "timestamp_inicio": 3.2,
      "timestamp_fin": 5.8,
      "texto": "Sí, soy yo. ¿De dónde me llama?",
      "palabras": 7,
      "confianza": 0.98
    }
  ],
  "estadisticas_basicas": {
    "total_segmentos": 45,
    "segmentos_agente": 24,
    "segmentos_cliente": 21,
    "palabras_totales": 320,
    "confianza_promedio": 0.96
  }
}
```

---

## Manejo de Errores

| Error | Causa | Acción |
|-------|-------|--------|
| `audio_too_short` | Audio < 10 segundos | Rechazar, posible error de grabación |
| `audio_too_long` | Audio > 30 minutos | Dividir en chunks de 10 min |
| `low_confidence` | Confianza < 0.7 | Marcar para revisión manual |
| `single_speaker` | Solo 1 speaker detectado | Forzar análisis mono, alertar |
| `language_mismatch` | Audio no es español | Intentar con auto-detect |

---

## Notas de Implementación

1. **Timeout**: Configurar timeout de 5 minutos para audios largos
2. **Retry**: Si falla, reintentar 1 vez con modelo `whisper-medium`
3. **Cache**: No cachear transcripciones (cada audio es único)
4. **Cleanup**: Eliminar archivo temporal después de procesar

