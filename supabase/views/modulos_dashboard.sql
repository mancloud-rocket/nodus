-- ============================================
-- NODUS - Vistas para Dashboard de Modulos
-- Tres Pilares: Contacto Directo, Compromiso, Abandono
-- ============================================

-- ============================================
-- Vista 1: Resumen Global de Modulos por Dia
-- Uso: Pagina Vision General, graficos de tendencia
-- ============================================

CREATE OR REPLACE VIEW vista_modulos_global AS
SELECT
    DATE_TRUNC('day', fecha_llamada)::date as fecha,
    COUNT(*) as total_llamadas,
    
    -- MODULO 1: CONTACTO DIRECTO
    ROUND(AVG(score_contacto_directo), 1) as avg_contacto_directo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'monto_mencionado'->>'puntos')::numeric), 1) as avg_puntos_monto,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'puntos')::numeric), 1) as avg_puntos_fecha,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'puntos')::numeric), 1) as avg_puntos_consecuencias,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'alternativas_pago'->>'puntos')::numeric), 1) as avg_puntos_alternativas,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'puntos')::numeric), 1) as avg_puntos_objeciones,
    
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'monto_mencionado'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_monto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_fecha,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_consecuencias,
    
    -- MODULO 2: COMPROMISO DE PAGO
    ROUND(AVG(score_compromiso_pago), 1) as avg_compromiso_pago,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'oferta_clara'->>'puntos')::numeric), 1) as avg_puntos_oferta,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'puntos')::numeric), 1) as avg_puntos_alt_pago,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'puntos')::numeric), 1) as avg_puntos_fecha_esp,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'puntos')::numeric), 1) as avg_puntos_validacion,
    
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_oferta_clara,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_alternativas_pago,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_fecha_especifica,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_validacion_cliente,
    
    -- MODULO 3: ABANDONO
    COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) as llamadas_con_abandono,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
    
    -- RESULTADOS
    ROUND(AVG(score_total), 1) as avg_score_total,
    ROUND(AVG(probabilidad_cumplimiento), 1) as avg_probabilidad

FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', fecha_llamada)::date
ORDER BY fecha DESC;

COMMENT ON VIEW vista_modulos_global IS 'Resumen diario de los 3 modulos - ultimos 30 dias';

-- ============================================
-- Vista 2: Impacto por Elementos de Compromiso
-- Uso: Grafico de barras "Sin elementos" hasta "Acuerdo completo"
-- ============================================

