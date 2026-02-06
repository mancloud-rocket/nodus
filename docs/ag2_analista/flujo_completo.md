# Agente Analista - Flujo Completo End-to-End

## 📋 Resumen del Flujo

```
Webhook Transcriptor → Obtener Contexto → Evaluar Módulos → Calcular Probabilidad → 
Generar Alertas → INSERT Supabase → [Webhook Detector si alertas]
```

---

## 🔄 Flujo Detallado

### PASO 1: Recibir Webhook del Transcriptor

**Endpoint**: `POST /webhooks/analizar-llamada`

**Payload recibido**:
```json
{
  "registro_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "transcripcion_id": "f1e2d3c4-b5a6-7890-1234-567890abcdef"
}
```

**Validación**:
```javascript
// Saturn Studio - Nodo de validación
if (!payload.registro_id || !payload.transcripcion_id) {
  throw new Error('Missing required fields');
}
```

---

### PASO 2: Obtener Contexto desde Supabase

**Query 1: Transcripción completa**
```sql
SELECT 
  transcripcion_id,
  registro_id,
  transcripcion_completa,
  segmentos,
  entidades,
  metricas_conversacion,
  analisis_emocional,
  patrones_script,
  resultado_preliminar,
  resumen_ejecutivo,
  referencias_creditos,
  seguimiento
FROM transcripciones 
WHERE transcripcion_id = $1;
```

**Query 2: Info del registro y agente**
```sql
SELECT 
  rl.registro_id,
  rl.agente_id,
  rl.agente_nombre,
  rl.cliente_nombre,
  rl.empresa_acreedora,
  rl.empresa_cobranza,
  rl.campana,
  rl.timestamp_inicio,
  rl.duracion_segundos,
  a.nombre as agente_nombre_oficial,
  a.equipo,
  a.estado as agente_estado
FROM registro_llamadas rl
LEFT JOIN agentes a ON rl.agente_id = a.agente_id
WHERE rl.registro_id = $1;
```

**Query 3: Historial del cliente (si existe)**
```sql
SELECT 
  al.analisis_id,
  al.score_total,
  al.probabilidad_cumplimiento,
  al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' as tipo_validacion,
  al.fecha_llamada,
  al.alertas
FROM analisis_llamadas al
JOIN registro_llamadas rl ON al.registro_id = rl.registro_id
WHERE rl.cliente_nombre = $1
  AND al.created_at < NOW()
ORDER BY al.created_at DESC
LIMIT 5;
```

**Resultado combinado**:
```javascript
const contexto = {
  transcripcion: resultQuery1[0],
  registro: resultQuery2[0],
  historial: resultQuery3  // puede ser []
};
```

---

### PASO 3: Evaluar Módulos con Claude

**Preparar prompt**:
```javascript
const promptModulos = construirPromptModulos({
  transcripcion_completa: contexto.transcripcion.transcripcion_completa,
  segmentos_json: JSON.stringify(contexto.transcripcion.segmentos),
  entidades_json: JSON.stringify(contexto.transcripcion.entidades),
  patrones_script_json: JSON.stringify(contexto.transcripcion.patrones_script),
  resultado_preliminar_json: JSON.stringify(contexto.transcripcion.resultado_preliminar)
});
```

**Llamada a Claude**:
```javascript
const responseModulos = await claude.messages.create({
  model: 'claude-opus-4-5-20250514',
  max_tokens: 4000,
  temperature: 0.2,
  messages: [{ role: 'user', content: promptModulos }]
});

const analisisModulos = JSON.parse(responseModulos.content[0].text);
```

**Output esperado**:
```json
{
  "modulo_contacto_directo": {
    "score": 80,
    "desglose": {...}
  },
  "modulo_compromiso_pago": {
    "score": 80,
    "desglose": {...}
  },
  "modulo_abandono": {
    "hubo_abandono": false,
    ...
  },
  "score_total": 80,
  "notas_evaluacion": "..."
}
```

---

### PASO 4: Calcular Probabilidad de Cumplimiento

