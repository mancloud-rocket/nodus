# Agente Coach - Flujo Completo E2E (SQL + LLM)

## Resumen del Flujo

```
Cron 08:00 AM
    -> SELECT obtener_agentes_para_coaching() [Supabase Function]
    -> Para cada agente:
       -> SELECT obtener_datos_coaching(agente_id) [Supabase Function]
       -> Enviar a LLM (Claude Opus)
       -> INSERT coaching_reports [SQL directo]
    -> Notificar (Slack/Email)
```

---

## Configuracion del Cron

```javascript
// Saturn Studio - Trigger Cron
{
  "trigger": "cron",
  "schedule": "0 8 * * *",  // Todos los dias a las 08:00
  "timezone": "America/Santiago"
}
```

---

## Funciones de Supabase Disponibles

Las funciones estan en `supabase/functions/coach_functions.sql`

| Funcion | Descripcion | Uso |
|---------|-------------|-----|
| `obtener_agentes_para_coaching(dias, min)` | Lista agentes listos | Paso 1 |
| `obtener_metricas_agente(id, dias)` | Metricas del periodo | Individual |
| `obtener_benchmark_equipo(equipo, dias)` | Promedio del equipo | Comparativa |
| `obtener_ranking_agente(id, equipo, dias)` | Posicion en equipo | Comparativa |
| `obtener_reporte_anterior(id)` | Ultimo reporte | Tendencia |
| `obtener_alertas_agente(id, dias)` | Alertas recientes | Contexto |
| `obtener_muestra_llamadas(id, dias, n)` | Mejores/peores | LLM |
| `obtener_datos_coaching(id, dias)` | **TODO en JSON** | **Principal** |

---

## PASO 1: Obtener Agentes para Coaching

**Query SQL en Saturn Studio:**

```sql
-- Obtener lista de agentes listos para coaching
SELECT * FROM obtener_agentes_para_coaching(7, 5);
```

**Resultado esperado:**
```json
[
  {
    "agente_id": "11111111-1111-1111-1111-111111111111",
    "nombre": "Maria Lopez",
    "equipo": "Equipo Norte",
    "total_llamadas": 12,
    "score_promedio": 82.3,
    "tiene_reporte_anterior": true
  },
  {
    "agente_id": "22222222-2222-2222-2222-222222222222",
    "nombre": "Carlos Mendez",
    "equipo": "Equipo Norte",
    "total_llamadas": 10,
    "score_promedio": 65.5,
    "tiene_reporte_anterior": true
  }
]
```

---

## PASO 2: Para Cada Agente - Obtener Datos Completos

**Query SQL en Saturn Studio:**

```sql
-- Obtener TODOS los datos necesarios para el LLM en un solo JSON
SELECT obtener_datos_coaching('11111111-1111-1111-1111-111111111111', 7);
```

