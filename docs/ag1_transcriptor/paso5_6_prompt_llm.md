# Paso 5-6: Prompt LLM para Extracción de Entidades y Análisis

## Modelo Recomendado

- **Modelo**: `claude-sonnet-4-5-20250514`
- **Temperature**: 0.1 (queremos consistencia, no creatividad)
- **Max Tokens**: 4000
- **Timeout**: 60 segundos

---

## Input del Paso Anterior

El input viene del paso 3-4 (Gemini) y ya incluye:
- ✅ Transcripción completa
- ✅ Segmentos con timestamps
- ✅ Speakers identificados (agente/cliente)
- ✅ Emociones por segmento
- ✅ Análisis emocional general
- ✅ Momentos críticos detectados
- ✅ Estadísticas básicas

**El LLM NO debe recalcular estos datos**, sino usarlos para extraer entidades y analizar patrones.

---

## System Prompt

```
Eres un experto analizador de llamadas de cobranzas. Tu tarea es extraer información estructurada de transcripciones de llamadas entre agentes de cobranza y clientes deudores.

CONTEXTO DEL NEGOCIO:
- Las llamadas son de gestión de cobranza de deudas (tarjetas de crédito, préstamos, etc.)
- El objetivo del agente es lograr un compromiso de pago del cliente
- Un "compromiso válido" requiere: monto específico + fecha específica + VALIDACIÓN EXPLÍCITA del cliente

REGLAS DE ANÁLISIS:
1. Sé objetivo y basa todo en evidencia textual exacta
2. Si algo no está claro, indica "no_detectado" en lugar de inferir
3. Los montos deben estar en la moneda mencionada (CLP, PEN, USD, MXN, COP, ARS)
4. Las fechas deben convertirse a formato ISO (YYYY-MM-DD) o descriptivo si no es específica ("el sábado" → "proximo_sabado")
5. Una validación es EXPLÍCITA solo si el cliente dice claramente "sí voy a pagar", "confirmo", "de acuerdo, pagaré", "yo creo que el sábado cancelo", etc.
6. "ok", "entiendo", "lo voy a revisar", "ya" NO son validaciones explícitas
7. USA el análisis emocional proporcionado para enriquecer tu análisis, no lo recalcules

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.
```

---

## User Prompt Template

