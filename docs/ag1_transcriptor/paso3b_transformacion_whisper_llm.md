# Paso 3b: Transformación de Whisper a Formato Estructurado

## Problema

Whisper devuelve:
- Texto plano
- Timestamps por segmento
- Speakers genéricos (SPEAKER_00, SPEAKER_01)

Necesitamos:
- JSON estructurado con segmentos
- Speakers mapeados (agente/cliente)
- Formato consistente para el siguiente paso

## Solución: LLM de Transformación

Usar **Claude Sonnet 4.5** para transformar la salida de Whisper al formato esperado.

---

## Prompt de Transformación

### System Prompt

```
Eres un transformador de transcripciones de llamadas de cobranza. Tu tarea es convertir la salida cruda de Whisper (texto + timestamps + speakers genéricos) en un JSON estructurado con speakers identificados (agente/cliente) y formato consistente.

REGLAS DE IDENTIFICACIÓN DE SPEAKERS:
1. El primer speaker que habla generalmente es el AGENTE (llamadas outbound)
2. El speaker que menciona el nombre de la empresa es el AGENTE
3. El speaker que pregunta "¿hablo con...?" o "¿es usted...?" es el AGENTE
4. El speaker que confirma su identidad ("Sí, soy yo") es el CLIENTE
5. El speaker que menciona términos de cobranza (mora, deuda, saldo) es el AGENTE
6. El speaker que menciona su situación personal o económica es el CLIENTE

FORMATO DE SALIDA:
Debes devolver un JSON con la estructura exacta especificada, sin texto adicional.
```

---

## User Prompt Template

```
Transforma la siguiente transcripción de Whisper al formato JSON estructurado requerido.

## DATOS DE CONTEXTO
- Agente esperado: {nombre_agente}
- Empresa: {nombre_empresa}
- Cliente: {cliente_ref}

## SALIDA DE WHISPER
{whisper_output_json}

## INSTRUCCIONES

1. **Identificar Speakers:**
   - Analiza quién es el agente y quién es el cliente basándote en:
     * Contenido del mensaje (términos de cobranza, identificación de empresa)
     * Orden de aparición
     * Tipo de preguntas/respuestas
   - Mapea SPEAKER_00 y SPEAKER_01 a "agente" o "cliente"

2. **Estructurar Segmentos:**
   - Cada segmento debe tener:
     * id (secuencial, empezando en 0)
     * speaker ("agente" o "cliente")
     * timestamp_inicio (número decimal en segundos)
     * timestamp_fin (número decimal en segundos)
     * texto (texto limpio del segmento)
     * palabras (conteo de palabras en el texto)
     * confianza (si Whisper la proporcionó, sino null)

3. **Calcular Estadísticas:**
   - Total de segmentos
   - Segmentos por speaker
   - Palabras totales
   - Confianza promedio

4. **Validar:**
   - Todos los segmentos deben tener speaker válido ("agente" o "cliente")
   - Timestamps deben ser crecientes
   - No debe haber gaps mayores a 30 segundos sin explicación

## FORMATO DE RESPUESTA (JSON)

```json
{
  "transcripcion_completa": "texto completo de la llamada...",
  "duracion_segundos": 255.4,
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
      "confianza": 0.97
    }
  ],
  "estadisticas_basicas": {
    "total_segmentos": 45,
    "segmentos_agente": 24,
    "segmentos_cliente": 21,
    "palabras_totales": 320,
    "palabras_agente": 215,
    "palabras_cliente": 105,
    "confianza_promedio": 0.96
  },
  "speaker_mapping": {
    "SPEAKER_00": "agente",
    "SPEAKER_01": "cliente",
    "confidence": 0.95,
    "method": "first_speaker_identifies_company"
  }
}
```

Responde ÚNICAMENTE con el JSON, sin texto adicional.
```

---

## Ejemplo Completo

### Input: Salida de Whisper

