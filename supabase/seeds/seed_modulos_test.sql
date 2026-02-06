-- ============================================
-- NODUS - Datos de Prueba para Modulos Dashboard
-- Fecha actual: 4 de febrero de 2026
-- ============================================

-- Limpiar datos anteriores (si existen)
DELETE FROM analisis_llamadas WHERE fecha_llamada >= '2026-01-20';
DELETE FROM transcripciones WHERE created_at >= '2026-01-20';
DELETE FROM registro_llamadas WHERE timestamp_inicio >= '2026-01-20';

-- ============================================
-- Insertar agentes de prueba (si no existen)
-- ============================================

INSERT INTO agentes (agente_id, nombre, email, estado, equipo, fecha_ingreso) VALUES
('a0000001-0000-0000-0000-000000000001', 'Carlos Ramirez', 'carlos.ramirez@empresa.com', 'activo', 'Equipo Norte', '2024-01-15'),
('a0000001-0000-0000-0000-000000000002', 'Maria Gonzalez', 'maria.gonzalez@empresa.com', 'activo', 'Equipo Sur', '2024-03-20'),
('a0000001-0000-0000-0000-000000000003', 'Luis Torres', 'luis.torres@empresa.com', 'activo', 'Equipo Norte', '2024-06-10'),
('a0000001-0000-0000-0000-000000000004', 'Ana Martinez', 'ana.martinez@empresa.com', 'activo', 'Equipo Centro', '2024-08-05'),
('a0000001-0000-0000-0000-000000000005', 'Jose Perez', 'jose.perez@empresa.com', 'activo', 'Equipo Sur', '2024-09-12')
ON CONFLICT (agente_id) DO NOTHING;

-- ============================================
-- Funcion auxiliar para generar datos
-- ============================================

-- Insertar registros de llamadas y analisis para los ultimos 14 dias
-- Cada agente tendra entre 8-15 llamadas

DO $$
DECLARE
    v_agente RECORD;
    v_registro_id UUID;
    v_transcripcion_id UUID;
    v_fecha DATE;
    v_hora TIME;
    v_duracion INTEGER;
    v_score_contacto INTEGER;
    v_score_compromiso INTEGER;
    v_score_total INTEGER;
    v_prob_cumplimiento INTEGER;
    v_tiene_oferta BOOLEAN;
    v_tiene_alternativas BOOLEAN;
    v_tiene_fecha BOOLEAN;
    v_tiene_validacion BOOLEAN;
    v_hubo_abandono BOOLEAN;
    v_momento_abandono INTEGER;
    v_razon_abandono TEXT;
    v_i INTEGER;
    v_num_llamadas INTEGER;