```
Analiza la siguiente transcripción de una llamada de cobranza y extrae la información en el formato JSON especificado.

## DATOS DE CONTEXTO (si disponibles)
- Fecha de la llamada: {fecha_llamada}
- Agente: {nombre_agente}
- Cliente (referencia): {cliente_ref}
- Empresa de cobranza: {empresa_cobranza}
- Empresa acreedora: {empresa_acreedora}

## DATOS DE LA TRANSCRIPCIÓN (del paso anterior)

### Transcripción Completa:
{transcripcion_completa}

### Segmentos con Emociones:
{segmentos_json}

### Estadísticas Básicas (ya calculadas):
{estadisticas_basicas}

### Análisis Emocional (ya calculado):
{analisis_emocional}

## INSTRUCCIONES DE EXTRACCIÓN

Extrae y estructura la siguiente información:

### 1. ENTIDADES
- **Montos mencionados**: deudas, ofertas de descuento, pagos parciales, totales a pagar
- **Fechas mencionadas**: vencimientos, compromisos de pago, plazos límite
- **Métodos de pago**: app, web, sucursal, transferencia, etc.
- **Referencias de créditos**: números de cuenta, IDs de crédito
- **Objeciones del cliente**: razones para no pagar o postergar
- **Compromisos de pago**: explícitos o implícitos, con monto y fecha

### 2. DETECCIÓN DE PATRONES DEL SCRIPT
Evalúa si el agente siguió el script estándar de cobranza:
- Saludo correcto
- Identificación de empresa y agente
- Verificación de identidad del cliente
- Explicación del motivo de la llamada
- Mención del monto de deuda
- Presentación de ofertas/alternativas
- Mención de consecuencias (si aplica)
- Intento de cierre/compromiso
- Despedida correcta

### 3. ANÁLISIS DEL RESULTADO
- ¿Se logró compromiso? ¿De qué tipo?
- ¿Hubo abandono de llamada?
- ¿Requiere seguimiento?
- Nivel de riesgo de incumplimiento

### 4. NOTAS Y RECOMENDACIONES
- Observaciones importantes sobre la llamada
- Acciones de seguimiento recomendadas

## FORMATO DE RESPUESTA (JSON)

Responde con el siguiente formato JSON:

{
  "entidades": {
    "montos": [
      {
        "valor": 405302,
        "moneda": "CLP",
        "contexto": "deuda_principal",
        "segmento_id": 8,
        "frase_exacta": "deuda de 405.302 pesos"
      },
      {
        "valor": 128888,
        "moneda": "CLP",
        "contexto": "oferta_descuento",
        "segmento_id": 8,
        "frase_exacta": "pague solamente 128.888 pesos"
      }
    ],
    "fechas": [
      {
        "fecha_relativa": "el sábado",
        "fecha_iso": null,
        "contexto": "compromiso_pago",
        "segmento_id": 36,
        "frase_exacta": "Sí, para el día sábado"
      }
    ],
    "metodos_pago": [
      {
        "metodo": "app_movil",
        "mencionado_por": "cliente",
        "segmento_id": 18,
        "frase_exacta": "Por la app"
      },
      {
        "metodo": "web",
        "mencionado_por": "agente",
        "segmento_id": 37,
        "frase_exacta": "por la página"
      }
    ],
    "referencias_creditos": [
      {
        "identificador": "8569",
        "tipo": "terminacion_cuenta",
        "monto_deuda": 405302,
        "monto_oferta": 128888,
        "segmento_id": 8
      },
      {
        "identificador": "6564",
        "tipo": "terminacion_cuenta",
        "monto_deuda": 16809,
        "monto_oferta": 10607,
        "segmento_id": 9
      }
    ],
    "objeciones": [
      {
        "tipo": "ninguna",
        "descripcion": null,
        "segmento_id": null,
        "frase_exacta": null,
        "fue_manejada": null,
        "resultado_manejo": null
      }
    ],
    "compromisos": [
      {
        "tipo": "pago_parcial",
        "credito_referencia": "8569",
        "monto": 128888,
        "moneda": "CLP",
        "fecha_relativa": "el sábado",
        "fecha_iso": null,
        "validacion": "explicita",
        "segmento_id": 39,
        "frase_validacion": "yo creo que el sábado cancelo ese de 128",
        "confianza": 0.85
      }
    ]
  },
  "patrones_script": {
    "saludo_correcto": true,
    "identificacion_empresa": true,
    "identificacion_agente": true,
    "verificacion_identidad_cliente": true,
    "explicacion_motivo": true,
    "mencion_monto_deuda": true,
    "presentacion_ofertas": true,
    "mencion_consecuencias": false,
    "intento_cierre": true,
    "despedida_correcta": true,
    "score_script": 90,
    "notas_script": "Agente siguió el script correctamente, solo faltó mencionar consecuencias de no pago"
  },
  "resultado_llamada": {
    "tipo_cierre": "compromiso_explicito",
    "hubo_abandono": false,
    "abandono_info": null,
    "compromiso_logrado": true,
    "monto_total_comprometido": 128888,
    "moneda": "CLP",
    "fecha_compromiso": "proximo_sabado",
    "metodo_pago_acordado": "app_movil",
    "riesgo_incumplimiento": "bajo",
    "razon_riesgo": "Cliente mostró disposición activa, ya realizó un pago previo, emociones positivas al final"
  },
  "seguimiento": {
    "requiere_seguimiento": true,
    "tipo_seguimiento": "confirmacion_pago",
    "fecha_sugerida": "lunes_siguiente",
    "prioridad": "media",
    "notas": "Verificar que el pago se realizó el sábado. Cliente tiene otros 2 créditos pendientes que podrían abordarse después."
  },
  "resumen_ejecutivo": {
    "duracion_segundos": 268,
    "resultado": "exitoso",
    "descripcion": "Llamada exitosa. Cliente Yessenia González se comprometió a pagar 128,888 CLP el sábado por el crédito terminado en 8569. Ya había pagado un crédito de ~10,000 CLP el día anterior. Le quedan 2 créditos grandes pendientes.",
    "puntos_clave": [
      "Cliente ya pagó un crédito el día anterior (buena señal)",
      "Aceptó oferta de descuento: pagar 128,888 en lugar de 405,302 (68% descuento)",
      "Compromiso explícito para pagar el sábado",
      "Interesada en consolidar las deudas grandes (repactación en sucursal)",
      "Evolución emocional positiva durante la llamada"
    ],
    "alertas": [],
    "recomendaciones": [
      "Confirmar el pago el lunes",
      "Si paga, ofrecer repactación de los 2 créditos restantes",
      "Considerar bloquear la oferta de descuento como se indicó en la llamada"
    ]
  }
}

Responde ÚNICAMENTE con el JSON, sin texto adicional.
```