**Preparar prompt**:
```javascript
const promptPrediccion = construirPromptPrediccion({
  analisis_modulos_json: JSON.stringify(analisisModulos),
  resultado_preliminar_json: JSON.stringify(contexto.transcripcion.resultado_preliminar),
  historial_cliente_json: JSON.stringify(contexto.historial),
  info_deuda_json: JSON.stringify({
    campana: contexto.registro.campana,
    monto_deuda: calcularMontoTotal(contexto.transcripcion.entidades.montos)
  })
});
```

**Llamada a Claude**:
```javascript
const responsePrediccion = await claude.messages.create({
  model: 'claude-opus-4-5-20250514',
  max_tokens: 2000,
  temperature: 0.3,
  messages: [{ role: 'user', content: promptPrediccion }]
});

const prediccion = JSON.parse(responsePrediccion.content[0].text);
```

**Output esperado**:
```json
{
  "probabilidad_cumplimiento": 78,
  "nivel_cumplimiento": "alta",
  "calculo": {...},
  "factores_prediccion": {...}
}
```

---

### PASO 5: Generar Alertas

**Lógica de alertas**:
```javascript
function generarAlertas(analisisModulos, prediccion) {
  const alertas = [];
  
  // Score crítico
  if (analisisModulos.score_total < 30) {
    alertas.push({
      tipo: 'critical',
      codigo: 'SCORE_CRITICO',
      mensaje: `Score críticamente bajo (${analisisModulos.score_total})`,
      severidad: 'critica'
    });
  } else if (analisisModulos.score_total < 50) {
    alertas.push({
      tipo: 'warning',
      codigo: 'SCORE_BAJO',
      mensaje: `Score bajo (${analisisModulos.score_total})`,
      severidad: 'alta'
    });
  }
  
  // Validación
  const validacion = analisisModulos.modulo_compromiso_pago.desglose.validacion_cliente;
  if (validacion.tipo === 'ninguna') {
    alertas.push({
      tipo: 'warning',
      codigo: 'FALTA_VALIDACION',
      mensaje: 'Cliente no validó compromiso',
      severidad: 'alta'
    });
  }
  
  // Abandono
  if (analisisModulos.modulo_abandono.hubo_abandono) {
    alertas.push({
      tipo: 'error',
      codigo: 'ABANDONO_LLAMADA',
      mensaje: `Abandono por ${analisisModulos.modulo_abandono.iniciado_por}`,
      severidad: 'alta'
    });
  }
  
  // Probabilidad baja
  if (prediccion.probabilidad_cumplimiento < 30) {
    alertas.push({
      tipo: 'warning',
      codigo: 'PROBABILIDAD_BAJA',
      mensaje: `Probabilidad muy baja (${prediccion.probabilidad_cumplimiento}%)`,
      severidad: 'media'
    });
  }
  
  return alertas;
}
```

---

### PASO 6: Generar Recomendaciones

**Lógica de recomendaciones**:
```javascript
function generarRecomendaciones(contexto, analisisModulos, prediccion) {
  const recomendaciones = [];
  const resultado = contexto.transcripcion.resultado_preliminar;
  
  // Si hay compromiso, programar seguimiento
  if (resultado.compromiso_logrado) {
    recomendaciones.push({
      prioridad: 'media',
      destinatario: 'sistema',
      accion: `Programar recordatorio de pago`,
      cuando: '24h antes de fecha compromiso'
    });
    
    recomendaciones.push({
      prioridad: 'media',
      destinatario: 'agente',
      accion: 'Llamar para confirmar pago realizado',
      cuando: 'día siguiente al compromiso'
    });
  }
  
  // Si validación débil
  const validacion = analisisModulos.modulo_compromiso_pago.desglose.validacion_cliente;
  if (validacion.tipo === 'implicita') {
    recomendaciones.push({
      prioridad: 'alta',
      destinatario: 'supervisor',
      accion: 'Llamar para reforzar compromiso con validación explícita',
      cuando: '24-48 horas'
    });
  }
  
  // Si score bajo
  if (analisisModulos.score_total < 60) {
    recomendaciones.push({
      prioridad: 'media',
      destinatario: 'coaching',
      accion: 'Incluir llamada en revisión de coaching',
      cuando: 'próximo reporte'
    });
  }
  
  return recomendaciones;
}
```

---

