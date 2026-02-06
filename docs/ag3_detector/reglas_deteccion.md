# Reglas de Deteccion - Agente Detector (Modo Periodico 24h)

## Vision General

El Detector se ejecuta diariamente y analiza las ultimas 24 horas de datos para generar alertas. No requiere LLM, opera con reglas predefinidas y queries SQL.

---

## 1. Queries de Obtencion de Datos

### 1.1 Metricas Globales del Periodo

```sql
-- Metricas de las ultimas 24 horas
WITH periodo_actual AS (
  SELECT 
    COUNT(*) as total_llamadas,
    AVG(score_total) as score_promedio,
    COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true') as abandonos,
    COUNT(*) FILTER (
      WHERE modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
    ) as validaciones_explicitas,
    AVG(probabilidad_cumplimiento) as prob_cumplimiento_promedio
  FROM analisis_llamadas
  WHERE created_at >= NOW() - INTERVAL '24 hours'
),
periodo_anterior AS (
  SELECT 
    COUNT(*) as total_llamadas,
    AVG(score_total) as score_promedio,
    COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true') as abandonos,
    COUNT(*) FILTER (
      WHERE modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
    ) as validaciones_explicitas
  FROM analisis_llamadas
  WHERE created_at >= NOW() - INTERVAL '48 hours'
    AND created_at < NOW() - INTERVAL '24 hours'
)
SELECT 
  pa.*,
  pan.total_llamadas as llamadas_anterior,
  pan.score_promedio as score_anterior,
  pan.abandonos as abandonos_anterior,
  pan.validaciones_explicitas as validaciones_anterior
FROM periodo_actual pa, periodo_anterior pan;
```

### 1.2 Metricas por Agente

```sql
SELECT 
  al.agente_id,
  rl.agente_nombre,
  a.equipo,
  COUNT(*) as total_llamadas,
  AVG(al.score_total) as score_promedio,
  COUNT(*) FILTER (WHERE al.modulo_abandono->>'hubo_abandono' = 'true') as abandonos,
  COUNT(*) FILTER (
    WHERE al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
  ) as validaciones_explicitas,
  COUNT(*) FILTER (WHERE al.score_total < 40) as llamadas_criticas,
  AVG(al.probabilidad_cumplimiento) as prob_promedio,
  ARRAY_AGG(al.score_total ORDER BY al.created_at) as scores_ordenados
FROM analisis_llamadas al
JOIN registro_llamadas rl ON al.registro_id = rl.registro_id
LEFT JOIN agentes a ON al.agente_id = a.agente_id
WHERE al.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY al.agente_id, rl.agente_nombre, a.equipo
HAVING COUNT(*) >= 3;  -- Minimo 3 llamadas para evaluar
```

### 1.3 Comparativa de Agente vs Dia Anterior

```sql
SELECT 
  agente_id,
  AVG(score_total) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as score_hoy,
  AVG(score_total) FILTER (
    WHERE created_at >= NOW() - INTERVAL '48 hours' 
    AND created_at < NOW() - INTERVAL '24 hours'
  ) as score_ayer
FROM analisis_llamadas
WHERE created_at >= NOW() - INTERVAL '48 hours'
GROUP BY agente_id
HAVING 
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') >= 3
  AND COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '24 hours') >= 3;
```

---

## 2. Reglas de Alerta por Agente

### 2.1 AGENTE_SCORE_CRITICO

```javascript
const regla = {
  codigo: 'AGENTE_SCORE_CRITICO',
  tipo: 'agente',
  severidad: 'critica',
  condicion: (agente) => agente.score_promedio < 40,
  descripcion: (agente) => 
    `Score promedio critico (${Math.round(agente.score_promedio)}) en ultimas 24h`,
  datos: (agente) => ({
    score_promedio: Math.round(agente.score_promedio),
    total_llamadas: agente.total_llamadas,
    llamadas_criticas: agente.llamadas_criticas,
    umbral: 40
  }),
  accion_requerida: 'Intervencion inmediata - coaching urgente'
};
```

### 2.2 AGENTE_SCORE_BAJO

```javascript
const regla = {
  codigo: 'AGENTE_SCORE_BAJO',
  tipo: 'agente',
  severidad: 'alta',
  condicion: (agente) => agente.score_promedio >= 40 && agente.score_promedio < 55,
  descripcion: (agente) => 
    `Score promedio bajo (${Math.round(agente.score_promedio)}) en ultimas 24h`,
  datos: (agente) => ({
    score_promedio: Math.round(agente.score_promedio),
    total_llamadas: agente.total_llamadas,
    umbral: 55
  }),
  accion_requerida: 'Incluir en revision de coaching prioritaria'
};
```