BEGIN
    -- Para cada agente
    FOR v_agente IN SELECT agente_id, nombre FROM agentes WHERE estado = 'activo' LOOP
        
        -- Numero aleatorio de llamadas (8-15)
        v_num_llamadas := 8 + floor(random() * 8)::integer;
        
        -- Para cada llamada
        FOR v_i IN 1..v_num_llamadas LOOP
            -- Fecha aleatoria en los ultimos 14 dias
            v_fecha := CURRENT_DATE - (floor(random() * 14)::integer || ' days')::interval;
            v_hora := (8 + floor(random() * 10))::integer || ':' || (floor(random() * 60))::integer || ':00';
            v_duracion := 120 + floor(random() * 300)::integer;
            
            -- Generar scores basados en el agente (algunos mejores que otros)
            CASE 
                WHEN v_agente.nombre = 'Carlos Ramirez' THEN
                    v_score_contacto := 75 + floor(random() * 15)::integer;
                    v_score_compromiso := 80 + floor(random() * 15)::integer;
                WHEN v_agente.nombre = 'Maria Gonzalez' THEN
                    v_score_contacto := 70 + floor(random() * 15)::integer;
                    v_score_compromiso := 72 + floor(random() * 15)::integer;
                WHEN v_agente.nombre = 'Luis Torres' THEN
                    v_score_contacto := 65 + floor(random() * 15)::integer;
                    v_score_compromiso := 68 + floor(random() * 15)::integer;
                WHEN v_agente.nombre = 'Ana Martinez' THEN
                    v_score_contacto := 58 + floor(random() * 15)::integer;
                    v_score_compromiso := 60 + floor(random() * 15)::integer;
                ELSE
                    v_score_contacto := 50 + floor(random() * 15)::integer;
                    v_score_compromiso := 55 + floor(random() * 15)::integer;
            END CASE;
            
            v_score_total := (v_score_contacto + v_score_compromiso) / 2;
            
            -- Elementos de compromiso (probabilistico basado en score)
            v_tiene_oferta := random() < (v_score_compromiso::numeric / 100);
            v_tiene_alternativas := random() < ((v_score_compromiso - 10)::numeric / 100);
            v_tiene_fecha := random() < ((v_score_compromiso - 20)::numeric / 100);
            v_tiene_validacion := random() < ((v_score_compromiso - 40)::numeric / 100);
            
            -- Probabilidad de cumplimiento basada en elementos
            v_prob_cumplimiento := 5;
            IF v_tiene_oferta THEN v_prob_cumplimiento := v_prob_cumplimiento + 15; END IF;
            IF v_tiene_alternativas THEN v_prob_cumplimiento := v_prob_cumplimiento + 10; END IF;
            IF v_tiene_fecha THEN v_prob_cumplimiento := v_prob_cumplimiento + 15; END IF;
            IF v_tiene_validacion THEN v_prob_cumplimiento := v_prob_cumplimiento + 40; END IF;
            v_prob_cumplimiento := v_prob_cumplimiento + floor(random() * 15)::integer;
            IF v_prob_cumplimiento > 100 THEN v_prob_cumplimiento := 100; END IF;
            
            -- Abandono (mas probable si score bajo)
            v_hubo_abandono := random() < (1 - v_score_total::numeric / 100) * 0.5;
            IF v_hubo_abandono THEN
                v_momento_abandono := 15 + floor(random() * 120)::integer;
                v_razon_abandono := CASE floor(random() * 4)::integer
                    WHEN 0 THEN 'Cliente no interesado'
                    WHEN 1 THEN 'Monto muy alto'
                    WHEN 2 THEN 'Sin opciones de pago'
                    ELSE 'Objeciones no resueltas'
                END;
            ELSE
                v_momento_abandono := NULL;
                v_razon_abandono := NULL;
            END IF;
            
            -- Insertar registro de llamada
            v_registro_id := uuid_generate_v4();
            INSERT INTO registro_llamadas (
                registro_id, audio_url, audio_id_externo,
                timestamp_inicio, timestamp_fin, duracion_segundos, timestamp_fecha,
                agente_id, cliente_ref, campana, estado
            ) VALUES (
                v_registro_id,
                'https://storage.example.com/audio/' || v_registro_id || '.mp3',
                'audio_' || floor(random() * 100000)::integer,
                (v_fecha || ' ' || v_hora)::timestamptz,
                (v_fecha || ' ' || v_hora)::timestamptz + (v_duracion || ' seconds')::interval,
                v_duracion,
                v_fecha,
                v_agente.agente_id,
                'CLI-' || floor(random() * 100000)::integer,
                CASE floor(random() * 3)::integer WHEN 0 THEN 'Cobranza Temprana' WHEN 1 THEN 'Cobranza Media' ELSE 'Cobranza Dificil' END,
                'analizado'
            );
            
            -- Insertar transcripcion
            v_transcripcion_id := uuid_generate_v4();
            INSERT INTO transcripciones (
                transcripcion_id, registro_id, transcripcion_completa, segmentos,
                modelo_transcripcion, modelo_emociones, modelo_entidades
            ) VALUES (
                v_transcripcion_id,
                v_registro_id,
                'Transcripcion de llamada de cobranza...',
                '[]'::jsonb,
                'gemini-2.0-flash',
                'gemini-2.0-flash',
                'claude-sonnet-4'
            );
            
            -- Actualizar registro con transcripcion_id
            UPDATE registro_llamadas SET transcripcion_id = v_transcripcion_id WHERE registro_id = v_registro_id;
            
            -- Insertar analisis
            INSERT INTO analisis_llamadas (
                registro_id, transcripcion_id, agente_id,
                score_total, score_contacto_directo, score_compromiso_pago,
                modulo_contacto_directo,
                modulo_compromiso_pago,
                modulo_abandono,
                probabilidad_cumplimiento, nivel_cumplimiento,
                factores_prediccion, alertas, recomendaciones,
                modelo_usado, version_prompt, confianza_analisis,
                fecha_llamada
            ) VALUES (
                v_registro_id, v_transcripcion_id, v_agente.agente_id,
                v_score_total, v_score_contacto, v_score_compromiso,
                jsonb_build_object(
                    'score', v_score_contacto,
                    'desglose', jsonb_build_object(
                        'monto_mencionado', jsonb_build_object('presente', random() < 0.75, 'puntos', floor(random() * 25)::integer, 'max', 25, 'evidencia', ''),
                        'fecha_vencimiento', jsonb_build_object('presente', random() < 0.70, 'puntos', floor(random() * 15)::integer, 'max', 15, 'evidencia', ''),
                        'consecuencias_impago', jsonb_build_object('presente', random() < 0.60, 'puntos', floor(random() * 20)::integer, 'max', 20, 'evidencia', ''),
                        'alternativas_pago', jsonb_build_object('presente', random() < 0.65, 'puntos', floor(random() * 15)::integer, 'max', 15, 'evidencia', ''),
                        'manejo_objeciones', jsonb_build_object('calidad', floor(random() * 5)::integer, 'puntos', floor(random() * 25)::integer, 'max', 25, 'objeciones_detectadas', floor(random() * 3)::integer)
                    )
                ),
                jsonb_build_object(
                    'score', v_score_compromiso,
                    'desglose', jsonb_build_object(
                        'oferta_clara', jsonb_build_object('presente', v_tiene_oferta, 'puntos', CASE WHEN v_tiene_oferta THEN 15 + floor(random() * 5)::integer ELSE floor(random() * 10)::integer END, 'max', 20),
                        'alternativas_pago', jsonb_build_object('presente', v_tiene_alternativas, 'puntos', CASE WHEN v_tiene_alternativas THEN 7 + floor(random() * 3)::integer ELSE floor(random() * 5)::integer END, 'max', 10),
                        'fecha_especifica', jsonb_build_object('presente', v_tiene_fecha, 'puntos', CASE WHEN v_tiene_fecha THEN 15 + floor(random() * 5)::integer ELSE floor(random() * 10)::integer END, 'max', 20, 'fecha', CASE WHEN v_tiene_fecha THEN (CURRENT_DATE + (floor(random() * 30)::integer || ' days')::interval)::text ELSE NULL END),
                        'validacion_cliente', jsonb_build_object('presente', v_tiene_validacion, 'tipo', CASE WHEN v_tiene_validacion THEN 'explicita' ELSE 'ninguna' END, 'puntos', CASE WHEN v_tiene_validacion THEN 40 + floor(random() * 10)::integer ELSE floor(random() * 20)::integer END, 'max', 50, 'frase_exacta', CASE WHEN v_tiene_validacion THEN 'Si, confirmo el pago' ELSE '' END)
                    )
                ),
                jsonb_build_object(
                    'hubo_abandono', v_hubo_abandono,
                    'momento_segundos', v_momento_abandono,
                    'iniciado_por', CASE WHEN v_hubo_abandono THEN 'cliente' ELSE NULL END,
                    'razon', v_razon_abandono,
                    'senales_previas', '[]'::jsonb
                ),
                v_prob_cumplimiento,
                CASE 
                    WHEN v_prob_cumplimiento >= 70 THEN 'alta'
                    WHEN v_prob_cumplimiento >= 40 THEN 'media'
                    ELSE 'baja'
                END::nivel_cumplimiento,
                jsonb_build_object(
                    'factores_positivos', '[]'::jsonb,
                    'factores_negativos', '[]'::jsonb,
                    'razonamiento', 'Analisis automatico',
                    'historial_cliente_considerado', false
                ),
                '[]'::jsonb,
                '[]'::jsonb,
                'claude-opus-4',
                'v1.0',
                0.85 + (random() * 0.15),
                v_fecha
            );
            
            -- Actualizar registro con analisis_id
            UPDATE registro_llamadas rl 
            SET analisis_id = al.analisis_id 
            FROM analisis_llamadas al 
            WHERE rl.registro_id = al.registro_id AND rl.registro_id = v_registro_id;
            
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- Verificar datos insertados
-- ============================================

SELECT 'Registros de llamadas insertados:' as info, COUNT(*) as total FROM registro_llamadas WHERE timestamp_fecha >= '2026-01-20';
SELECT 'Analisis insertados:' as info, COUNT(*) as total FROM analisis_llamadas WHERE fecha_llamada >= '2026-01-20';
SELECT 'Por agente:' as info;
SELECT ag.nombre, COUNT(*) as llamadas, ROUND(AVG(al.score_total), 1) as score_promedio
FROM analisis_llamadas al
JOIN agentes ag ON al.agente_id = ag.agente_id
WHERE al.fecha_llamada >= '2026-01-20'
GROUP BY ag.nombre
ORDER BY score_promedio DESC;

-- ============================================
-- Probar vistas
-- ============================================

SELECT 'Vista vista_kpis_principales:' as vista;
SELECT * FROM vista_kpis_principales LIMIT 5;

SELECT 'Vista vista_compromiso_elementos:' as vista;
SELECT * FROM vista_compromiso_elementos;

SELECT 'Vista vista_agente_modulos:' as vista;
SELECT agente_nombre, score_contacto, score_compromiso, tasa_abandono, score_total FROM vista_agente_modulos;