```json
{
  "text": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama? Buenos días señor García, le habla María González del banco Central...",
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
        {"word": "días", "start": 0.4, "end": 0.8, "confidence": 0.99}
      ]
    },
    {
      "id": 1,
      "start": 3.2,
      "end": 5.8,
      "text": "Sí, soy yo. ¿De dónde me llama?",
      "speaker": "SPEAKER_01",
      "words": [
        {"word": "Sí,", "start": 3.2, "end": 3.5, "confidence": 0.99},
        {"word": "soy", "start": 3.5, "end": 3.8, "confidence": 0.99}
      ]
    },
    {
      "id": 2,
      "start": 5.8,
      "end": 15.5,
      "text": "Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta.",
      "speaker": "SPEAKER_00",
      "words": [...]
    }
  ]
}
```

### Prompt Enviado al LLM

```
Transforma la siguiente transcripción de Whisper al formato JSON estructurado requerido.

## DATOS DE CONTEXTO
- Agente esperado: María González
- Empresa: Banco Central
- Cliente: CL-45632

## SALIDA DE WHISPER
{
  "text": "Buenos días, ¿hablo con el señor García? Sí, soy yo...",
  "duration": 255.4,
  "segments": [
    {"id": 0, "start": 0.0, "end": 3.2, "text": "Buenos días, ¿hablo con el señor García?", "speaker": "SPEAKER_00"},
    {"id": 1, "start": 3.2, "end": 5.8, "text": "Sí, soy yo. ¿De dónde me llama?", "speaker": "SPEAKER_01"},
    {"id": 2, "start": 5.8, "end": 15.5, "text": "Buenos días señor García, le habla María González del banco Central...", "speaker": "SPEAKER_00"}
  ]
}

## INSTRUCCIONES
[Ver prompt completo arriba]
```

### Output del LLM

```json
{
  "transcripcion_completa": "Buenos días, ¿hablo con el señor García? Sí, soy yo. ¿De dónde me llama? Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta. ¿Me permite unos minutos? Sí, dígame. Señor García, tenemos registrado un saldo vencido de 1,450 soles que venció el 15 de diciembre...",
  "duracion_segundos": 255.4,
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
      "confianza": 0.99
    },
    {
      "id": 2,
      "speaker": "agente",
      "timestamp_inicio": 5.8,
      "timestamp_fin": 15.5,
      "texto": "Buenos días señor García, le habla María González del banco Central. Le llamo por un tema importante sobre su cuenta.",
      "palabras": 18,
      "confianza": 0.97
    }
  ],
  "estadisticas_basicas": {
    "total_segmentos": 14,
    "segmentos_agente": 8,
    "segmentos_cliente": 6,
    "palabras_totales": 285,
    "palabras_agente": 195,
    "palabras_cliente": 90,
    "confianza_promedio": 0.96
  },
  "speaker_mapping": {
    "SPEAKER_00": "agente",
    "SPEAKER_01": "cliente",
    "confidence": 0.98,
    "method": "first_speaker_identifies_company",
    "evidencia": [
      "SPEAKER_00 pregunta '¿hablo con el señor García?' (patrón de agente)",
      "SPEAKER_00 menciona 'María González del banco Central' (identificación de agente)",
      "SPEAKER_01 confirma identidad 'Sí, soy yo' (patrón de cliente)"
    ]
  }
}
```

---

## Implementación en Saturn Studio

### Nodo: Transform Whisper Output

```yaml
node_type: llm_request
name: transform_whisper_output
config:
  provider: anthropic
  model: claude-sonnet-4-5-20250514
  temperature: 0.1
  max_tokens: 2000
  timeout: 30000
  
input:
  system_prompt: |
    Eres un transformador de transcripciones de llamadas de cobranza...
    [system prompt completo]
  
  user_prompt: |
    Transforma la siguiente transcripción de Whisper al formato JSON estructurado requerido.
    
    ## DATOS DE CONTEXTO
    - Agente esperado: {{input.metadata.nombre_agente}}
    - Empresa: {{input.metadata.nombre_empresa}}
    - Cliente: {{input.cliente_ref}}
    
    ## SALIDA DE WHISPER
    {{whisper_output | json}}
    
    ## INSTRUCCIONES
    [instrucciones completas]
  
  variables:
    whisper_output: "{{previous_node.output}}"
    nombre_agente: "{{agente.nombre}}"
    nombre_empresa: "Banco Central"
    cliente_ref: "{{input.cliente_ref}}"

output:
  parse_json: true
  validate_schema: true
  on_error:
    action: retry
    max_attempts: 2
    fallback: use_whisper_raw_with_default_mapping
```

