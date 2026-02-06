-- ============================================================================
-- FUNCIONES DEL AGENTE COACH
-- Calculo de metricas, comparativas y datos para LLM
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCION: Obtener agentes activos para coaching
-- Retorna agentes con al menos 7 dias de antiguedad
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_agentes_coaching(
    p_dias_minimo INTEGER DEFAULT 7
)
RETURNS TABLE (
    agente_id UUID,
    nombre TEXT,
    email TEXT,
    equipo TEXT,
    supervisor_id UUID,
    fecha_ingreso DATE,
    dias_activo INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.agente_id,
        a.nombre::TEXT,
        a.email::TEXT,
        a.equipo::TEXT,
        a.supervisor_id,
        a.fecha_ingreso,
        EXTRACT(DAY FROM NOW() - a.fecha_ingreso)::INTEGER as dias_activo
    FROM agentes a
    WHERE a.estado = 'activo'
      AND a.fecha_ingreso < NOW() - (p_dias_minimo || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 2. FUNCION: Obtener metricas de un agente para el periodo
-- Calcula todas las metricas necesarias para coaching
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_metricas_agente(
    p_agente_id UUID,
    p_dias INTEGER DEFAULT 7,
    p_limite_llamadas INTEGER DEFAULT 25
)
RETURNS TABLE (
    total_llamadas BIGINT,
    score_promedio NUMERIC,
    score_min INTEGER,
    score_max INTEGER,
    score_contacto_promedio NUMERIC,
    score_compromiso_promedio NUMERIC,
    tasa_validacion_explicita NUMERIC,
    tasa_abandono NUMERIC,
    prob_cumplimiento_promedio NUMERIC,
    llamadas_excelentes BIGINT,
    llamadas_buenas BIGINT,
    llamadas_regulares BIGINT,
    llamadas_bajas BIGINT,
    fecha_inicio DATE,
    fecha_fin DATE
) AS $$
BEGIN
    RETURN QUERY
    WITH analisis_periodo AS (
        SELECT 
            al.score_total,
            al.score_contacto_directo,
            al.score_compromiso_pago,
            al.probabilidad_cumplimiento,
            al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' as validacion_tipo,
            al.modulo_abandono->>'hubo_abandono' as hubo_abandono,
            al.created_at::DATE as fecha
        FROM analisis_llamadas al
        WHERE al.agente_id = p_agente_id
          AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
        ORDER BY al.created_at DESC
        LIMIT p_limite_llamadas
    )
    SELECT 
        COUNT(*)::BIGINT,
        ROUND(AVG(score_total), 1),
        MIN(score_total),
        MAX(score_total),
        ROUND(AVG(score_contacto_directo), 1),
        ROUND(AVG(score_compromiso_pago), 1),
        ROUND(COUNT(*) FILTER (WHERE validacion_tipo = 'explicita')::NUMERIC / NULLIF(COUNT(*), 0), 2),
        ROUND(COUNT(*) FILTER (WHERE hubo_abandono = 'true')::NUMERIC / NULLIF(COUNT(*), 0), 2),
        ROUND(AVG(probabilidad_cumplimiento), 1),
        COUNT(*) FILTER (WHERE score_total >= 80)::BIGINT,
        COUNT(*) FILTER (WHERE score_total >= 60 AND score_total < 80)::BIGINT,
        COUNT(*) FILTER (WHERE score_total >= 40 AND score_total < 60)::BIGINT,
        COUNT(*) FILTER (WHERE score_total < 40)::BIGINT,
        MIN(fecha),
        MAX(fecha)
    FROM analisis_periodo;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 3. FUNCION: Obtener benchmark del equipo
-- Metricas promedio del equipo para comparacion
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_benchmark_equipo(
    p_equipo TEXT,
    p_dias INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_agentes BIGINT,
    total_llamadas BIGINT,
    score_promedio NUMERIC,
    score_top NUMERIC,
    tasa_validacion_promedio NUMERIC,
    prob_cumplimiento_promedio NUMERIC,
    tasa_abandono_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH metricas_por_agente AS (
        SELECT 
            al.agente_id,
            AVG(al.score_total) as score,
            COUNT(*) as llamadas,
            COUNT(*) FILTER (
                WHERE al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
            )::NUMERIC / NULLIF(COUNT(*), 0) as tasa_val,
            AVG(al.probabilidad_cumplimiento) as prob,
            COUNT(*) FILTER (WHERE al.modulo_abandono->>'hubo_abandono' = 'true')::NUMERIC / NULLIF(COUNT(*), 0) as abandono
        FROM analisis_llamadas al
        JOIN agentes a ON al.agente_id = a.agente_id
        WHERE a.equipo = p_equipo
          AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
        GROUP BY al.agente_id
        HAVING COUNT(*) >= 3
    )
    SELECT 
        COUNT(DISTINCT agente_id)::BIGINT,
        SUM(llamadas)::BIGINT,
        ROUND(AVG(score), 1),
        ROUND(MAX(score), 1),
        ROUND(AVG(tasa_val), 2),
        ROUND(AVG(prob), 1),
        ROUND(AVG(abandono), 2)
    FROM metricas_por_agente;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 4. FUNCION: Obtener ranking del agente en su equipo
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_ranking_agente(
    p_agente_id UUID,
    p_equipo TEXT,
    p_dias INTEGER DEFAULT 7
)
RETURNS TABLE (
    ranking INTEGER,
    total_agentes INTEGER,
    percentil INTEGER,
    score_agente NUMERIC,
    score_mejor NUMERIC,
    score_promedio_equipo NUMERIC,
    diferencia_vs_mejor NUMERIC,
    diferencia_vs_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH scores_equipo AS (
        SELECT 
            al.agente_id,
            AVG(al.score_total) as score_promedio
        FROM analisis_llamadas al
        JOIN agentes a ON al.agente_id = a.agente_id
        WHERE a.equipo = p_equipo
          AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
        GROUP BY al.agente_id
        HAVING COUNT(*) >= 3
    ),
    ranking_equipo AS (
        SELECT 
            se.agente_id,
            se.score_promedio,
            ROW_NUMBER() OVER (ORDER BY se.score_promedio DESC)::INTEGER as pos,
            COUNT(*) OVER ()::INTEGER as total
        FROM scores_equipo se
    ),
    stats AS (
        SELECT 
            MAX(score_promedio) as max_score,
            AVG(score_promedio) as avg_score
        FROM ranking_equipo
    )
    SELECT 
        COALESCE(r.pos, 0)::INTEGER,
        COALESCE(r.total, 0)::INTEGER,
        COALESCE(ROUND((1 - r.pos::NUMERIC / NULLIF(r.total, 0)) * 100)::INTEGER, 0),
        ROUND(r.score_promedio, 1),
        ROUND(s.max_score, 1),
        ROUND(s.avg_score, 1),
        ROUND(r.score_promedio - s.max_score, 1),
        ROUND(r.score_promedio - s.avg_score, 1)
    FROM ranking_equipo r
    CROSS JOIN stats s
    WHERE r.agente_id = p_agente_id;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 5. FUNCION: Obtener reporte anterior
-- Ultimo coaching report del agente
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_reporte_anterior(
    p_agente_id UUID
)
RETURNS TABLE (
    reporte_id UUID,
    fecha_reporte DATE,
    score_anterior NUMERIC,
    tasa_validacion_anterior NUMERIC,
    objetivo_cumplido BOOLEAN,
    objetivo_semana TEXT,
    gap_area TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.reporte_id,
        cr.fecha_reporte,
        (cr.metricas_periodo->>'score_promedio')::NUMERIC,
        (cr.metricas_periodo->>'tasa_validacion')::NUMERIC,
        (cr.progreso_vs_anterior->>'objetivo_anterior_cumplido')::BOOLEAN,
        cr.plan_mejora->>'objetivo_semana',
        cr.gap_critico->>'area'
    FROM coaching_reports cr
    WHERE cr.agente_id = p_agente_id
    ORDER BY cr.fecha_reporte DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 6. FUNCION: Obtener alertas del periodo
-- Alertas del agente en los ultimos N dias
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_alertas_agente(
    p_agente_id UUID,
    p_dias INTEGER DEFAULT 7
)
RETURNS TABLE (
    codigo TEXT,
    severidad TEXT,
    descripcion TEXT,
    fecha DATE,
    estado TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.codigo::TEXT,
        aa.severidad::TEXT,
        aa.descripcion::TEXT,
        aa.created_at::DATE,
        aa.estado::TEXT
    FROM alertas_anomalias aa
    WHERE p_agente_id = ANY(aa.agentes_relacionados)
      AND aa.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    ORDER BY aa.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 7. FUNCION: Obtener muestra de llamadas (mejores y peores)
-- Para analisis del LLM
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_muestra_llamadas(
    p_agente_id UUID,
    p_dias INTEGER DEFAULT 7,
    p_cantidad INTEGER DEFAULT 3
)
RETURNS TABLE (
    tipo TEXT,
    analisis_id UUID,
    score_total INTEGER,
    score_contacto INTEGER,
    score_compromiso INTEGER,
    validacion_tipo TEXT,
    hubo_abandono BOOLEAN,
    prob_cumplimiento INTEGER,
    fecha DATE
) AS $$
BEGIN
    -- Mejores llamadas
    RETURN QUERY
    SELECT 
        'mejor'::TEXT,
        al.analisis_id,
        al.score_total,
        al.score_contacto_directo,
        al.score_compromiso_pago,
        al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo',
        (al.modulo_abandono->>'hubo_abandono')::BOOLEAN,
        al.probabilidad_cumplimiento,
        al.created_at::DATE
    FROM analisis_llamadas al
    WHERE al.agente_id = p_agente_id
      AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    ORDER BY al.score_total DESC
    LIMIT p_cantidad;
    
    -- Peores llamadas
    RETURN QUERY
    SELECT 
        'peor'::TEXT,
        al.analisis_id,
        al.score_total,
        al.score_contacto_directo,
        al.score_compromiso_pago,
        al.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo',
        (al.modulo_abandono->>'hubo_abandono')::BOOLEAN,
        al.probabilidad_cumplimiento,
        al.created_at::DATE
    FROM analisis_llamadas al
    WHERE al.agente_id = p_agente_id
      AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    ORDER BY al.score_total ASC
    LIMIT p_cantidad;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 8. FUNCION PRINCIPAL: Obtener datos completos para coaching
-- Combina todas las metricas en un solo JSON
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_datos_coaching(
    p_agente_id UUID,
    p_dias INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
    v_agente RECORD;
    v_metricas RECORD;
    v_benchmark RECORD;
    v_ranking RECORD;
    v_anterior RECORD;
    v_alertas JSONB;
    v_muestra JSONB;
    v_resultado JSONB;
BEGIN
    -- 1. Datos del agente
    SELECT 
        a.agente_id,
        a.nombre,
        a.email,
        a.equipo,
        a.fecha_ingreso,
        EXTRACT(DAY FROM NOW() - a.fecha_ingreso)::INTEGER as dias_activo
    INTO v_agente
    FROM agentes a
    WHERE a.agente_id = p_agente_id;
    
    IF v_agente IS NULL THEN
        RETURN jsonb_build_object('error', 'Agente no encontrado');
    END IF;
    
    -- 2. Metricas del periodo
    SELECT * INTO v_metricas 
    FROM obtener_metricas_agente(p_agente_id, p_dias);
    
    IF v_metricas.total_llamadas < 5 THEN
        RETURN jsonb_build_object(
            'error', 'Insuficientes llamadas',
            'total_llamadas', v_metricas.total_llamadas,
            'minimo_requerido', 5
        );
    END IF;
    
    -- 3. Benchmark del equipo
    SELECT * INTO v_benchmark 
    FROM obtener_benchmark_equipo(v_agente.equipo, p_dias);
    
    -- 4. Ranking
    SELECT * INTO v_ranking
    FROM obtener_ranking_agente(p_agente_id, v_agente.equipo, p_dias);
    
    -- 5. Reporte anterior
    SELECT * INTO v_anterior
    FROM obtener_reporte_anterior(p_agente_id);
    
    -- 6. Alertas
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'codigo', codigo,
        'severidad', severidad,
        'descripcion', descripcion,
        'fecha', fecha,
        'estado', estado
    )), '[]'::JSONB)
    INTO v_alertas
    FROM obtener_alertas_agente(p_agente_id, p_dias);
    
    -- 7. Muestra de llamadas
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'tipo', tipo,
        'analisis_id', analisis_id,
        'score_total', score_total,
        'score_contacto', score_contacto,
        'score_compromiso', score_compromiso,
        'validacion_tipo', validacion_tipo,
        'hubo_abandono', hubo_abandono,
        'prob_cumplimiento', prob_cumplimiento,
        'fecha', fecha
    )), '[]'::JSONB)
    INTO v_muestra
    FROM obtener_muestra_llamadas(p_agente_id, p_dias, 3);
    
    -- Construir resultado
    v_resultado := jsonb_build_object(
        'agente', jsonb_build_object(
            'agente_id', v_agente.agente_id,
            'nombre', v_agente.nombre,
            'email', v_agente.email,
            'equipo', v_agente.equipo,
            'fecha_ingreso', v_agente.fecha_ingreso,
            'dias_activo', v_agente.dias_activo
        ),
        'metricas', jsonb_build_object(
            'periodo_dias', p_dias,
            'fecha_inicio', v_metricas.fecha_inicio,
            'fecha_fin', v_metricas.fecha_fin,
            'total_llamadas', v_metricas.total_llamadas,
            'score_promedio', v_metricas.score_promedio,
            'score_min', v_metricas.score_min,
            'score_max', v_metricas.score_max,
            'score_contacto_promedio', v_metricas.score_contacto_promedio,
            'score_compromiso_promedio', v_metricas.score_compromiso_promedio,
            'tasa_validacion_explicita', v_metricas.tasa_validacion_explicita,
            'tasa_abandono', v_metricas.tasa_abandono,
            'prob_cumplimiento_promedio', v_metricas.prob_cumplimiento_promedio,
            'distribucion', jsonb_build_object(
                'excelente_80_100', v_metricas.llamadas_excelentes,
                'bueno_60_79', v_metricas.llamadas_buenas,
                'regular_40_59', v_metricas.llamadas_regulares,
                'bajo_0_39', v_metricas.llamadas_bajas
            )
        ),
        'benchmark_equipo', jsonb_build_object(
            'equipo', v_agente.equipo,
            'total_agentes', v_benchmark.total_agentes,
            'total_llamadas', v_benchmark.total_llamadas,
            'score_promedio', v_benchmark.score_promedio,
            'score_top', v_benchmark.score_top,
            'tasa_validacion_promedio', v_benchmark.tasa_validacion_promedio,
            'prob_cumplimiento_promedio', v_benchmark.prob_cumplimiento_promedio,
            'tasa_abandono_promedio', v_benchmark.tasa_abandono_promedio
        ),
        'ranking', jsonb_build_object(
            'posicion', v_ranking.ranking,
            'total_agentes', v_ranking.total_agentes,
            'percentil', v_ranking.percentil,
            'score_agente', v_ranking.score_agente,
            'score_mejor', v_ranking.score_mejor,
            'score_promedio_equipo', v_ranking.score_promedio_equipo,
            'diferencia_vs_mejor', v_ranking.diferencia_vs_mejor,
            'diferencia_vs_promedio', v_ranking.diferencia_vs_promedio
        ),
        'reporte_anterior', CASE 
            WHEN v_anterior.reporte_id IS NOT NULL THEN jsonb_build_object(
                'reporte_id', v_anterior.reporte_id,
                'fecha', v_anterior.fecha_reporte,
                'score_anterior', v_anterior.score_anterior,
                'tasa_validacion_anterior', v_anterior.tasa_validacion_anterior,
                'objetivo_cumplido', v_anterior.objetivo_cumplido,
                'objetivo_semana', v_anterior.objetivo_semana,
                'gap_area', v_anterior.gap_area
            )
            ELSE NULL
        END,
        'tendencia', CASE 
            WHEN v_anterior.score_anterior IS NOT NULL THEN jsonb_build_object(
                'score_cambio', ROUND(v_metricas.score_promedio - v_anterior.score_anterior, 1),
                'direccion', CASE 
                    WHEN v_metricas.score_promedio - v_anterior.score_anterior > 3 THEN 'mejorando'
                    WHEN v_metricas.score_promedio - v_anterior.score_anterior < -3 THEN 'empeorando'
                    ELSE 'estable'
                END
            )
            ELSE jsonb_build_object('score_cambio', 0, 'direccion', 'sin_datos')
        END,
        'alertas', v_alertas,
        'muestra_llamadas', v_muestra
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 9. FUNCION: Obtener datos de todos los agentes para coaching
-- Para procesamiento batch
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_agentes_para_coaching(
    p_dias INTEGER DEFAULT 7,
    p_minimo_llamadas INTEGER DEFAULT 5
)
RETURNS TABLE (
    agente_id UUID,
    nombre TEXT,
    equipo TEXT,
    total_llamadas BIGINT,
    score_promedio NUMERIC,
    tiene_reporte_anterior BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.agente_id,
        a.nombre::TEXT,
        a.equipo::TEXT,
        COUNT(al.analisis_id)::BIGINT as total_llamadas,
        ROUND(AVG(al.score_total), 1) as score_promedio,
        EXISTS(SELECT 1 FROM coaching_reports cr WHERE cr.agente_id = a.agente_id) as tiene_reporte_anterior
    FROM agentes a
    LEFT JOIN analisis_llamadas al ON a.agente_id = al.agente_id
        AND al.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    WHERE a.estado = 'activo'
      AND a.fecha_ingreso < NOW() - INTERVAL '7 days'
    GROUP BY a.agente_id, a.nombre, a.equipo
    HAVING COUNT(al.analisis_id) >= p_minimo_llamadas
    ORDER BY a.equipo, a.nombre;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- VISTAS UTILES
-- ----------------------------------------------------------------------------

-- Vista: Resumen de agentes listos para coaching
DROP VIEW IF EXISTS v_agentes_coaching;
CREATE VIEW v_agentes_coaching AS
SELECT * FROM obtener_agentes_para_coaching(7, 5);


-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================

-- Obtener agentes listos para coaching:
-- SELECT * FROM obtener_agentes_para_coaching(7, 5);

-- Obtener metricas de un agente:
-- SELECT * FROM obtener_metricas_agente('11111111-1111-1111-1111-111111111111', 7);

-- Obtener benchmark del equipo:
-- SELECT * FROM obtener_benchmark_equipo('Equipo Norte', 7);

-- Obtener ranking del agente:
-- SELECT * FROM obtener_ranking_agente('11111111-1111-1111-1111-111111111111', 'Equipo Norte', 7);

-- Obtener reporte anterior:
-- SELECT * FROM obtener_reporte_anterior('11111111-1111-1111-1111-111111111111');

-- Obtener alertas del agente:
-- SELECT * FROM obtener_alertas_agente('44444444-4444-4444-4444-444444444444', 7);

-- Obtener muestra de llamadas:
-- SELECT * FROM obtener_muestra_llamadas('11111111-1111-1111-1111-111111111111', 7, 3);

-- FUNCION PRINCIPAL - Obtener todo para el LLM:
-- SELECT obtener_datos_coaching('11111111-1111-1111-1111-111111111111', 7);

-- Vista rapida:
-- SELECT * FROM v_agentes_coaching;

