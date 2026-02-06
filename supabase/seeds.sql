-- ============================================
-- NODUS - Seed Data for Development
-- Datos de prueba para desarrollo
-- ============================================

-- ============================================
-- AGENTES DE PRUEBA
-- ============================================

INSERT INTO agentes (agente_id, nombre, email, estado, equipo, fecha_ingreso, codigo_externo) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Carlos Ramírez', 'carlos.ramirez@360.com', 'activo', 'Equipo A', '2025-01-15', 'EXT-001'),
    ('a0000000-0000-0000-0000-000000000002', 'María González', 'maria.gonzalez@360.com', 'activo', 'Equipo A', '2025-02-01', 'EXT-002'),
    ('a0000000-0000-0000-0000-000000000003', 'José Pérez', 'jose.perez@360.com', 'activo', 'Equipo B', '2025-02-15', 'EXT-003'),
    ('a0000000-0000-0000-0000-000000000004', 'Ana Martínez', 'ana.martinez@360.com', 'activo', 'Equipo B', '2025-03-01', 'EXT-004'),
    ('a0000000-0000-0000-0000-000000000005', 'Luis Torres', 'luis.torres@360.com', 'activo', 'Equipo A', '2025-01-20', 'EXT-005'),
    ('a0000000-0000-0000-0000-000000000006', 'Fernando Urbano', 'fernando@360consultores.com', 'activo', 'Administración', '2024-01-01', 'EXT-ADMIN')
ON CONFLICT (agente_id) DO NOTHING;

-- Supervisor
UPDATE agentes SET supervisor_id = 'a0000000-0000-0000-0000-000000000006' 
WHERE agente_id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005');

