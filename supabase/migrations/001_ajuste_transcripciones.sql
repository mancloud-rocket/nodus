-- ============================================
-- MIGRACIÓN: Ajuste de tablas para Agente Transcriptor
-- Fecha: 2026-01-31
-- ============================================

-- ============================================
-- 1. MODIFICAR registro_llamadas
-- Hacer opcionales los campos que no siempre tenemos
-- ============================================

-- timestamp_inicio y timestamp_fin ahora pueden ser NULL (si no tenemos los datos)
ALTER TABLE registro_llamadas 
    ALTER COLUMN timestamp_inicio DROP NOT NULL,
    ALTER COLUMN timestamp_fin DROP NOT NULL;

-- cliente_ref puede ser NULL inicialmente (se llena después de la transcripción)
ALTER TABLE registro_llamadas 
    ALTER COLUMN cliente_ref DROP NOT NULL;

-- Agregar campo para nombre del cliente extraído
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(200);

-- Agregar campo para nombre del agente extraído (si no tenemos agente_id)
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS agente_nombre VARCHAR(200);

-- Agregar campo para empresa acreedora
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS empresa_acreedora VARCHAR(200);

-- Agregar campo para empresa de cobranza
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS empresa_cobranza VARCHAR(200);

-- Hacer agente_id opcional (se puede llenar después si se identifica)
ALTER TABLE registro_llamadas 
    ALTER COLUMN agente_id DROP NOT NULL;

-- ============================================
-- 2. MODIFICAR transcripciones
-- Ajustar estructura a lo que realmente tenemos
-- ============================================

-- Agregar campo para análisis emocional completo (viene de Gemini)
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS analisis_emocional JSONB DEFAULT '{
        "agente": {
            "emocion_dominante": "neutral",
            "distribucion": {},
            "intensidad_promedio": 0
        },
        "cliente": {
            "emocion_dominante": "neutral",
            "distribucion": {},
            "intensidad_promedio": 0
        },
        "evolucion_cliente": "estable",
        "momentos_criticos": []
    }';

-- Agregar campo para patrones de script detectados
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS patrones_script JSONB DEFAULT '{
        "saludo_correcto": false,
        "identificacion_empresa": false,
        "identificacion_agente": false,
        "verificacion_identidad_cliente": false,
        "explicacion_motivo": false,
        "mencion_monto_deuda": false,
        "presentacion_ofertas": false,
        "mencion_consecuencias": false,
        "intento_cierre": false,
        "despedida_correcta": false,
        "score_script": 0
    }';

-- Agregar campo para resultado preliminar de la llamada
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS resultado_preliminar JSONB DEFAULT '{
        "tipo_cierre": "sin_compromiso",
        "compromiso_logrado": false,
        "monto_comprometido": null,
        "fecha_compromiso": null,
        "riesgo_incumplimiento": "medio",
        "requiere_seguimiento": true
    }';

-- Agregar campo para resumen ejecutivo
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS resumen_ejecutivo JSONB DEFAULT '{
        "resultado": "pendiente",
        "descripcion": "",
        "puntos_clave": [],
        "recomendaciones": []
    }';

-- Agregar campo para referencias de créditos extraídas
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS referencias_creditos JSONB DEFAULT '[]';

-- Agregar campo para información de seguimiento
ALTER TABLE transcripciones 
    ADD COLUMN IF NOT EXISTS seguimiento JSONB DEFAULT '{
        "requiere_seguimiento": false,
        "tipo_seguimiento": null,
        "fecha_sugerida": null,
        "prioridad": "media",
        "notas": ""
    }';

-- Actualizar default de metricas_conversacion para incluir campos que sí tenemos
-- (El ALTER COLUMN ... SET DEFAULT no cambia valores existentes, solo nuevos)

-- ============================================
-- 3. AGREGAR ÍNDICES ÚTILES
-- ============================================

-- Índice para buscar por cliente
CREATE INDEX IF NOT EXISTS idx_registro_cliente_nombre ON registro_llamadas(cliente_nombre);

-- Índice para buscar por agente por nombre
CREATE INDEX IF NOT EXISTS idx_registro_agente_nombre ON registro_llamadas(agente_nombre);

-- Índice GIN para análisis emocional
CREATE INDEX IF NOT EXISTS idx_transcripciones_emocional ON transcripciones USING GIN (analisis_emocional);

-- Índice GIN para resultado preliminar
CREATE INDEX IF NOT EXISTS idx_transcripciones_resultado ON transcripciones USING GIN (resultado_preliminar);

-- ============================================
-- 4. COMENTARIOS ACTUALIZADOS
-- ============================================

COMMENT ON COLUMN registro_llamadas.cliente_nombre IS 'Nombre del cliente extraído de la transcripción';
COMMENT ON COLUMN registro_llamadas.agente_nombre IS 'Nombre del agente extraído de la transcripción o del archivo';
COMMENT ON COLUMN registro_llamadas.empresa_acreedora IS 'Empresa a la que se le debe (ej: Caja Los Andes)';
COMMENT ON COLUMN registro_llamadas.empresa_cobranza IS 'Empresa que realiza la cobranza (ej: Redsap)';

COMMENT ON COLUMN transcripciones.analisis_emocional IS 'Análisis emocional completo de Gemini';
COMMENT ON COLUMN transcripciones.patrones_script IS 'Patrones de script de cobranza detectados';
COMMENT ON COLUMN transcripciones.resultado_preliminar IS 'Resultado preliminar de la llamada (pre-análisis completo)';
COMMENT ON COLUMN transcripciones.resumen_ejecutivo IS 'Resumen ejecutivo de la llamada';
COMMENT ON COLUMN transcripciones.referencias_creditos IS 'Referencias a créditos/cuentas mencionadas';
COMMENT ON COLUMN transcripciones.seguimiento IS 'Información de seguimiento recomendado';



