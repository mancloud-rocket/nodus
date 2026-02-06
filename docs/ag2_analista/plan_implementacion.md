# Plan de Implementación - Agente Analista

## 📋 Resumen

| Aspecto | Detalle |
|---------|---------|
| **Tiempo estimado** | 3-5 días |
| **Complejidad** | Media-Alta |
| **Dependencias** | Agente Transcriptor funcionando, Supabase configurado |
| **Tecnologías** | Saturn Studio, Claude Opus 4.5, Supabase |

---

## 🎯 Objetivos del Sprint

1. ✅ Implementar webhook receptor desde Transcriptor
2. ✅ Crear flujo de obtención de contexto
3. ✅ Integrar Claude para evaluación de módulos
4. ✅ Integrar Claude para predicción de cumplimiento
5. ✅ Implementar lógica de alertas y recomendaciones
6. ✅ Configurar INSERT en Supabase
7. ✅ Configurar webhook condicional al Detector
8. ✅ Testing end-to-end

---

## 📝 Checklist Detallado

### Fase 1: Preparación (Día 1 - Mañana)

#### 1.1 Configuración de Entorno
- [ ] Verificar acceso a Saturn Studio
- [ ] Verificar API key de Anthropic (Claude)
- [ ] Verificar conexión a Supabase
- [ ] Crear variables de entorno:
  ```
  CLAUDE_API_KEY=sk-ant-xxx
  CLAUDE_MODEL=claude-opus-4-5-20250514
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_KEY=xxx
  WEBHOOK_DETECTOR_URL=https://xxx
  ```

#### 1.2 Verificar Schema de Supabase
- [ ] Confirmar tabla `analisis_llamadas` existe con todos los campos
- [ ] Verificar constraints (0-100 en scores, ENUM en nivel_cumplimiento)
- [ ] Verificar índices están creados
- [ ] Probar INSERT manual con datos de ejemplo

#### 1.3 Verificar Agente Transcriptor
- [ ] Confirmar que Transcriptor está funcionando
- [ ] Verificar que el webhook de salida tiene el formato correcto
- [ ] Obtener URL del webhook del Analista para configurar en Transcriptor

---

### Fase 2: Desarrollo del Flujo (Día 1 - Tarde a Día 2)

#### 2.1 Crear Webhook Receptor en Saturn Studio
- [ ] Crear nuevo flujo "Agente Analista"
- [ ] Configurar trigger: HTTP Webhook POST
- [ ] Endpoint: `/webhooks/analizar-llamada`
- [ ] Validar payload de entrada:
  ```json
  {
    "registro_id": "required|uuid",
    "transcripcion_id": "required|uuid"
  }
  ```
- [ ] Configurar timeout: 2 minutos
- [ ] Configurar retry: 2 intentos

#### 2.2 Nodo: Obtener Contexto
- [ ] Crear nodo de Supabase Query
- [ ] Query 1: Obtener transcripción completa
  ```sql
  SELECT * FROM transcripciones 
  WHERE transcripcion_id = {{transcripcion_id}}
  ```
- [ ] Query 2: Obtener registro y agente
  ```sql
  SELECT rl.*, a.nombre, a.equipo 
  FROM registro_llamadas rl
  LEFT JOIN agentes a ON rl.agente_id = a.agente_id
  WHERE rl.registro_id = {{registro_id}}
  ```
- [ ] Query 3: Obtener historial cliente
  ```sql
  SELECT al.* FROM analisis_llamadas al
  JOIN registro_llamadas rl ON al.registro_id = rl.registro_id
  WHERE rl.cliente_nombre = {{cliente_nombre}}
  ORDER BY al.created_at DESC LIMIT 5
  ```
- [ ] Configurar queries en paralelo para optimizar tiempo

#### 2.3 Nodo: Preparar Prompt Módulos
- [ ] Crear nodo de transformación JavaScript
- [ ] Cargar template de `prompt_modulos.md`
- [ ] Inyectar variables:
  - `{{transcripcion_completa}}`
  - `{{segmentos_json}}`
  - `{{entidades_json}}`
  - `{{patrones_script_json}}`
  - `{{resultado_preliminar_json}}`
- [ ] Validar que el prompt no exceda límites de tokens

#### 2.4 Nodo: Llamar Claude - Módulos
- [ ] Crear nodo de API Call a Anthropic
- [ ] Configurar:
  - Model: `claude-opus-4-5-20250514`
  - Temperature: 0.2
  - Max tokens: 4000