CREATE OR REPLACE VIEW vista_compromiso_elementos AS
WITH elementos AS (
    SELECT
        analisis_id,
        fecha_llamada,
        probabilidad_cumplimiento,
        score_compromiso_pago,
        (modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean as tiene_oferta,
        (modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'presente')::boolean as tiene_alternativas,
        (modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'presente')::boolean as tiene_fecha,
        (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean as tiene_validacion,
        CASE WHEN (modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean THEN 1 ELSE 0 END +
        CASE WHEN (modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'presente')::boolean THEN 1 ELSE 0 END +
        CASE WHEN (modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'presente')::boolean THEN 1 ELSE 0 END +
        CASE WHEN (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean THEN 1 ELSE 0 END as num_elementos
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
),
clasificacion AS (
    SELECT
        *,
        CASE num_elementos
            WHEN 0 THEN 'Sin elementos'
            WHEN 1 THEN 'Solo oferta'
            WHEN 2 THEN 'Oferta + alternativas'
            WHEN 3 THEN 'Tres elementos'
            WHEN 4 THEN 'Acuerdo completo'
            ELSE 'Parcial'
        END as categoria,
        num_elementos as orden
    FROM elementos
)
SELECT
    categoria,
    orden,
    COUNT(*) as total_llamadas,
    ROUND(AVG(probabilidad_cumplimiento), 1) as prob_promedio,
    ROUND(AVG(score_compromiso_pago), 1) as score_promedio,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as porcentaje_del_total
FROM clasificacion
GROUP BY categoria, orden
ORDER BY orden;

COMMENT ON VIEW vista_compromiso_elementos IS 'Distribucion de llamadas por cantidad de elementos de compromiso';

-- ============================================
-- Vista 3: Detalle de Abandonos
-- Uso: Donut charts y analisis de patrones
-- ============================================

CREATE OR REPLACE VIEW vista_abandonos_detalle AS
SELECT
    CASE 
        WHEN (modulo_abandono->>'momento_segundos')::int IS NULL THEN 'No registrado'
        WHEN (modulo_abandono->>'momento_segundos')::int <= 30 THEN '0-30 seg'
        WHEN (modulo_abandono->>'momento_segundos')::int <= 60 THEN '31-60 seg'
        WHEN (modulo_abandono->>'momento_segundos')::int <= 120 THEN '1-2 min'
        ELSE '> 2 min'
    END as momento_rango,
    COALESCE(modulo_abandono->>'razon', 'No especificada') as razon,
    COALESCE(modulo_abandono->>'iniciado_por', 'Desconocido') as iniciado_por,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as porcentaje
FROM analisis_llamadas
WHERE 
    fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
    AND (modulo_abandono->>'hubo_abandono')::boolean = true
GROUP BY 
    momento_rango,
    modulo_abandono->>'razon',
    modulo_abandono->>'iniciado_por'
ORDER BY total DESC;

COMMENT ON VIEW vista_abandonos_detalle IS 'Analisis detallado de abandonos por momento y razon';

-- ============================================
-- Vista 4: Resumen de Abandono por Momento
-- Uso: 3 KPIs principales de abandono
-- ============================================

CREATE OR REPLACE VIEW vista_abandono_kpis AS
WITH totales AS (
    SELECT 
        COUNT(*) as total_llamadas,
        COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) as total_abandonos
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
),
abandonos AS (
    SELECT
        modulo_abandono->>'momento_segundos' as momento,
        modulo_abandono->>'razon' as razon
    FROM analisis_llamadas
    WHERE 
        fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
        AND (modulo_abandono->>'hubo_abandono')::boolean = true
)
SELECT
    'primeros_30_seg' as kpi,
    COUNT(*) FILTER (WHERE momento::int <= 30) as valor,
    ROUND(100.0 * COUNT(*) FILTER (WHERE momento::int <= 30) / NULLIF((SELECT total_abandonos FROM totales), 0), 1) as porcentaje_abandonos,
    ROUND(100.0 * COUNT(*) FILTER (WHERE momento::int <= 30) / NULLIF((SELECT total_llamadas FROM totales), 0), 1) as porcentaje_total
FROM abandonos
UNION ALL
SELECT
    'al_mencionar_monto' as kpi,
    COUNT(*) FILTER (WHERE razon ILIKE '%monto%') as valor,
    ROUND(100.0 * COUNT(*) FILTER (WHERE razon ILIKE '%monto%') / NULLIF((SELECT total_abandonos FROM totales), 0), 1) as porcentaje_abandonos,
    ROUND(100.0 * COUNT(*) FILTER (WHERE razon ILIKE '%monto%') / NULLIF((SELECT total_llamadas FROM totales), 0), 1) as porcentaje_total
FROM abandonos
UNION ALL
SELECT
    'durante_objeciones' as kpi,
    COUNT(*) FILTER (WHERE razon ILIKE '%objecion%' OR razon ILIKE '%rechazo%') as valor,
    ROUND(100.0 * COUNT(*) FILTER (WHERE razon ILIKE '%objecion%' OR razon ILIKE '%rechazo%') / NULLIF((SELECT total_abandonos FROM totales), 0), 1) as porcentaje_abandonos,
    ROUND(100.0 * COUNT(*) FILTER (WHERE razon ILIKE '%objecion%' OR razon ILIKE '%rechazo%') / NULLIF((SELECT total_llamadas FROM totales), 0), 1) as porcentaje_total
FROM abandonos;

COMMENT ON VIEW vista_abandono_kpis IS 'KPIs principales de abandono para donut charts';

-- ============================================
-- Vista 5: Metricas por Agente (3 Modulos)
-- Uso: Tablas comparativas y rankings
-- ============================================

CREATE OR REPLACE VIEW vista_agente_modulos AS
SELECT
    a.agente_id,
    ag.nombre as agente_nombre,
    ag.equipo,
    ag.estado,
    COUNT(*) as total_llamadas,
    
    -- Modulo 1: Contacto Directo
    ROUND(AVG(a.score_contacto_directo), 1) as score_contacto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_contacto_directo->'desglose'->'monto_mencionado'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_monto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_fecha,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'calidad')::int >= 3) / NULLIF(COUNT(*), 0), 1) as pct_buen_manejo,
    
    -- Modulo 2: Compromiso de Pago
    ROUND(AVG(a.score_compromiso_pago), 1) as score_compromiso,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_oferta,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_validacion,
    
    -- Modulo 3: Abandono
    COUNT(*) FILTER (WHERE (a.modulo_abandono->>'hubo_abandono')::boolean) as llamadas_con_abandono,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
    
    -- Resultados
    ROUND(AVG(a.score_total), 1) as score_total,
    ROUND(AVG(a.probabilidad_cumplimiento), 1) as prob_cumplimiento,
    
    -- Rankings
    RANK() OVER (ORDER BY AVG(a.score_total) DESC) as ranking_score,
    RANK() OVER (ORDER BY AVG(a.probabilidad_cumplimiento) DESC) as ranking_prob

