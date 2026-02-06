-- ============================================
-- NODUS - Database Schema v2 para Supabase
-- Centrado en Agentes de Saturn Studio
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE estado_procesamiento AS ENUM ('pendiente', 'procesando', 'transcrito', 'analizado', 'error');
CREATE TYPE nivel_cumplimiento AS ENUM ('baja', 'media', 'alta');
CREATE TYPE severidad_alerta AS ENUM ('critica', 'alta', 'media', 'baja');
CREATE TYPE estado_alerta AS ENUM ('nueva', 'en_revision', 'resuelta', 'falso_positivo');
CREATE TYPE estado_agente AS ENUM ('activo', 'inactivo', 'vacaciones');
CREATE TYPE tipo_alerta AS ENUM ('individual', 'sistemica', 'patron');

-- ============================================
-- TABLE: agentes
-- Gestión de agentes de cobranza
-- USADO POR: Todos los agentes (lectura), Dashboard
-- ============================================

CREATE TABLE agentes (
    agente_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE,
    avatar_url TEXT,
    codigo_externo VARCHAR(50), -- ID en sistema externo (CRM)
    
    -- Información laboral
    fecha_ingreso DATE,
    estado estado_agente DEFAULT 'activo',
    equipo VARCHAR(100),
    supervisor_id UUID REFERENCES agentes(agente_id),
    
    -- Metadata adicional
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agentes_estado ON agentes(estado);
CREATE INDEX idx_agentes_equipo ON agentes(equipo);
CREATE INDEX idx_agentes_codigo_externo ON agentes(codigo_externo);

COMMENT ON TABLE agentes IS 'Agentes de cobranza - tabla central del sistema';

-- ============================================
-- TABLE: registro_llamadas
-- Registro de llamadas procesadas (referencia, NO almacena audio)
-- ESCRITO POR: Agente Transcriptor
-- ACTUALIZADO POR: Agente Analista
-- ============================================

CREATE TABLE registro_llamadas (
    registro_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencia al audio externo (NO se almacena el audio)
    audio_url TEXT NOT NULL,
    audio_id_externo VARCHAR(100), -- ID en sistema de grabación
    
    -- Timestamps de la llamada original
    timestamp_inicio TIMESTAMPTZ NOT NULL,
    timestamp_fin TIMESTAMPTZ NOT NULL,
    duracion_segundos INTEGER, -- Calculado en trigger
    timestamp_fecha DATE, -- Fecha de la llamada (calculado en trigger, para índices)
    
    -- Relaciones
    agente_id UUID NOT NULL REFERENCES agentes(agente_id),
    cliente_ref VARCHAR(100) NOT NULL, -- Referencia al cliente en sistema externo
    
    -- Contexto de la llamada
    campana VARCHAR(100),
    tipo_deuda VARCHAR(50),
    monto_deuda DECIMAL(12,2),
    dias_mora INTEGER,
    
    -- Estado del procesamiento en NODUS
    estado estado_procesamiento DEFAULT 'pendiente',
    error_mensaje TEXT,
    
    -- Referencias a outputs de agentes
    transcripcion_id UUID,
    analisis_id UUID,
    
    -- Metadata del sistema externo
    metadata_externa JSONB DEFAULT '{}',
    
    -- Timestamps del sistema
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registro_agente ON registro_llamadas(agente_id);
CREATE INDEX idx_registro_cliente ON registro_llamadas(cliente_ref);
CREATE INDEX idx_registro_timestamp ON registro_llamadas(timestamp_inicio DESC);
CREATE INDEX idx_registro_estado ON registro_llamadas(estado);
CREATE INDEX idx_registro_campana ON registro_llamadas(campana);
CREATE INDEX idx_registro_fecha ON registro_llamadas(timestamp_fecha);
CREATE INDEX idx_registro_agente_fecha ON registro_llamadas(agente_id, timestamp_fecha);

COMMENT ON TABLE registro_llamadas IS 'Registro de llamadas procesadas - NO almacena audio, solo referencias';

-- ============================================
-- TABLE: transcripciones
-- Output del AGENTE TRANSCRIPTOR
-- ESCRITO POR: Agente Transcriptor
-- LEÍDO POR: Agente Analista
-- ============================================

CREATE TABLE transcripciones (
    transcripcion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_id UUID NOT NULL REFERENCES registro_llamadas(registro_id) ON DELETE CASCADE,
    
    -- Transcripción completa
    transcripcion_completa TEXT NOT NULL,
    
    -- Segmentos con diarización
    -- Array de: {speaker, timestamp_inicio, timestamp_fin, texto, emocion, velocidad_habla}
    segmentos JSONB NOT NULL DEFAULT '[]',
    
    -- Entidades extraídas por LLM
    entidades JSONB DEFAULT '{
        "montos": [],
        "fechas": [],
        "metodos_pago": [],
        "objeciones": [],
        "compromisos": []
    }',
    
    -- Métricas conversacionales
    metricas_conversacion JSONB DEFAULT '{
        "palabras_agente": 0,
        "palabras_cliente": 0,
        "ratio_habla": 0,
        "interrupciones": 0,
        "silencios_largos": 0,
        "velocidad_promedio_agente": 0,
        "velocidad_promedio_cliente": 0
    }',
    
    -- Calidad del audio
    calidad_audio JSONB DEFAULT '{
        "score": 0,
        "ruido_fondo": false,
        "cortes": 0,
        "inaudibles": 0
    }',
    
    -- Metadata del procesamiento
    modelo_transcripcion VARCHAR(50),
    modelo_emociones VARCHAR(50),
    modelo_entidades VARCHAR(50),
    tiempo_procesamiento_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(registro_id)
);

