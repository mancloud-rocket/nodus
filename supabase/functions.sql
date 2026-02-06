-- ============================================
-- NODUS - Funciones útiles para Supabase
-- ============================================

-- ============================================
-- Función: Obtener métricas de dashboard
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_llamadas', COUNT(r.registro_id),
        'llamadas_hoy', COUNT(CASE WHEN DATE(r.timestamp_inicio) = CURRENT_DATE THEN 1 END),
        'score_promedio', ROUND(AVG(a.score_total), 2),
        'tasa_validacion', ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0), 
            4
        ),
        'probabilidad_promedio', ROUND(AVG(a.probabilidad_cumplimiento), 2),
        'alertas_activas', (
            SELECT COUNT(*) FROM alertas_anomalias 
            WHERE estado IN ('nueva', 'en_revision')
        ),
        'duracion_promedio', ROUND(AVG(r.duracion_segundos))
    ) INTO result
    FROM registro_llamadas r
    LEFT JOIN analisis_llamadas a ON r.registro_id = a.registro_id
    WHERE DATE(r.timestamp_inicio) BETWEEN fecha_inicio AND fecha_fin
      AND r.estado = 'analizado';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_dashboard_metrics IS 'Obtiene métricas principales para el dashboard';

-- ============================================
-- Función: Obtener métricas de agente
-- ============================================

CREATE OR REPLACE FUNCTION get_agente_metrics(
    p_agente_id UUID,
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'agente_id', p_agente_id,
        'agente_nombre', ag.nombre,
        'equipo', ag.equipo,
        'total_llamadas', COUNT(a.analisis_id),
        'score_promedio', ROUND(AVG(a.score_total), 2),
        'score_min', MIN(a.score_total),
        'score_max', MAX(a.score_total),
        'tasa_validacion', ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0) * 100, 
            2
        ),
        'probabilidad_cumplimiento_promedio', ROUND(AVG(a.probabilidad_cumplimiento), 2),
        'llamadas_alto_score', COUNT(CASE WHEN a.score_total >= 70 THEN 1 END),
        'llamadas_medio_score', COUNT(CASE WHEN a.score_total BETWEEN 40 AND 69 THEN 1 END),
        'llamadas_bajo_score', COUNT(CASE WHEN a.score_total < 40 THEN 1 END),
        'duracion_promedio', ROUND(AVG(r.duracion_segundos))
    ) INTO result
    FROM agentes ag
    LEFT JOIN analisis_llamadas a ON ag.agente_id = a.agente_id
    LEFT JOIN registro_llamadas r ON a.registro_id = r.registro_id
    WHERE ag.agente_id = p_agente_id
      AND a.fecha_llamada BETWEEN fecha_inicio AND fecha_fin
    GROUP BY ag.agente_id, ag.nombre, ag.equipo;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_agente_metrics IS 'Obtiene métricas detalladas de un agente específico';

-- ============================================
-- Función: Obtener métricas de equipo
-- ============================================

CREATE OR REPLACE FUNCTION get_equipo_metrics(
    p_equipo VARCHAR(100),
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'equipo', p_equipo,
        'total_agentes', COUNT(DISTINCT ag.agente_id),
        'total_llamadas', COUNT(a.analisis_id),
        'score_promedio_equipo', ROUND(AVG(a.score_total), 2),
        'tasa_validacion_equipo', ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0) * 100, 
            2
        ),
        'probabilidad_promedio', ROUND(AVG(a.probabilidad_cumplimiento), 2),
        'mejor_agente', (
            SELECT ag2.nombre
            FROM agentes ag2
            JOIN analisis_llamadas a2 ON ag2.agente_id = a2.agente_id
            WHERE ag2.equipo = p_equipo
              AND a2.fecha_llamada BETWEEN fecha_inicio AND fecha_fin
            GROUP BY ag2.agente_id, ag2.nombre
            ORDER BY AVG(a2.score_total) DESC
            LIMIT 1
        )
    ) INTO result
    FROM agentes ag
    LEFT JOIN analisis_llamadas a ON ag.agente_id = a.agente_id
    WHERE ag.equipo = p_equipo
      AND ag.estado = 'activo'
      AND a.fecha_llamada BETWEEN fecha_inicio AND fecha_fin
    GROUP BY ag.equipo;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_equipo_metrics IS 'Obtiene métricas agregadas de un equipo';

