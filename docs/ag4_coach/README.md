# Agente #4: Coach

## Vision General

El Agente Coach genera reportes de coaching personalizados para cada agente de cobranza. Analiza metricas, compara con el equipo, identifica gaps y crea planes de mejora accionables.

**Enfoque:** La logica de obtencion de datos esta en **funciones SQL de Supabase**, y el analisis cualitativo se hace con **Claude Opus**.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ obtener_agentes_para_coaching(dias, min)             │   │
│  │ obtener_datos_coaching(agente_id, dias) -> JSONB     │   │
│  │ obtener_metricas_agente(id, dias)                    │   │
│  │ obtener_benchmark_equipo(equipo, dias)               │   │
│  │ obtener_ranking_agente(id, equipo, dias)             │   │
│  │ obtener_reporte_anterior(id)                         │   │
│  │ obtener_alertas_agente(id, dias)                     │   │
│  │ obtener_muestra_llamadas(id, dias, n)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        Cron 08:00 AM │ 
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SATURN STUDIO                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. SELECT obtener_agentes_para_coaching()            │   │
│  │ 2. Loop: SELECT obtener_datos_coaching(id)           │   │
│  │ 3. HTTP: POST Claude API (analisis cualitativo)      │   │
│  │ 4. INSERT INTO coaching_reports                      │   │
│  │ 5. Notificar (Slack si hay criticos)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Funciones SQL de Supabase

| Funcion | Input | Output | Uso |
|---------|-------|--------|-----|
| `obtener_agentes_para_coaching` | dias, min_llamadas | Lista de agentes | Paso 1 |
| `obtener_datos_coaching` | agente_id, dias | **JSONB completo** | **Principal** |
| `obtener_metricas_agente` | agente_id, dias | Metricas periodo | Interno |
| `obtener_benchmark_equipo` | equipo, dias | Promedios equipo | Interno |
| `obtener_ranking_agente` | id, equipo, dias | Posicion/percentil | Interno |
| `obtener_reporte_anterior` | agente_id | Ultimo reporte | Tendencia |
| `obtener_alertas_agente` | agente_id, dias | Alertas periodo | Contexto |
| `obtener_muestra_llamadas` | id, dias, n | Mejores/peores | LLM |

**Archivo:** `supabase/functions/coach_functions.sql`

---

## Uso Rapido

### Obtener agentes listos para coaching

```sql
SELECT * FROM obtener_agentes_para_coaching(7, 5);
```

### Obtener todos los datos para el LLM

```sql
SELECT obtener_datos_coaching('11111111-1111-1111-1111-111111111111', 7);
```

Retorna un **JSONB completo** con:
- Datos del agente
- Metricas del periodo (score, validacion, abandono, etc.)
- Benchmark del equipo
- Ranking y percentil
- Reporte anterior (si existe)
- Tendencia (mejorando/empeorando/estable)
- Alertas recientes
- Muestra de mejores/peores llamadas

---

## Output de obtener_datos_coaching()

```json
{
  "agente": {
    "agente_id": "uuid",
    "nombre": "Maria Lopez",
    "equipo": "Equipo Norte",
    "dias_activo": 1116
  },
  "metricas": {
    "total_llamadas": 12,
    "score_promedio": 82.3,
    "tasa_validacion_explicita": 1.0,
    "tasa_abandono": 0.0,
    "distribucion": {
      "excelente_80_100": 8,
      "bueno_60_79": 4
    }
  },
  "benchmark_equipo": {
    "score_promedio": 73.9,
    "score_top": 82.3,
    "total_agentes": 2
  },
  "ranking": {
    "posicion": 1,
    "percentil": 50,
    "diferencia_vs_promedio": 8.4
  },
  "reporte_anterior": {
    "score_anterior": 78,
    "objetivo_cumplido": true
  },
  "tendencia": {
    "score_cambio": 4.3,
    "direccion": "mejorando"
  },
  "alertas": [],
  "muestra_llamadas": [...]
}
```

---

## Pipeline

```
1. obtener_agentes_para_coaching(7, 5)
   -> Lista de agentes con >= 5 llamadas en 7 dias

2. Para cada agente:
   obtener_datos_coaching(agente_id, 7)
   -> JSON con todas las metricas

3. Enviar JSON a Claude Opus
   -> Analisis cualitativo (fortalezas, gaps, plan)

4. INSERT INTO coaching_reports
   -> Metricas + Analisis LLM

5. Notificar si hay agentes criticos
```

---

## Tabla de Destino

**coaching_reports**
| Campo | Tipo | Fuente |
|-------|------|--------|
| agente_id | UUID | SQL |
| fecha_reporte | DATE | CURRENT_DATE |
| periodo_inicio/fin | DATE | obtener_datos_coaching |
| total_llamadas_analizadas | INT | obtener_datos_coaching |
| metricas_periodo | JSONB | obtener_datos_coaching |
| comparativa_equipo | JSONB | obtener_datos_coaching |
| fortalezas | JSONB | LLM |
| gap_critico | JSONB | LLM |
| plan_mejora | JSONB | LLM |
| progreso_vs_anterior | JSONB | LLM |

---

## Estructura de Archivos

```
docs/ag4_coach/
├── README.md                    # Este archivo
├── prompt_analisis_agente.md    # Prompt para Claude
├── templates_mensajes.md        # Mensajes motivacionales
├── input_ejemplo.json           # Ejemplo de datos
├── output_ejemplo.json          # Ejemplo de reporte
├── flujo_completo.md            # E2E con queries
├── insert_supabase.md           # SQL de insercion
└── plan_implementacion.md       # Checklist

supabase/functions/
└── coach_functions.sql          # Funciones SQL completas
```

---

## Ventajas de este Enfoque

1. **Una sola funcion obtiene todo:** `obtener_datos_coaching()` retorna un JSONB completo listo para el LLM
2. **Logica en SQL:** Calculos de metricas, rankings y comparativas se hacen en la base de datos
3. **LLM solo para analisis cualitativo:** Claude recibe datos estructurados y genera insights
4. **Testeable:** Puedes ejecutar las funciones manualmente para verificar datos
5. **Eficiente:** Reduce round-trips a la base de datos

---

## Tiempo de Implementacion

| Fase | Tiempo |
|------|--------|
| Crear funciones SQL | 2-3h |
| Configurar Saturn Studio | 2-3h |
| Crear prompt LLM | 1-2h |
| Testing | 2-3h |
| **Total** | **1-1.5 dias** |