**Resultado esperado:**
```json
{
  "agente": {
    "agente_id": "11111111-1111-1111-1111-111111111111",
    "nombre": "Maria Lopez",
    "email": "maria.lopez@empresa.com",
    "equipo": "Equipo Norte",
    "fecha_ingreso": "2023-01-15",
    "dias_activo": 1116
  },
  "metricas": {
    "periodo_dias": 7,
    "fecha_inicio": "2026-02-02",
    "fecha_fin": "2026-02-03",
    "total_llamadas": 12,
    "score_promedio": 82.3,
    "score_min": 76,
    "score_max": 90,
    "score_contacto_promedio": 80.2,
    "score_compromiso_promedio": 84.4,
    "tasa_validacion_explicita": 1.0,
    "tasa_abandono": 0.0,
    "prob_cumplimiento_promedio": 75.6,
    "distribucion": {
      "excelente_80_100": 8,
      "bueno_60_79": 4,
      "regular_40_59": 0,
      "bajo_0_39": 0
    }
  },
  "benchmark_equipo": {
    "equipo": "Equipo Norte",
    "total_agentes": 2,
    "total_llamadas": 22,
    "score_promedio": 73.9,
    "score_top": 82.3,
    "tasa_validacion_promedio": 0.59,
    "prob_cumplimiento_promedio": 63.1,
    "tasa_abandono_promedio": 0.05
  },
  "ranking": {
    "posicion": 1,
    "total_agentes": 2,
    "percentil": 50,
    "score_agente": 82.3,
    "score_mejor": 82.3,
    "score_promedio_equipo": 73.9,
    "diferencia_vs_mejor": 0,
    "diferencia_vs_promedio": 8.4
  },
  "reporte_anterior": {
    "reporte_id": "d0000001-0000-0000-0000-000000000001",
    "fecha": "2026-01-28",
    "score_anterior": 78,
    "tasa_validacion_anterior": 0.85,
    "objetivo_cumplido": true,
    "objetivo_semana": "Mantener score sobre 80 y mejorar mencion de consecuencias",
    "gap_area": "Consecuencias del impago"
  },
  "tendencia": {
    "score_cambio": 4.3,
    "direccion": "mejorando"
  },
  "alertas": [],
  "muestra_llamadas": [
    {"tipo": "mejor", "score_total": 90, "validacion_tipo": "explicita"},
    {"tipo": "mejor", "score_total": 88, "validacion_tipo": "explicita"},
    {"tipo": "mejor", "score_total": 86, "validacion_tipo": "explicita"},
    {"tipo": "peor", "score_total": 76, "validacion_tipo": "explicita"},
    {"tipo": "peor", "score_total": 78, "validacion_tipo": "explicita"},
    {"tipo": "peor", "score_total": 79, "validacion_tipo": "explicita"}
  ]
}
```

---

## PASO 3: Enviar al LLM (Claude Opus) - Genera JSON con Query

El LLM recibe los datos y genera un **JSON con la query SQL** dentro.

**Prompt completo:**

```
# GENERADOR DE SQL - COACHING REPORT

## TU TAREA
Analiza los datos del agente y genera un JSON con una propiedad "query" que contenga la query SQL completa para insertar en coaching_reports.

## DATOS DEL AGENTE
{DATOS_COACHING_JSON}

## FECHA DE HOY
{FECHA_HOY}

## FORMATO DE RESPUESTA
Responde UNICAMENTE con un JSON valido en este formato exacto:
{"query":"INSERT INTO coaching_reports (...) VALUES (...) RETURNING reporte_id;"}

## REGLAS CRITICAS
1. Responde SOLO con el JSON - nada mas (sin explicaciones, sin markdown, sin ```)
2. La query debe ser una sola linea dentro del valor "query"
3. Todos los campos JSONB en el SQL deben terminar con ::JSONB
4. Las fechas en el SQL usan comillas simples: '2026-02-04'
5. Los UUIDs en el SQL usan comillas simples: 'uuid-aqui'
6. Los JSONB dentro del SQL usan comilla simple afuera, dobles adentro: '{"key":"value"}'::JSONB
7. Para que el JSON de respuesta sea valido, escapa las comillas dobles internas con \"
8. El JSON de respuesta debe ser parseable por JSON.parse()

## ESTRUCTURA DE LA QUERY SQL (dentro del JSON)
INSERT INTO coaching_reports (agente_id, fecha_reporte, periodo_inicio, periodo_fin, total_llamadas_analizadas, metricas_periodo, comparativa_equipo, fortalezas, gap_critico, plan_mejora, progreso_vs_anterior, generado_por, modelo_usado) VALUES (
    agente_id,           -- UUID del agente (viene en datos.agente.agente_id)
    fecha_reporte,       -- Usa FECHA_HOY
    periodo_inicio,      -- Viene en datos.metricas.fecha_inicio
    periodo_fin,         -- Viene en datos.metricas.fecha_fin
    total_llamadas,      -- Viene en datos.metricas.total_llamadas (INTEGER)
    metricas_periodo,    -- JSONB con: score_promedio, score_min, score_max, tasa_validacion, tasa_abandono, probabilidad_cumplimiento_promedio
    comparativa_equipo,  -- JSONB con: score_equipo, validacion_equipo, ranking, total_agentes, percentil, diferencia_vs_promedio
    fortalezas,          -- JSONB array: TU ANALISIS
    gap_critico,         -- JSONB objeto: TU ANALISIS
    plan_mejora,         -- JSONB objeto: TU ANALISIS
    progreso_vs_anterior,-- JSONB objeto: TU ANALISIS
    generado_por,        -- Siempre: ''agente_coach''
    modelo_usado         -- Siempre: ''claude-opus-4-5-20250514''
) RETURNING reporte_id;

