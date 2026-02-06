-- ============================================================================
-- DATOS DUMMY PARA TESTING DEL AGENTE DETECTOR
-- Fecha actual: 4 de febrero 2026, 05:16 AM
-- Periodo: Ultimas 48 horas (desde 2 de febrero 2026, 05:16 AM)
-- ============================================================================

-- Limpiar datos existentes (en orden correcto por FKs)
TRUNCATE analisis_llamadas CASCADE;
TRUNCATE transcripciones CASCADE;
TRUNCATE registro_llamadas CASCADE;
TRUNCATE agentes CASCADE;

-- ============================================================================
-- 1. AGENTES (6 agentes con diferentes perfiles)
-- ============================================================================

INSERT INTO agentes (agente_id, nombre, email, equipo, estado, fecha_ingreso) VALUES
-- Agente ESTRELLA: score alto, buena validacion
('11111111-1111-1111-1111-111111111111', 'Maria Lopez', 'maria.lopez@empresa.com', 'Equipo Norte', 'activo', '2023-01-15'),

-- Agente PROMEDIO: score normal
('22222222-2222-2222-2222-222222222222', 'Carlos Mendez', 'carlos.mendez@empresa.com', 'Equipo Norte', 'activo', '2023-06-01'),

-- Agente EN RIESGO: score bajo (40-55)
('33333333-3333-3333-3333-333333333333', 'Pedro Ruiz', 'pedro.ruiz@empresa.com', 'Equipo Sur', 'activo', '2024-02-01'),

-- Agente CRITICO: score muy bajo (<40), alto abandono
('44444444-4444-4444-4444-444444444444', 'Ana Torres', 'ana.torres@empresa.com', 'Equipo Sur', 'activo', '2024-08-01'),

-- Agente SIN VALIDACION: score ok pero sin validaciones explicitas
('55555555-5555-5555-5555-555555555555', 'Luis Garcia', 'luis.garcia@empresa.com', 'Equipo Centro', 'activo', '2023-09-15'),

-- Agente NUEVO: pocas llamadas
('66666666-6666-6666-6666-666666666666', 'Sofia Vargas', 'sofia.vargas@empresa.com', 'Equipo Centro', 'activo', '2026-01-15');

-- ============================================================================
-- 2. REGISTRO DE LLAMADAS + TRANSCRIPCIONES + ANALISIS
-- Distribuidas en las ultimas 48 horas
-- ============================================================================

-- -------------------------------------------------------------------------------
-- MARIA LOPEZ (Estrella) - 12 llamadas, score promedio ~82
-- -------------------------------------------------------------------------------

-- Llamada 1
INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado)
VALUES ('a0000001-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML001', 'ML001', '2026-02-02 09:15:00-05', '2026-02-02 09:19:30-05', '11111111-1111-1111-1111-111111111111', 'CLI-001', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion)
VALUES ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Transcripcion Maria Lopez llamada 1...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at)
VALUES ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 
85, 82, 88,
'{"score": 82, "desglose": {"monto_mencionado": {"presente": true, "puntos": 25, "max": 25}, "validacion_cliente": {"tipo": "explicita", "puntos": 45, "max": 50}}}'::JSONB,
'{"score": 88, "desglose": {"validacion_cliente": {"presente": true, "tipo": "explicita", "puntos": 45, "max": 50}}}'::JSONB,
'{"hubo_abandono": false}'::JSONB,
78, 'alta', '2026-02-02', '2026-02-02 09:25:00-05');