---

## Ejemplo de Input Real (del paso anterior)

```json
{
  "transcripcion_completa": "Agente: Buenas tardes. Cliente: Buenas tardes...",
  "duracion_segundos": 268,
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
    }
  ],
  "estadisticas_basicas": {
    "total_segmentos": 46,
    "segmentos_agente": 24,
    "segmentos_cliente": 22,
    "palabras_totales": 489,
    "palabras_agente": 375,
    "palabras_cliente": 114,
    "confianza_promedio": 0.98
  },
  "analisis_emocional": {
    "agente": {
      "emocion_dominante": "neutral",
      "distribucion": {"neutral": 0.55, "positivo": 0.3, "interesado": 0.15},
      "intensidad_promedio": 0.42
    },
    "cliente": {
      "emocion_dominante": "neutral",
      "distribucion": {"neutral": 0.4, "interesado": 0.25, "positivo": 0.2, "aliviado": 0.1, "confundido": 0.05},
      "intensidad_promedio": 0.45
    },
    "evolucion_cliente": "mejoró significativamente...",
    "momentos_criticos": [
      {
        "timestamp": 228,
        "tipo": "compromiso",
        "descripcion": "Cliente confirma que realizará el pago del crédito mayor el día sábado.",
        "emocion_antes": "interesado",
        "emocion_despues": "positivo",
        "impacto": "alto"
      }
    ]
  }
}
```

---

## Implementación en Saturn Studio

### Nodo: LLM Extracción

```yaml
node_type: llm_request
name: extraccion_entidades_analisis
config:
  provider: anthropic
  model: claude-sonnet-4-5-20250514
  temperature: 0.1
  max_tokens: 4000
  timeout: 60000
  retry:
    max_attempts: 2
    backoff: exponential
  
input:
  system_prompt: "{{system_prompt}}"
  user_prompt: "{{user_prompt_template}}"
  variables:
    # Datos de contexto (si disponibles del webhook inicial)
    fecha_llamada: "{{input.metadata.fecha | default('no_disponible')}}"
    nombre_agente: "{{input.metadata.nombre_agente | default('no_disponible')}}"
    cliente_ref: "{{input.cliente_ref | default('no_disponible')}}"
    empresa_cobranza: "{{input.metadata.empresa_cobranza | default('no_disponible')}}"
    empresa_acreedora: "{{input.metadata.empresa_acreedora | default('no_disponible')}}"
    
    # Datos del paso anterior (Gemini)
    transcripcion_completa: "{{gemini_output.transcripcion_completa}}"
    segmentos_json: "{{gemini_output.segmentos_raw | json}}"
    estadisticas_basicas: "{{gemini_output.estadisticas_basicas | json}}"
    analisis_emocional: "{{gemini_output.analisis_emocional | json}}"

output:
  parse_json: true
  validate_schema: true
  on_error:
    action: retry
    max_attempts: 2
    fallback: mark_for_review
```