-- ============================================
-- Función: Tendencias por día
-- ============================================

CREATE OR REPLACE FUNCTION get_tendencias_diarias(
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    fecha DATE,
    total_llamadas BIGINT,
    score_promedio NUMERIC,
    tasa_validacion NUMERIC,
    probabilidad_promedio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.fecha_llamada as fecha,
        COUNT(a.analisis_id) as total_llamadas,
        ROUND(AVG(a.score_total), 2) as score_promedio,
        ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0) * 100, 
            2
        ) as tasa_validacion,
        ROUND(AVG(a.probabilidad_cumplimiento), 2) as probabilidad_promedio
    FROM analisis_llamadas a
    WHERE a.fecha_llamada BETWEEN fecha_inicio AND fecha_fin
    GROUP BY a.fecha_llamada
    ORDER BY fecha;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tendencias_diarias IS 'Devuelve tendencias diarias para gráficos';

-- ============================================
-- Función: Top performers
-- ============================================

CREATE OR REPLACE FUNCTION get_top_performers(
    limite INTEGER DEFAULT 10,
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    agente_id UUID,
    nombre VARCHAR,
    equipo VARCHAR,
    score_promedio NUMERIC,
    total_llamadas BIGINT,
    tasa_validacion NUMERIC,
    ranking BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ag.agente_id,
        ag.nombre,
        ag.equipo,
        ROUND(AVG(a.score_total), 2) as score_promedio,
        COUNT(a.analisis_id) as total_llamadas,
        ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0) * 100, 
            2
        ) as tasa_validacion,
        RANK() OVER (ORDER BY AVG(a.score_total) DESC) as ranking
    FROM agentes ag
    JOIN analisis_llamadas a ON ag.agente_id = a.agente_id
    WHERE ag.estado = 'activo'
      AND a.fecha_llamada BETWEEN fecha_inicio AND fecha_fin
    GROUP BY ag.agente_id, ag.nombre, ag.equipo
    HAVING COUNT(a.analisis_id) >= 5 -- Mínimo 5 llamadas para ranking
    ORDER BY score_promedio DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_performers IS 'Devuelve ranking de mejores agentes';

-- ============================================
-- Función: Búsqueda de registros con filtros
-- ============================================