### 2.3 AGENTE_ABANDONO_ALTO

```javascript
const regla = {
  codigo: 'AGENTE_ABANDONO_ALTO',
  tipo: 'agente',
  severidad: 'alta',
  condicion: (agente) => {
    const tasaAbandono = agente.abandonos / agente.total_llamadas;
    return tasaAbandono > 0.20 && agente.total_llamadas >= 5;
  },
  descripcion: (agente) => {
    const tasa = Math.round((agente.abandonos / agente.total_llamadas) * 100);
    return `Tasa de abandono alta (${tasa}%) en ultimas 24h`;
  },
  datos: (agente) => ({
    tasa_abandono: agente.abandonos / agente.total_llamadas,
    abandonos: agente.abandonos,
    total_llamadas: agente.total_llamadas,
    umbral: 0.20
  }),
  accion_requerida: 'Revisar grabaciones y dar feedback sobre rapport'
};
```

### 2.4 AGENTE_SIN_VALIDACION

```javascript
const regla = {
  codigo: 'AGENTE_SIN_VALIDACION',
  tipo: 'agente',
  severidad: 'alta',
  condicion: (agente) => {
    const tasaValidacion = agente.validaciones_explicitas / agente.total_llamadas;
    return tasaValidacion < 0.15 && agente.total_llamadas >= 5;
  },
  descripcion: (agente) => {
    const tasa = Math.round((agente.validaciones_explicitas / agente.total_llamadas) * 100);
    return `Tasa de validacion explicita muy baja (${tasa}%) en ultimas 24h`;
  },
  datos: (agente) => ({
    tasa_validacion: agente.validaciones_explicitas / agente.total_llamadas,
    validaciones: agente.validaciones_explicitas,
    total_llamadas: agente.total_llamadas,
    umbral: 0.15
  }),
  accion_requerida: 'Reforzar tecnicas de cierre y validacion'
};
```

### 2.5 AGENTE_CAIDA_SCORE

```javascript
const regla = {
  codigo: 'AGENTE_CAIDA_SCORE',
  tipo: 'agente',
  severidad: 'media',
  condicion: (agente, comparativa) => {
    if (!comparativa || !comparativa.score_ayer) return false;
    const caida = ((comparativa.score_ayer - agente.score_promedio) / comparativa.score_ayer) * 100;
    return caida > 15;
  },
  descripcion: (agente, comparativa) => {
    const caida = Math.round(((comparativa.score_ayer - agente.score_promedio) / comparativa.score_ayer) * 100);
    return `Caida de score del ${caida}% vs dia anterior`;
  },
  datos: (agente, comparativa) => ({
    score_hoy: Math.round(agente.score_promedio),
    score_ayer: Math.round(comparativa.score_ayer),
    caida_porcentaje: ((comparativa.score_ayer - agente.score_promedio) / comparativa.score_ayer) * 100
  }),
  accion_requerida: 'Investigar causa de la caida'
};
```

### 2.6 AGENTE_PROBABILIDAD_BAJA

```javascript
const regla = {
  codigo: 'AGENTE_PROBABILIDAD_BAJA',
  tipo: 'agente',
  severidad: 'media',
  condicion: (agente) => agente.prob_promedio < 30 && agente.total_llamadas >= 5,
  descripcion: (agente) => 
    `Probabilidad de cumplimiento promedio muy baja (${Math.round(agente.prob_promedio)}%)`,
  datos: (agente) => ({
    probabilidad_promedio: Math.round(agente.prob_promedio),
    total_llamadas: agente.total_llamadas,
    umbral: 30
  }),
  accion_requerida: 'Evaluar calidad de compromisos obtenidos'
};
```

---

## 3. Reglas de Patron

### 3.1 PATRON_LLAMADAS_CRITICAS

```javascript
const regla = {
  codigo: 'PATRON_LLAMADAS_CRITICAS',
  tipo: 'patron',
  severidad: 'alta',
  condicion: (agente) => agente.llamadas_criticas >= 5,
  descripcion: (agente) => 
    `${agente.llamadas_criticas} llamadas con score critico (<40) en 24h`,
  datos: (agente) => ({
    llamadas_criticas: agente.llamadas_criticas,
    total_llamadas: agente.total_llamadas,
    porcentaje: (agente.llamadas_criticas / agente.total_llamadas) * 100
  }),
  accion_requerida: 'Revision urgente de casos criticos'
};
```