---

## Validación Post-LLM

```python
def validate_extraction_response(response):
    """Validar respuesta del LLM antes de guardar"""
    
    errors = []
    warnings = []
    
    # 1. Verificar estructura básica
    required_keys = ['entidades', 'patrones_script', 'resultado_llamada', 'seguimiento', 'resumen_ejecutivo']
    for key in required_keys:
        if key not in response:
            errors.append(f"Falta campo requerido: {key}")
    
    # 2. Verificar que hay al menos un monto detectado
    montos = response.get('entidades', {}).get('montos', [])
    if len(montos) == 0:
        warnings.append("No se detectaron montos en la llamada")
    
    # 3. Verificar formato de montos
    for monto in montos:
        if monto.get('valor', 0) <= 0:
            errors.append(f"Monto inválido: {monto.get('valor')}")
        if monto.get('moneda') not in ['CLP', 'PEN', 'USD', 'MXN', 'COP', 'ARS']:
            errors.append(f"Moneda no reconocida: {monto.get('moneda')}")
    
    # 4. Verificar compromisos tienen confianza
    for compromiso in response.get('entidades', {}).get('compromisos', []):
        if 'confianza' not in compromiso:
            errors.append("Compromiso sin campo 'confianza'")
        elif not (0 <= compromiso.get('confianza', 0) <= 1):
            errors.append(f"Confianza fuera de rango: {compromiso.get('confianza')}")
    
    # 5. Verificar score_script está en rango
    score = response.get('patrones_script', {}).get('score_script', 0)
    if not (0 <= score <= 100):
        errors.append(f"Score de script fuera de rango: {score}")
    
    # 6. Verificar resultado tiene tipo válido
    tipo_cierre = response.get('resultado_llamada', {}).get('tipo_cierre')
    tipos_validos = ['compromiso_explicito', 'compromiso_implicito', 'sin_compromiso', 'rechazo', 'abandono', 'escalacion']
    if tipo_cierre not in tipos_validos:
        errors.append(f"Tipo de cierre inválido: {tipo_cierre}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }
```

---

## Output Final para Supabase

El output de este paso se guarda en la tabla `analisis_llamadas`:

```json
{
  "analisis_id": "an-uuid-generado",
  "registro_id": "registro-de-la-llamada",
  "transcripcion_id": "transcripcion-uuid",
  "agente_id": "agente-uuid",
  "fecha_llamada": "2026-01-30",
  
  // Scores principales (calculados del análisis)
  "score_total": 85,
  "score_compromiso": 90,
  "score_script": 90,
  
  // Datos extraídos
  "entidades": { ... },
  "patrones_script": { ... },
  "resultado_llamada": { ... },
  "seguimiento": { ... },
  "resumen_ejecutivo": { ... },
  
  // Del paso anterior (copiados para referencia rápida)
  "analisis_emocional": { ... },
  
  // Metadata
  "modelo_usado": "claude-sonnet-4-5-20250514",
  "version_prompt": "v2.0",
  "tiempo_procesamiento_ms": 3500
}
```

---

## Diferencias vs Versión Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Análisis emocional | LLM lo calculaba | Ya viene del paso anterior, LLM lo usa |
| Estadísticas básicas | LLM las calculaba | Ya vienen calculadas |
| Input | Solo texto | JSON estructurado con emociones |
| Referencias de crédito | No se extraían | Se extraen como entidades |
| Score del script | No existía | Se calcula (0-100) |
| Riesgo de incumplimiento | No existía | Se evalúa con razón |
| Seguimiento | Básico | Más detallado con tipo y prioridad |