FROM analisis_llamadas a
JOIN agentes ag ON a.agente_id = ag.agente_id
WHERE 
    a.fecha_llamada >= CURRENT_DATE - INTERVAL '7 days'
    AND ag.estado = 'activo'
GROUP BY a.agente_id, ag.nombre, ag.equipo, ag.estado
HAVING COUNT(*) >= 3
ORDER BY score_total DESC;

COMMENT ON VIEW vista_agente_modulos IS 'Metricas de los 3 modulos por agente - ultimos 7 dias';

-- ============================================
-- Vista 6: Evolucion Semanal
-- Uso: Grafico de lineas con tendencia
-- ============================================

CREATE OR REPLACE VIEW vista_evolucion_semanal AS
WITH datos_semana AS (
    SELECT
        DATE_TRUNC('week', fecha_llamada)::date as semana,
        COUNT(*) as total_llamadas,
        ROUND(AVG(score_total), 1) as score_total,
        ROUND(AVG(score_contacto_directo), 1) as score_contacto,
        ROUND(AVG(score_compromiso_pago), 1) as score_compromiso,
        ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_validacion,
        ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
        ROUND(AVG(probabilidad_cumplimiento), 1) as prob_cumplimiento
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', fecha_llamada)::date
)
SELECT
    semana,
    total_llamadas,
    score_total,
    score_contacto,
    score_compromiso,
    tasa_validacion,
    tasa_abandono,
    prob_cumplimiento,
    LAG(score_total) OVER (ORDER BY semana) as score_total_anterior,
    LAG(prob_cumplimiento) OVER (ORDER BY semana) as prob_anterior
FROM datos_semana
ORDER BY semana DESC;

COMMENT ON VIEW vista_evolucion_semanal IS 'Evolucion semanal de metricas - ultimas 12 semanas';

-- ============================================
-- Vista 7: Flujo de Probabilidad (Compromiso)
-- Uso: Diagrama de flechas mostrando acumulacion
-- ============================================

CREATE OR REPLACE VIEW vista_flujo_probabilidad AS
WITH base AS (
    SELECT
        (modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean as oferta,
        (modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'presente')::boolean as alternativas,
        (modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'presente')::boolean as fecha,
        (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean as validacion,
        probabilidad_cumplimiento
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 'Inicio' as paso, 0 as orden, 0 as prob_teorica, ROUND(AVG(probabilidad_cumplimiento) FILTER (WHERE NOT oferta), 1) as prob_real, COUNT(*) FILTER (WHERE NOT oferta) as n FROM base
UNION ALL
SELECT 'Oferta clara' as paso, 1 as orden, 20 as prob_teorica, ROUND(AVG(probabilidad_cumplimiento) FILTER (WHERE oferta AND NOT alternativas), 1) as prob_real, COUNT(*) FILTER (WHERE oferta AND NOT alternativas) as n FROM base
UNION ALL
SELECT 'Alternativas' as paso, 2 as orden, 30 as prob_teorica, ROUND(AVG(probabilidad_cumplimiento) FILTER (WHERE oferta AND alternativas AND NOT fecha), 1) as prob_real, COUNT(*) FILTER (WHERE oferta AND alternativas AND NOT fecha) as n FROM base
UNION ALL
SELECT 'Fecha especifica' as paso, 3 as orden, 50 as prob_teorica, ROUND(AVG(probabilidad_cumplimiento) FILTER (WHERE oferta AND alternativas AND fecha AND NOT validacion), 1) as prob_real, COUNT(*) FILTER (WHERE oferta AND alternativas AND fecha AND NOT validacion) as n FROM base
UNION ALL
SELECT 'Validacion cliente' as paso, 4 as orden, 100 as prob_teorica, ROUND(AVG(probabilidad_cumplimiento) FILTER (WHERE oferta AND alternativas AND fecha AND validacion), 1) as prob_real, COUNT(*) FILTER (WHERE oferta AND alternativas AND fecha AND validacion) as n FROM base
ORDER BY orden;

COMMENT ON VIEW vista_flujo_probabilidad IS 'Flujo de probabilidad segun elementos de compromiso';

-- ============================================
-- Vista 8: Detalle de Contacto Directo
-- Uso: Pagina de Contacto Directo - cumplimiento por variable
-- ============================================

CREATE OR REPLACE VIEW vista_contacto_detalle AS
SELECT
    'Monto adeudado' as variable,
    25 as peso_maximo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'monto_mencionado'->>'puntos')::numeric), 1) as puntos_promedio,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'monto_mencionado'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_cumplimiento,
    COUNT(*) as total_llamadas
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
    'Fecha de vencimiento' as variable,
    15 as peso_maximo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'puntos')::numeric), 1) as puntos_promedio,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_cumplimiento,
    COUNT(*) as total_llamadas
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
    'Consecuencias del impago' as variable,
    20 as peso_maximo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'puntos')::numeric), 1) as puntos_promedio,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_cumplimiento,
    COUNT(*) as total_llamadas
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
    'Alternativas de pago' as variable,
    15 as peso_maximo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'alternativas_pago'->>'puntos')::numeric), 1) as puntos_promedio,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'alternativas_pago'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_cumplimiento,
    COUNT(*) as total_llamadas
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT
    'Manejo de objeciones' as variable,
    25 as peso_maximo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'puntos')::numeric), 1) as puntos_promedio,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'calidad')::int >= 3) / NULLIF(COUNT(*), 0), 1) as pct_cumplimiento,
    COUNT(*) as total_llamadas
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW vista_contacto_detalle IS 'Detalle de cumplimiento por variable del modulo Contacto Directo';