---

## Validación Post-Transformación

```python
def validate_transformed_output(output):
    """Validar que la transformación sea correcta"""
    
    errors = []
    
    # 1. Verificar que todos los segmentos tengan speaker válido
    for seg in output.get('segmentos_raw', []):
        if seg.get('speaker') not in ['agente', 'cliente']:
            errors.append(f"Segmento {seg.get('id')} tiene speaker inválido: {seg.get('speaker')}")
    
    # 2. Verificar que timestamps sean crecientes
    prev_end = 0
    for seg in sorted(output.get('segmentos_raw', []), key=lambda x: x.get('timestamp_inicio', 0)):
        if seg.get('timestamp_inicio', 0) < prev_end:
            errors.append(f"Segmento {seg.get('id')} tiene timestamp_inicio antes del anterior")
        prev_end = seg.get('timestamp_fin', 0)
    
    # 3. Verificar que estadísticas sean consistentes
    stats = output.get('estadisticas_basicas', {})
    total_seg = stats.get('segmentos_agente', 0) + stats.get('segmentos_cliente', 0)
    if total_seg != stats.get('total_segmentos', 0):
        errors.append("Total de segmentos no coincide con suma de agente + cliente")
    
    # 4. Verificar que speaker_mapping tenga ambos speakers
    mapping = output.get('speaker_mapping', {})
    if 'SPEAKER_00' not in mapping or 'SPEAKER_01' not in mapping:
        errors.append("Speaker mapping incompleto")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }
```

---

## Flujo Completo Actualizado

```
1. Whisper → Texto + Timestamps + SPEAKER_00/SPEAKER_01
2. LLM Transform → JSON estructurado con agente/cliente identificados
3. AI Studio Emociones → Emociones por segmento
4. LLM Extracción → Entidades + Métricas
```

---

## Alternativa: Reglas Simples (Si LLM es muy costoso)

Si el volumen es muy alto y necesitas reducir costos, puedes usar reglas heurísticas:

```python
def map_speakers_simple(whisper_output, agente_nombre, empresa_nombre):
    """Mapeo simple basado en reglas"""
    
    mapping = {}
    segments = whisper_output.get('segments', [])
    
    # Regla 1: El que habla primero es agente (outbound)
    first_speaker = segments[0].get('speaker') if segments else None
    
    # Regla 2: El que menciona el nombre de la empresa
    for seg in segments:
        text = seg.get('text', '').lower()
        if empresa_nombre.lower() in text or agente_nombre.lower() in text:
            mapping[seg.get('speaker')] = 'agente'
            break
    
    # Regla 3: El que pregunta "¿hablo con...?"
    for seg in segments:
        if '¿hablo con' in seg.get('text', '').lower() or '¿es usted' in seg.get('text', '').lower():
            mapping[seg.get('speaker')] = 'agente'
            break
    
    # Si no se identificó, usar regla del primer speaker
    if first_speaker and first_speaker not in mapping:
        mapping[first_speaker] = 'agente'
    
    # El otro speaker es cliente
    all_speakers = set(seg.get('speaker') for seg in segments)
    for speaker in all_speakers:
        if speaker not in mapping:
            mapping[speaker] = 'cliente'
    
    return mapping
```

**Recomendación:** Usar LLM para mayor precisión, especialmente cuando:
- Hay múltiples speakers que cambian
- El audio tiene ruido
- Los patrones no son claros

---

## Costo Estimado

| Modelo | Tokens Input | Tokens Output | Costo por Llamada |
|--------|-------------|---------------|-------------------|
| Claude Sonnet 4.5 | ~500 | ~300 | ~$0.001 |
| Claude Haiku | ~500 | ~300 | ~$0.0003 |

Para 1000 llamadas/día: ~$1/día con Sonnet, ~$0.30/día con Haiku.



