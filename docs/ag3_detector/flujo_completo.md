# Agente Detector - Flujo Completo (Modo Periodico 24h)

## Resumen del Flujo

```
Cron 07:00 AM 
    -> CALL ejecutar_detector() [Supabase Function]
    -> Filtrar alertas nuevas (es_nueva = true)
    -> INSERT INTO alertas_anomalias [SQL directo]
    -> SELECT obtener_metricas_periodo() [Supabase Function]
    -> Generar resumen
    -> Notificar (Slack/Email)
```

---

## Configuracion del Cron

```javascript
// Saturn Studio - Trigger Cron
{
  "trigger": "cron",
  "schedule": "0 7 * * *",  // Todos los dias a las 07:00 AM
  "timezone": "America/Santiago"
}
```

---

## Funciones de Supabase Disponibles

Las funciones estan en `supabase/functions/detector_functions.sql`

| Funcion | Descripcion | Uso |
|---------|-------------|-----|
| `evaluar_alertas_agente(nombre, horas)` | Evalua alertas de un agente | Por agente |
| `evaluar_alertas_todos_agentes(horas)` | Evalua todos los agentes | Batch |
| `evaluar_alertas_sistemicas(horas)` | Evalua alertas globales | Sistema |
| `ejecutar_detector(horas, dias_dedup)` | Completo con deduplicacion | Principal |
| `obtener_metricas_periodo(horas)` | Metricas para resumen | Resumen |

---

## PASO 1: Ejecutar Detector (Supabase Function)

**Query SQL en Saturn Studio:**

```sql
-- Obtener todas las alertas nuevas (no duplicadas)
SELECT 
    tipo,
    severidad,
    codigo,
    descripcion,
    agente_id,
    agente_nombre,
    equipo,
    datos,
    accion_requerida
FROM ejecutar_detector(24, 3)
WHERE es_nueva = true;
```

**Resultado esperado:**
```json
[
  {
    "tipo": "agente",
    "severidad": "critica",
    "codigo": "AGENTE_SCORE_CRITICO",
    "descripcion": "Score promedio critico (36) en ultimas 24 horas",
    "agente_id": "uuid",
    "agente_nombre": "Pedro Ruiz",
    "equipo": "Equipo Sur",
    "datos": {"score_promedio": 36, "total_llamadas": 20},
    "accion_requerida": "Intervencion inmediata - coaching urgente"
  }
]
```

---

## PASO 2: Persistir Alertas (SQL Directo)

**Query SQL en Saturn Studio:**

```sql
-- Insertar alertas detectadas
INSERT INTO alertas_anomalias (
    tipo,
    severidad,
    codigo,
    descripcion,
    datos_soporte,
    accion_recomendada,
    agentes_relacionados,
    estado,
    notificacion_enviada
)
SELECT 
    tipo::tipo_alerta,
    severidad::severidad_alerta,
    codigo,
    descripcion,
    datos,
    jsonb_build_object(
        'accion', accion_requerida,
        'urgencia', CASE severidad WHEN 'critica' THEN 'inmediato' WHEN 'alta' THEN 'hoy' ELSE 'esta_semana' END,
        'destinatario', COALESCE(agente_nombre, 'supervisor'),
        'deadline', NULL
    ),
    CASE WHEN agente_id IS NOT NULL THEN ARRAY[agente_id] ELSE NULL END,
    'nueva'::estado_alerta,
    false
FROM ejecutar_detector(24, 3)
WHERE es_nueva = true
RETURNING alerta_id, tipo, severidad, codigo, descripcion;
```

**Alternativa - INSERT con valores especificos:**

```sql
-- Si prefieres insertar los valores desde Saturn Studio despues de procesarlos
INSERT INTO alertas_anomalias (
    tipo, severidad, codigo, descripcion, 
    datos_soporte, accion_recomendada, agentes_relacionados,
    estado, notificacion_enviada
) VALUES 
    ('individual'::tipo_alerta, 'critica'::severidad_alerta, 'AGENTE_SCORE_CRITICO', 
     'Score promedio critico (36) en ultimas 24 horas',
     '{"score_promedio": 36, "total_llamadas": 20}'::JSONB,
     '{"accion": "Intervencion inmediata - coaching urgente", "urgencia": "inmediato", "destinatario": "Pedro Ruiz"}'::JSONB,
     ARRAY['44444444-4444-4444-4444-444444444444'::UUID],
     'nueva'::estado_alerta, false),
    ('individual'::tipo_alerta, 'alta'::severidad_alerta, 'AGENTE_ABANDONO_ALTO',
     'Tasa de abandono alta (30%) en ultimas 24 horas',
     '{"tasa_abandono": 0.30, "abandonos": 6}'::JSONB,
     '{"accion": "Revisar grabaciones y dar feedback", "urgencia": "hoy", "destinatario": "Pedro Ruiz"}'::JSONB,
     ARRAY['44444444-4444-4444-4444-444444444444'::UUID],
     'nueva'::estado_alerta, false)
RETURNING alerta_id;
```

