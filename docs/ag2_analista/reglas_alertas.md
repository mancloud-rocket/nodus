# Reglas de Generación de Alertas

## Visión General

El Agente Analista genera alertas basándose en los resultados del análisis. Estas alertas se incluyen en el registro de `analisis_llamadas` y pueden disparar el Agente Detector.

---

## Estructura de una Alerta

```json
{
  "tipo": "warning" | "error" | "critical",
  "codigo": "CODIGO_ALERTA",
  "mensaje": "Descripción legible de la alerta",
  "severidad": "baja" | "media" | "alta" | "critica",
  "datos": {
    // Datos adicionales según el tipo
  }
}
```

---

## Reglas de Alertas

### 1. SCORE_CRITICO
**Condición**: `score_total < 30`

```json
{
  "tipo": "critical",
  "codigo": "SCORE_CRITICO",
  "mensaje": "Score de llamada críticamente bajo ({score})",
  "severidad": "critica",
  "datos": {
    "score_total": 28,
    "score_contacto": 35,
    "score_compromiso": 20
  }
}
```

**Acción**: Dispara webhook al Agente Detector inmediatamente.

---

### 2. SCORE_BAJO
**Condición**: `score_total >= 30 AND score_total < 50`

```json
{
  "tipo": "warning",
  "codigo": "SCORE_BAJO",
  "mensaje": "Score de llamada por debajo del umbral ({score})",
  "severidad": "alta",
  "datos": {
    "score_total": 42,
    "umbral": 50
  }
}
```

---

### 3. FALTA_VALIDACION
**Condición**: `validacion_cliente.tipo = 'ninguna'`

```json
{
  "tipo": "warning",
  "codigo": "FALTA_VALIDACION",
  "mensaje": "Cliente NO validó el compromiso de pago",
  "severidad": "alta",
  "datos": {
    "tipo_validacion": "ninguna",
    "monto_comprometido": 128888,
    "impacto_estimado": "Probabilidad de cumplimiento reducida a <35%"
  }
}
```

---

### 4. VALIDACION_DEBIL
**Condición**: `validacion_cliente.tipo = 'implicita' AND monto_comprometido > 100000`

```json
{
  "tipo": "warning",
  "codigo": "VALIDACION_DEBIL",
  "mensaje": "Validación implícita para monto alto",
  "severidad": "media",
  "datos": {
    "tipo_validacion": "implicita",
    "monto_comprometido": 150000,
    "frase_cliente": "ok, entiendo"
  }
}
```

---

### 5. ABANDONO_LLAMADA
**Condición**: `hubo_abandono = true`

```json
{
  "tipo": "error",
  "codigo": "ABANDONO_LLAMADA",
  "mensaje": "Llamada abandonada por {iniciado_por}",
  "severidad": "alta",
  "datos": {
    "momento_segundos": 145,
    "iniciado_por": "cliente",
    "razon": "Cliente frustrado por tiempo de espera"
  }
}
```

---

### 6. PROBABILIDAD_BAJA
**Condición**: `probabilidad_cumplimiento < 30`

```json
{
  "tipo": "warning",
  "codigo": "PROBABILIDAD_BAJA",
  "mensaje": "Probabilidad de cumplimiento muy baja ({prob}%)",
  "severidad": "media",
  "datos": {
    "probabilidad": 25,
    "factores_principales": ["sin validación", "historial negativo"]
  }
}
```

---

### 7. OBJECIONES_NO_MANEJADAS
**Condición**: `manejo_objeciones.calidad < 0.5 AND objeciones_detectadas > 0`

```json
{
  "tipo": "warning",
  "codigo": "OBJECIONES_NO_MANEJADAS",
  "mensaje": "{N} objeciones detectadas con manejo deficiente",
  "severidad": "media",
  "datos": {
    "objeciones_detectadas": 2,
    "calidad_manejo": 0.3,
    "detalle": "Cliente mencionó no tener dinero, agente no ofreció alternativas"
  }
}
```

---

### 8. CONSECUENCIAS_NO_MENCIONADAS
**Condición**: `consecuencias_impago.presente = false AND dias_mora > 60`

```json
{
  "tipo": "warning",
  "codigo": "CONSECUENCIAS_OMITIDAS",
  "mensaje": "No se mencionaron consecuencias (cliente con {dias} días de mora)",
  "severidad": "baja",
  "datos": {
    "dias_mora": 75,
    "monto_deuda": 250000
  }
}
```