-- Llamadas 2-12 para Maria Lopez (scores altos 75-90)
INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000002-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML002', 'ML002', '2026-02-02 10:30:00-05', '2026-02-02 10:35:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-002', 'CAMPANA_Q1', 'analizado'),
('a0000003-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML003', 'ML003', '2026-02-02 11:45:00-05', '2026-02-02 11:50:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-003', 'CAMPANA_Q1', 'analizado'),
('a0000004-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML004', 'ML004', '2026-02-02 14:00:00-05', '2026-02-02 14:06:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-004', 'CAMPANA_Q1', 'analizado'),
('a0000005-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML005', 'ML005', '2026-02-02 15:15:00-05', '2026-02-02 15:20:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-005', 'CAMPANA_Q1', 'analizado'),
('a0000006-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML006', 'ML006', '2026-02-02 16:30:00-05', '2026-02-02 16:35:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-006', 'CAMPANA_Q1', 'analizado'),
('a0000007-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML007', 'ML007', '2026-02-03 09:00:00-05', '2026-02-03 09:05:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-007', 'CAMPANA_Q1', 'analizado'),
('a0000008-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML008', 'ML008', '2026-02-03 10:15:00-05', '2026-02-03 10:20:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-008', 'CAMPANA_Q1', 'analizado'),
('a0000009-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML009', 'ML009', '2026-02-03 11:30:00-05', '2026-02-03 11:36:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-009', 'CAMPANA_Q1', 'analizado'),
('a0000010-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML010', 'ML010', '2026-02-03 14:00:00-05', '2026-02-03 14:05:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-010', 'CAMPANA_Q1', 'analizado'),
('a0000011-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML011', 'ML011', '2026-02-03 15:15:00-05', '2026-02-03 15:21:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-011', 'CAMPANA_Q1', 'analizado'),
('a0000012-0000-0000-0000-000000000001', 'https://drive.google.com/file/ML012', 'ML012', '2026-02-03 16:30:00-05', '2026-02-03 16:35:00-05', '11111111-1111-1111-1111-111111111111', 'CLI-012', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000002-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001', 'Transcripcion ML002...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000003-0000-0000-0000-000000000001', 'a0000003-0000-0000-0000-000000000001', 'Transcripcion ML003...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000004-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'Transcripcion ML004...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000005-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'Transcripcion ML005...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000006-0000-0000-0000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'Transcripcion ML006...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000007-0000-0000-0000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'Transcripcion ML007...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000008-0000-0000-0000-000000000001', 'a0000008-0000-0000-0000-000000000001', 'Transcripcion ML008...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000009-0000-0000-0000-000000000001', 'a0000009-0000-0000-0000-000000000001', 'Transcripcion ML009...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000010-0000-0000-0000-000000000001', 'a0000010-0000-0000-0000-000000000001', 'Transcripcion ML010...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000011-0000-0000-0000-000000000001', 'a0000011-0000-0000-0000-000000000001', 'Transcripcion ML011...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000012-0000-0000-0000-000000000001', 'a0000012-0000-0000-0000-000000000001', 'Transcripcion ML012...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000002-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 80, 78, 82, '{"score": 78}'::JSONB, '{"score": 82, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 72, 'alta', '2026-02-02', '2026-02-02 10:40:00-05'),
('c0000003-0000-0000-0000-000000000001', 'a0000003-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 88, 85, 91, '{"score": 85}'::JSONB, '{"score": 91, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 85, 'alta', '2026-02-02', '2026-02-02 11:55:00-05'),
('c0000004-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 76, 74, 78, '{"score": 74}'::JSONB, '{"score": 78, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 68, 'media', '2026-02-02', '2026-02-02 14:10:00-05'),
('c0000005-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'b0000005-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 82, 80, 84, '{"score": 80}'::JSONB, '{"score": 84, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 75, 'alta', '2026-02-02', '2026-02-02 15:25:00-05'),
('c0000006-0000-0000-0000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'b0000006-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 90, 88, 92, '{"score": 88}'::JSONB, '{"score": 92, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 88, 'alta', '2026-02-02', '2026-02-02 16:40:00-05'),
('c0000007-0000-0000-0000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'b0000007-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 78, 76, 80, '{"score": 76}'::JSONB, '{"score": 80, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 70, 'media', '2026-02-03', '2026-02-03 09:10:00-05'),
('c0000008-0000-0000-0000-000000000001', 'a0000008-0000-0000-0000-000000000001', 'b0000008-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 84, 82, 86, '{"score": 82}'::JSONB, '{"score": 86, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 78, 'alta', '2026-02-03', '2026-02-03 10:25:00-05'),
('c0000009-0000-0000-0000-000000000001', 'a0000009-0000-0000-0000-000000000001', 'b0000009-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 86, 84, 88, '{"score": 84}'::JSONB, '{"score": 88, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 82, 'alta', '2026-02-03', '2026-02-03 11:40:00-05'),
('c0000010-0000-0000-0000-000000000001', 'a0000010-0000-0000-0000-000000000001', 'b0000010-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 79, 77, 81, '{"score": 77}'::JSONB, '{"score": 81, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 71, 'media', '2026-02-03', '2026-02-03 14:10:00-05'),
('c0000011-0000-0000-0000-000000000001', 'a0000011-0000-0000-0000-000000000001', 'b0000011-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 83, 81, 85, '{"score": 81}'::JSONB, '{"score": 85, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 76, 'alta', '2026-02-03', '2026-02-03 15:25:00-05'),
('c0000012-0000-0000-0000-000000000001', 'a0000012-0000-0000-0000-000000000001', 'b0000012-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 81, 79, 83, '{"score": 79}'::JSONB, '{"score": 83, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 74, 'alta', '2026-02-03', '2026-02-03 16:40:00-05');

-- -------------------------------------------------------------------------------
-- CARLOS MENDEZ (Promedio) - 10 llamadas, score promedio ~65
-- -------------------------------------------------------------------------------

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000001-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM001', 'CM001', '2026-02-02 09:30:00-05', '2026-02-02 09:35:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-101', 'CAMPANA_Q1', 'analizado'),
('a0000002-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM002', 'CM002', '2026-02-02 10:45:00-05', '2026-02-02 10:50:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-102', 'CAMPANA_Q1', 'analizado'),
('a0000003-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM003', 'CM003', '2026-02-02 14:15:00-05', '2026-02-02 14:21:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-103', 'CAMPANA_Q1', 'analizado'),
('a0000004-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM004', 'CM004', '2026-02-02 15:30:00-05', '2026-02-02 15:35:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-104', 'CAMPANA_Q1', 'analizado'),
('a0000005-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM005', 'CM005', '2026-02-02 16:45:00-05', '2026-02-02 16:50:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-105', 'CAMPANA_Q1', 'analizado'),
('a0000006-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM006', 'CM006', '2026-02-03 09:15:00-05', '2026-02-03 09:20:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-106', 'CAMPANA_Q1', 'analizado'),
('a0000007-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM007', 'CM007', '2026-02-03 10:30:00-05', '2026-02-03 10:36:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-107', 'CAMPANA_Q1', 'analizado'),
('a0000008-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM008', 'CM008', '2026-02-03 11:45:00-05', '2026-02-03 11:50:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-108', 'CAMPANA_Q1', 'analizado'),
('a0000009-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM009', 'CM009', '2026-02-03 14:15:00-05', '2026-02-03 14:20:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-109', 'CAMPANA_Q1', 'analizado'),
('a0000010-0000-0000-0000-000000000002', 'https://drive.google.com/file/CM010', 'CM010', '2026-02-03 15:30:00-05', '2026-02-03 15:35:00-05', '22222222-2222-2222-2222-222222222222', 'CLI-110', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Transcripcion CM001...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'Transcripcion CM002...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000003-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000002', 'Transcripcion CM003...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000004-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000002', 'Transcripcion CM004...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000005-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000002', 'Transcripcion CM005...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000006-0000-0000-0000-000000000002', 'a0000006-0000-0000-0000-000000000002', 'Transcripcion CM006...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000007-0000-0000-0000-000000000002', 'a0000007-0000-0000-0000-000000000002', 'Transcripcion CM007...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000008-0000-0000-0000-000000000002', 'a0000008-0000-0000-0000-000000000002', 'Transcripcion CM008...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000009-0000-0000-0000-000000000002', 'a0000009-0000-0000-0000-000000000002', 'Transcripcion CM009...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000010-0000-0000-0000-000000000002', 'a0000010-0000-0000-0000-000000000002', 'Transcripcion CM010...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 68, 65, 71, '{"score": 65}'::JSONB, '{"score": 71, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 55, 'media', '2026-02-02', '2026-02-02 09:40:00-05'),
('c0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 62, 60, 64, '{"score": 60}'::JSONB, '{"score": 64, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 48, 'media', '2026-02-02', '2026-02-02 10:55:00-05'),
('c0000003-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 70, 68, 72, '{"score": 68}'::JSONB, '{"score": 72, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 60, 'media', '2026-02-02', '2026-02-02 14:25:00-05'),
('c0000004-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000002', 'b0000004-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 65, 63, 67, '{"score": 63}'::JSONB, '{"score": 67, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 52, 'media', '2026-02-02', '2026-02-02 15:40:00-05'),
('c0000005-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000002', 'b0000005-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 58, 55, 61, '{"score": 55}'::JSONB, '{"score": 61, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 40, 'media', '2026-02-02', '2026-02-02 16:55:00-05'),
('c0000006-0000-0000-0000-000000000002', 'a0000006-0000-0000-0000-000000000002', 'b0000006-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 72, 70, 74, '{"score": 70}'::JSONB, '{"score": 74, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 62, 'media', '2026-02-03', '2026-02-03 09:25:00-05'),
('c0000007-0000-0000-0000-000000000002', 'a0000007-0000-0000-0000-000000000002', 'b0000007-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 66, 64, 68, '{"score": 64}'::JSONB, '{"score": 68, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 54, 'media', '2026-02-03', '2026-02-03 10:40:00-05'),
('c0000008-0000-0000-0000-000000000002', 'a0000008-0000-0000-0000-000000000002', 'b0000008-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 64, 62, 66, '{"score": 62}'::JSONB, '{"score": 66, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 50, 'media', '2026-02-03', '2026-02-03 11:55:00-05'),
('c0000009-0000-0000-0000-000000000002', 'a0000009-0000-0000-0000-000000000002', 'b0000009-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 69, 67, 71, '{"score": 67}'::JSONB, '{"score": 71, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 58, 'media', '2026-02-03', '2026-02-03 14:25:00-05'),
('c0000010-0000-0000-0000-000000000002', 'a0000010-0000-0000-0000-000000000002', 'b0000010-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 61, 59, 63, '{"score": 59}'::JSONB, '{"score": 63, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 46, 'media', '2026-02-03', '2026-02-03 15:40:00-05');

-- -------------------------------------------------------------------------------
-- PEDRO RUIZ (En Riesgo) - 10 llamadas, score promedio ~48 (dispara AGENTE_SCORE_BAJO)
-- -------------------------------------------------------------------------------

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000001-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR001', 'PR001', '2026-02-02 09:00:00-05', '2026-02-02 09:04:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-201', 'CAMPANA_Q1', 'analizado'),
('a0000002-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR002', 'PR002', '2026-02-02 10:15:00-05', '2026-02-02 10:19:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-202', 'CAMPANA_Q1', 'analizado'),
('a0000003-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR003', 'PR003', '2026-02-02 11:30:00-05', '2026-02-02 11:35:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-203', 'CAMPANA_Q1', 'analizado'),
('a0000004-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR004', 'PR004', '2026-02-02 14:00:00-05', '2026-02-02 14:04:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-204', 'CAMPANA_Q1', 'analizado'),
('a0000005-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR005', 'PR005', '2026-02-02 15:15:00-05', '2026-02-02 15:20:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-205', 'CAMPANA_Q1', 'analizado'),
('a0000006-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR006', 'PR006', '2026-02-03 09:00:00-05', '2026-02-03 09:05:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-206', 'CAMPANA_Q1', 'analizado'),
('a0000007-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR007', 'PR007', '2026-02-03 10:15:00-05', '2026-02-03 10:19:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-207', 'CAMPANA_Q1', 'analizado'),
('a0000008-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR008', 'PR008', '2026-02-03 11:30:00-05', '2026-02-03 11:34:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-208', 'CAMPANA_Q1', 'analizado'),
('a0000009-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR009', 'PR009', '2026-02-03 14:00:00-05', '2026-02-03 14:05:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-209', 'CAMPANA_Q1', 'analizado'),
('a0000010-0000-0000-0000-000000000003', 'https://drive.google.com/file/PR010', 'PR010', '2026-02-03 15:15:00-05', '2026-02-03 15:19:00-05', '33333333-3333-3333-3333-333333333333', 'CLI-210', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Transcripcion PR001...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000002-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000003', 'Transcripcion PR002...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000003-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 'Transcripcion PR003...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000004-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000003', 'Transcripcion PR004...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000005-0000-0000-0000-000000000003', 'a0000005-0000-0000-0000-000000000003', 'Transcripcion PR005...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000006-0000-0000-0000-000000000003', 'a0000006-0000-0000-0000-000000000003', 'Transcripcion PR006...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000007-0000-0000-0000-000000000003', 'a0000007-0000-0000-0000-000000000003', 'Transcripcion PR007...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000008-0000-0000-0000-000000000003', 'a0000008-0000-0000-0000-000000000003', 'Transcripcion PR008...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000009-0000-0000-0000-000000000003', 'a0000009-0000-0000-0000-000000000003', 'Transcripcion PR009...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000010-0000-0000-0000-000000000003', 'a0000010-0000-0000-0000-000000000003', 'Transcripcion PR010...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 52, 50, 54, '{"score": 50}'::JSONB, '{"score": 54, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 35, 'baja', '2026-02-02', '2026-02-02 09:10:00-05'),
('c0000002-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000003', 'b0000002-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 45, 43, 47, '{"score": 43}'::JSONB, '{"score": 47, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 28, 'baja', '2026-02-02', '2026-02-02 10:25:00-05'),
('c0000003-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 55, 53, 57, '{"score": 53}'::JSONB, '{"score": 57, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 38, 'baja', '2026-02-02', '2026-02-02 11:40:00-05'),
('c0000004-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000003', 'b0000004-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 48, 46, 50, '{"score": 46}'::JSONB, '{"score": 50, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 32, 'baja', '2026-02-02', '2026-02-02 14:10:00-05'),
('c0000005-0000-0000-0000-000000000003', 'a0000005-0000-0000-0000-000000000003', 'b0000005-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 42, 40, 44, '{"score": 40}'::JSONB, '{"score": 44, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 25, 'baja', '2026-02-02', '2026-02-02 15:25:00-05'),
('c0000006-0000-0000-0000-000000000003', 'a0000006-0000-0000-0000-000000000003', 'b0000006-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 50, 48, 52, '{"score": 48}'::JSONB, '{"score": 52, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 34, 'baja', '2026-02-03', '2026-02-03 09:10:00-05'),
('c0000007-0000-0000-0000-000000000003', 'a0000007-0000-0000-0000-000000000003', 'b0000007-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 46, 44, 48, '{"score": 44}'::JSONB, '{"score": 48, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 30, 'baja', '2026-02-03', '2026-02-03 10:25:00-05'),
('c0000008-0000-0000-0000-000000000003', 'a0000008-0000-0000-0000-000000000003', 'b0000008-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 53, 51, 55, '{"score": 51}'::JSONB, '{"score": 55, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 36, 'baja', '2026-02-03', '2026-02-03 11:40:00-05'),
('c0000009-0000-0000-0000-000000000003', 'a0000009-0000-0000-0000-000000000003', 'b0000009-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 44, 42, 46, '{"score": 42}'::JSONB, '{"score": 46, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 27, 'baja', '2026-02-03', '2026-02-03 14:10:00-05'),
('c0000010-0000-0000-0000-000000000003', 'a0000010-0000-0000-0000-000000000003', 'b0000010-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 49, 47, 51, '{"score": 47}'::JSONB, '{"score": 51, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 33, 'baja', '2026-02-03', '2026-02-03 15:25:00-05');

-- -------------------------------------------------------------------------------
-- ANA TORRES (Critico) - 10 llamadas, score promedio ~32 (dispara AGENTE_SCORE_CRITICO)
-- Con 4 abandonos (40%) - dispara AGENTE_ABANDONO_ALTO
-- -------------------------------------------------------------------------------

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000001-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT001', 'AT001', '2026-02-02 09:45:00-05', '2026-02-02 09:48:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-301', 'CAMPANA_Q1', 'analizado'),
('a0000002-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT002', 'AT002', '2026-02-02 11:00:00-05', '2026-02-02 11:03:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-302', 'CAMPANA_Q1', 'analizado'),
('a0000003-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT003', 'AT003', '2026-02-02 12:15:00-05', '2026-02-02 12:18:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-303', 'CAMPANA_Q1', 'analizado'),
('a0000004-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT004', 'AT004', '2026-02-02 14:30:00-05', '2026-02-02 14:33:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-304', 'CAMPANA_Q1', 'analizado'),
('a0000005-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT005', 'AT005', '2026-02-02 15:45:00-05', '2026-02-02 15:48:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-305', 'CAMPANA_Q1', 'analizado'),
('a0000006-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT006', 'AT006', '2026-02-03 09:30:00-05', '2026-02-03 09:33:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-306', 'CAMPANA_Q1', 'analizado'),
('a0000007-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT007', 'AT007', '2026-02-03 10:45:00-05', '2026-02-03 10:48:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-307', 'CAMPANA_Q1', 'analizado'),
('a0000008-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT008', 'AT008', '2026-02-03 12:00:00-05', '2026-02-03 12:03:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-308', 'CAMPANA_Q1', 'analizado'),
('a0000009-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT009', 'AT009', '2026-02-03 14:15:00-05', '2026-02-03 14:18:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-309', 'CAMPANA_Q1', 'analizado'),
('a0000010-0000-0000-0000-000000000004', 'https://drive.google.com/file/AT010', 'AT010', '2026-02-03 15:30:00-05', '2026-02-03 15:33:00-05', '44444444-4444-4444-4444-444444444444', 'CLI-310', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Transcripcion AT001...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000002-0000-0000-0000-000000000004', 'a0000002-0000-0000-0000-000000000004', 'Transcripcion AT002...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000003-0000-0000-0000-000000000004', 'a0000003-0000-0000-0000-000000000004', 'Transcripcion AT003...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000004-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000004', 'Transcripcion AT004...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000005-0000-0000-0000-000000000004', 'a0000005-0000-0000-0000-000000000004', 'Transcripcion AT005...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000006-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000004', 'Transcripcion AT006...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000007-0000-0000-0000-000000000004', 'a0000007-0000-0000-0000-000000000004', 'Transcripcion AT007...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000008-0000-0000-0000-000000000004', 'a0000008-0000-0000-0000-000000000004', 'Transcripcion AT008...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000009-0000-0000-0000-000000000004', 'a0000009-0000-0000-0000-000000000004', 'Transcripcion AT009...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000010-0000-0000-0000-000000000004', 'a0000010-0000-0000-0000-000000000004', 'Transcripcion AT010...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 35, 33, 37, '{"score": 33}'::JSONB, '{"score": 37, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 18, 'baja', '2026-02-02', '2026-02-02 09:55:00-05'),
('c0000002-0000-0000-0000-000000000004', 'a0000002-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 28, 26, 30, '{"score": 26}'::JSONB, '{"score": 30, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 12, 'baja', '2026-02-02', '2026-02-02 11:10:00-05'),
('c0000003-0000-0000-0000-000000000004', 'a0000003-0000-0000-0000-000000000004', 'b0000003-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 38, 36, 40, '{"score": 36}'::JSONB, '{"score": 40, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 22, 'baja', '2026-02-02', '2026-02-02 12:25:00-05'),
('c0000004-0000-0000-0000-000000000004', 'a0000004-0000-0000-0000-000000000004', 'b0000004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 32, 30, 34, '{"score": 30}'::JSONB, '{"score": 34, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 16, 'baja', '2026-02-02', '2026-02-02 14:40:00-05'),
('c0000005-0000-0000-0000-000000000004', 'a0000005-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 25, 23, 27, '{"score": 23}'::JSONB, '{"score": 27, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 10, 'baja', '2026-02-02', '2026-02-02 15:55:00-05'),
('c0000006-0000-0000-0000-000000000004', 'a0000006-0000-0000-0000-000000000004', 'b0000006-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 36, 34, 38, '{"score": 34}'::JSONB, '{"score": 38, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 20, 'baja', '2026-02-03', '2026-02-03 09:40:00-05'),
('c0000007-0000-0000-0000-000000000004', 'a0000007-0000-0000-0000-000000000004', 'b0000007-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 30, 28, 32, '{"score": 28}'::JSONB, '{"score": 32, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 14, 'baja', '2026-02-03', '2026-02-03 10:55:00-05'),
('c0000008-0000-0000-0000-000000000004', 'a0000008-0000-0000-0000-000000000004', 'b0000008-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 34, 32, 36, '{"score": 32}'::JSONB, '{"score": 36, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 18, 'baja', '2026-02-03', '2026-02-03 12:10:00-05'),
('c0000009-0000-0000-0000-000000000004', 'a0000009-0000-0000-0000-000000000004', 'b0000009-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 29, 27, 31, '{"score": 27}'::JSONB, '{"score": 31, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": true}'::JSONB, 13, 'baja', '2026-02-03', '2026-02-03 14:25:00-05'),
('c0000010-0000-0000-0000-000000000004', 'a0000010-0000-0000-0000-000000000004', 'b0000010-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 33, 31, 35, '{"score": 31}'::JSONB, '{"score": 35, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 17, 'baja', '2026-02-03', '2026-02-03 15:40:00-05');

-- -------------------------------------------------------------------------------
-- LUIS GARCIA (Sin Validacion) - 10 llamadas, score ~60 pero SIN validaciones explicitas
-- Solo 1 validacion explicita de 10 (10%) - dispara AGENTE_SIN_VALIDACION
-- -------------------------------------------------------------------------------

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000001-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG001', 'LG001', '2026-02-02 08:30:00-05', '2026-02-02 08:35:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-401', 'CAMPANA_Q1', 'analizado'),
('a0000002-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG002', 'LG002', '2026-02-02 09:45:00-05', '2026-02-02 09:50:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-402', 'CAMPANA_Q1', 'analizado'),
('a0000003-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG003', 'LG003', '2026-02-02 11:00:00-05', '2026-02-02 11:05:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-403', 'CAMPANA_Q1', 'analizado'),
('a0000004-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG004', 'LG004', '2026-02-02 14:15:00-05', '2026-02-02 14:20:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-404', 'CAMPANA_Q1', 'analizado'),
('a0000005-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG005', 'LG005', '2026-02-02 15:30:00-05', '2026-02-02 15:35:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-405', 'CAMPANA_Q1', 'analizado'),
('a0000006-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG006', 'LG006', '2026-02-03 08:30:00-05', '2026-02-03 08:35:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-406', 'CAMPANA_Q1', 'analizado'),
('a0000007-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG007', 'LG007', '2026-02-03 09:45:00-05', '2026-02-03 09:50:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-407', 'CAMPANA_Q1', 'analizado'),
('a0000008-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG008', 'LG008', '2026-02-03 11:00:00-05', '2026-02-03 11:05:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-408', 'CAMPANA_Q1', 'analizado'),
('a0000009-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG009', 'LG009', '2026-02-03 14:15:00-05', '2026-02-03 14:20:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-409', 'CAMPANA_Q1', 'analizado'),
('a0000010-0000-0000-0000-000000000005', 'https://drive.google.com/file/LG010', 'LG010', '2026-02-03 15:30:00-05', '2026-02-03 15:35:00-05', '55555555-5555-5555-5555-555555555555', 'CLI-410', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Transcripcion LG001...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000002-0000-0000-0000-000000000005', 'a0000002-0000-0000-0000-000000000005', 'Transcripcion LG002...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000003-0000-0000-0000-000000000005', 'a0000003-0000-0000-0000-000000000005', 'Transcripcion LG003...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000004-0000-0000-0000-000000000005', 'a0000004-0000-0000-0000-000000000005', 'Transcripcion LG004...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000005-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000005', 'Transcripcion LG005...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000006-0000-0000-0000-000000000005', 'a0000006-0000-0000-0000-000000000005', 'Transcripcion LG006...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000007-0000-0000-0000-000000000005', 'a0000007-0000-0000-0000-000000000005', 'Transcripcion LG007...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000008-0000-0000-0000-000000000005', 'a0000008-0000-0000-0000-000000000005', 'Transcripcion LG008...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000009-0000-0000-0000-000000000005', 'a0000009-0000-0000-0000-000000000005', 'Transcripcion LG009...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000010-0000-0000-0000-000000000005', 'a0000010-0000-0000-0000-000000000005', 'Transcripcion LG010...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 62, 60, 64, '{"score": 60}'::JSONB, '{"score": 64, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 35, 'baja', '2026-02-02', '2026-02-02 08:40:00-05'),
('c0000002-0000-0000-0000-000000000005', 'a0000002-0000-0000-0000-000000000005', 'b0000002-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 58, 56, 60, '{"score": 56}'::JSONB, '{"score": 60, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 32, 'baja', '2026-02-02', '2026-02-02 09:55:00-05'),
('c0000003-0000-0000-0000-000000000005', 'a0000003-0000-0000-0000-000000000005', 'b0000003-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 65, 63, 67, '{"score": 63}'::JSONB, '{"score": 67, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 40, 'media', '2026-02-02', '2026-02-02 11:10:00-05'),
('c0000004-0000-0000-0000-000000000005', 'a0000004-0000-0000-0000-000000000005', 'b0000004-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 60, 58, 62, '{"score": 58}'::JSONB, '{"score": 62, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 36, 'baja', '2026-02-02', '2026-02-02 14:25:00-05'),
('c0000005-0000-0000-0000-000000000005', 'a0000005-0000-0000-0000-000000000005', 'b0000005-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 55, 53, 57, '{"score": 53}'::JSONB, '{"score": 57, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 30, 'baja', '2026-02-02', '2026-02-02 15:40:00-05'),
('c0000006-0000-0000-0000-000000000005', 'a0000006-0000-0000-0000-000000000005', 'b0000006-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 63, 61, 65, '{"score": 61}'::JSONB, '{"score": 65, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 42, 'media', '2026-02-03', '2026-02-03 08:40:00-05'),
('c0000007-0000-0000-0000-000000000005', 'a0000007-0000-0000-0000-000000000005', 'b0000007-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 59, 57, 61, '{"score": 57}'::JSONB, '{"score": 61, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 34, 'baja', '2026-02-03', '2026-02-03 09:55:00-05'),
('c0000008-0000-0000-0000-000000000005', 'a0000008-0000-0000-0000-000000000005', 'b0000008-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 61, 59, 63, '{"score": 59}'::JSONB, '{"score": 63, "desglose": {"validacion_cliente": {"tipo": "implicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 38, 'baja', '2026-02-03', '2026-02-03 11:10:00-05'),
('c0000009-0000-0000-0000-000000000005', 'a0000009-0000-0000-0000-000000000005', 'b0000009-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 57, 55, 59, '{"score": 55}'::JSONB, '{"score": 59, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 33, 'baja', '2026-02-03', '2026-02-03 14:25:00-05'),
('c0000010-0000-0000-0000-000000000005', 'a0000010-0000-0000-0000-000000000005', 'b0000010-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 64, 62, 66, '{"score": 62}'::JSONB, '{"score": 66, "desglose": {"validacion_cliente": {"tipo": "ninguna"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 41, 'media', '2026-02-03', '2026-02-03 15:40:00-05');

-- -------------------------------------------------------------------------------
-- SOFIA VARGAS (Nueva) - Solo 2 llamadas (no suficientes para alertas)
-- -------------------------------------------------------------------------------

INSERT INTO registro_llamadas (registro_id, audio_url, audio_id_externo, timestamp_inicio, timestamp_fin, agente_id, cliente_ref, campana, estado) VALUES
('a0000001-0000-0000-0000-000000000006', 'https://drive.google.com/file/SV001', 'SV001', '2026-02-03 10:00:00-05', '2026-02-03 10:05:00-05', '66666666-6666-6666-6666-666666666666', 'CLI-501', 'CAMPANA_Q1', 'analizado'),
('a0000002-0000-0000-0000-000000000006', 'https://drive.google.com/file/SV002', 'SV002', '2026-02-03 14:30:00-05', '2026-02-03 14:35:00-05', '66666666-6666-6666-6666-666666666666', 'CLI-502', 'CAMPANA_Q1', 'analizado');

INSERT INTO transcripciones (transcripcion_id, registro_id, transcripcion_completa, segmentos, modelo_transcripcion) VALUES
('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Transcripcion SV001...', '[]'::JSONB, 'gemini-2.0-flash'),
('b0000002-0000-0000-0000-000000000006', 'a0000002-0000-0000-0000-000000000006', 'Transcripcion SV002...', '[]'::JSONB, 'gemini-2.0-flash');

INSERT INTO analisis_llamadas (analisis_id, registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, fecha_llamada, created_at) VALUES
('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666', 70, 68, 72, '{"score": 68}'::JSONB, '{"score": 72, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 55, 'media', '2026-02-03', '2026-02-03 10:10:00-05'),
('c0000002-0000-0000-0000-000000000006', 'a0000002-0000-0000-0000-000000000006', 'b0000002-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666', 68, 66, 70, '{"score": 66}'::JSONB, '{"score": 70, "desglose": {"validacion_cliente": {"tipo": "explicita"}}}'::JSONB, '{"hubo_abandono": false}'::JSONB, 52, 'media', '2026-02-03', '2026-02-03 14:40:00-05');

-- ============================================================================
-- RESUMEN DE DATOS CREADOS
-- ============================================================================
-- 
-- AGENTES (6):
-- 1. Maria Lopez    - Estrella (score ~82, 100% validacion)
-- 2. Carlos Mendez  - Promedio (score ~65, 40% validacion, 1 abandono)
-- 3. Pedro Ruiz     - En Riesgo (score ~48, 0% validacion, 3 abandonos)  -> AGENTE_SCORE_BAJO
-- 4. Ana Torres     - Critico (score ~32, 0% validacion, 4 abandonos)    -> AGENTE_SCORE_CRITICO + AGENTE_ABANDONO_ALTO
-- 5. Luis Garcia    - Sin Valid (score ~60, 10% validacion)              -> AGENTE_SIN_VALIDACION
-- 6. Sofia Vargas   - Nueva (solo 2 llamadas, no genera alertas)
--
-- TOTAL LLAMADAS: 54 (ultimas 48 horas)
-- ALERTAS ESPERADAS:
--   - AGENTE_SCORE_CRITICO: Ana Torres (score 32)
--   - AGENTE_SCORE_BAJO: Pedro Ruiz (score 48)
--   - AGENTE_ABANDONO_ALTO: Ana Torres (40%)
--   - AGENTE_SIN_VALIDACION: Luis Garcia (10%), Pedro Ruiz (0%), Ana Torres (0%)
--
-- ============================================================================