CREATE INDEX idx_transcripciones_registro ON transcripciones(registro_id);
CREATE INDEX idx_transcripciones_fecha ON transcripciones(created_at DESC);
CREATE INDEX idx_transcripciones_entidades ON transcripciones USING GIN (entidades);

COMMENT ON TABLE transcripciones IS 'Output del Agente Transcriptor - AI Studio';

-- ============================================
-- TABLE: analisis_llamadas
-- Output del AGENTE ANALISTA
-- ESCRITO POR: Agente Analista
-- LEÍDO POR: Agente Detector, Coach, Estratega, Conversacional
-- ============================================

CREATE TABLE analisis_llamadas (
    analisis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registro_id UUID NOT NULL REFERENCES registro_llamadas(registro_id) ON DELETE CASCADE,
    transcripcion_id UUID NOT NULL REFERENCES transcripciones(transcripcion_id),
    agente_id UUID NOT NULL REFERENCES agentes(agente_id),
    
    -- ═══════════════════════════════════════
    -- SCORES PRINCIPALES
    -- ═══════════════════════════════════════
    score_total INTEGER NOT NULL CHECK (score_total >= 0 AND score_total <= 100),
    score_contacto_directo INTEGER CHECK (score_contacto_directo >= 0 AND score_contacto_directo <= 100),
    score_compromiso_pago INTEGER CHECK (score_compromiso_pago >= 0 AND score_compromiso_pago <= 100),
    
    -- ═══════════════════════════════════════
    -- MÓDULO 1: CONTACTO DIRECTO (0-100 pts)
    -- ═══════════════════════════════════════
    modulo_contacto_directo JSONB NOT NULL DEFAULT '{
        "score": 0,
        "desglose": {
            "monto_mencionado": {"presente": false, "puntos": 0, "max": 25, "evidencia": ""},
            "fecha_vencimiento": {"presente": false, "puntos": 0, "max": 15, "evidencia": ""},
            "consecuencias_impago": {"presente": false, "puntos": 0, "max": 20, "evidencia": ""},
            "alternativas_pago": {"presente": false, "puntos": 0, "max": 15, "evidencia": ""},
            "manejo_objeciones": {"calidad": 0, "puntos": 0, "max": 25, "objeciones_detectadas": 0}
        }
    }',
    
    -- ═══════════════════════════════════════
    -- MÓDULO 2: COMPROMISO DE PAGO (0-100 pts)
    -- ═══════════════════════════════════════
    modulo_compromiso_pago JSONB NOT NULL DEFAULT '{
        "score": 0,
        "desglose": {
            "oferta_clara": {"presente": false, "puntos": 0, "max": 20},
            "alternativas_pago": {"presente": false, "puntos": 0, "max": 10},
            "fecha_especifica": {"presente": false, "puntos": 0, "max": 20, "fecha": null},
            "validacion_cliente": {"presente": false, "tipo": "ninguna", "puntos": 0, "max": 50, "frase_exacta": ""}
        }
    }',
    
    -- ═══════════════════════════════════════
    -- MÓDULO 3: ABANDONO
    -- ═══════════════════════════════════════
    modulo_abandono JSONB NOT NULL DEFAULT '{
        "hubo_abandono": false,
        "momento_segundos": null,
        "iniciado_por": null,
        "razon": null,
        "senales_previas": []
    }',
    
    -- ═══════════════════════════════════════
    -- PREDICCIÓN DE CUMPLIMIENTO
    -- ═══════════════════════════════════════
    probabilidad_cumplimiento INTEGER NOT NULL CHECK (probabilidad_cumplimiento >= 0 AND probabilidad_cumplimiento <= 100),
    nivel_cumplimiento nivel_cumplimiento NOT NULL,
    
    factores_prediccion JSONB DEFAULT '{
        "factores_positivos": [],
        "factores_negativos": [],
        "razonamiento": "",
        "historial_cliente_considerado": false
    }',
    
    -- ═══════════════════════════════════════
    -- ALERTAS DETECTADAS (para Agente Detector)
    -- ═══════════════════════════════════════
    alertas JSONB DEFAULT '[]',
    -- Array de: {tipo, codigo, mensaje, severidad}
    
    -- ═══════════════════════════════════════
    -- RECOMENDACIONES GENERADAS
    -- ═══════════════════════════════════════
    recomendaciones JSONB DEFAULT '[]',
    -- Array de: {prioridad, destinatario, accion, cuando}
    
    -- ═══════════════════════════════════════
    -- METADATA DEL ANÁLISIS
    -- ═══════════════════════════════════════
    modelo_usado VARCHAR(100),
    version_prompt VARCHAR(20),
    confianza_analisis DECIMAL(3,2) CHECK (confianza_analisis >= 0 AND confianza_analisis <= 1),
    tiempo_procesamiento_ms INTEGER,
    
    -- Timestamp de la llamada (denormalizado para queries rápidas)
    fecha_llamada DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(registro_id)
);