### 3.2 PATRON_ABANDONOS_CONSECUTIVOS

```javascript
// Esta regla requiere analizar la secuencia de llamadas
const regla = {
  codigo: 'PATRON_ABANDONOS_CONSECUTIVOS',
  tipo: 'patron',
  severidad: 'alta',
  condicion: (agente) => {
    // Analizar scores_ordenados para encontrar abandonos consecutivos
    const llamadas = agente.llamadas_detalle; // Necesita query adicional
    let maxConsecutivos = 0;
    let consecutivos = 0;
    
    for (const llamada of llamadas) {
      if (llamada.hubo_abandono) {
        consecutivos++;
        maxConsecutivos = Math.max(maxConsecutivos, consecutivos);
      } else {
        consecutivos = 0;
      }
    }
    
    return maxConsecutivos >= 3;
  },
  descripcion: (agente, consecutivos) => 
    `${consecutivos} abandonos consecutivos detectados`,
  datos: (agente, consecutivos) => ({
    abandonos_consecutivos: consecutivos,
    total_abandonos: agente.abandonos
  }),
  accion_requerida: 'Intervencion inmediata - posible problema sistematico'
};
```

---

## 4. Reglas Sistemicas

### 4.1 SISTEMA_TASA_ABANDONO

```javascript
const regla = {
  codigo: 'SISTEMA_TASA_ABANDONO',
  tipo: 'sistemica',
  severidad: 'critica',
  condicion: (metricas) => {
    const tasaAbandono = metricas.abandonos / metricas.total_llamadas;
    return tasaAbandono > 0.25 && metricas.total_llamadas >= 50;
  },
  descripcion: (metricas) => {
    const tasa = Math.round((metricas.abandonos / metricas.total_llamadas) * 100);
    return `Tasa de abandono global del ${tasa}% en ultimas 24h`;
  },
  datos: (metricas) => ({
    tasa_abandono: metricas.abandonos / metricas.total_llamadas,
    abandonos: metricas.abandonos,
    total_llamadas: metricas.total_llamadas,
    umbral: 0.25
  }),
  accion_requerida: 'Revision de operaciones - posible problema sistemico'
};
```

### 4.2 SISTEMA_CAIDA_SCORES

```javascript
const regla = {
  codigo: 'SISTEMA_CAIDA_SCORES',
  tipo: 'sistemica',
  severidad: 'alta',
  condicion: (metricas) => {
    if (!metricas.score_anterior) return false;
    const caida = ((metricas.score_anterior - metricas.score_promedio) / metricas.score_anterior) * 100;
    return caida > 10;
  },
  descripcion: (metricas) => {
    const caida = Math.round(((metricas.score_anterior - metricas.score_promedio) / metricas.score_anterior) * 100);
    return `Score promedio global cayo ${caida}% vs dia anterior`;
  },
  datos: (metricas) => ({
    score_hoy: Math.round(metricas.score_promedio),
    score_ayer: Math.round(metricas.score_anterior),
    caida_porcentaje: ((metricas.score_anterior - metricas.score_promedio) / metricas.score_anterior) * 100
  }),
  accion_requerida: 'Investigar causa de la caida global'
};
```

### 4.3 SISTEMA_VALIDACION_BAJA

```javascript
const regla = {
  codigo: 'SISTEMA_VALIDACION_BAJA',
  tipo: 'sistemica',
  severidad: 'alta',
  condicion: (metricas) => {
    const tasaValidacion = metricas.validaciones_explicitas / metricas.total_llamadas;
    return tasaValidacion < 0.25 && metricas.total_llamadas >= 50;
  },
  descripcion: (metricas) => {
    const tasa = Math.round((metricas.validaciones_explicitas / metricas.total_llamadas) * 100);
    return `Tasa de validacion explicita global del ${tasa}%`;
  },
  datos: (metricas) => ({
    tasa_validacion: metricas.validaciones_explicitas / metricas.total_llamadas,
    validaciones: metricas.validaciones_explicitas,
    total_llamadas: metricas.total_llamadas,
    umbral: 0.25
  }),
  accion_requerida: 'Refuerzo de script de cierre a todos los agentes'
};
```