CREATE OR REPLACE FUNCTION search_registros(
    p_search TEXT DEFAULT NULL,
    p_agente_id UUID DEFAULT NULL,
    p_estado estado_procesamiento DEFAULT NULL,
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_score_min INTEGER DEFAULT NULL,
    p_score_max INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    registro_id UUID,
    agente_nombre VARCHAR,
    cliente_ref VARCHAR,
    duracion_segundos INTEGER,
    timestamp_inicio TIMESTAMPTZ,
    estado estado_procesamiento,
    score_total INTEGER,
    probabilidad_cumplimiento INTEGER,
    tiene_alertas BOOLEAN,
    campana VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.registro_id,
        ag.nombre as agente_nombre,
        r.cliente_ref,
        r.duracion_segundos,
        r.timestamp_inicio,
        r.estado,
        a.score_total,
        a.probabilidad_cumplimiento,
        (a.alertas IS NOT NULL AND jsonb_array_length(a.alertas) > 0) as tiene_alertas,
        r.campana
    FROM registro_llamadas r
    LEFT JOIN agentes ag ON r.agente_id = ag.agente_id
    LEFT JOIN analisis_llamadas a ON r.registro_id = a.registro_id
    WHERE 
        (p_search IS NULL OR ag.nombre ILIKE '%' || p_search || '%' OR r.cliente_ref ILIKE '%' || p_search || '%')
        AND (p_agente_id IS NULL OR r.agente_id = p_agente_id)
        AND (p_estado IS NULL OR r.estado = p_estado)
        AND (p_fecha_desde IS NULL OR DATE(r.timestamp_inicio) >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR DATE(r.timestamp_inicio) <= p_fecha_hasta)
        AND (p_score_min IS NULL OR a.score_total >= p_score_min)
        AND (p_score_max IS NULL OR a.score_total <= p_score_max)
    ORDER BY r.timestamp_inicio DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_registros IS 'Búsqueda de registros con múltiples filtros';

-- ============================================
-- Función: Obtener últimos análisis de un agente
-- Para el AGENTE COACH
-- ============================================

CREATE OR REPLACE FUNCTION get_ultimos_analisis_agente(
    p_agente_id UUID,
    p_limite INTEGER DEFAULT 25
)
RETURNS TABLE (
    analisis_id UUID,
    registro_id UUID,
    fecha_llamada DATE,
    score_total INTEGER,
    score_contacto_directo INTEGER,
    score_compromiso_pago INTEGER,
    probabilidad_cumplimiento INTEGER,
    nivel_cumplimiento nivel_cumplimiento,
    tiene_validacion BOOLEAN,
    hubo_abandono BOOLEAN,
    alertas JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.analisis_id,
        a.registro_id,
        a.fecha_llamada,
        a.score_total,
        a.score_contacto_directo,
        a.score_compromiso_pago,
        a.probabilidad_cumplimiento,
        a.nivel_cumplimiento,
        (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean as tiene_validacion,
        (a.modulo_abandono->>'hubo_abandono')::boolean as hubo_abandono,
        a.alertas
    FROM analisis_llamadas a
    WHERE a.agente_id = p_agente_id
    ORDER BY a.created_at DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ultimos_analisis_agente IS 'Obtiene últimos N análisis de un agente - usado por Agente Coach';

-- ============================================
-- Función: Obtener alertas activas
-- Para el AGENTE DETECTOR y Dashboard
-- ============================================

CREATE OR REPLACE FUNCTION get_alertas_activas(
    p_severidad severidad_alerta DEFAULT NULL,
    p_tipo tipo_alerta DEFAULT NULL,
    p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
    alerta_id UUID,
    tipo tipo_alerta,
    severidad severidad_alerta,
    categoria VARCHAR,
    codigo VARCHAR,
    descripcion TEXT,
    agentes_relacionados UUID[],
    registro_id UUID,
    estado estado_alerta,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.alerta_id,
        al.tipo,
        al.severidad,
        al.categoria,
        al.codigo,
        al.descripcion,
        al.agentes_relacionados,
        al.registro_id,
        al.estado,
        al.created_at
    FROM alertas_anomalias al
    WHERE al.estado IN ('nueva', 'en_revision')
      AND (p_severidad IS NULL OR al.severidad = p_severidad)
      AND (p_tipo IS NULL OR al.tipo = p_tipo)
    ORDER BY 
        CASE al.severidad 
            WHEN 'critica' THEN 1 
            WHEN 'alta' THEN 2 
            WHEN 'media' THEN 3 
            WHEN 'baja' THEN 4 
        END,
        al.created_at DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_alertas_activas IS 'Obtiene alertas activas ordenadas por severidad';

-- ============================================
-- Función: Actualizar métricas agregadas
-- Para ejecutar via cron o post-análisis
-- ============================================

CREATE OR REPLACE FUNCTION refresh_metricas_agregadas(
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    -- Eliminar métricas existentes del día (por agente)
    DELETE FROM metricas_agregadas 
    WHERE fecha = p_fecha AND agente_id IS NOT NULL AND equipo IS NULL AND campana IS NULL;
    
    -- Insertar métricas por agente
    INSERT INTO metricas_agregadas (
        fecha, agente_id, total_llamadas, duracion_promedio_segundos,
        score_promedio, score_min, score_max,
        tasa_validacion, probabilidad_cumplimiento_promedio,
        llamadas_score_alto, llamadas_score_medio, llamadas_score_bajo,
        llamadas_con_abandono
    )
    SELECT 
        p_fecha,
        a.agente_id,
        COUNT(a.analisis_id),
        ROUND(AVG(r.duracion_segundos))::INTEGER,
        ROUND(AVG(a.score_total), 2),
        MIN(a.score_total),
        MAX(a.score_total),
        ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0), 
            4
        ),
        ROUND(AVG(a.probabilidad_cumplimiento), 2),
        COUNT(CASE WHEN a.score_total >= 70 THEN 1 END),
        COUNT(CASE WHEN a.score_total BETWEEN 40 AND 69 THEN 1 END),
        COUNT(CASE WHEN a.score_total < 40 THEN 1 END),
        COUNT(CASE WHEN (a.modulo_abandono->>'hubo_abandono')::boolean = true THEN 1 END)
    FROM analisis_llamadas a
    JOIN registro_llamadas r ON a.registro_id = r.registro_id
    WHERE a.fecha_llamada = p_fecha
    GROUP BY a.agente_id;
    
    -- Eliminar métricas globales del día
    DELETE FROM metricas_agregadas 
    WHERE fecha = p_fecha AND agente_id IS NULL AND equipo IS NULL AND campana IS NULL;
    
    -- Insertar métricas globales
    INSERT INTO metricas_agregadas (
        fecha, total_llamadas, duracion_promedio_segundos,
        score_promedio, score_min, score_max,
        tasa_validacion, probabilidad_cumplimiento_promedio,
        llamadas_score_alto, llamadas_score_medio, llamadas_score_bajo,
        llamadas_con_abandono, alertas_criticas, alertas_altas
    )
    SELECT 
        p_fecha,
        COUNT(a.analisis_id),
        ROUND(AVG(r.duracion_segundos))::INTEGER,
        ROUND(AVG(a.score_total), 2),
        MIN(a.score_total),
        MAX(a.score_total),
        ROUND(
            COUNT(CASE WHEN (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean = true THEN 1 END)::DECIMAL 
            / NULLIF(COUNT(a.analisis_id), 0), 
            4
        ),
        ROUND(AVG(a.probabilidad_cumplimiento), 2),
        COUNT(CASE WHEN a.score_total >= 70 THEN 1 END),
        COUNT(CASE WHEN a.score_total BETWEEN 40 AND 69 THEN 1 END),
        COUNT(CASE WHEN a.score_total < 40 THEN 1 END),
        COUNT(CASE WHEN (a.modulo_abandono->>'hubo_abandono')::boolean = true THEN 1 END),
        (SELECT COUNT(*) FROM alertas_anomalias WHERE DATE(created_at) = p_fecha AND severidad = 'critica'),
        (SELECT COUNT(*) FROM alertas_anomalias WHERE DATE(created_at) = p_fecha AND severidad = 'alta')
    FROM analisis_llamadas a
    JOIN registro_llamadas r ON a.registro_id = r.registro_id
    WHERE a.fecha_llamada = p_fecha;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_metricas_agregadas IS 'Recalcula métricas agregadas para una fecha - ejecutar via cron diario';

-- ============================================
-- Función: Obtener datos para el Agente Conversacional (RAG)
-- ============================================

CREATE OR REPLACE FUNCTION get_contexto_agente_para_chat(
    p_agente_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'agente', (
            SELECT json_build_object(
                'nombre', nombre,
                'equipo', equipo,
                'estado', estado,
                'fecha_ingreso', fecha_ingreso
            )
            FROM agentes WHERE agente_id = p_agente_id
        ),
        'metricas_recientes', (
            SELECT get_agente_metrics(p_agente_id, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE)
        ),
        'ultimo_coaching', (
            SELECT json_build_object(
                'fecha', fecha_reporte,
                'score_promedio', metricas_periodo->>'score_promedio',
                'tasa_validacion', metricas_periodo->>'tasa_validacion',
                'gap_critico', gap_critico->>'area',
                'objetivo', plan_mejora->>'objetivo_semana'
            )
            FROM coaching_reports
            WHERE agente_id = p_agente_id
            ORDER BY fecha_reporte DESC
            LIMIT 1
        ),
        'alertas_activas', (
            SELECT json_agg(json_build_object(
                'tipo', tipo,
                'severidad', severidad,
                'descripcion', descripcion
            ))
            FROM alertas_anomalias
            WHERE p_agente_id = ANY(agentes_relacionados)
              AND estado IN ('nueva', 'en_revision')
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_contexto_agente_para_chat IS 'Obtiene contexto completo de un agente para el Agente Conversacional';

-- ============================================
-- FIN DE FUNCIONES
-- ============================================