-- Índices optimizados para las queries de los agentes
CREATE INDEX idx_analisis_registro ON analisis_llamadas(registro_id);
CREATE INDEX idx_analisis_agente ON analisis_llamadas(agente_id);
CREATE INDEX idx_analisis_score ON analisis_llamadas(score_total DESC);
CREATE INDEX idx_analisis_probabilidad ON analisis_llamadas(probabilidad_cumplimiento DESC);
CREATE INDEX idx_analisis_nivel ON analisis_llamadas(nivel_cumplimiento);
CREATE INDEX idx_analisis_fecha ON analisis_llamadas(fecha_llamada DESC);
CREATE INDEX idx_analisis_agente_fecha ON analisis_llamadas(agente_id, fecha_llamada DESC);
CREATE INDEX idx_analisis_alertas ON analisis_llamadas USING GIN (alertas);

-- Para el Agente Coach: últimos 25 análisis por agente
CREATE INDEX idx_analisis_coach ON analisis_llamadas(agente_id, created_at DESC);

COMMENT ON TABLE analisis_llamadas IS 'Output del Agente Analista - Claude Opus';

-- ============================================
-- TABLE: alertas_anomalias
-- Output del AGENTE DETECTOR
-- ESCRITO POR: Agente Detector
-- LEÍDO POR: Dashboard, Agente Estratega
-- ============================================

CREATE TABLE alertas_anomalias (
    alerta_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Clasificación
    tipo tipo_alerta NOT NULL,
    severidad severidad_alerta NOT NULL,
    categoria VARCHAR(50), -- performance, tendencia, coaching, sistema
    codigo VARCHAR(50), -- SCORE_BAJO, ABANDONO, FALTA_VALIDACION, etc.
    
    -- Descripción
    descripcion TEXT NOT NULL,
    causa_probable TEXT,
    
    -- Datos de soporte
    datos_soporte JSONB DEFAULT '{}',
    
    -- Impacto estimado
    impacto_estimado JSONB DEFAULT '{
        "llamadas_afectadas": 0,
        "perdida_oportunidades": 0,
        "monto_en_riesgo": 0
    }',
    
    -- Acción recomendada
    accion_recomendada JSONB DEFAULT '{
        "urgencia": "hoy",
        "destinatario": "",
        "accion": "",
        "deadline": null
    }',
    
    -- Relaciones
    registro_id UUID REFERENCES registro_llamadas(registro_id), -- Si es alerta individual
    agentes_relacionados UUID[], -- Para alertas de patrón
    
    -- Estado de la alerta
    estado estado_alerta DEFAULT 'nueva',
    notificacion_enviada BOOLEAN DEFAULT false,
    
    -- Resolución
    resuelto_por UUID REFERENCES agentes(agente_id),
    fecha_resolucion TIMESTAMPTZ,
    notas_resolucion TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alertas_severidad ON alertas_anomalias(severidad);
