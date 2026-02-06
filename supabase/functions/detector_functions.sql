-- ============================================================================
-- FUNCIONES DEL AGENTE DETECTOR
-- Evaluacion de reglas por agente y sistemicas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCION: Evaluar alertas de un agente especifico (por ID)
-- Recibe: UUID del agente
-- Retorna: tabla con alertas detectadas
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluar_alertas_agente(
    p_agente_id UUID,
    p_periodo_horas INTEGER DEFAULT 24
)
RETURNS TABLE (
    tipo TEXT,
    severidad TEXT,
    codigo TEXT,
    descripcion TEXT,
    agente_id UUID,
    agente_nombre TEXT,
    equipo TEXT,
    datos JSONB,
    accion_requerida TEXT
) AS $$
DECLARE
    v_agente_nombre TEXT;
    v_equipo TEXT;
    v_total_llamadas INTEGER;
    v_score_promedio NUMERIC;
    v_abandonos INTEGER;
    v_validaciones INTEGER;
    v_llamadas_criticas INTEGER;
    v_prob_promedio NUMERIC;
    v_tasa_abandono NUMERIC;
    v_tasa_validacion NUMERIC;
    v_score_ayer NUMERIC;
    v_caida_porcentaje NUMERIC;
BEGIN
    -- Obtener datos del agente
    SELECT a.nombre, a.equipo
    INTO v_agente_nombre, v_equipo
    FROM agentes a
    WHERE a.agente_id = p_agente_id;
    
    -- Si no existe el agente, retornar vacio
    IF v_agente_nombre IS NULL THEN
        RETURN;
    END IF;
    
    -- Calcular metricas del periodo
    SELECT 
        COUNT(*),
        AVG(score_total),
        COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true'),
        COUNT(*) FILTER (
            WHERE modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
        ),
        COUNT(*) FILTER (WHERE score_total < 40),
        AVG(probabilidad_cumplimiento)
    INTO 
        v_total_llamadas,
        v_score_promedio,
        v_abandonos,
        v_validaciones,
        v_llamadas_criticas,
        v_prob_promedio
    FROM analisis_llamadas al
    WHERE al.agente_id = p_agente_id
      AND al.created_at >= NOW() - (p_periodo_horas || ' hours')::INTERVAL;
    
    -- Si no hay suficientes llamadas, retornar vacio
    IF v_total_llamadas < 3 THEN
        RETURN;
    END IF;
    
    -- Calcular tasas
    v_tasa_abandono := v_abandonos::NUMERIC / v_total_llamadas;
    v_tasa_validacion := v_validaciones::NUMERIC / v_total_llamadas;
    
    -- Obtener score del dia anterior para comparar
    SELECT AVG(al.score_total)
    INTO v_score_ayer
    FROM analisis_llamadas al
    WHERE al.agente_id = p_agente_id
      AND al.created_at >= NOW() - ((p_periodo_horas * 2) || ' hours')::INTERVAL
      AND al.created_at < NOW() - (p_periodo_horas || ' hours')::INTERVAL;
    
    -- Calcular caida porcentual
    IF v_score_ayer IS NOT NULL AND v_score_ayer > 0 THEN
        v_caida_porcentaje := ((v_score_ayer - v_score_promedio) / v_score_ayer) * 100;
    ELSE
        v_caida_porcentaje := 0;
    END IF;
    
    -- ========================================================================
    -- EVALUAR REGLAS
    -- ========================================================================
    
    -- REGLA 1: AGENTE_SCORE_CRITICO (score < 40)
    IF v_score_promedio < 40 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'critica'::TEXT,
            'AGENTE_SCORE_CRITICO'::TEXT,
            format('Score promedio critico (%s) en ultimas %s horas', 
                   ROUND(v_score_promedio), p_periodo_horas),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'score_promedio', ROUND(v_score_promedio),
                'total_llamadas', v_total_llamadas,
                'llamadas_criticas', v_llamadas_criticas,
                'umbral', 40
            ),
            'Intervencion inmediata - coaching urgente'::TEXT;
    
    -- REGLA 2: AGENTE_SCORE_BAJO (score 40-55)
    ELSIF v_score_promedio < 55 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'alta'::TEXT,
            'AGENTE_SCORE_BAJO'::TEXT,
            format('Score promedio bajo (%s) en ultimas %s horas', 
                   ROUND(v_score_promedio), p_periodo_horas),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'score_promedio', ROUND(v_score_promedio),
                'total_llamadas', v_total_llamadas,
                'umbral', 55
            ),
            'Incluir en revision de coaching prioritaria'::TEXT;
    END IF;
    
    -- REGLA 3: AGENTE_ABANDONO_ALTO (> 20%)
    IF v_tasa_abandono > 0.20 AND v_total_llamadas >= 5 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'alta'::TEXT,
            'AGENTE_ABANDONO_ALTO'::TEXT,
            format('Tasa de abandono alta (%s%%) en ultimas %s horas', 
                   ROUND(v_tasa_abandono * 100), p_periodo_horas),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'tasa_abandono', ROUND(v_tasa_abandono, 2),
                'abandonos', v_abandonos,
                'total_llamadas', v_total_llamadas,
                'umbral', 0.20
            ),
            'Revisar grabaciones y dar feedback sobre rapport'::TEXT;
    END IF;
    
    -- REGLA 4: AGENTE_SIN_VALIDACION (< 15%)
    IF v_tasa_validacion < 0.15 AND v_total_llamadas >= 5 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'alta'::TEXT,
            'AGENTE_SIN_VALIDACION'::TEXT,
            format('Tasa de validacion explicita muy baja (%s%%) en ultimas %s horas', 
                   ROUND(v_tasa_validacion * 100), p_periodo_horas),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'tasa_validacion', ROUND(v_tasa_validacion, 2),
                'validaciones', v_validaciones,
                'total_llamadas', v_total_llamadas,
                'umbral', 0.15
            ),
            'Reforzar tecnicas de cierre y validacion'::TEXT;
    END IF;
    
    -- REGLA 5: AGENTE_CAIDA_SCORE (> 15% caida)
    IF v_caida_porcentaje > 15 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'media'::TEXT,
            'AGENTE_CAIDA_SCORE'::TEXT,
            format('Caida de score del %s%% vs dia anterior', 
                   ROUND(v_caida_porcentaje)),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'score_hoy', ROUND(v_score_promedio),
                'score_ayer', ROUND(v_score_ayer),
                'caida_porcentaje', ROUND(v_caida_porcentaje, 1)
            ),
            'Investigar causa de la caida'::TEXT;
    END IF;
    
    -- REGLA 6: PATRON_LLAMADAS_CRITICAS (>= 5 llamadas con score < 40)
    IF v_llamadas_criticas >= 5 THEN
        RETURN QUERY SELECT
            'patron'::TEXT,
            'alta'::TEXT,
            'PATRON_LLAMADAS_CRITICAS'::TEXT,
            format('%s llamadas con score critico (<40) en %s horas', 
                   v_llamadas_criticas, p_periodo_horas),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'llamadas_criticas', v_llamadas_criticas,
                'total_llamadas', v_total_llamadas,
                'porcentaje', ROUND((v_llamadas_criticas::NUMERIC / v_total_llamadas) * 100)
            ),
            'Revision urgente de casos criticos'::TEXT;
    END IF;
    
    -- REGLA 7: AGENTE_PROBABILIDAD_BAJA (< 30%)
    IF v_prob_promedio < 30 AND v_total_llamadas >= 5 THEN
        RETURN QUERY SELECT
            'individual'::TEXT,
            'media'::TEXT,
            'AGENTE_PROBABILIDAD_BAJA'::TEXT,
            format('Probabilidad de cumplimiento promedio muy baja (%s%%)', 
                   ROUND(v_prob_promedio)),
            p_agente_id,
            v_agente_nombre,
            v_equipo,
            jsonb_build_object(
                'probabilidad_promedio', ROUND(v_prob_promedio),
                'total_llamadas', v_total_llamadas,
                'umbral', 30
            ),
            'Evaluar calidad de compromisos obtenidos'::TEXT;
    END IF;
    
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 2. FUNCION: Evaluar alertas por nombre del agente
-- Wrapper que busca el ID por nombre
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluar_alertas_agente_por_nombre(
    p_agente_nombre TEXT,
    p_periodo_horas INTEGER DEFAULT 24
)
RETURNS TABLE (
    tipo TEXT,
    severidad TEXT,
    codigo TEXT,
    descripcion TEXT,
    agente_id UUID,
    agente_nombre TEXT,
    equipo TEXT,
    datos JSONB,
    accion_requerida TEXT
) AS $$
DECLARE
    v_agente_id UUID;