### PASO 7: INSERT en Supabase

**Construir objeto final**:
```javascript
const analisisCompleto = {
  registro_id: contexto.registro.registro_id,
  transcripcion_id: contexto.transcripcion.transcripcion_id,
  agente_id: contexto.registro.agente_id,
  
  score_total: analisisModulos.score_total,
  score_contacto_directo: analisisModulos.modulo_contacto_directo.score,
  score_compromiso_pago: analisisModulos.modulo_compromiso_pago.score,
  
  modulo_contacto_directo: analisisModulos.modulo_contacto_directo,
  modulo_compromiso_pago: analisisModulos.modulo_compromiso_pago,
  modulo_abandono: analisisModulos.modulo_abandono,
  
  probabilidad_cumplimiento: prediccion.probabilidad_cumplimiento,
  nivel_cumplimiento: prediccion.nivel_cumplimiento,
  factores_prediccion: prediccion.factores_prediccion,
  
  alertas: alertas,
  recomendaciones: recomendaciones,
  
  modelo_usado: 'claude-opus-4-5-20250514',
  version_prompt: 'v1.0',
  confianza_analisis: prediccion.factores_prediccion.confianza_prediccion,
  tiempo_procesamiento_ms: Date.now() - startTime,
  fecha_llamada: contexto.registro.timestamp_inicio?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
};
```

**INSERT**:
```sql
INSERT INTO analisis_llamadas (
  registro_id, transcripcion_id, agente_id,
  score_total, score_contacto_directo, score_compromiso_pago,
  modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono,
  probabilidad_cumplimiento, nivel_cumplimiento, factores_prediccion,
  alertas, recomendaciones,
  modelo_usado, version_prompt, confianza_analisis, tiempo_procesamiento_ms, fecha_llamada
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
) RETURNING analisis_id;
```

**UPDATE registro_llamadas**:
```sql
UPDATE registro_llamadas 
SET 
  estado = 'analizado',
  analisis_id = $1,
  updated_at = NOW()
WHERE registro_id = $2;
```

---

### PASO 8: Trigger Condicional al Detector

**Evaluar si disparar**:
```javascript
function debeDispararDetector(alertas) {
  return alertas.some(a => 
    a.severidad === 'critica' || 
    (a.severidad === 'alta' && ['SCORE_BAJO', 'ABANDONO_LLAMADA', 'FALTA_VALIDACION'].includes(a.codigo))
  );
}
```

**Webhook al Detector**:
```javascript
if (debeDispararDetector(alertas)) {
  await fetch(process.env.WEBHOOK_DETECTOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trigger: 'analisis_individual',
      analisis_id: analisisId,
      registro_id: contexto.registro.registro_id,
      agente_id: contexto.registro.agente_id,
      alertas: alertas,
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## ⏱️ Tiempos Esperados

| Paso | Tiempo | Acumulado |
|------|--------|-----------|
| 1. Recibir webhook | <50ms | 50ms |
| 2. Queries Supabase (paralelo) | ~300ms | 350ms |
| 3. Claude - Módulos | 2-3s | 3.5s |
| 4. Claude - Predicción | 1-2s | 5s |
| 5-6. Alertas + Recomendaciones | <50ms | 5s |
| 7. INSERT/UPDATE Supabase | ~200ms | 5.2s |
| 8. Webhook Detector | ~100ms | 5.3s |
| **Total** | **~5s** | |

---

## 🔴 Manejo de Errores

```javascript
try {
  // ... flujo completo ...
} catch (error) {
  // Registrar error
  await supabase.from('registro_llamadas').update({
    estado: 'error',
    error_mensaje: error.message,
    updated_at: new Date()
  }).eq('registro_id', registro_id);
  
  // Notificar
  await notificarError({
    agente: 'analista',
    registro_id: registro_id,
    error: error.message,
    stack: error.stack
  });
  
  throw error;
}
```

---

## 📊 Métricas a Monitorear

| Métrica | Target | Alerta |
|---------|--------|--------|
| Tiempo total | < 10s | > 15s |
| Tasa éxito | > 99% | < 95% |
| Errores Claude | < 1% | > 5% |
| Errores Supabase | < 0.1% | > 1% |