CREATE INDEX idx_alertas_estado ON alertas_anomalias(estado);
CREATE INDEX idx_alertas_tipo ON alertas_anomalias(tipo);
CREATE INDEX idx_alertas_fecha ON alertas_anomalias(created_at DESC);
CREATE INDEX idx_alertas_activas ON alertas_anomalias(severidad, estado) 
    WHERE estado IN ('nueva', 'en_revision');
CREATE INDEX idx_alertas_agentes ON alertas_anomalias USING GIN (agentes_relacionados);

COMMENT ON TABLE alertas_anomalias IS 'Output del Agente Detector';

-- ============================================
-- TABLE: coaching_reports
-- Output del AGENTE COACH
-- ESCRITO POR: Agente Coach (diario)
-- LEÍDO POR: Dashboard, Agente Conversacional
-- ============================================

CREATE TABLE coaching_reports (
    reporte_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id UUID NOT NULL REFERENCES agentes(agente_id) ON DELETE CASCADE,
    
    -- Período analizado
    fecha_reporte DATE NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    total_llamadas_analizadas INTEGER DEFAULT 0,
    
    -- ═══════════════════════════════════════
    -- MÉTRICAS DEL PERÍODO
    -- ═══════════════════════════════════════
    metricas_periodo JSONB NOT NULL DEFAULT '{
        "score_promedio": 0,
        "score_min": 0,
        "score_max": 0,
        "tasa_validacion": 0,
        "probabilidad_cumplimiento_promedio": 0,
        "tasa_abandono": 0,
        "duracion_promedio": 0
    }',
    
    -- ═══════════════════════════════════════
    -- COMPARATIVA CON EQUIPO
    -- ═══════════════════════════════════════
    comparativa_equipo JSONB DEFAULT '{
        "score_equipo": 0,
        "validacion_equipo": 0,
        "ranking": 0,
        "total_agentes": 0,
        "percentil": 0,
        "diferencia_vs_promedio": 0
    }',
    
    -- ═══════════════════════════════════════
    -- ANÁLISIS CUALITATIVO
    -- ═══════════════════════════════════════
    fortalezas JSONB DEFAULT '[]',
    -- Array de: {area, descripcion, evidencia, impacto}
    
    gap_critico JSONB,
    -- {area, descripcion, impacto, ejemplos_registros[], frecuencia}
    
    patrones JSONB DEFAULT '[]',
    -- Array de: {tipo, descripcion, frecuencia, impacto}
    
    -- ═══════════════════════════════════════
    -- PLAN DE MEJORA
    -- ═══════════════════════════════════════
    plan_mejora JSONB DEFAULT '{
        "objetivo_semana": "",
        "meta_cuantitativa": "",
        "acciones": [],
        "registros_para_revisar": [],
        "recursos_sugeridos": []
    }',
    
    -- ═══════════════════════════════════════
    -- SEGUIMIENTO
    -- ═══════════════════════════════════════
    progreso_vs_anterior JSONB DEFAULT '{
        "score_cambio": 0,
        "validacion_cambio": 0,
        "objetivo_anterior_cumplido": null,
        "notas": ""
    }',
    
    -- Metadata
    generado_por VARCHAR(50) DEFAULT 'agente_coach',
    modelo_usado VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agente_id, fecha_reporte)
);

CREATE INDEX idx_coaching_agente ON coaching_reports(agente_id);
CREATE INDEX idx_coaching_fecha ON coaching_reports(fecha_reporte DESC);
CREATE INDEX idx_coaching_agente_fecha ON coaching_reports(agente_id, fecha_reporte DESC);

COMMENT ON TABLE coaching_reports IS 'Output del Agente Coach - Diario 08:00';

-- ============================================
-- TABLE: reportes_estrategia
-- Output del AGENTE ESTRATEGA
-- ESCRITO POR: Agente Estratega (semanal)
-- LEÍDO POR: Dashboard, Agente Conversacional
-- ============================================