-- ============================================
-- REGISTRO DE LLAMADAS DE PRUEBA
-- ============================================

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, tipo_deuda, monto_deuda, dias_mora, estado) VALUES
    ('r0000000-0000-0000-0000-000000000001', 'https://storage.externo.com/audio1.mp3', 'CALL-001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '245 seconds', 'a0000000-0000-0000-0000-000000000002', 'CL-45632', 'Recuperación Q1', 'Tarjeta de crédito', 1450.00, 45, 'analizado'),
    ('r0000000-0000-0000-0000-000000000002', 'https://storage.externo.com/audio2.mp3', 'CALL-002', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours' + INTERVAL '312 seconds', 'a0000000-0000-0000-0000-000000000001', 'CL-78901', 'Recuperación Q1', 'Préstamo personal', 3200.00, 30, 'analizado'),
    ('r0000000-0000-0000-0000-000000000003', 'https://storage.externo.com/audio3.mp3', 'CALL-003', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours' + INTERVAL '189 seconds', 'a0000000-0000-0000-0000-000000000003', 'CL-23456', 'Gestión temprana', 'Tarjeta de crédito', 890.00, 15, 'analizado'),
    ('r0000000-0000-0000-0000-000000000004', 'https://storage.externo.com/audio4.mp3', 'CALL-004', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours' + INTERVAL '156 seconds', 'a0000000-0000-0000-0000-000000000002', 'CL-34567', 'Recuperación Q1', 'Préstamo personal', 5600.00, 60, 'analizado'),
    ('r0000000-0000-0000-0000-000000000005', 'https://storage.externo.com/audio5.mp3', 'CALL-005', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '278 seconds', 'a0000000-0000-0000-0000-000000000004', 'CL-89012', 'Gestión temprana', 'Tarjeta de crédito', 2100.00, 20, 'transcrito')
ON CONFLICT (registro_id) DO NOTHING;

-- ============================================
-- TRANSCRIPCIONES DE PRUEBA
-- ============================================

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, entidades, metricas_conversacion, modelo_transcripcion, tiempo_procesamiento_ms) VALUES
    ('t0000000-0000-0000-0000-000000000001', 
     'r0000000-0000-0000-0000-000000000001', 
     'Buenos días, ¿hablo con el señor García? Sí, soy yo. Le llamo del área de recuperación para hablarle sobre su saldo vencido de 1,450 soles en su tarjeta de crédito. El vencimiento fue el 15 de diciembre. Entiendo, ¿qué opciones tengo? Puede pagar por nuestra web, app móvil o en cualquier agencia. Le sugiero regularizar antes del 15 de febrero para evitar intereses adicionales. Ok, entiendo, lo voy a revisar.',
     '[
        {"speaker": "agente", "timestamp_inicio": 0, "timestamp_fin": 3, "texto": "Buenos días, ¿hablo con el señor García?", "emocion": "neutral", "velocidad_habla": 145},
        {"speaker": "cliente", "timestamp_inicio": 3, "timestamp_fin": 5, "texto": "Sí, soy yo. ¿De dónde me llama?", "emocion": "neutral", "velocidad_habla": 140},
        {"speaker": "agente", "timestamp_inicio": 5, "timestamp_fin": 15, "texto": "Le llamo del área de recuperación para hablarle sobre su saldo vencido de 1,450 soles en su tarjeta de crédito. El vencimiento fue el 15 de diciembre.", "emocion": "neutral", "velocidad_habla": 150},
        {"speaker": "cliente", "timestamp_inicio": 15, "timestamp_fin": 18, "texto": "Entiendo, ¿qué opciones tengo?", "emocion": "neutral", "velocidad_habla": 135},
        {"speaker": "agente", "timestamp_inicio": 18, "timestamp_fin": 30, "texto": "Puede pagar por nuestra web, app móvil o en cualquier agencia. Le sugiero regularizar antes del 15 de febrero para evitar intereses adicionales.", "emocion": "positivo", "velocidad_habla": 148},
        {"speaker": "cliente", "timestamp_inicio": 30, "timestamp_fin": 35, "texto": "Ok, entiendo, lo voy a revisar.", "emocion": "neutral", "velocidad_habla": 130}
     ]'::jsonb,
     '{
        "montos": [{"valor": 1450, "moneda": "PEN", "contexto": "deuda_principal"}],
        "fechas": [{"fecha": "2025-12-15", "contexto": "vencimiento"}, {"fecha": "2026-02-15", "contexto": "compromiso_sugerido"}],
        "metodos_pago": ["web", "app", "agencia"],
        "objeciones": [],
        "compromisos": [{"tipo": "implicito", "fecha": "2026-02-15", "monto": 1450}]
     }'::jsonb,
     '{
        "palabras_agente": 65,
        "palabras_cliente": 18,
        "ratio_habla": 0.78,
        "interrupciones": 0,
        "silencios_largos": 0,
        "velocidad_promedio_agente": 148,
        "velocidad_promedio_cliente": 135
     }'::jsonb,
     'whisper-large-v3',
     45000
    ),
    ('t0000000-0000-0000-0000-000000000002', 
     'r0000000-0000-0000-0000-000000000002', 
     'Buenos días señor Rodríguez. Le llamo por su préstamo personal con saldo de 3,200 soles vencido hace 30 días. Necesitamos regularizar esta situación. Sí, he tenido problemas económicos. Entiendo su situación, ¿podría realizar un pago parcial de al menos 1,000 soles esta semana? Sí, puedo hacer eso el viernes. Perfecto, ¿me confirma que pagará 1,000 soles este viernes 31? Sí, confirmo que pagaré el viernes. Excelente, queda registrado.',
     '[
        {"speaker": "agente", "timestamp_inicio": 0, "timestamp_fin": 12, "texto": "Buenos días señor Rodríguez. Le llamo por su préstamo personal con saldo de 3,200 soles vencido hace 30 días. Necesitamos regularizar esta situación.", "emocion": "neutral", "velocidad_habla": 152},
        {"speaker": "cliente", "timestamp_inicio": 12, "timestamp_fin": 16, "texto": "Sí, he tenido problemas económicos.", "emocion": "negativo", "velocidad_habla": 125},
        {"speaker": "agente", "timestamp_inicio": 16, "timestamp_fin": 25, "texto": "Entiendo su situación, ¿podría realizar un pago parcial de al menos 1,000 soles esta semana?", "emocion": "positivo", "velocidad_habla": 145},
        {"speaker": "cliente", "timestamp_inicio": 25, "timestamp_fin": 30, "texto": "Sí, puedo hacer eso el viernes.", "emocion": "neutral", "velocidad_habla": 130},
        {"speaker": "agente", "timestamp_inicio": 30, "timestamp_fin": 38, "texto": "Perfecto, ¿me confirma que pagará 1,000 soles este viernes 31?", "emocion": "neutral", "velocidad_habla": 150},
        {"speaker": "cliente", "timestamp_inicio": 38, "timestamp_fin": 42, "texto": "Sí, confirmo que pagaré el viernes.", "emocion": "positivo", "velocidad_habla": 140},
        {"speaker": "agente", "timestamp_inicio": 42, "timestamp_fin": 45, "texto": "Excelente, queda registrado.", "emocion": "positivo", "velocidad_habla": 145}
     ]'::jsonb,
     '{
        "montos": [{"valor": 3200, "moneda": "PEN", "contexto": "deuda_principal"}, {"valor": 1000, "moneda": "PEN", "contexto": "pago_parcial"}],
        "fechas": [{"fecha": "2026-01-31", "contexto": "compromiso_pago"}],
        "metodos_pago": [],
        "objeciones": [{"tipo": "economica", "texto": "problemas económicos", "manejada": true}],
        "compromisos": [{"tipo": "explicito", "fecha": "2026-01-31", "monto": 1000, "validacion": "Sí, confirmo que pagaré el viernes"}]
     }'::jsonb,
     '{
        "palabras_agente": 58,
        "palabras_cliente": 22,
        "ratio_habla": 0.72,
        "interrupciones": 0,
        "silencios_largos": 0,
        "velocidad_promedio_agente": 148,
        "velocidad_promedio_cliente": 132
     }'::jsonb,
     'whisper-large-v3',
     52000
    ),
    ('t0000000-0000-0000-0000-000000000003', 
     'r0000000-0000-0000-0000-000000000003', 
     'Buenas tardes, ¿señora López? Sí, dígame. Le llamo por su tarjeta con saldo de 890 soles. No me interesa, estoy ocupada. Entiendo, solo le tomaré un minuto. No, no tengo tiempo, adiós.',
     '[
        {"speaker": "agente", "timestamp_inicio": 0, "timestamp_fin": 4, "texto": "Buenas tardes, ¿señora López?", "emocion": "neutral", "velocidad_habla": 140},
        {"speaker": "cliente", "timestamp_inicio": 4, "timestamp_fin": 6, "texto": "Sí, dígame.", "emocion": "neutral", "velocidad_habla": 130},
        {"speaker": "agente", "timestamp_inicio": 6, "timestamp_fin": 12, "texto": "Le llamo por su tarjeta con saldo de 890 soles.", "emocion": "neutral", "velocidad_habla": 145},
        {"speaker": "cliente", "timestamp_inicio": 12, "timestamp_fin": 16, "texto": "No me interesa, estoy ocupada.", "emocion": "negativo", "velocidad_habla": 155},
        {"speaker": "agente", "timestamp_inicio": 16, "timestamp_fin": 20, "texto": "Entiendo, solo le tomaré un minuto.", "emocion": "neutral", "velocidad_habla": 140},
        {"speaker": "cliente", "timestamp_inicio": 20, "timestamp_fin": 24, "texto": "No, no tengo tiempo, adiós.", "emocion": "negativo", "velocidad_habla": 160}
     ]'::jsonb,
     '{
        "montos": [{"valor": 890, "moneda": "PEN", "contexto": "deuda_principal"}],
        "fechas": [],
        "metodos_pago": [],
        "objeciones": [{"tipo": "tiempo", "texto": "estoy ocupada", "manejada": false}],
        "compromisos": []
     }'::jsonb,
     '{
        "palabras_agente": 22,
        "palabras_cliente": 14,
        "ratio_habla": 0.61,
        "interrupciones": 1,
        "silencios_largos": 0,
        "velocidad_promedio_agente": 142,
        "velocidad_promedio_cliente": 148
     }'::jsonb,
     'whisper-large-v3',
     28000
    )