- [ ] Parsear respuesta JSON
- [ ] Validar estructura de respuesta:
  - `modulo_contacto_directo.score` existe
  - `modulo_compromiso_pago.score` existe
  - `modulo_abandono.hubo_abandono` existe
- [ ] Manejar errores de parsing

#### 2.5 Nodo: Preparar Prompt Predicción
- [ ] Crear nodo de transformación
- [ ] Cargar template de `prompt_prediccion.md`
- [ ] Inyectar variables:
  - `{{analisis_modulos_json}}`
  - `{{resultado_preliminar_json}}`
  - `{{historial_cliente_json}}`
  - `{{info_deuda_json}}`

#### 2.6 Nodo: Llamar Claude - Predicción
- [ ] Crear nodo de API Call a Anthropic
- [ ] Configurar:
  - Model: `claude-opus-4-5-20250514`
  - Temperature: 0.3
  - Max tokens: 2000
- [ ] Parsear respuesta JSON
- [ ] Validar:
  - `probabilidad_cumplimiento` en rango 0-100
  - `nivel_cumplimiento` es 'baja', 'media' o 'alta'

---

### Fase 3: Lógica de Negocio (Día 2 - Tarde)

#### 3.1 Nodo: Generar Alertas
- [ ] Crear nodo JavaScript
- [ ] Implementar función `generarAlertas()` según `reglas_alertas.md`
- [ ] Reglas a implementar:
  - [ ] SCORE_CRITICO (< 30)
  - [ ] SCORE_BAJO (30-50)
  - [ ] FALTA_VALIDACION
  - [ ] VALIDACION_DEBIL
  - [ ] ABANDONO_LLAMADA
  - [ ] PROBABILIDAD_BAJA
- [ ] Retornar array de alertas con estructura correcta

#### 3.2 Nodo: Generar Recomendaciones
- [ ] Crear nodo JavaScript
- [ ] Implementar función `generarRecomendaciones()`
- [ ] Tipos de recomendaciones:
  - [ ] Seguimiento de pago
  - [ ] Refuerzo de compromiso
  - [ ] Revisión de coaching
  - [ ] Acciones del sistema
- [ ] Asignar prioridades correctamente

#### 3.3 Nodo: Construir Objeto Final
- [ ] Crear nodo de transformación
- [ ] Combinar todos los datos:
  ```javascript
  {
    registro_id,
    transcripcion_id,
    agente_id,
    score_total,
    score_contacto_directo,
    score_compromiso_pago,
    modulo_contacto_directo,
    modulo_compromiso_pago,
    modulo_abandono,
    probabilidad_cumplimiento,
    nivel_cumplimiento,
    factores_prediccion,
    alertas,
    recomendaciones,
    modelo_usado,
    version_prompt,
    confianza_analisis,
    tiempo_procesamiento_ms,
    fecha_llamada
  }
  ```
- [ ] Calcular `tiempo_procesamiento_ms`
- [ ] Validar objeto completo antes de INSERT

---

### Fase 4: Persistencia (Día 3 - Mañana)

#### 4.1 Nodo: INSERT analisis_llamadas
- [ ] Crear nodo Supabase Insert
- [ ] Mapear todos los campos
- [ ] Configurar RETURNING para obtener `analisis_id`
- [ ] Manejar errores de constraint
- [ ] Manejar errores de duplicado

#### 4.2 Nodo: UPDATE registro_llamadas
- [ ] Crear nodo Supabase Update
- [ ] Actualizar:
  - `estado = 'analizado'`
  - `analisis_id = {{analisis_id}}`
  - `updated_at = NOW()`
- [ ] Verificar que el UPDATE fue exitoso

---

### Fase 5: Integración con Detector (Día 3 - Tarde)

#### 5.1 Nodo: Evaluar Trigger Detector
- [ ] Crear nodo condicional
- [ ] Implementar función `debeDispararDetector()`
- [ ] Condiciones:
  - Severidad crítica: siempre disparar
  - Severidad alta + códigos específicos: disparar
  - Resto: no disparar

#### 5.2 Nodo: Webhook al Detector
- [ ] Crear nodo HTTP Request (condicional)
- [ ] Endpoint: `{{WEBHOOK_DETECTOR_URL}}`
- [ ] Method: POST
- [ ] Payload:
  ```json
  {
    "trigger": "analisis_individual",
    "analisis_id": "{{analisis_id}}",
    "registro_id": "{{registro_id}}",
    "agente_id": "{{agente_id}}",
    "alertas": [...],
    "timestamp": "{{now}}"
  }
  ```
