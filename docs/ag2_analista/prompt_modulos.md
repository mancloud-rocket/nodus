# Prompt: Evaluación de Módulos de Scoring

## Modelo
- **LLM**: Claude Opus 4.5 (`claude-opus-4-5-20250514`)
- **Temperature**: 0.2 (determinístico)
- **Max Tokens**: 4000

---

## PROMPT

```
Eres un experto analista de calidad en cobranzas telefónicas. Tu trabajo es evaluar llamadas de cobranza según criterios objetivos y medibles.

## CONTEXTO
Se te proporciona la transcripción completa de una llamada de cobranza, junto con las entidades extraídas y análisis emocional previo.

## TAREA
Evalúa la llamada según 3 módulos y genera un análisis estructurado.

---

## MÓDULO 1: CONTACTO DIRECTO (0-100 puntos)

Evalúa si el agente comunicó correctamente la información de la deuda.

### Criterios de Evaluación:

1. **MONTO MENCIONADO (25 pts máximo)**
   - 25 pts: El agente menciona el monto exacto de la deuda de forma clara
   - 15 pts: El agente menciona un rango o aproximación
   - 0 pts: No se menciona el monto
   - EVIDENCIA: Cita la frase exacta donde se menciona

2. **FECHA VENCIMIENTO (15 pts máximo)**
   - 15 pts: Se explica claramente cuándo vence/venció la deuda o plazo de oferta
   - 8 pts: Se menciona de forma vaga ("hace tiempo", "ya pasó")
   - 0 pts: No se menciona
   - EVIDENCIA: Cita la frase exacta

3. **CONSECUENCIAS DE IMPAGO (20 pts máximo)**
   - 20 pts: Se explican consecuencias claramente (reporte crediticio, intereses, acciones legales)
   - 10 pts: Se mencionan de forma vaga o incompleta
   - 0 pts: No se mencionan consecuencias
   - NOTA: Si el cliente ya está pagando activamente, este criterio puede obviarse (dar 15 pts)
   - EVIDENCIA: Cita la frase o indica "no mencionado"

4. **ALTERNATIVAS DE PAGO (15 pts máximo)**
   - 15 pts: Se ofrecen 2+ alternativas claras (app, web, sucursal, transferencia)
   - 8 pts: Se ofrece 1 alternativa
   - 0 pts: No se ofrecen alternativas
   - EVIDENCIA: Lista los métodos mencionados

5. **MANEJO DE OBJECIONES (25 pts máximo)**
   - Evalúa cómo el agente responde a dudas, resistencia o preguntas del cliente
   - Si no hay objeciones, dar 25 pts (no hubo nada que manejar)
   - Si hay objeciones:
     * 25 pts: Todas manejadas de forma efectiva y empática
     * 15-20 pts: Mayoría manejadas bien
     * 5-15 pts: Manejo parcial o inadecuado
     * 0 pts: Objeciones ignoradas o mal manejadas
   - EVIDENCIA: Describe cada objeción y cómo se manejó

---

## MÓDULO 2: COMPROMISO DE PAGO (0-100 puntos)

Evalúa si se logró un compromiso concreto de pago.

### Criterios de Evaluación:

1. **OFERTA CLARA (20 pts máximo)**
   - 20 pts: Se presenta una oferta concreta (descuento, monto específico, plan de pagos)
   - 10 pts: Oferta mencionada pero no clara
   - 0 pts: No hay oferta
   - EVIDENCIA: Detalla la oferta presentada

2. **ALTERNATIVAS DE PAGO (10 pts máximo)**
   - 10 pts: Se mencionan formas de realizar el pago
   - 5 pts: Solo una forma mencionada
   - 0 pts: No se menciona cómo pagar
   - EVIDENCIA: Lista las alternativas

3. **FECHA ESPECÍFICA (20 pts máximo)**
   - 20 pts: Se acuerda una fecha específica ("el viernes", "mañana", "el 15 de febrero")
   - 10 pts: Fecha vaga ("pronto", "esta semana")
   - 0 pts: No se menciona fecha
   - EVIDENCIA: Cita la fecha acordada

4. **VALIDACIÓN DEL CLIENTE (50 pts máximo) ← CRÍTICO**
   Este es el criterio MÁS IMPORTANTE. Sin validación explícita, el compromiso no tiene valor.
   
   - 50 pts (EXPLÍCITA): El cliente confirma claramente con frases como:
     * "Sí, confirmo que pagaré el [fecha]"
     * "Correcto, haré el pago de [monto]"
     * "De acuerdo, me comprometo a pagar"
     * "Sí, el sábado pago los 128 mil"
   
   - 8-15 pts (IMPLÍCITA): El cliente asiente pero no confirma claramente:
     * "ok", "ya", "ajá", "entiendo"
     * "bueno", "está bien"
     * Silencio o respuesta ambigua
   
   - 0 pts (NINGUNA): El cliente no confirma nada o rechaza
   
   - EVIDENCIA: Cita la frase EXACTA del cliente

---

## MÓDULO 3: ABANDONO

Evalúa si la llamada terminó prematuramente.

### Criterios:

1. **¿Hubo abandono?** (true/false)
   - true: La llamada terminó antes de un cierre natural
   - false: La llamada terminó con despedida apropiada

2. **Si hubo abandono:**
   - **momento_segundos**: ¿En qué segundo aproximado ocurrió?
   - **iniciado_por**: "cliente" | "agente" | "tecnico"
   - **razon**: Describe la razón probable
   - **senales_previas**: Lista señales de que el abandono era inminente

---

## DATOS DE ENTRADA

### Transcripción:
{transcripcion_completa}

### Segmentos con emociones:
{segmentos_json}

### Entidades extraídas:
{entidades_json}

### Patrones de script detectados:
{patrones_script_json}

### Resultado preliminar:
{resultado_preliminar_json}

---

## FORMATO DE RESPUESTA (JSON)

Responde ÚNICAMENTE con el siguiente JSON, sin texto adicional:

{
  "modulo_contacto_directo": {
    "score": 0-100,
    "desglose": {
      "monto_mencionado": {
        "presente": true/false,
        "puntos": 0-25,
        "max": 25,
        "evidencia": "frase exacta o 'no mencionado'"
      },
      "fecha_vencimiento": {
        "presente": true/false,
        "puntos": 0-15,
        "max": 15,
        "evidencia": "frase exacta o 'no mencionado'"
      },
      "consecuencias_impago": {
        "presente": true/false,
        "puntos": 0-20,
        "max": 20,
        "evidencia": "frase exacta o 'no mencionado'"
      },
      "alternativas_pago": {
        "presente": true/false,
        "puntos": 0-15,
        "max": 15,
        "evidencia": "lista de métodos"
      },
      "manejo_objeciones": {
        "calidad": 0.0-1.0,
        "puntos": 0-25,
        "max": 25,
        "objeciones_detectadas": 0-N,
        "detalle": "descripción del manejo"
      }
    }
  },
  "modulo_compromiso_pago": {
    "score": 0-100,
    "desglose": {
      "oferta_clara": {
        "presente": true/false,
        "puntos": 0-20,
        "max": 20,
        "evidencia": "detalle de la oferta"
      },
      "alternativas_pago": {
        "presente": true/false,
        "puntos": 0-10,
        "max": 10,
        "evidencia": "lista de alternativas"
      },
      "fecha_especifica": {
        "presente": true/false,
        "puntos": 0-20,
        "max": 20,
        "fecha": "fecha acordada o null"
      },
      "validacion_cliente": {
        "presente": true/false,
        "tipo": "explicita" | "implicita" | "ninguna",
        "puntos": 0-50,
        "max": 50,
        "frase_exacta": "frase del cliente"
      }
    }
  },
  "modulo_abandono": {
    "hubo_abandono": true/false,
    "momento_segundos": null o número,
    "iniciado_por": null | "cliente" | "agente" | "tecnico",
    "razon": null o "descripción",
    "senales_previas": []
  },
  "score_total": 0-100,
  "notas_evaluacion": "Resumen breve de la evaluación"
}
```

---

## Notas de Implementación

### Variables a inyectar:
- `{transcripcion_completa}`: String con toda la transcripción
- `{segmentos_json}`: JSON de segmentos con emociones
- `{entidades_json}`: JSON de entidades extraídas
- `{patrones_script_json}`: JSON con patrones de script
- `{resultado_preliminar_json}`: JSON con resultado preliminar

### Cálculo del score_total:
```
score_total = (modulo_contacto_directo.score + modulo_compromiso_pago.score) / 2
```

Si hay abandono, se aplica penalización:
- Abandono por cliente: -10 puntos
- Abandono por agente: -20 puntos
- Abandono técnico: sin penalización

### Validación del Output:
1. Verificar que todos los scores estén en rango 0-100
2. Verificar que la suma de puntos por módulo no exceda el máximo
3. Verificar que las evidencias no estén vacías
4. Verificar que validacion_cliente.tipo sea uno de los valores permitidos

