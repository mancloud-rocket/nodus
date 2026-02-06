-- ============================================================================
-- DATOS DUMMY PARA TESTING DEL AGENTE COACH
-- Requiere: ejecutar primero seed_detector_test.sql
-- Fecha actual: 4 de febrero 2026
-- ============================================================================

-- ============================================================================
-- 1. COACHING REPORTS ANTERIORES (hace 7 dias - 28 de enero 2026)
-- Para comparar progreso
-- ============================================================================

INSERT INTO coaching_reports (
    reporte_id,
    agente_id,
    fecha_reporte,
    periodo_inicio,
    periodo_fin,
    total_llamadas_analizadas,
    metricas_periodo,
    comparativa_equipo,
    fortalezas,
    gap_critico,
    plan_mejora,
    progreso_vs_anterior,
    generado_por,
    modelo_usado
) VALUES

-- Maria Lopez (Estrella) - Reporte anterior con score 78 (mejoro a 82)
(
    'd0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '2026-01-28',
    '2026-01-21',
    '2026-01-28',
    15,
    '{
        "score_promedio": 78,
        "score_min": 70,
        "score_max": 85,
        "tasa_validacion": 0.85,
        "probabilidad_cumplimiento_promedio": 72,
        "tasa_abandono": 0.05,
        "duracion_promedio": 280
    }'::JSONB,
    '{
        "score_equipo": 65,
        "validacion_equipo": 0.45,
        "ranking": 1,
        "total_agentes": 6,
        "percentil": 95,
        "diferencia_vs_promedio": 13
    }'::JSONB,
    '[
        {"area": "Validacion de compromisos", "descripcion": "Excelente tasa de validacion explicita", "evidencia": "85% de validaciones explicitas", "impacto": "alto"},
        {"area": "Manejo de objeciones", "descripcion": "Responde con empatia y soluciones", "evidencia": "Score de manejo 88/100", "impacto": "alto"}
    ]'::JSONB,
    '{
        "area": "Consecuencias del impago",
        "descripcion": "Podria reforzar las consecuencias del no pago",
        "impacto": "medio",
        "ejemplos_registros": [],
        "frecuencia": "ocasional"
    }'::JSONB,
    '{
        "objetivo_semana": "Mantener score sobre 80 y mejorar mencion de consecuencias",
        "meta_cuantitativa": "Score >= 80, mencionar consecuencias en 80% de llamadas",
        "acciones": ["Incluir consecuencias en el pitch inicial", "Revisar script de cierre"],
        "registros_para_revisar": [],
        "recursos_sugeridos": ["Video: Tecnicas de urgencia"]
    }'::JSONB,
    '{
        "score_cambio": 3,
        "validacion_cambio": 0.05,
        "objetivo_anterior_cumplido": true,
        "notas": "Cumplio objetivo de mantener score sobre 75"
    }'::JSONB,
    'agente_coach',
    'claude-opus-4-5-20250514'
),

-- Carlos Mendez (Promedio) - Reporte anterior con score 62 (mejoro a 65)
(
    'd0000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '2026-01-28',
    '2026-01-21',
    '2026-01-28',
    12,
    '{
        "score_promedio": 62,
        "score_min": 52,
        "score_max": 72,
        "tasa_validacion": 0.35,
        "probabilidad_cumplimiento_promedio": 48,
        "tasa_abandono": 0.12,
        "duracion_promedio": 260
    }'::JSONB,
    '{
        "score_equipo": 65,
        "validacion_equipo": 0.45,
        "ranking": 3,
        "total_agentes": 6,
        "percentil": 50,
        "diferencia_vs_promedio": -3
    }'::JSONB,
    '[
        {"area": "Empatia", "descripcion": "Buen tono de voz y conexion inicial", "evidencia": "Clientes responden positivamente", "impacto": "medio"}
    ]'::JSONB,
    '{
        "area": "Validacion de compromisos",
        "descripcion": "Solo 35% de validaciones explicitas",
        "impacto": "alto",
        "ejemplos_registros": [],
        "frecuencia": "frecuente"
    }'::JSONB,
    '{
        "objetivo_semana": "Aumentar validaciones explicitas a 50%",
        "meta_cuantitativa": "Validacion explicita >= 50%",
        "acciones": ["Usar frase de cierre: Entonces confirmamos que pagara X el dia Y, correcto?"],
        "registros_para_revisar": [],
        "recursos_sugeridos": ["Script: Frases de validacion"]
    }'::JSONB,
    '{
        "score_cambio": 2,
        "validacion_cambio": 0.05,
        "objetivo_anterior_cumplido": false,
        "notas": "No alcanzo objetivo de 50% validacion"
    }'::JSONB,
    'agente_coach',
    'claude-opus-4-5-20250514'
),