---

## PASO 3: Obtener Metricas para Resumen (Supabase Function)

**Query SQL en Saturn Studio:**

```sql
SELECT * FROM obtener_metricas_periodo(24);
```

**Resultado esperado:**
```json
{
  "total_llamadas": 450,
  "score_promedio": 72.5,
  "tasa_abandono": 0.08,
  "tasa_validacion": 0.39,
  "prob_cumplimiento_promedio": 58.3,
  "llamadas_anterior": 420,
  "score_anterior": 74.2,
  "cambio_llamadas_porcentaje": 7.1,
  "cambio_score": -1.7
}
```

---

## PASO 4: Contar Alertas por Severidad

**Query SQL en Saturn Studio:**

```sql
-- Contar alertas insertadas hoy por severidad
SELECT 
    severidad,
    COUNT(*) as cantidad
FROM alertas_anomalias
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY severidad
ORDER BY 
    CASE severidad 
        WHEN 'critica' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        ELSE 4 
    END;
```

---

## PASO 5: Obtener Lista de Agentes con Alertas

**Query SQL en Saturn Studio:**

```sql
-- Agentes con alertas de hoy
SELECT 
    a.nombre as agente_nombre,
    a.equipo,
    ARRAY_AGG(aa.codigo ORDER BY 
        CASE aa.severidad 
            WHEN 'critica' THEN 1 
            WHEN 'alta' THEN 2 
            ELSE 3 
        END
    ) as alertas,
    COUNT(*) as cantidad_alertas
FROM alertas_anomalias aa
JOIN agentes a ON a.agente_id = aa.agentes_relacionados[1]
WHERE DATE(aa.created_at) = CURRENT_DATE
  AND aa.agentes_relacionados IS NOT NULL
GROUP BY a.nombre, a.equipo
ORDER BY cantidad_alertas DESC;
```

---

## Flujo Completo en Saturn Studio

### Nodo 1: Ejecutar Detector y Persistir

```sql
-- Un solo query que ejecuta el detector e inserta las alertas nuevas
INSERT INTO alertas_anomalias (
    tipo, severidad, codigo, descripcion, 
    datos_soporte, accion_recomendada, agentes_relacionados,
    estado, notificacion_enviada
)
SELECT 
    tipo::tipo_alerta,
    severidad::severidad_alerta,
    codigo,
    descripcion,
    datos,
    jsonb_build_object(
        'accion', accion_requerida,
        'urgencia', CASE severidad WHEN 'critica' THEN 'inmediato' WHEN 'alta' THEN 'hoy' ELSE 'esta_semana' END,
        'destinatario', COALESCE(agente_nombre, 'supervisor'),
        'deadline', NULL
    ),
    CASE WHEN agente_id IS NOT NULL THEN ARRAY[agente_id] ELSE NULL END,
    'nueva'::estado_alerta,
    false
FROM ejecutar_detector(24, 3)
WHERE es_nueva = true
RETURNING 
    alerta_id, tipo, severidad, codigo, descripcion;
```

### Nodo 2: Obtener Resumen

```sql
-- Obtener metricas y conteos para el resumen
WITH metricas AS (
    SELECT * FROM obtener_metricas_periodo(24)
),
conteo_alertas AS (
    SELECT 
        COUNT(*) FILTER (WHERE severidad = 'critica') as criticas,
        COUNT(*) FILTER (WHERE severidad = 'alta') as altas,
        COUNT(*) FILTER (WHERE severidad = 'media') as medias,
        COUNT(*) FILTER (WHERE severidad = 'baja') as bajas,
        COUNT(*) as total
    FROM alertas_anomalias
    WHERE DATE(created_at) = CURRENT_DATE
),
agentes_alertas AS (
    SELECT 
        a.nombre as agente_nombre,
        ARRAY_AGG(aa.codigo) as alertas
    FROM alertas_anomalias aa
    JOIN agentes a ON a.agente_id = aa.agentes_relacionados[1]
    WHERE DATE(aa.created_at) = CURRENT_DATE
      AND aa.agentes_relacionados IS NOT NULL
    GROUP BY a.nombre
)
SELECT 
    m.*,
    c.criticas,
    c.altas,
    c.medias,
    c.bajas,
    c.total as total_alertas,
    (SELECT JSONB_AGG(jsonb_build_object(
        'nombre', agente_nombre,
        'alertas', alertas
    )) FROM agentes_alertas) as agentes_con_alertas
FROM metricas m, conteo_alertas c;
```