### 4.4 SISTEMA_VOLUMEN_BAJO

```javascript
const regla = {
  codigo: 'SISTEMA_VOLUMEN_BAJO',
  tipo: 'sistemica',
  severidad: 'media',
  condicion: (metricas) => {
    if (!metricas.llamadas_anterior) return false;
    const porcentaje = (metricas.total_llamadas / metricas.llamadas_anterior) * 100;
    return porcentaje < 70;
  },
  descripcion: (metricas) => {
    const porcentaje = Math.round((metricas.total_llamadas / metricas.llamadas_anterior) * 100);
    return `Volumen de llamadas al ${porcentaje}% vs dia anterior`;
  },
  datos: (metricas) => ({
    llamadas_hoy: metricas.total_llamadas,
    llamadas_ayer: metricas.llamadas_anterior,
    porcentaje: (metricas.total_llamadas / metricas.llamadas_anterior) * 100
  }),
  accion_requerida: 'Verificar problemas de personal o tecnicos'
};
```

---

## 5. Flujo de Evaluacion

```javascript
async function ejecutarDetector() {
  const alertas = [];
  const fecha = new Date().toISOString().split('T')[0];
  
  // 1. Obtener metricas globales
  const metricasGlobales = await obtenerMetricasGlobales();
  
  // 2. Obtener metricas por agente
  const metricasAgentes = await obtenerMetricasPorAgente();
  const comparativasAgentes = await obtenerComparativasAgentes();
  
  // 3. Evaluar reglas por agente
  for (const agente of metricasAgentes) {
    const comparativa = comparativasAgentes.find(c => c.agente_id === agente.agente_id);
    
    for (const regla of reglasAgente) {
      if (regla.condicion(agente, comparativa)) {
        alertas.push({
          tipo: regla.tipo,
          severidad: regla.severidad,
          codigo: regla.codigo,
          descripcion: regla.descripcion(agente, comparativa),
          agente_id: agente.agente_id,
          agente_nombre: agente.agente_nombre,
          equipo: agente.equipo,
          datos: regla.datos(agente, comparativa),
          accion_requerida: regla.accion_requerida,
          fecha_periodo: fecha
        });
      }
    }
    
    // Evaluar reglas de patron
    for (const regla of reglasPatron) {
      if (regla.condicion(agente)) {
        alertas.push({
          tipo: regla.tipo,
          severidad: regla.severidad,
          codigo: regla.codigo,
          descripcion: regla.descripcion(agente),
          agente_id: agente.agente_id,
          agente_nombre: agente.agente_nombre,
          datos: regla.datos(agente),
          accion_requerida: regla.accion_requerida,
          fecha_periodo: fecha
        });
      }
    }
  }
  
  // 4. Evaluar reglas sistemicas
  for (const regla of reglasSistemicas) {
    if (regla.condicion(metricasGlobales)) {
      alertas.push({
        tipo: regla.tipo,
        severidad: regla.severidad,
        codigo: regla.codigo,
        descripcion: regla.descripcion(metricasGlobales),
        agente_id: null,
        agente_nombre: null,
        datos: regla.datos(metricasGlobales),
        accion_requerida: regla.accion_requerida,
        fecha_periodo: fecha
      });
    }
  }
  
  // 5. Filtrar duplicados (alertas similares en ultimos 3 dias)
  const alertasFiltradas = await filtrarDuplicados(alertas);
  
  // 6. Persistir y notificar
  await persistirAlertas(alertasFiltradas);
  await generarResumenYNotificar(alertasFiltradas, metricasGlobales);
  
  return alertasFiltradas;
}
```

---

## 6. Configuracion de Umbrales

```json
{
  "periodo_analisis_horas": 24,
  "minimo_llamadas_agente": 3,
  "minimo_llamadas_sistema": 50,
  
  "umbrales_agente": {
    "score_critico": 40,
    "score_bajo": 55,
    "abandono_alto": 0.20,
    "validacion_minima": 0.15,
    "caida_score": 0.15,
    "probabilidad_baja": 30
  },
  
  "umbrales_patron": {
    "llamadas_criticas_minimo": 5,
    "abandonos_consecutivos_minimo": 3
  },
  
  "umbrales_sistema": {
    "abandono_critico": 0.25,
    "caida_score": 0.10,
    "validacion_minima": 0.25,
    "volumen_minimo": 0.70
  },
  
  "deduplicacion": {
    "ventana_dias": 3
  }
}
```