- [ ] No esperar respuesta (async)

---

### Fase 6: Testing (Día 4)

#### 6.1 Tests Unitarios
- [ ] Test: Validación de payload de entrada
- [ ] Test: Queries de contexto retornan datos correctos
- [ ] Test: Prompt de módulos se construye correctamente
- [ ] Test: Respuesta de Claude se parsea correctamente
- [ ] Test: Alertas se generan según reglas
- [ ] Test: Recomendaciones se generan correctamente
- [ ] Test: INSERT en Supabase funciona

#### 6.2 Tests de Integración
- [ ] Test E2E: Llamada exitosa con score alto
  - Input: Transcripción con validación explícita
  - Expected: score > 70, probabilidad > 70, sin alertas
- [ ] Test E2E: Llamada con score bajo
  - Input: Transcripción sin validación
  - Expected: score < 50, alertas generadas, webhook a Detector
- [ ] Test E2E: Llamada con abandono
  - Input: Transcripción con abandono
  - Expected: alerta ABANDONO_LLAMADA, webhook a Detector
- [ ] Test E2E: Cliente con historial
  - Input: Cliente que ya tiene llamadas previas
  - Expected: historial_cliente_considerado = true

#### 6.3 Tests de Performance
- [ ] Medir tiempo total del flujo (target: < 10s)
- [ ] Medir tiempo de cada nodo
- [ ] Identificar cuellos de botella
- [ ] Optimizar si es necesario

---

### Fase 7: Despliegue y Monitoreo (Día 5)

#### 7.1 Configurar Transcriptor
- [ ] Actualizar Agente Transcriptor con URL del Analista
- [ ] Verificar que el webhook se dispara correctamente
- [ ] Probar flujo completo: Audio → Transcriptor → Analista

#### 7.2 Configurar Logging
- [ ] Logs de inicio/fin de cada ejecución
- [ ] Logs de errores con stack trace
- [ ] Logs de métricas (tiempo, scores)

#### 7.3 Configurar Alertas de Monitoreo
- [ ] Alerta si tiempo > 15s
- [ ] Alerta si tasa de error > 5%
- [ ] Alerta si errores de Claude
- [ ] Dashboard de métricas

#### 7.4 Documentación Final
- [ ] Actualizar README del agente
- [ ] Documentar troubleshooting común
- [ ] Crear runbook de operaciones

---

## 🚨 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Claude no retorna JSON válido | Media | Alto | Retry con instrucción más explícita |
| Timeout en llamadas a Claude | Baja | Alto | Configurar timeout de 60s, retry |
| Historial de cliente vacío | Alta | Bajo | Manejar caso null correctamente |
| Score fuera de rango | Baja | Medio | Validar y recortar a 0-100 |
| Supabase no disponible | Muy baja | Alto | Retry, notificar error |

---

## 📊 Métricas de Éxito

| Métrica | Target | Crítico |
|---------|--------|---------|
| Tiempo promedio | < 5s | > 15s |
| Tasa de éxito | > 99% | < 95% |
| Errores de Claude | < 1% | > 5% |
| Cobertura de alertas | 100% | < 90% |
| Precisión de scores | N/A | Validar con muestras manuales |

---

## 📅 Cronograma

```
Día 1 (Mañana):  Preparación + Configuración
Día 1 (Tarde):   Webhook + Contexto
Día 2 (Mañana):  Nodos Claude (Módulos + Predicción)
Día 2 (Tarde):   Lógica de Alertas + Recomendaciones
Día 3 (Mañana):  Persistencia Supabase
Día 3 (Tarde):   Integración con Detector
Día 4:           Testing completo
Día 5:           Despliegue + Monitoreo
```

---

## ✅ Criterios de Aceptación

1. El Analista procesa correctamente webhooks del Transcriptor
2. Los scores se calculan según las reglas definidas
3. La probabilidad de cumplimiento considera todos los factores
4. Las alertas se generan automáticamente según severidad
5. El INSERT en Supabase es exitoso y completo
6. El webhook al Detector se dispara condicionalmente
7. El tiempo total de procesamiento es < 10s
8. La tasa de éxito es > 99%