CREATE TABLE reportes_estrategia (
    reporte_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Período
    fecha_reporte DATE NOT NULL,
    semana_numero INTEGER,
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    
    -- ═══════════════════════════════════════
    -- RESUMEN EJECUTIVO
    -- ═══════════════════════════════════════
    resumen_ejecutivo JSONB NOT NULL DEFAULT '{
        "total_llamadas": 0,
        "total_agentes_activos": 0,
        "score_promedio": 0,
        "cambio_vs_anterior": 0,
        "tasa_validacion": 0,
        "probabilidad_cumplimiento_promedio": 0,
        "monto_comprometido": 0,
        "logros": [],
        "preocupaciones": []
    }',
    
    -- ═══════════════════════════════════════
    -- HALLAZGOS ESTRATÉGICOS
    -- ═══════════════════════════════════════
    hallazgos_estrategicos JSONB DEFAULT '[]',
    -- Array de: {titulo, categoria, descripcion, hipotesis, recomendacion, impacto_proyectado, confianza}
    
    -- ═══════════════════════════════════════
    -- ANÁLISIS TEMPORAL
    -- ═══════════════════════════════════════
    analisis_temporal JSONB DEFAULT '{
        "mejor_dia": "",
        "mejor_dia_score": 0,
        "peor_dia": "",
        "peor_dia_score": 0,
        "mejor_hora": "",
        "mejor_hora_score": 0,
        "tendencias_por_dia": [],
        "tendencias_por_hora": []
    }',
    
    -- ═══════════════════════════════════════
    -- ANÁLISIS DE EQUIPO
    -- ═══════════════════════════════════════
    top_performers JSONB DEFAULT '[]',
    -- Array de: {agente_id, nombre, score, patron_clave, recomendacion}
    
    agentes_en_riesgo JSONB DEFAULT '[]',
    -- Array de: {agente_id, nombre, score, gap_principal, accion_urgente}
    
    -- ═══════════════════════════════════════
    -- ANÁLISIS DE SCRIPTS/CAMPAÑAS
    -- ═══════════════════════════════════════
    analisis_campanas JSONB DEFAULT '[]',
    -- Array de: {campana, llamadas, score_promedio, insights, recomendaciones}
    
    -- ═══════════════════════════════════════
    -- RECOMENDACIONES ESTRATÉGICAS
    -- ═══════════════════════════════════════
    recomendaciones_estrategicas JSONB DEFAULT '[]',
    -- Array de: {prioridad, area, recomendacion, impacto_esperado, recursos_necesarios, deadline}
    
    -- ═══════════════════════════════════════
    -- PROYECCIONES
    -- ═══════════════════════════════════════
    proyecciones JSONB DEFAULT '{
        "score_proyectado_siguiente_semana": 0,
        "cumplimiento_proyectado": 0,
        "riesgos_identificados": [],
        "oportunidades": []
    }',
    
    -- Metadata
    generado_por VARCHAR(50) DEFAULT 'agente_estratega',
    modelo_usado VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(fecha_reporte)
);

CREATE INDEX idx_estrategia_fecha ON reportes_estrategia(fecha_reporte DESC);
CREATE INDEX idx_estrategia_semana ON reportes_estrategia(semana_numero DESC);

COMMENT ON TABLE reportes_estrategia IS 'Output del Agente Estratega - Semanal DOM 22:00';

-- ============================================
-- TABLE: metricas_agregadas
-- Métricas pre-calculadas para queries rápidas
-- ACTUALIZADO POR: Cron o post-análisis
-- LEÍDO POR: Dashboard, Todos los agentes
-- ============================================