-- ============================================
-- Vista 9: KPIs Principales del Dashboard
-- Uso: Cards principales de la pagina Overview
-- ============================================

CREATE OR REPLACE VIEW vista_kpis_principales AS
WITH periodo_actual AS (
    SELECT
        AVG(score_total) as score_total,
        AVG(score_contacto_directo) as score_contacto,
        AVG(score_compromiso_pago) as score_compromiso,
        100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0) as tasa_validacion,
        100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0) as tasa_abandono,
        AVG(probabilidad_cumplimiento) as probabilidad,
        COUNT(*) as total_llamadas
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '7 days'
),
periodo_anterior AS (
    SELECT
        AVG(score_total) as score_total,
        AVG(score_contacto_directo) as score_contacto,
        AVG(score_compromiso_pago) as score_compromiso,
        100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0) as tasa_validacion,
        100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0) as tasa_abandono,
        AVG(probabilidad_cumplimiento) as probabilidad,
        COUNT(*) as total_llamadas
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '14 days'
      AND fecha_llamada < CURRENT_DATE - INTERVAL '7 days'
)
SELECT
    'score_total' as kpi,
    ROUND(a.score_total, 1) as valor,
    ROUND(p.score_total, 1) as valor_anterior,
    ROUND(a.score_total - COALESCE(p.score_total, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'score_contacto' as kpi,
    ROUND(a.score_contacto, 1) as valor,
    ROUND(p.score_contacto, 1) as valor_anterior,
    ROUND(a.score_contacto - COALESCE(p.score_contacto, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'score_compromiso' as kpi,
    ROUND(a.score_compromiso, 1) as valor,
    ROUND(p.score_compromiso, 1) as valor_anterior,
    ROUND(a.score_compromiso - COALESCE(p.score_compromiso, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'tasa_validacion' as kpi,
    ROUND(a.tasa_validacion, 1) as valor,
    ROUND(p.tasa_validacion, 1) as valor_anterior,
    ROUND(a.tasa_validacion - COALESCE(p.tasa_validacion, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'tasa_abandono' as kpi,
    ROUND(a.tasa_abandono, 1) as valor,
    ROUND(p.tasa_abandono, 1) as valor_anterior,
    ROUND(a.tasa_abandono - COALESCE(p.tasa_abandono, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'probabilidad' as kpi,
    ROUND(a.probabilidad, 1) as valor,
    ROUND(p.probabilidad, 1) as valor_anterior,
    ROUND(a.probabilidad - COALESCE(p.probabilidad, 0), 1) as cambio
FROM periodo_actual a, periodo_anterior p
UNION ALL
SELECT
    'total_llamadas' as kpi,
    a.total_llamadas as valor,
    p.total_llamadas as valor_anterior,
    a.total_llamadas - COALESCE(p.total_llamadas, 0) as cambio
FROM periodo_actual a, periodo_anterior p;

COMMENT ON VIEW vista_kpis_principales IS 'KPIs principales con comparativa vs periodo anterior';