-- Pedro Ruiz (En Riesgo) - Reporte anterior con score 55 (empeoro a 48)
(
    'd0000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    '2026-01-28',
    '2026-01-21',
    '2026-01-28',
    10,
    '{
        "score_promedio": 55,
        "score_min": 42,
        "score_max": 65,
        "tasa_validacion": 0.10,
        "probabilidad_cumplimiento_promedio": 38,
        "tasa_abandono": 0.20,
        "duracion_promedio": 220
    }'::JSONB,
    '{
        "score_equipo": 58,
        "validacion_equipo": 0.38,
        "ranking": 4,
        "total_agentes": 6,
        "percentil": 33,
        "diferencia_vs_promedio": -3
    }'::JSONB,
    '[
        {"area": "Conocimiento de producto", "descripcion": "Conoce bien las ofertas", "evidencia": "Explica claramente las opciones", "impacto": "medio"}
    ]'::JSONB,
    '{
        "area": "Cierre de llamadas",
        "descripcion": "Muchas llamadas terminan sin compromiso",
        "impacto": "critico",
        "ejemplos_registros": [],
        "frecuencia": "muy_frecuente"
    }'::JSONB,
    '{
        "objetivo_semana": "Mejorar score a 60 y reducir abandonos",
        "meta_cuantitativa": "Score >= 60, Abandonos <= 15%",
        "acciones": ["Escuchar activamente", "No interrumpir al cliente", "Usar validacion antes de colgar"],
        "registros_para_revisar": [],
        "recursos_sugeridos": ["Sesion 1:1 con supervisor", "Video: Tecnicas de cierre"]
    }'::JSONB,
    '{
        "score_cambio": -2,
        "validacion_cambio": -0.05,
        "objetivo_anterior_cumplido": false,
        "notas": "Score continua bajando, requiere intervencion"
    }'::JSONB,
    'agente_coach',
    'claude-opus-4-5-20250514'
),

-- Ana Torres (Critico) - Reporte anterior con score 38 (empeoro a 32)
(
    'd0000004-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    '2026-01-28',
    '2026-01-21',
    '2026-01-28',
    8,
    '{
        "score_promedio": 38,
        "score_min": 25,
        "score_max": 48,
        "tasa_validacion": 0.05,
        "probabilidad_cumplimiento_promedio": 22,
        "tasa_abandono": 0.35,
        "duracion_promedio": 180
    }'::JSONB,
    '{
        "score_equipo": 58,
        "validacion_equipo": 0.38,
        "ranking": 6,
        "total_agentes": 6,
        "percentil": 5,
        "diferencia_vs_promedio": -20
    }'::JSONB,
    '[]'::JSONB,
    '{
        "area": "Comunicacion general",
        "descripcion": "Dificultades en todos los modulos",
        "impacto": "critico",
        "ejemplos_registros": [],
        "frecuencia": "constante"
    }'::JSONB,
    '{
        "objetivo_semana": "Alcanzar score de 45",
        "meta_cuantitativa": "Score >= 45, Abandonos <= 25%",
        "acciones": ["Sesion intensiva con supervisor", "Shadowing con agente estrella", "Revisar 5 llamadas propias diarias"],
        "registros_para_revisar": [],
        "recursos_sugeridos": ["Entrenamiento basico de cobranza", "Mentoria con Maria Lopez"]
    }'::JSONB,
    '{
        "score_cambio": -4,
        "validacion_cambio": -0.05,
        "objetivo_anterior_cumplido": false,
        "notas": "Situacion critica - requiere plan de mejora inmediato"
    }'::JSONB,
    'agente_coach',
    'claude-opus-4-5-20250514'
),

-- Luis Garcia (Sin Validacion) - Reporte anterior con score 58 (mejoro a 60)
(
    'd0000005-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',
    '2026-01-28',
    '2026-01-21',
    '2026-01-28',
    11,
    '{
        "score_promedio": 58,
        "score_min": 50,
        "score_max": 68,
        "tasa_validacion": 0.08,
        "probabilidad_cumplimiento_promedio": 35,
        "tasa_abandono": 0.08,
        "duracion_promedio": 270
    }'::JSONB,
    '{
        "score_equipo": 62,
        "validacion_equipo": 0.42,
        "ranking": 3,
        "total_agentes": 4,
        "percentil": 25,
        "diferencia_vs_promedio": -4
    }'::JSONB,
    '[
        {"area": "Bajo abandono", "descripcion": "Mantiene al cliente en la llamada", "evidencia": "Solo 8% de abandonos", "impacto": "medio"}
    ]'::JSONB,
    '{
        "area": "Validacion de compromisos",
        "descripcion": "Casi nunca pide confirmacion explicita",
        "impacto": "critico",
        "ejemplos_registros": [],
        "frecuencia": "constante"
    }'::JSONB,
    '{
        "objetivo_semana": "Aumentar validaciones explicitas a 25%",
        "meta_cuantitativa": "Validacion explicita >= 25%",
        "acciones": ["Agregar pregunta de confirmacion al final de cada llamada", "Practicar frases de cierre"],
        "registros_para_revisar": [],
        "recursos_sugeridos": ["Script: 10 formas de validar un compromiso"]
    }'::JSONB,
    '{
        "score_cambio": 1,
        "validacion_cambio": 0.02,
        "objetivo_anterior_cumplido": false,
        "notas": "Mejora leve pero validaciones siguen muy bajas"
    }'::JSONB,
    'agente_coach',
    'claude-opus-4-5-20250514'
);