ON CONFLICT (registro_id) DO NOTHING;

-- Actualizar registro_llamadas con transcripcion_id
UPDATE registro_llamadas SET transcripcion_id = 't0000000-0000-0000-0000-000000000001' WHERE registro_id = 'r0000000-0000-0000-0000-000000000001';
UPDATE registro_llamadas SET transcripcion_id = 't0000000-0000-0000-0000-000000000002' WHERE registro_id = 'r0000000-0000-0000-0000-000000000002';
UPDATE registro_llamadas SET transcripcion_id = 't0000000-0000-0000-0000-000000000003' WHERE registro_id = 'r0000000-0000-0000-0000-000000000003';

-- ============================================
-- ANÁLISIS DE PRUEBA
-- ============================================

INSERT INTO analisis_llamadas (
    analisis_id, registro_id, transcripcion_id, agente_id,
    score_total, score_contacto_directo, score_compromiso_pago,
    modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono,
    probabilidad_cumplimiento, nivel_cumplimiento, factores_prediccion,
    alertas, recomendaciones,
    modelo_usado, confianza_analisis, fecha_llamada
) VALUES
    -- Llamada 1: Score medio con alerta de validación
    ('an000000-0000-0000-0000-000000000001',
     'r0000000-0000-0000-0000-000000000001',
     't0000000-0000-0000-0000-000000000001',
     'a0000000-0000-0000-0000-000000000002',
     72, 85, 58,
     '{
        "score": 85,
        "desglose": {
            "monto_mencionado": {"presente": true, "puntos": 25, "max": 25, "evidencia": "su saldo vencido de 1,450 soles"},
            "fecha_vencimiento": {"presente": true, "puntos": 15, "max": 15, "evidencia": "vencimiento fue el 15 de diciembre"},
            "consecuencias_impago": {"presente": true, "puntos": 12, "max": 20, "evidencia": "evitar intereses adicionales"},
            "alternativas_pago": {"presente": true, "puntos": 15, "max": 15, "evidencia": "web, app móvil o agencia"},
            "manejo_objeciones": {"calidad": 0.8, "puntos": 18, "max": 25, "objeciones_detectadas": 0}
        }
     }'::jsonb,
     '{
        "score": 58,
        "desglose": {
            "oferta_clara": {"presente": true, "puntos": 20, "max": 20},
            "alternativas_pago": {"presente": true, "puntos": 10, "max": 10},
            "fecha_especifica": {"presente": true, "puntos": 20, "max": 20, "fecha": "2026-02-15"},
            "validacion_cliente": {"presente": false, "tipo": "implicita", "puntos": 8, "max": 50, "frase_exacta": "lo voy a revisar"}
        }
     }'::jsonb,
     '{"hubo_abandono": false}'::jsonb,
     58, 'media',
     '{
        "factores_positivos": ["Fecha específica acordada", "Buena explicación de alternativas", "Monto claramente comunicado"],
        "factores_negativos": ["Falta validación explícita (-30pts)", "Cliente no confirmó compromiso"],
        "razonamiento": "Aunque hay fecha clara y alternativas bien explicadas, la ausencia de validación explícita reduce significativamente la probabilidad de cumplimiento.",
        "historial_cliente_considerado": false
     }'::jsonb,
     '[{"tipo": "advertencia", "codigo": "FALTA_VALIDACION", "mensaje": "Cliente NO validó explícitamente el compromiso de pago", "severidad": "alta"}]'::jsonb,
     '[{"prioridad": "alta", "destinatario": "supervisor", "accion": "Llamar en 48hrs para reforzar compromiso con validación explícita", "cuando": "antes de fecha compromiso"}]'::jsonb,
     'claude-opus-4-5-20250514',
     0.89,
     CURRENT_DATE
    ),
    -- Llamada 2: Score alto con validación
    ('an000000-0000-0000-0000-000000000002',
     'r0000000-0000-0000-0000-000000000002',
     't0000000-0000-0000-0000-000000000002',
     'a0000000-0000-0000-0000-000000000001',
     89, 92, 86,
     '{
        "score": 92,
        "desglose": {
            "monto_mencionado": {"presente": true, "puntos": 25, "max": 25, "evidencia": "3,200 soles"},
            "fecha_vencimiento": {"presente": true, "puntos": 15, "max": 15, "evidencia": "vencido hace 30 días"},
            "consecuencias_impago": {"presente": true, "puntos": 18, "max": 20, "evidencia": "necesitamos regularizar"},
            "alternativas_pago": {"presente": true, "puntos": 12, "max": 15, "evidencia": "pago parcial"},
            "manejo_objeciones": {"calidad": 0.92, "puntos": 22, "max": 25, "objeciones_detectadas": 1}
        }
     }'::jsonb,
     '{
        "score": 86,
        "desglose": {
            "oferta_clara": {"presente": true, "puntos": 20, "max": 20},
            "alternativas_pago": {"presente": true, "puntos": 8, "max": 10},
            "fecha_especifica": {"presente": true, "puntos": 20, "max": 20, "fecha": "2026-01-31"},
            "validacion_cliente": {"presente": true, "tipo": "explicita", "puntos": 38, "max": 50, "frase_exacta": "Sí, confirmo que pagaré el viernes"}
        }
     }'::jsonb,
     '{"hubo_abandono": false}'::jsonb,
     82, 'alta',
     '{
        "factores_positivos": ["Validación EXPLÍCITA obtenida", "Fecha específica confirmada", "Monto acordado", "Excelente manejo de objeción económica"],
        "factores_negativos": ["Historial desconocido"],
        "razonamiento": "Alta probabilidad por validación explícita clara. Cliente confirmó verbalmente el compromiso de pago.",
        "historial_cliente_considerado": false
     }'::jsonb,
     '[]'::jsonb,
     '[{"prioridad": "baja", "destinatario": "sistema", "accion": "Enviar recordatorio SMS 1 día antes", "cuando": "2026-01-30"}]'::jsonb,
     'claude-opus-4-5-20250514',
     0.94,
     CURRENT_DATE
    ),
    -- Llamada 3: Score bajo con abandono
    ('an000000-0000-0000-0000-000000000003',
     'r0000000-0000-0000-0000-000000000003',
     't0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000003',
     34, 45, 22,
     '{
        "score": 45,
        "desglose": {
            "monto_mencionado": {"presente": true, "puntos": 25, "max": 25, "evidencia": "890 soles"},
            "fecha_vencimiento": {"presente": false, "puntos": 0, "max": 15, "evidencia": ""},
            "consecuencias_impago": {"presente": false, "puntos": 0, "max": 20, "evidencia": ""},
            "alternativas_pago": {"presente": false, "puntos": 0, "max": 15, "evidencia": ""},
            "manejo_objeciones": {"calidad": 0.3, "puntos": 20, "max": 25, "objeciones_detectadas": 1}
        }
     }'::jsonb,
     '{
        "score": 22,
        "desglose": {
            "oferta_clara": {"presente": false, "puntos": 0, "max": 20},
            "alternativas_pago": {"presente": false, "puntos": 0, "max": 10},
            "fecha_especifica": {"presente": false, "puntos": 0, "max": 20, "fecha": null},
            "validacion_cliente": {"presente": false, "tipo": "ninguna", "puntos": 0, "max": 50, "frase_exacta": ""}
        }
     }'::jsonb,
     '{"hubo_abandono": true, "momento_segundos": 24, "iniciado_por": "cliente", "razon": "Cliente colgó por falta de tiempo", "senales_previas": ["tono negativo", "respuestas cortas"]}'::jsonb,
     12, 'baja',
     '{
        "factores_positivos": [],
        "factores_negativos": ["Abandono de llamada", "Sin compromiso establecido", "Cliente frustrado", "Objeción no manejada efectivamente"],
        "razonamiento": "Muy baja probabilidad por abandono temprano. Cliente no mostró interés y el agente no logró retener la conversación.",
        "historial_cliente_considerado": false
     }'::jsonb,
     '[
        {"tipo": "critica", "codigo": "ABANDONO_LLAMADA", "mensaje": "Cliente abandonó la llamada frustrado", "severidad": "critica"},
        {"tipo": "critica", "codigo": "SCORE_BAJO", "mensaje": "Score muy por debajo del umbral (34/100)", "severidad": "alta"}
     ]'::jsonb,
     '[
        {"prioridad": "alta", "destinatario": "supervisor", "accion": "Reasignar cliente a agente senior", "cuando": "hoy"},
        {"prioridad": "alta", "destinatario": "agente", "accion": "Revisar llamada con supervisor para feedback", "cuando": "mañana"}
     ]'::jsonb,
     'claude-opus-4-5-20250514',
     0.91,
     CURRENT_DATE
    )