### Nodo 3: Preparar Datos para Notificacion (Opcional)

```sql
-- Este paso es opcional si no tienes tabla de notificaciones
-- Prepara los datos para enviar a Slack/Email
SELECT 
    (SELECT COUNT(*) FROM alertas_anomalias WHERE DATE(created_at) = CURRENT_DATE) as total_alertas,
    (SELECT COUNT(*) FROM alertas_anomalias WHERE DATE(created_at) = CURRENT_DATE AND severidad = 'critica') as criticas,
    (SELECT COUNT(*) FROM alertas_anomalias WHERE DATE(created_at) = CURRENT_DATE AND severidad = 'alta') as altas,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') as fecha;
```

### Nodo 4: Notificar Slack (Condicional)

Solo si hay alertas criticas o altas:

```javascript
// Saturn Studio - Nodo HTTP Request
const alertas = resultadoNodo1;
const resumen = resultadoNodo2;

// Verificar si hay alertas criticas o altas
const tieneCriticas = resumen.criticas > 0;
const tieneAltas = resumen.altas > 0;

if (tieneCriticas || tieneAltas) {
    const emoji = tieneCriticas ? ':rotating_light:' : ':warning:';
    
    const mensaje = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} Reporte de Alertas - ${resumen.fecha}`,
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Llamadas:* ${resumen.total_llamadas}` },
                    { type: 'mrkdwn', text: `*Score:* ${resumen.score_promedio} (${resumen.cambio_score > 0 ? '+' : ''}${resumen.cambio_score})` }
                ]
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Alertas:* :red_circle: ${resumen.criticas} criticas | :orange_circle: ${resumen.altas} altas | :yellow_circle: ${resumen.medias} medias`
                }
            }
        ]
    };
    
    // Agregar agentes con alertas
    if (resumen.agentes_con_alertas && resumen.agentes_con_alertas.length > 0) {
        const listaAgentes = resumen.agentes_con_alertas
            .map(a => `- ${a.nombre}: ${a.alertas.join(', ')}`)
            .join('\n');
        
        mensaje.blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: `*Agentes:*\n${listaAgentes}` }
        });
    }
    
    // Enviar a Slack
    await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensaje)
    });
}
```

---

## Uso de Funciones Individuales

### Evaluar un agente especifico

```sql
-- Evaluar alertas solo de Pedro Ruiz
SELECT * FROM evaluar_alertas_agente('Pedro Ruiz', 24);
```

### Usar las vistas predefinidas

```sql
-- Ver alertas de agentes (ultimas 24h)
SELECT * FROM v_alertas_agentes_24h;

-- Ver alertas sistemicas (ultimas 24h)
SELECT * FROM v_alertas_sistemicas_24h;
```

### Evaluar con periodo personalizado

```sql
-- Evaluar ultimas 48 horas con deduplicacion de 7 dias
SELECT * FROM ejecutar_detector(48, 7) WHERE es_nueva = true;
```

---

## Tiempos Esperados

| Paso | Tiempo |
|------|--------|
| ejecutar_detector() | ~2-3s |
| INSERT alertas | ~200ms |
| obtener_metricas_periodo() | ~500ms |
| Queries de resumen | ~300ms |
| Notificaciones | ~2s |
| **Total** | **~5-6s** |

---

## Diagrama de Flujo Saturn Studio

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON 07:00 AM                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 1: SQL Query                                          │
│  INSERT INTO alertas_anomalias                              │
│  SELECT FROM ejecutar_detector(24, 3) WHERE es_nueva        │
│  RETURNING alerta_id, tipo, severidad, codigo...            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 2: SQL Query                                          │
│  SELECT metricas + conteos + agentes_con_alertas            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 3: Condicional                                        │
│  IF criticas > 0 OR altas > 0                               │
└────────┬────────────────────────────────┬───────────────────┘
         │ SI                             │ NO
         ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐
│  NODO 4: HTTP       │          │  FIN                │
│  POST Slack         │          └─────────────────────┘
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  NODO 5: HTTP       │
│  POST Email (opc)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  FIN                │
└─────────────────────┘
```