BEGIN
    -- Buscar agente por nombre
    SELECT a.agente_id INTO v_agente_id
    FROM agentes a
    WHERE a.nombre ILIKE p_agente_nombre
    LIMIT 1;
    
    IF v_agente_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY SELECT * FROM evaluar_alertas_agente(v_agente_id, p_periodo_horas);
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 3. FUNCION: Evaluar alertas de TODOS los agentes
-- Retorna: tabla con alertas de todos los agentes activos
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluar_alertas_todos_agentes(
    p_periodo_horas INTEGER DEFAULT 24
)
RETURNS TABLE (
    tipo TEXT,
    severidad TEXT,
    codigo TEXT,
    descripcion TEXT,
    agente_id UUID,
    agente_nombre TEXT,
    equipo TEXT,
    datos JSONB,
    accion_requerida TEXT
) AS $$
DECLARE
    v_agente RECORD;
BEGIN
    -- Obtener lista de agentes con llamadas en el periodo
    FOR v_agente IN
        SELECT DISTINCT al.agente_id
        FROM analisis_llamadas al
        WHERE al.created_at >= NOW() - (p_periodo_horas || ' hours')::INTERVAL
          AND al.agente_id IS NOT NULL
    LOOP
        -- Evaluar alertas para cada agente
        RETURN QUERY 
        SELECT * FROM evaluar_alertas_agente(v_agente.agente_id, p_periodo_horas);
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 4. FUNCION: Evaluar alertas sistemicas
-- Retorna: tabla con alertas a nivel sistema
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION evaluar_alertas_sistemicas(
    p_periodo_horas INTEGER DEFAULT 24
)
RETURNS TABLE (
    tipo TEXT,
    severidad TEXT,
    codigo TEXT,
    descripcion TEXT,
    agente_id UUID,
    agente_nombre TEXT,
    equipo TEXT,
    datos JSONB,
    accion_requerida TEXT
) AS $$
DECLARE
    v_total_llamadas INTEGER;
    v_score_promedio NUMERIC;
    v_abandonos INTEGER;
    v_validaciones INTEGER;
    v_llamadas_anterior INTEGER;
    v_score_anterior NUMERIC;
    v_abandonos_anterior INTEGER;
    v_tasa_abandono NUMERIC;
    v_tasa_validacion NUMERIC;
    v_caida_score NUMERIC;
    v_porcentaje_volumen NUMERIC;