ON CONFLICT (registro_id) DO NOTHING;

-- Actualizar registro_llamadas con analisis_id
UPDATE registro_llamadas SET analisis_id = 'an000000-0000-0000-0000-000000000001' WHERE registro_id = 'r0000000-0000-0000-0000-000000000001';
UPDATE registro_llamadas SET analisis_id = 'an000000-0000-0000-0000-000000000002' WHERE registro_id = 'r0000000-0000-0000-0000-000000000002';
UPDATE registro_llamadas SET analisis_id = 'an000000-0000-0000-0000-000000000003' WHERE registro_id = 'r0000000-0000-0000-0000-000000000003';

-- ============================================
-- ALERTAS DE PRUEBA
-- ============================================

INSERT INTO alertas_anomalias (
    tipo, severidad, categoria, codigo, descripcion, causa_probable,
    impacto_estimado, accion_recomendada, agentes_relacionados, registro_id, estado
) VALUES
    ('individual', 'critica', 'performance', 'SCORE_BAJO',
     'Score crítico en llamada de José Pérez (34/100). Cliente abandonó frustrado.',
     'Mal manejo de objeciones y falta de técnica de retención',
     '{"llamadas_afectadas": 1, "perdida_oportunidades": 1, "monto_en_riesgo": 890}'::jsonb,
     '{"urgencia": "inmediata", "destinatario": "supervisor", "accion": "Revisar llamada y dar feedback al agente", "deadline": null}'::jsonb,
     ARRAY['a0000000-0000-0000-0000-000000000003']::UUID[],
     'r0000000-0000-0000-0000-000000000003',
     'nueva'
    ),
    ('sistemica', 'alta', 'tendencia', 'VALIDACION_BAJA',
     'Tasa de validación cayó 15% en las últimas 4 horas comparado con ayer.',
     'Posible cambio en script o perfil de clientes contactados',
     '{"llamadas_afectadas": 15, "perdida_oportunidades": 8, "monto_en_riesgo": 12500}'::jsonb,
     '{"urgencia": "hoy", "destinatario": "supervisor", "accion": "Revisar las últimas 10 llamadas sin validación", "deadline": null}'::jsonb,
     NULL,
     NULL,
     'nueva'
    ),
    ('patron', 'media', 'coaching', 'GAP_VALIDACION',
     'María González no logra validación explícita en 68% de sus llamadas esta semana.',
     'Gap en técnica de cierre - no usa preguntas de confirmación',
     '{"llamadas_afectadas": 17, "perdida_oportunidades": 6, "monto_en_riesgo": 8500}'::jsonb,
     '{"urgencia": "esta_semana", "destinatario": "supervisor", "accion": "Sesión de coaching sobre técnica de cierre", "deadline": null}'::jsonb,
     ARRAY['a0000000-0000-0000-0000-000000000002']::UUID[],
     NULL,
     'en_revision'
    );