## CAMPOS QUE DEBES ANALIZAR Y GENERAR

### fortalezas (array JSONB)
Identifica 1-3 fortalezas basandote en:
- Score alto (>= 75)
- Tasa validacion alta (>= 0.5)
- Bajo abandono (<= 0.1)
- Mejora vs periodo anterior
- Posicion en ranking
Formato: [{"area": "string", "descripcion": "string", "evidencia": "dato concreto", "impacto": "alto|medio|bajo"}]

### gap_critico (objeto JSONB)
Identifica EL gap mas importante basandote en:
- Score bajo (< 60)
- Tasa validacion baja (< 0.3)
- Alto abandono (> 0.15)
- Empeoramiento vs anterior
- Alertas recientes
Si no hay gap critico, usa: {"area": "Ninguno critico", "descripcion": "Mantener nivel actual", "impacto": "bajo", "frecuencia": "ocasional"}
Formato: {"area": "string", "descripcion": "string", "impacto": "critico|alto|medio|bajo", "frecuencia": "constante|frecuente|ocasional"}

### plan_mejora (objeto JSONB)
Genera un plan ESPECIFICO y MEDIBLE:
- objetivo_semana: Que debe lograr esta semana (especifico)
- meta_cuantitativa: Numero concreto (ej: "Score >= 70", "Validacion >= 40%")
- acciones: 2-4 acciones concretas
- recursos_sugeridos: 0-2 recursos (videos, scripts, sesiones)
Formato: {"objetivo_semana": "string", "meta_cuantitativa": "string", "acciones": ["string"], "recursos_sugeridos": ["string"]}

### progreso_vs_anterior (objeto JSONB)
Compara con reporte_anterior si existe:
- score_cambio: diferencia numerica (puede ser negativo)
- validacion_cambio: diferencia numerica
- objetivo_anterior_cumplido: true/false basado en datos
- notas: explicacion breve
Formato: {"score_cambio": number, "validacion_cambio": number, "objetivo_anterior_cumplido": true|false, "notas": "string"}

## EJEMPLO DE OUTPUT CORRECTO