BEGIN
    -- Obtener metricas del periodo actual
    SELECT 
        COUNT(*),
        AVG(score_total),
        COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true'),
        COUNT(*) FILTER (
            WHERE modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
        )
    INTO 
        v_total_llamadas,
        v_score_promedio,
        v_abandonos,
        v_validaciones
    FROM analisis_llamadas
    WHERE created_at >= NOW() - (p_periodo_horas || ' hours')::INTERVAL;
    
    -- Obtener metricas del periodo anterior (para comparar)
    SELECT 
        COUNT(*),
        AVG(score_total),
        COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true')
    INTO 
        v_llamadas_anterior,
        v_score_anterior,
        v_abandonos_anterior
    FROM analisis_llamadas
    WHERE created_at >= NOW() - ((p_periodo_horas * 2) || ' hours')::INTERVAL
      AND created_at < NOW() - (p_periodo_horas || ' hours')::INTERVAL;
    
    -- Si no hay suficientes datos, retornar vacio
    IF v_total_llamadas < 10 THEN
        RETURN;
    END IF;
    
    -- Calcular metricas derivadas
    v_tasa_abandono := v_abandonos::NUMERIC / v_total_llamadas;
    v_tasa_validacion := v_validaciones::NUMERIC / v_total_llamadas;
    
    IF v_score_anterior IS NOT NULL AND v_score_anterior > 0 THEN
        v_caida_score := ((v_score_anterior - v_score_promedio) / v_score_anterior) * 100;
    ELSE
        v_caida_score := 0;
    END IF;
    
    IF v_llamadas_anterior IS NOT NULL AND v_llamadas_anterior > 0 THEN
        v_porcentaje_volumen := (v_total_llamadas::NUMERIC / v_llamadas_anterior) * 100;
    ELSE
        v_porcentaje_volumen := 100;
    END IF;
    
    -- ========================================================================
    -- EVALUAR REGLAS SISTEMICAS
    -- ========================================================================
    
    -- REGLA 1: SISTEMA_TASA_ABANDONO (> 25% global)
    IF v_tasa_abandono > 0.25 THEN
        RETURN QUERY SELECT
            'sistemica'::TEXT,
            'critica'::TEXT,
            'SISTEMA_TASA_ABANDONO'::TEXT,
            format('Tasa de abandono global del %s%% en ultimas %s horas', 
                   ROUND(v_tasa_abandono * 100), p_periodo_horas),
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            jsonb_build_object(
                'tasa_abandono', ROUND(v_tasa_abandono, 2),
                'abandonos', v_abandonos,
                'total_llamadas', v_total_llamadas,
                'umbral', 0.25
            ),
            'Revision de operaciones - posible problema sistemico'::TEXT;
    END IF;
    
    -- REGLA 2: SISTEMA_CAIDA_SCORES (> 10% caida)
    IF v_caida_score > 10 THEN
        RETURN QUERY SELECT
            'sistemica'::TEXT,
            'alta'::TEXT,
            'SISTEMA_CAIDA_SCORES'::TEXT,
            format('Score promedio global cayo %s%% vs periodo anterior', 
                   ROUND(v_caida_score)),
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            jsonb_build_object(
                'score_actual', ROUND(v_score_promedio),
                'score_anterior', ROUND(v_score_anterior),
                'caida_porcentaje', ROUND(v_caida_score, 1)
            ),
            'Investigar causa de la caida global'::TEXT;
    END IF;
    
    -- REGLA 3: SISTEMA_VALIDACION_BAJA (< 30% global)
    IF v_tasa_validacion < 0.30 THEN
        RETURN QUERY SELECT
            'sistemica'::TEXT,
            'alta'::TEXT,
            'SISTEMA_VALIDACION_BAJA'::TEXT,
            format('Tasa de validacion explicita global del %s%%', 
                   ROUND(v_tasa_validacion * 100)),
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            jsonb_build_object(
                'tasa_validacion', ROUND(v_tasa_validacion, 2),
                'validaciones', v_validaciones,
                'total_llamadas', v_total_llamadas,
                'umbral', 0.30
            ),
            'Refuerzo de script de cierre a todos los agentes'::TEXT;
    END IF;
    
    -- REGLA 4: SISTEMA_VOLUMEN_BAJO (< 70% del esperado)
    IF v_porcentaje_volumen < 70 THEN
        RETURN QUERY SELECT
            'sistemica'::TEXT,
            'media'::TEXT,
            'SISTEMA_VOLUMEN_BAJO'::TEXT,
            format('Volumen de llamadas al %s%% vs periodo anterior', 
                   ROUND(v_porcentaje_volumen)),
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            jsonb_build_object(
                'llamadas_actual', v_total_llamadas,
                'llamadas_anterior', v_llamadas_anterior,
                'porcentaje', ROUND(v_porcentaje_volumen)
            ),
            'Verificar problemas de personal o tecnicos'::TEXT;
    END IF;
    
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 5. FUNCION: Ejecutar detector completo
-- Combina alertas de agentes + sistemicas
-- Filtra duplicados y retorna alertas nuevas
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ejecutar_detector(
    p_periodo_horas INTEGER DEFAULT 24,
    p_ventana_dedup_dias INTEGER DEFAULT 3
)
RETURNS TABLE (
    tipo TEXT,
    severidad TEXT,
    codigo TEXT,
    descripcion TEXT,
    agente_id UUID,
    agente_nombre TEXT,
    equipo TEXT,
    datos JSONB,
    accion_requerida TEXT,
    es_nueva BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH todas_alertas AS (
        -- Alertas de agentes
        SELECT * FROM evaluar_alertas_todos_agentes(p_periodo_horas)
        UNION ALL
        -- Alertas sistemicas
        SELECT * FROM evaluar_alertas_sistemicas(p_periodo_horas)
    ),
    alertas_existentes AS (
        -- Alertas de los ultimos N dias para deduplicacion
        SELECT DISTINCT aa.codigo, aa.agentes_relacionados[1] as ag_id
        FROM alertas_anomalias aa
        WHERE aa.created_at >= NOW() - (p_ventana_dedup_dias || ' days')::INTERVAL
    )
    SELECT 
        ta.tipo,
        ta.severidad,
        ta.codigo,
        ta.descripcion,
        ta.agente_id,
        ta.agente_nombre,
        ta.equipo,
        ta.datos,
        ta.accion_requerida,
        NOT EXISTS (
            SELECT 1 FROM alertas_existentes ae
            WHERE ae.codigo = ta.codigo 
              AND (ae.ag_id = ta.agente_id OR (ae.ag_id IS NULL AND ta.agente_id IS NULL))
        ) AS es_nueva
    FROM todas_alertas ta;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 6. FUNCION: Obtener metricas globales del periodo
-- Para generar el resumen diario
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_metricas_periodo(
    p_periodo_horas INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_llamadas BIGINT,
    score_promedio NUMERIC,
    tasa_abandono NUMERIC,
    tasa_validacion NUMERIC,
    prob_cumplimiento_promedio NUMERIC,
    llamadas_anterior BIGINT,
    score_anterior NUMERIC,
    cambio_llamadas_porcentaje NUMERIC,
    cambio_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH actual AS (
        SELECT 
            COUNT(*) as total,
            AVG(score_total) as score,
            COUNT(*) FILTER (WHERE modulo_abandono->>'hubo_abandono' = 'true')::NUMERIC / 
                NULLIF(COUNT(*), 0) as abandono,
            COUNT(*) FILTER (
                WHERE modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'tipo' = 'explicita'
            )::NUMERIC / NULLIF(COUNT(*), 0) as validacion,
            AVG(probabilidad_cumplimiento) as prob
        FROM analisis_llamadas
        WHERE created_at >= NOW() - (p_periodo_horas || ' hours')::INTERVAL
    ),
    anterior AS (
        SELECT 
            COUNT(*) as total,
            AVG(score_total) as score
        FROM analisis_llamadas
        WHERE created_at >= NOW() - ((p_periodo_horas * 2) || ' hours')::INTERVAL
          AND created_at < NOW() - (p_periodo_horas || ' hours')::INTERVAL
    )
    SELECT 
        a.total,
        ROUND(a.score, 1),
        ROUND(a.abandono, 2),
        ROUND(a.validacion, 2),
        ROUND(a.prob, 1),
        ant.total,
        ROUND(ant.score, 1),
        CASE WHEN ant.total > 0 
             THEN ROUND(((a.total::NUMERIC - ant.total) / ant.total) * 100, 1)
             ELSE NULL END,
        ROUND(a.score - COALESCE(ant.score, a.score), 1)
    FROM actual a, anterior ant;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 7. VISTA: Resumen de alertas por agente (ultimas 24h)
-- Para consultas rapidas
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS v_alertas_agentes_24h;
CREATE VIEW v_alertas_agentes_24h AS
SELECT * FROM evaluar_alertas_todos_agentes(24);


-- ----------------------------------------------------------------------------
-- 8. VISTA: Resumen de alertas sistemicas (ultimas 24h)
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS v_alertas_sistemicas_24h;
CREATE VIEW v_alertas_sistemicas_24h AS
SELECT * FROM evaluar_alertas_sistemicas(24);


-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================

-- Evaluar alertas de un agente por ID:
-- SELECT * FROM evaluar_alertas_agente('11111111-1111-1111-1111-111111111111', 24);

-- Evaluar alertas de un agente por nombre:
-- SELECT * FROM evaluar_alertas_agente_por_nombre('Maria Lopez', 24);

-- Evaluar alertas de todos los agentes:
-- SELECT * FROM evaluar_alertas_todos_agentes(24);

-- Evaluar alertas sistemicas:
-- SELECT * FROM evaluar_alertas_sistemicas(24);

-- Ejecutar detector completo con deduplicacion:
-- SELECT * FROM ejecutar_detector(24, 3) WHERE es_nueva = true;

-- Obtener metricas del periodo:
-- SELECT * FROM obtener_metricas_periodo(24);

-- Usar vistas:
-- SELECT * FROM v_alertas_agentes_24h;
-- SELECT * FROM v_alertas_sistemicas_24h;
