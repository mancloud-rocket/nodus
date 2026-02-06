# Agente Coach - INSERT en Supabase

## Tabla Destino: `coaching_reports`

---

## SQL de INSERT Completo

```sql
INSERT INTO coaching_reports (
    agente_id,
    fecha_reporte,
    periodo_evaluado,
    metricas_periodo,
    distribucion_scores,
    tendencia,
    comparativa_equipo,
    fortalezas,
    gap_critico,
    plan_mejora,
    progreso_objetivo_anterior,
    mensaje_motivacional,
    metricas_destacadas,
    recomendacion_supervisor,
    alertas_periodo,
    metadata
) VALUES (
    $1,   -- agente_id UUID
    $2,   -- fecha_reporte DATE
    $3,   -- periodo_evaluado JSONB
    $4,   -- metricas_periodo JSONB
    $5,   -- distribucion_scores JSONB
    $6,   -- tendencia JSONB
    $7,   -- comparativa_equipo JSONB
    $8,   -- fortalezas JSONB
    $9,   -- gap_critico JSONB
    $10,  -- plan_mejora JSONB
    $11,  -- progreso_objetivo_anterior JSONB
    $12,  -- mensaje_motivacional TEXT
    $13,  -- metricas_destacadas JSONB
    $14,  -- recomendacion_supervisor TEXT
    $15,  -- alertas_periodo JSONB
    $16   -- metadata JSONB
) RETURNING reporte_id;
```

---

## Ejemplo con Datos Reales (una linea)

```sql
INSERT INTO coaching_reports (agente_id, fecha_reporte, periodo_evaluado, metricas_periodo, distribucion_scores, tendencia, comparativa_equipo, fortalezas, gap_critico, plan_mejora, progreso_objetivo_anterior, mensaje_motivacional, metricas_destacadas, recomendacion_supervisor, alertas_periodo, metadata) VALUES ('11111111-2222-3333-4444-555555555555', '2026-02-04', '{"inicio":"2026-01-28","fin":"2026-02-03","dias":7,"llamadas_analizadas":25}'::JSONB, '{"score_promedio":72,"score_contacto_promedio":78,"score_compromiso_promedio":66,"tasa_validacion_explicita":0.20,"tasa_abandono":0.08,"probabilidad_cumplimiento_promedio":58,"total_llamadas":25}'::JSONB, '{"excelente_80_100":6,"bueno_60_79":12,"regular_40_59":5,"bajo_0_39":2}'::JSONB, '{"vs_semana_anterior":5,"direccion":"mejorando","racha":2}'::JSONB, '{"score_promedio_equipo":78,"ranking":8,"total_agentes_equipo":12,"percentil":65,"distancia_al_mejor":-20,"distancia_al_promedio":-6}'::JSONB, '[{"area":"manejo_objeciones","descripcion":"Excelente capacidad para responder dudas","evidencia":"Solo 2 objeciones no resueltas en 25 llamadas"},{"area":"identificacion_cliente","descripcion":"Verificacion consistente","evidencia":"100% de llamadas con verificacion correcta"},{"area":"tono_positivo","descripcion":"Mantiene tono profesional","evidencia":"Emocion positivo en 68% de segmentos"}]'::JSONB, '{"area":"validacion_compromiso","descripcion":"Solo 20% de validacion explicita","impacto":"Reduce probabilidad de cumplimiento en 35%","benchmark_equipo":"Equipo: 42%","ejemplo_llamada":"anal-005"}'::JSONB, '{"objetivo_semanal":"Lograr 40% validacion explicita","acciones":[{"accion":"Usar frase de confirmacion","cuando":"Cada cierre","prioridad":"alta"},{"accion":"No aceptar ok como validacion","cuando":"Respuestas ambiguas","prioridad":"alta"}],"recursos_sugeridos":["Video: Tecnicas de cierre","Script: Frases de validacion"]}'::JSONB, '{"objetivo_anterior":"Reducir abandono a <10%","resultado":"cumplido","valor_logrado":"8%","nota":"Excelente mejora"}'::JSONB, 'Maria, tu progreso es notable: subiste 5 puntos esta semana. Tu fortaleza en manejo de objeciones es un activo valioso. Esta semana, enfocate en cerrar con fuerza!', '{"mejor_metrica":{"nombre":"Tasa abandono","valor":"8%","vs_equipo":"-25%"},"metrica_mejorar":{"nombre":"Validacion explicita","valor":"20%","vs_equipo":"-52%"}}'::JSONB, 'Maria ha demostrado mejora sostenida. Recomiendo escuchar grabaciones con ella para identificar patron de validacion.', '[{"fecha":"2026-02-02","tipo":"ABANDONO_CLIENTE","descripcion":"Cliente abandono la llamada"}]'::JSONB, '{"modelo_usado":"claude-opus-4-5-20250514","version_prompt":"v1.0","tiempo_generacion_ms":4500}'::JSONB) RETURNING reporte_id;
```

---

## Mapeo de Campos

