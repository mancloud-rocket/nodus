-- ============================================
-- MIGRACIÓN: Simplificar tabla registro_llamadas
-- Solo mantener las columnas realmente necesarias
-- Fecha: 2026-02-03
-- ============================================

-- ============================================
-- 1. ELIMINAR COLUMNAS NO USADAS
-- ============================================

-- Eliminar columnas de contexto de deuda (no las usamos)
ALTER TABLE registro_llamadas 
    DROP COLUMN IF EXISTS tipo_deuda,
    DROP COLUMN IF EXISTS monto_deuda,
    DROP COLUMN IF EXISTS dias_mora;

-- Eliminar metadata externa (no la usamos)
ALTER TABLE registro_llamadas 
    DROP COLUMN IF EXISTS metadata_externa;

-- ============================================
-- 2. VERIFICAR QUE EXISTEN LAS COLUMNAS NECESARIAS
-- (algunas vienen de la migración anterior)
-- ============================================

-- Cliente nombre (de migración 001)
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(200);

-- Agente nombre (de migración 001)
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS agente_nombre VARCHAR(200);

-- Empresa acreedora (de migración 001)
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS empresa_acreedora VARCHAR(200);

-- Empresa cobranza (de migración 001)
ALTER TABLE registro_llamadas 
    ADD COLUMN IF NOT EXISTS empresa_cobranza VARCHAR(200);

-- ============================================
-- 3. AJUSTAR CONSTRAINTS
-- ============================================

-- Asegurar que los timestamps sean opcionales
ALTER TABLE registro_llamadas 
    ALTER COLUMN timestamp_inicio DROP NOT NULL,
    ALTER COLUMN timestamp_fin DROP NOT NULL;

-- Asegurar que agente_id sea opcional
ALTER TABLE registro_llamadas 
    ALTER COLUMN agente_id DROP NOT NULL;

-- Asegurar que cliente_ref sea opcional
ALTER TABLE registro_llamadas 
    ALTER COLUMN cliente_ref DROP NOT NULL;

-- ============================================
-- 4. ESTRUCTURA FINAL DE LA TABLA
-- ============================================

/*
Después de esta migración, la tabla queda así:

registro_llamadas:
├── registro_id          UUID PRIMARY KEY (auto)
├── audio_url            TEXT NOT NULL
├── audio_id_externo     VARCHAR(100)
├── timestamp_inicio     TIMESTAMPTZ (opcional)
├── timestamp_fin        TIMESTAMPTZ (opcional)
├── duracion_segundos    INTEGER (calculado por trigger)
├── timestamp_fecha      DATE (calculado por trigger)
├── agente_id            UUID (opcional, FK a agentes)
├── agente_nombre        VARCHAR(200) (extraído de transcripción)
├── cliente_ref          VARCHAR(100) (opcional)
├── cliente_nombre       VARCHAR(200) (extraído de transcripción)
├── empresa_cobranza     VARCHAR(200) (extraído de transcripción)
├── empresa_acreedora    VARCHAR(200) (extraído de transcripción)
├── campana              VARCHAR(100)
├── estado               ENUM (pendiente, procesando, transcrito, analizado, error)
├── error_mensaje        TEXT
├── transcripcion_id     UUID (FK a transcripciones)
├── analisis_id          UUID (FK a analisis_llamadas)
├── created_at           TIMESTAMPTZ
└── updated_at           TIMESTAMPTZ
*/

-- ============================================
-- 5. ACTUALIZAR COMENTARIOS
-- ============================================

COMMENT ON TABLE registro_llamadas IS 'Registro simplificado de llamadas - solo campos esenciales';
COMMENT ON COLUMN registro_llamadas.audio_url IS 'URL del audio en Google Drive u otro storage';
COMMENT ON COLUMN registro_llamadas.audio_id_externo IS 'ID del archivo en el sistema externo (Drive file ID)';
COMMENT ON COLUMN registro_llamadas.agente_id IS 'FK opcional a tabla agentes (lookup por nombre de archivo si existe)';
COMMENT ON COLUMN registro_llamadas.agente_nombre IS 'Nombre del agente extraído de la transcripción';
COMMENT ON COLUMN registro_llamadas.cliente_ref IS 'Referencia externa del cliente (opcional)';
COMMENT ON COLUMN registro_llamadas.cliente_nombre IS 'Nombre del cliente extraído de la transcripción';
COMMENT ON COLUMN registro_llamadas.empresa_cobranza IS 'Empresa que realiza la cobranza (ej: Redsap)';
COMMENT ON COLUMN registro_llamadas.empresa_acreedora IS 'Empresa a la que se le debe (ej: Caja Los Andes)';
COMMENT ON COLUMN registro_llamadas.campana IS 'Campaña de cobranza (hardcodeado o del sistema)';