CREATE TABLE metricas_agregadas (
    metrica_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dimensiones
    fecha DATE NOT NULL,
    agente_id UUID REFERENCES agentes(agente_id), -- NULL = métricas globales
    equipo VARCHAR(100),
    campana VARCHAR(100),
    
    -- Métricas de volumen
    total_llamadas INTEGER DEFAULT 0,
    duracion_total_segundos INTEGER DEFAULT 0,
    duracion_promedio_segundos INTEGER DEFAULT 0,
    
    -- Métricas de score
    score_promedio DECIMAL(5,2),
    score_min INTEGER,
    score_max INTEGER,
    desviacion_estandar DECIMAL(5,2),
    
    -- Métricas de cumplimiento
    probabilidad_cumplimiento_promedio DECIMAL(5,2),
    tasa_validacion DECIMAL(5,4),
    
    -- Distribución por nivel
    llamadas_score_alto INTEGER DEFAULT 0, -- >= 70
    llamadas_score_medio INTEGER DEFAULT 0, -- 40-69
    llamadas_score_bajo INTEGER DEFAULT 0, -- < 40
    
    -- Métricas de abandono
    llamadas_con_abandono INTEGER DEFAULT 0,
    tasa_abandono DECIMAL(5,4),
    
    -- Alertas
    alertas_criticas INTEGER DEFAULT 0,
    alertas_altas INTEGER DEFAULT 0,
    alertas_medias INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único parcial para evitar duplicados (métricas por agente)
CREATE UNIQUE INDEX idx_metricas_agente_unique ON metricas_agregadas(fecha, agente_id) 
    WHERE agente_id IS NOT NULL AND equipo IS NULL AND campana IS NULL;

-- Índice único parcial (métricas por equipo)
CREATE UNIQUE INDEX idx_metricas_equipo_unique ON metricas_agregadas(fecha, equipo) 
    WHERE agente_id IS NULL AND equipo IS NOT NULL AND campana IS NULL;

-- Índice único parcial (métricas globales)
CREATE UNIQUE INDEX idx_metricas_global_unique ON metricas_agregadas(fecha) 
    WHERE agente_id IS NULL AND equipo IS NULL AND campana IS NULL;

CREATE INDEX idx_metricas_fecha ON metricas_agregadas(fecha DESC);
CREATE INDEX idx_metricas_agente ON metricas_agregadas(agente_id, fecha DESC);
CREATE INDEX idx_metricas_equipo ON metricas_agregadas(equipo, fecha DESC);

COMMENT ON TABLE metricas_agregadas IS 'Métricas pre-calculadas para dashboard rápido';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular duración y fecha
CREATE OR REPLACE FUNCTION calculate_registro_campos()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular duración en segundos
    IF NEW.timestamp_inicio IS NOT NULL AND NEW.timestamp_fin IS NOT NULL THEN
        NEW.duracion_segundos := EXTRACT(EPOCH FROM (NEW.timestamp_fin - NEW.timestamp_inicio))::INTEGER;
    END IF;
    
    -- Calcular fecha (usando UTC para consistencia)
    IF NEW.timestamp_inicio IS NOT NULL THEN
        NEW.timestamp_fecha := (NEW.timestamp_inicio AT TIME ZONE 'UTC')::DATE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_agentes_updated_at BEFORE UPDATE ON agentes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registro_updated_at BEFORE UPDATE ON registro_llamadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_registro_campos BEFORE INSERT OR UPDATE ON registro_llamadas
    FOR EACH ROW EXECUTE FUNCTION calculate_registro_campos();

CREATE TRIGGER update_alertas_updated_at BEFORE UPDATE ON alertas_anomalias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FOREIGN KEY: Actualizar referencias en registro_llamadas
-- ============================================

ALTER TABLE registro_llamadas 
ADD CONSTRAINT fk_registro_transcripcion 
FOREIGN KEY (transcripcion_id) REFERENCES transcripciones(transcripcion_id);

ALTER TABLE registro_llamadas 
ADD CONSTRAINT fk_registro_analisis 
FOREIGN KEY (analisis_id) REFERENCES analisis_llamadas(analisis_id);

-- ============================================
-- VIEWS
-- ============================================

-- Vista: Resumen de agente (para dashboard)
CREATE OR REPLACE VIEW vista_resumen_agentes AS
SELECT 
    ag.agente_id,
    ag.nombre,
    ag.equipo,
    ag.estado,
    COUNT(a.analisis_id) FILTER (WHERE a.fecha_llamada >= CURRENT_DATE - INTERVAL '7 days') as llamadas_semana,
    ROUND(AVG(a.score_total) FILTER (WHERE a.fecha_llamada >= CURRENT_DATE - INTERVAL '7 days'), 2) as score_semana,
    ROUND(AVG(a.probabilidad_cumplimiento) FILTER (WHERE a.fecha_llamada >= CURRENT_DATE - INTERVAL '7 days'), 2) as prob_cumplimiento_semana,
    (
        SELECT cr.metricas_periodo->>'tasa_validacion'
        FROM coaching_reports cr 
        WHERE cr.agente_id = ag.agente_id 
        ORDER BY cr.fecha_reporte DESC 
        LIMIT 1
    )::DECIMAL as tasa_validacion_ultimo_reporte
FROM agentes ag
LEFT JOIN analisis_llamadas a ON ag.agente_id = a.agente_id
WHERE ag.estado = 'activo'
GROUP BY ag.agente_id, ag.nombre, ag.equipo, ag.estado;

COMMENT ON VIEW vista_resumen_agentes IS 'Resumen rápido de agentes para dashboard';

-- ============================================
-- ROW LEVEL SECURITY
-- Deshabilitado por ahora - habilitar según necesidad
-- ============================================

-- Para habilitar RLS en el futuro:
-- ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registro_llamadas ENABLE ROW LEVEL SECURITY;
-- etc.

-- ============================================
-- FIN DEL SCHEMA v2
-- ============================================