-- ============================================
-- COACHING REPORT DE PRUEBA
-- ============================================

INSERT INTO coaching_reports (
    agente_id, fecha_reporte, periodo_inicio, periodo_fin, total_llamadas_analizadas,
    metricas_periodo, comparativa_equipo, fortalezas, gap_critico, plan_mejora, progreso_vs_anterior
) VALUES
    ('a0000000-0000-0000-0000-000000000002',
     CURRENT_DATE,
     CURRENT_DATE - INTERVAL '5 days',
     CURRENT_DATE,
     23,
     '{
        "score_promedio": 72,
        "score_min": 58,
        "score_max": 85,
        "tasa_validacion": 0.32,
        "probabilidad_cumplimiento_promedio": 48,
        "tasa_abandono": 0.04,
        "duracion_promedio": 245
     }'::jsonb,
     '{
        "score_equipo": 78,
        "validacion_equipo": 0.61,
        "ranking": 8,
        "total_agentes": 12,
        "percentil": 65,
        "diferencia_vs_promedio": -6
     }'::jsonb,
     '[
        {
            "area": "manejo_objeciones",
            "descripcion": "Excelente técnica de empatía al escuchar problemas del cliente",
            "evidencia": "92% de objeciones bien manejadas en las llamadas analizadas",
            "impacto": "Reduce abandono en 15%"
        },
        {
            "area": "comunicacion_alternativas",
            "descripcion": "Siempre presenta múltiples opciones de pago",
            "evidencia": "100% de llamadas incluyen alternativas",
            "impacto": "Aumenta flexibilidad percibida"
        }
     ]'::jsonb,
     '{
        "area": "validacion_cliente",
        "descripcion": "En 18 de 25 llamadas (72%) no logra validación explícita del compromiso",
        "impacto": "Reduce cumplimiento real en aproximadamente 35%",
        "ejemplos_registros": ["r0000000-0000-0000-0000-000000000001"],
        "frecuencia": "Casi todas las llamadas"
     }'::jsonb,
     '{
        "objetivo_semana": "Lograr validación explícita en más del 75% de los compromisos",
        "meta_cuantitativa": "Subir tasa de validación de 32% a 75%",
        "acciones": [
            {
                "accion": "Role-play de técnica de cierre",
                "como": "15 minutos diarios con supervisor usando el script de confirmación",
                "prioridad": "alta",
                "duracion": "15 min/día"
            },
            {
                "accion": "Revisar 3 llamadas exitosas de Carlos Ramírez",
                "como": "Observar cómo obtiene validación de forma natural",
                "prioridad": "media",
                "duracion": "30 min total"
            },
            {
                "accion": "Usar frase estándar de cierre",
                "como": "Al final de cada compromiso preguntar: ¿Me confirma que realizará el pago de X soles el día Y?",
                "prioridad": "alta",
                "duracion": "En cada llamada"
            }
        ],
        "registros_para_revisar": [
            {
                "registro_id": "r0000000-0000-0000-0000-000000000001",
                "razon": "ejemplo_negativo",
                "que_observar": "Momento donde cliente dice ok pero no valida explícitamente"
            }
        ],
        "recursos_sugeridos": ["Video: Técnicas de cierre efectivas", "Documento: Frases de validación"]
     }'::jsonb,
     '{
        "score_cambio": 3,
        "validacion_cambio": -5,
        "objetivo_anterior_cumplido": false,
        "notas": "Score mejoró pero validación empeoró. Foco en técnica de cierre."
     }'::jsonb
    );