-- Sofia Vargas (Nueva) no tiene reporte anterior porque tiene solo 2 llamadas

-- ============================================================================
-- 2. ALERTAS PARA LOS AGENTES (usando agentes_relacionados)
-- ============================================================================

-- Alertas para Pedro Ruiz (del periodo anterior)
INSERT INTO alertas_anomalias (
    tipo, severidad, codigo, descripcion, 
    datos_soporte, agentes_relacionados, estado, created_at
) VALUES
(
    'individual', 'alta', 'AGENTE_SCORE_BAJO',
    'Score promedio bajo (55) en ultimas 24 horas',
    '{"score_promedio": 55, "total_llamadas": 10}'::JSONB,
    ARRAY['33333333-3333-3333-3333-333333333333'::UUID],
    'resuelta',
    '2026-01-26 08:00:00-05'
),
(
    'individual', 'alta', 'AGENTE_ABANDONO_ALTO',
    'Tasa de abandono alta (22%) en ultimas 24 horas',
    '{"tasa_abandono": 0.22, "abandonos": 2}'::JSONB,
    ARRAY['33333333-3333-3333-3333-333333333333'::UUID],
    'resuelta',
    '2026-01-27 08:00:00-05'
);

-- Alertas para Ana Torres (del periodo anterior - criticas)
INSERT INTO alertas_anomalias (
    tipo, severidad, codigo, descripcion, 
    datos_soporte, agentes_relacionados, estado, created_at
) VALUES
(
    'individual', 'critica', 'AGENTE_SCORE_CRITICO',
    'Score promedio critico (35) en ultimas 24 horas',
    '{"score_promedio": 35, "total_llamadas": 8}'::JSONB,
    ARRAY['44444444-4444-4444-4444-444444444444'::UUID],
    'en_revision',
    '2026-01-25 08:00:00-05'
),
(
    'individual', 'alta', 'AGENTE_ABANDONO_ALTO',
    'Tasa de abandono alta (35%) en ultimas 24 horas',
    '{"tasa_abandono": 0.35, "abandonos": 3}'::JSONB,
    ARRAY['44444444-4444-4444-4444-444444444444'::UUID],
    'en_revision',
    '2026-01-26 08:00:00-05'
),
(
    'patron', 'alta', 'PATRON_LLAMADAS_CRITICAS',
    '6 llamadas con score critico (<40) en 24 horas',
    '{"llamadas_criticas": 6, "total_llamadas": 8}'::JSONB,
    ARRAY['44444444-4444-4444-4444-444444444444'::UUID],
    'en_revision',
    '2026-01-27 08:00:00-05'
);

-- Alerta para Luis Garcia
INSERT INTO alertas_anomalias (
    tipo, severidad, codigo, descripcion, 
    datos_soporte, agentes_relacionados, estado, created_at
) VALUES
(
    'individual', 'alta', 'AGENTE_SIN_VALIDACION',
    'Tasa de validacion explicita muy baja (8%) en ultimas 24 horas',
    '{"tasa_validacion": 0.08, "validaciones": 1}'::JSONB,
    ARRAY['55555555-5555-5555-5555-555555555555'::UUID],
    'nueva',
    '2026-01-28 08:00:00-05'
);

-- ============================================================================
-- RESUMEN DE DATOS CREADOS
-- ============================================================================
-- 
-- COACHING REPORTS ANTERIORES (5):
-- - Maria Lopez: score 78 -> 82 (mejoro +4)
-- - Carlos Mendez: score 62 -> 65 (mejoro +3)
-- - Pedro Ruiz: score 55 -> 48 (empeoro -7) *EN RIESGO*
-- - Ana Torres: score 38 -> 32 (empeoro -6) *CRITICO*
-- - Luis Garcia: score 58 -> 60 (mejoro +2, pero validacion sigue baja)
-- - Sofia Vargas: sin reporte (nueva)
--
-- ALERTAS HISTORICAS (6):
-- - Pedro Ruiz: 2 alertas resueltas
-- - Ana Torres: 3 alertas en revision
-- - Luis Garcia: 1 alerta nueva
--
-- ============================================================================