| Campo | Tipo | Fuente | Notas |
|-------|------|--------|-------|
| `agente_id` | UUID | Input | FK a agentes |
| `fecha_reporte` | DATE | Calculado | Fecha de generacion |
| `periodo_evaluado` | JSONB | Calculado | inicio, fin, dias |
| `metricas_periodo` | JSONB | Calculado | Todas las metricas |
| `distribucion_scores` | JSONB | Calculado | Histograma |
| `tendencia` | JSONB | Calculado | vs semana anterior |
| `comparativa_equipo` | JSONB | Calculado | Ranking, percentil |
| `fortalezas` | JSONB | LLM | Array de 3 fortalezas |
| `gap_critico` | JSONB | LLM | Area prioritaria |
| `plan_mejora` | JSONB | LLM | Objetivo + acciones |
| `progreso_objetivo_anterior` | JSONB | LLM | Seguimiento |
| `mensaje_motivacional` | TEXT | LLM | 2-3 oraciones |
| `metricas_destacadas` | JSONB | LLM | Mejor/peor metrica |
| `recomendacion_supervisor` | TEXT | LLM | Nota para supervisor |
| `alertas_periodo` | JSONB | Query | Alertas de la semana |
| `metadata` | JSONB | Sistema | Modelo, version, tiempo |

---

## Queries de Consulta Frecuentes

### Ultimo reporte de un agente
```sql
SELECT * FROM coaching_reports
WHERE agente_id = $1
ORDER BY fecha_reporte DESC
LIMIT 1;
```

### Reportes de hoy por equipo
```sql
SELECT cr.*, a.nombre as agente_nombre
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE a.equipo = $1
  AND cr.fecha_reporte = CURRENT_DATE
ORDER BY cr.metricas_periodo->>'score_promedio' DESC;
```

### Agentes con mejora sostenida
```sql
SELECT 
  cr.agente_id,
  a.nombre,
  cr.tendencia->>'racha' as racha_mejora
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE cr.fecha_reporte = CURRENT_DATE
  AND cr.tendencia->>'direccion' = 'mejorando'
  AND (cr.tendencia->>'racha')::int >= 2
ORDER BY (cr.tendencia->>'racha')::int DESC;
```

### Agentes que necesitan atencion
```sql
SELECT 
  cr.agente_id,
  a.nombre,
  cr.metricas_periodo->>'score_promedio' as score,
  cr.gap_critico->>'area' as area_critica
FROM coaching_reports cr
JOIN agentes a ON cr.agente_id = a.agente_id
WHERE cr.fecha_reporte = CURRENT_DATE
  AND (cr.metricas_periodo->>'score_promedio')::int < 50
ORDER BY (cr.metricas_periodo->>'score_promedio')::int ASC;
```

---

## Supabase JS SDK

```javascript
// INSERT reporte
const { data, error } = await supabase
  .from('coaching_reports')
  .insert({
    agente_id: '11111111-2222-3333-4444-555555555555',
    fecha_reporte: '2026-02-04',
    periodo_evaluado: { inicio: '2026-01-28', fin: '2026-02-03', dias: 7 },
    metricas_periodo: { score_promedio: 72, tasa_validacion_explicita: 0.20 },
    distribucion_scores: { excelente_80_100: 6, bueno_60_79: 12 },
    tendencia: { vs_semana_anterior: 5, direccion: 'mejorando', racha: 2 },
    comparativa_equipo: { ranking: 8, total_agentes_equipo: 12 },
    fortalezas: [{ area: 'manejo_objeciones', descripcion: '...' }],
    gap_critico: { area: 'validacion_compromiso', descripcion: '...' },
    plan_mejora: { objetivo_semanal: '40% validacion', acciones: [...] },
    progreso_objetivo_anterior: { resultado: 'cumplido' },
    mensaje_motivacional: 'Excelente trabajo...',
    metricas_destacadas: { mejor_metrica: {...}, metrica_mejorar: {...} },
    recomendacion_supervisor: 'Escuchar grabaciones con agente...',
    alertas_periodo: [...],
    metadata: { modelo_usado: 'claude-opus-4-5' }
  })
  .select('reporte_id')
  .single();

// Obtener historico de reportes
const { data: historico } = await supabase
  .from('coaching_reports')
  .select('fecha_reporte, metricas_periodo, tendencia')
  .eq('agente_id', agenteId)
  .order('fecha_reporte', { ascending: false })
  .limit(12);  // Ultimos 3 meses

// Obtener reportes del equipo hoy
const { data: equipoHoy } = await supabase
  .from('coaching_reports')
  .select(`
    *,
    agentes!inner(nombre, email)
  `)
  .eq('agentes.equipo', 'Equipo Norte')
  .eq('fecha_reporte', new Date().toISOString().split('T')[0]);
```

---

## Crear Notificacion para Agente

```javascript
async function notificarReporteCoaching(agente, reporte) {
  // 1. Crear notificacion in-app
  await supabase.from('notificaciones_usuarios').insert({
    usuario_id: agente.usuario_id,
    tipo: 'coaching_report',
    titulo: 'Tu reporte de coaching esta listo!',
    mensaje: `Score: ${reporte.metricas_periodo.score_promedio} | Ranking: ${reporte.comparativa_equipo.ranking}/${reporte.comparativa_equipo.total_agentes_equipo}`,
    datos: {
      reporte_id: reporte.reporte_id,
      fecha: reporte.fecha_reporte,
      tendencia: reporte.tendencia.direccion
    },
    leida: false
  });
  
  // 2. Opcional: Email si es agente nuevo o bajo rendimiento
  if (agente.dias_activo < 30 || reporte.metricas_periodo.score_promedio < 50) {
    await enviarEmailCoaching(agente.email, reporte);
  }
}
```