-- ============================================
-- MÉTRICAS AGREGADAS DE PRUEBA
-- ============================================

INSERT INTO metricas_agregadas (
    fecha, agente_id, total_llamadas, duracion_promedio_segundos, score_promedio, 
    tasa_validacion, probabilidad_cumplimiento_promedio,
    llamadas_score_alto, llamadas_score_medio, llamadas_score_bajo
) VALUES
    (CURRENT_DATE, 'a0000000-0000-0000-0000-000000000001', 5, 280, 82.5, 0.75, 68.2, 4, 1, 0),
    (CURRENT_DATE, 'a0000000-0000-0000-0000-000000000002', 8, 235, 72.3, 0.32, 45.5, 3, 4, 1),
    (CURRENT_DATE, 'a0000000-0000-0000-0000-000000000003', 3, 165, 45.2, 0.15, 22.8, 0, 1, 2),
    (CURRENT_DATE - INTERVAL '1 day', 'a0000000-0000-0000-0000-000000000001', 6, 295, 78.9, 0.68, 62.1, 3, 3, 0),
    (CURRENT_DATE - INTERVAL '1 day', 'a0000000-0000-0000-0000-000000000002', 7, 250, 69.8, 0.42, 48.3, 2, 4, 1);

-- Métricas globales del día
INSERT INTO metricas_agregadas (
    fecha, total_llamadas, duracion_promedio_segundos, score_promedio,
    tasa_validacion, probabilidad_cumplimiento_promedio,
    llamadas_score_alto, llamadas_score_medio, llamadas_score_bajo,
    alertas_criticas, alertas_altas
) VALUES
    (CURRENT_DATE, 16, 227, 66.7, 0.41, 45.5, 7, 6, 3, 1, 1);

-- ============================================
-- FIN DE SEEDS
-- ============================================

SELECT 'Seed data insertado correctamente' as mensaje;