---

### 9. INCONSISTENCIA_EMOCIONAL
**Condición**: `evolucion_cliente = 'empeoro' AND compromiso_logrado = true`

```json
{
  "tipo": "warning",
  "codigo": "INCONSISTENCIA_EMOCIONAL",
  "mensaje": "Compromiso logrado pero cliente terminó con emoción negativa",
  "severidad": "media",
  "datos": {
    "emocion_inicio": "neutral",
    "emocion_fin": "frustrado",
    "compromiso_monto": 50000
  }
}
```

---

### 10. EXCESO_DURACION
**Condición**: `duracion_segundos > 600 AND score_total < 60`

```json
{
  "tipo": "warning",
  "codigo": "EXCESO_DURACION",
  "mensaje": "Llamada muy larga ({min} min) con score bajo",
  "severidad": "baja",
  "datos": {
    "duracion_segundos": 720,
    "score_total": 45
  }
}
```

---

## Matriz de Severidad y Acciones

| Severidad | Dispara Detector | Notificación Inmediata | Incluir en Coaching |
|-----------|------------------|------------------------|---------------------|
| Crítica | ✅ Sí (inmediato) | ✅ Slack + Email | ✅ Prioridad alta |
| Alta | ✅ Sí (batch) | ✅ Slack | ✅ Sí |
| Media | ❌ No | ❌ No | ✅ Sí |
| Baja | ❌ No | ❌ No | ⚠️ Opcional |

---

## Código de Implementación (Pseudocódigo)

```javascript
function generarAlertas(analisis) {
  const alertas = [];
  
  // 1. Score crítico
  if (analisis.score_total < 30) {
    alertas.push({
      tipo: 'critical',
      codigo: 'SCORE_CRITICO',
      mensaje: `Score de llamada críticamente bajo (${analisis.score_total})`,
      severidad: 'critica',
      datos: { score_total: analisis.score_total }
    });
  }
  // 2. Score bajo
  else if (analisis.score_total < 50) {
    alertas.push({
      tipo: 'warning',
      codigo: 'SCORE_BAJO',
      mensaje: `Score de llamada por debajo del umbral (${analisis.score_total})`,
      severidad: 'alta',
      datos: { score_total: analisis.score_total, umbral: 50 }
    });
  }
  
  // 3. Falta validación
  const validacion = analisis.modulo_compromiso_pago.desglose.validacion_cliente;
  if (validacion.tipo === 'ninguna') {
    alertas.push({
      tipo: 'warning',
      codigo: 'FALTA_VALIDACION',
      mensaje: 'Cliente NO validó el compromiso de pago',
      severidad: 'alta',
      datos: { tipo_validacion: 'ninguna' }
    });
  }
  
  // 4. Abandono
  if (analisis.modulo_abandono.hubo_abandono) {
    alertas.push({
      tipo: 'error',
      codigo: 'ABANDONO_LLAMADA',
      mensaje: `Llamada abandonada por ${analisis.modulo_abandono.iniciado_por}`,
      severidad: 'alta',
      datos: analisis.modulo_abandono
    });
  }
  
  // 5. Probabilidad baja
  if (analisis.probabilidad_cumplimiento < 30) {
    alertas.push({
      tipo: 'warning',
      codigo: 'PROBABILIDAD_BAJA',
      mensaje: `Probabilidad de cumplimiento muy baja (${analisis.probabilidad_cumplimiento}%)`,
      severidad: 'media',
      datos: { probabilidad: analisis.probabilidad_cumplimiento }
    });
  }
  
  return alertas;
}

function debeDispararDetector(alertas) {
  return alertas.some(a => 
    a.severidad === 'critica' || 
    (a.severidad === 'alta' && ['SCORE_BAJO', 'ABANDONO_LLAMADA'].includes(a.codigo))
  );
}
```

---

## Webhook al Detector

Si `debeDispararDetector(alertas)` es `true`, enviar:

```json
{
  "trigger": "analisis_individual",
  "analisis_id": "uuid",
  "registro_id": "uuid",
  "agente_id": "uuid",
  "alertas": [...],
  "timestamp": "2026-01-31T15:30:00Z"
}
```