(Nota: las \" son comillas dobles escapadas para que el JSON sea valido)

```json
{
  "query": "INSERT INTO coaching_reports (agente_id, fecha_reporte, periodo_inicio, periodo_fin, total_llamadas_analizadas, metricas_periodo, comparativa_equipo, fortalezas, gap_critico, plan_mejora, progreso_vs_anterior, generado_por, modelo_usado) VALUES ('11111111-1111-1111-1111-111111111111', '2026-02-04', '2026-02-02', '2026-02-03', 12, '{\"score_promedio\":82.3,\"tasa_validacion\":1.0}'::JSONB, '{\"score_equipo\":73.9,\"ranking\":1}'::JSONB, '[{\"area\":\"Validacion\",\"impacto\":\"alto\"}]'::JSONB, '{\"area\":\"Ninguno critico\"}'::JSONB, '{\"objetivo_semana\":\"Mantener score\"}'::JSONB, '{\"score_cambio\":4.3}'::JSONB, 'agente_coach', 'claude-opus-4-5-20250514') RETURNING reporte_id;"
}
```

Cuando Saturn parsea ese JSON y accede a `.query`, obtiene el SQL limpio:

```sql
INSERT INTO coaching_reports (...) VALUES ('...', '{"score_promedio":82.3}'::JSONB, ...) RETURNING reporte_id;
```

## IMPORTANTE
- Responde SOLO con el JSON {"query":"..."}
- Las comillas dobles dentro del SQL se escapan automaticamente con \"
- NO incluyas explicaciones, comentarios ni markdown fuera del JSON
- El JSON debe ser parseable con JSON.parse()
```

**En Saturn Studio:**

```javascript
// Nodo: HTTP Request a Claude
const datosCoaching = resultadoPaso2;
const fechaHoy = new Date().toISOString().split('T')[0]; // '2026-02-04'

const prompt = `# GENERADOR DE SQL - COACHING REPORT
... (usar el prompt completo de arriba, reemplazando {DATOS_COACHING_JSON} y {FECHA_HOY})
`;

const response = await claudeAPI(prompt);
const jsonResponse = JSON.parse(response.content[0].text.trim());
// jsonResponse = { "query": "INSERT INTO coaching_reports ..." }
```

---

## PASO 4: Ejecutar SQL desde el JSON

El LLM devuelve `{"query": "INSERT..."}`, accedes a `.query` y ejecutas:

**En Saturn Studio (Nodo SQL):**

```sql
{var_aiagent_analisis.query}
```

**O en un nodo de codigo:**

```javascript
// El LLM devolvio JSON con la query
const resultado = var_aiagent_analisis;  // {"query": "INSERT..."}
const sql = resultado.query;

// Ejecutar
const result = await ejecutarSQL(sql);
```

**Ventaja:** Saturn puede parsear el JSON sin problemas, y accedes a `.query` para obtener el SQL limpio.

---

## Ejemplo Completo

**Input al LLM (datos de Maria Lopez):**
```json
{
  "agente": {"agente_id": "11111111-1111-1111-1111-111111111111", "nombre": "Maria Lopez"},
  "metricas": {"fecha_inicio": "2026-02-02", "fecha_fin": "2026-02-03", "total_llamadas": 12, "score_promedio": 82.3},
  "ranking": {"posicion": 1, "percentil": 50, "diferencia_vs_promedio": 8.4},
  "reporte_anterior": {"score_anterior": 78, "objetivo_cumplido": true},
  "tendencia": {"score_cambio": 4.3, "direccion": "mejorando"}
}
```

**Output del LLM (JSON con query):**
```json
{"query":"INSERT INTO coaching_reports (agente_id, fecha_reporte, periodo_inicio, periodo_fin, total_llamadas_analizadas, metricas_periodo, comparativa_equipo, fortalezas, gap_critico, plan_mejora, progreso_vs_anterior, generado_por, modelo_usado) VALUES ('11111111-1111-1111-1111-111111111111', '2026-02-04', '2026-02-02', '2026-02-03', 12, '{\"score_promedio\":82.3,\"tasa_validacion\":1.0}'::JSONB, '{\"score_equipo\":73.9,\"ranking\":1}'::JSONB, '[{\"area\":\"Validacion\",\"impacto\":\"alto\"}]'::JSONB, '{\"area\":\"Ninguno critico\"}'::JSONB, '{\"objetivo_semana\":\"Mantener score\"}'::JSONB, '{\"score_cambio\":4.3}'::JSONB, 'agente_coach', 'claude-opus-4-5-20250514') RETURNING reporte_id;"}
```

**En Saturn:**
```
{var_aiagent_analisis.query}
```

**Resultado:** Saturn parsea el JSON, extrae `.query`, y ejecuta el SQL.

---

## Flujo Completo en Saturn Studio

### Nodo 1: Obtener Agentes

```sql
SELECT * FROM obtener_agentes_para_coaching(7, 5);
```

### Nodo 2: Loop - Para cada agente

```javascript
// Configurar loop sobre resultado del Nodo 1
for (const agente of agentes) {
    // Ejecutar Nodos 3-5 para cada agente
}
```

### Nodo 3: Obtener Datos Coaching (dentro del loop)

```sql
SELECT obtener_datos_coaching($agente_id, 7);
```

### Nodo 4: Llamar Claude (dentro del loop)

```javascript
// HTTP Request a Claude API con el JSON del Nodo 3
// Ver PASO 3 arriba
```

### Nodo 5: Insertar Reporte (dentro del loop)

```sql
-- INSERT usando datos del Nodo 3 (metricas) + Nodo 4 (analisis LLM)
INSERT INTO coaching_reports (...) VALUES (...) RETURNING reporte_id;
```

### Nodo 6: Preparar Resumen

```sql
-- Obtener resumen de reportes generados hoy
SELECT 
    a.equipo,
    COUNT(*) as reportes_generados,
    AVG((cr.metricas_periodo->>'score_promedio')::NUMERIC) as score_promedio,
    COUNT(*) FILTER (WHERE (cr.metricas_periodo->>'score_promedio')::NUMERIC < 50) as requieren_atencion
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE cr.fecha_reporte = CURRENT_DATE
GROUP BY a.equipo;
```

### Nodo 7: Notificar Slack (si hay agentes criticos)

```javascript
// Enviar resumen a Slack si hay agentes que requieren atencion
```

---

## Tiempos Esperados

| Paso | Por Agente | Total (20 agentes) |
|------|------------|-------------------|
| obtener_datos_coaching() | ~300ms | 6s |
| Claude API | ~3-5s | 60-100s (secuencial) |
| INSERT reporte | ~100ms | 2s |
| **Total** | ~4-6s | **~2-3 min** |

---

## Diagrama de Flujo Saturn Studio

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON 08:00 AM                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 1: SQL Query                                          │
│  SELECT * FROM obtener_agentes_para_coaching(7, 5)          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 2: Loop sobre agentes                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NODO 3: SQL                                           │ │
│  │  SELECT obtener_datos_coaching(agente_id, 7)           │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NODO 4: HTTP Request                                  │ │
│  │  POST Claude API con datos + prompt                    │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NODO 5: SQL                                           │ │
│  │  INSERT INTO coaching_reports                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 6: SQL Query                                          │
│  Obtener resumen de reportes generados                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  NODO 7: Condicional                                        │
│  IF requieren_atencion > 0                                  │
└────────┬────────────────────────────────┬───────────────────┘
         │ SI                             │ NO
         ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐
│  NODO 8: HTTP       │          │  FIN                │
│  POST Slack         │          └─────────────────────┘
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  FIN                │
└─────────────────────┘
```

---

## Queries de Verificacion

### Ver reportes de hoy
```sql
SELECT 
    a.nombre,
    a.equipo,
    cr.metricas_periodo->>'score_promedio' as score,
    cr.plan_mejora->>'objetivo_semana' as objetivo
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE cr.fecha_reporte = CURRENT_DATE
ORDER BY a.equipo, a.nombre;
```

### Ver tendencia de un agente
```sql
SELECT 
    fecha_reporte,
    metricas_periodo->>'score_promedio' as score,
    progreso_vs_anterior->>'score_cambio' as cambio
FROM coaching_reports
WHERE agente_id = '11111111-1111-1111-1111-111111111111'
ORDER BY fecha_reporte DESC
LIMIT 5;
```

### Agentes que necesitan atencion
```sql
SELECT 
    a.nombre,
    a.equipo,
    (cr.metricas_periodo->>'score_promedio')::NUMERIC as score,
    cr.gap_critico->>'area' as gap
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE cr.fecha_reporte = CURRENT_DATE
  AND (cr.metricas_periodo->>'score_promedio')::NUMERIC < 50
ORDER BY (cr.metricas_periodo->>'score_promedio')::NUMERIC;
```
