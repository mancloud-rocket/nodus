# NODUS - Supabase Database Setup

Este directorio contiene todos los scripts SQL necesarios para configurar la base de datos de NODUS en Supabase (PostgreSQL).

## 📁 Archivos

- **`schema.sql`**: Schema completo de la base de datos (tablas, índices, triggers, views)
- **`seeds.sql`**: Datos de prueba para desarrollo
- **`functions.sql`**: Funciones útiles para consultas complejas

## 🚀 Setup Rápido

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Espera a que se inicialice (2-3 minutos)
4. Guarda tu **Project URL** y **anon key**

### 2. Ejecutar Schema

En el **SQL Editor** de Supabase:

```sql
-- 1. Ejecutar schema completo
-- Copiar y pegar todo el contenido de schema.sql
```

### 3. Cargar datos de prueba (opcional)

```sql
-- 2. Ejecutar seeds (solo para desarrollo)
-- Copiar y pegar todo el contenido de seeds.sql
```

### 4. Cargar funciones útiles

```sql
-- 3. Ejecutar funciones
-- Copiar y pegar todo el contenido de functions.sql
```

## 📊 Estructura de Tablas

| Tabla | Descripción | Escrita por |
|-------|-------------|-------------|
| `agentes` | Agentes de cobranza | Manual/API externa |
| `registro_llamadas` | Referencia a llamadas (NO audio) | Agente Transcriptor |
| `transcripciones` | Output de AI Studio | Agente Transcriptor |
| `analisis_llamadas` | Scoring y predicción | Agente Analista |
| `alertas_anomalias` | Alertas detectadas | Agente Detector |
| `coaching_reports` | Reportes diarios | Agente Coach |
| `reportes_estrategia` | Análisis semanal | Agente Estratega |
| `metricas_agregadas` | Métricas pre-calculadas | Cron/Triggers |

## 🔑 Variables de Entorno

Agregar a tu `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# API Keys (para backend)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 📈 Funciones Útiles

### Métricas de Dashboard

```sql
SELECT get_dashboard_metrics();
-- o con rango de fechas
SELECT get_dashboard_metrics('2026-01-01', '2026-01-31');
```

### Métricas de Agente

```sql
SELECT get_agente_metrics('uuid-del-agente');
```

### Top Performers

```sql
SELECT * FROM get_top_performers(10);
```

### Tendencias Diarias

```sql
SELECT * FROM get_tendencias_diarias();
```

### Búsqueda de Registros

```sql
SELECT * FROM search_registros(
    'María',           -- búsqueda
    NULL,              -- agente_id (opcional)
    'analizado',       -- estado (opcional)
    '2026-01-01',      -- fecha_desde
    '2026-01-31',      -- fecha_hasta
    NULL,              -- score_min (opcional)
    NULL,              -- score_max (opcional)
    50,                -- limit
    0                  -- offset
);
```

### Últimos análisis de un agente (para Coach)

```sql
SELECT * FROM get_ultimos_analisis_agente('uuid-del-agente', 25);
```

### Alertas activas

```sql
SELECT * FROM get_alertas_activas('critica', NULL, 10);
```

## 🔒 Row Level Security (RLS)

RLS está **deshabilitado** por defecto. Para habilitar según tus necesidades:

```sql
-- Habilitar RLS
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_llamadas ENABLE ROW LEVEL SECURITY;
-- etc.

-- Ejemplo: Permitir a supervisores ver todo
CREATE POLICY "Supervisors can see all data" ON registro_llamadas
    FOR SELECT 
    USING (
        auth.jwt()->>'role' = 'supervisor' 
        OR 
        auth.jwt()->>'role' = 'admin'
    );

-- Ejemplo: Agentes solo ven sus propios registros
CREATE POLICY "Agents see own records" ON registro_llamadas
    FOR SELECT 
    USING (
        agente_id = auth.uid()::UUID
    );

-- Service role para los agentes de Saturn Studio
CREATE POLICY "Service role full access" ON registro_llamadas 
    FOR ALL USING (auth.role() = 'service_role');
```

## 🔄 Migraciones

Para cambios futuros, crea archivos numerados:

```
migrations/
  001_initial_schema.sql
  002_add_campo_x.sql
  003_modify_index_y.sql
```

### Ejemplo de migración:

```sql
-- 002_add_campo_x.sql
ALTER TABLE llamadas 
ADD COLUMN prioridad VARCHAR(20) DEFAULT 'normal';

CREATE INDEX idx_llamadas_prioridad ON llamadas(prioridad);
```

## 🧪 Testing

### Verificar que todo esté correcto:

```sql
-- Contar tablas creadas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar datos seed
SELECT COUNT(*) FROM agentes;
SELECT COUNT(*) FROM llamadas;
SELECT COUNT(*) FROM analisis_llamadas;

-- Verificar funciones
SELECT * FROM get_dashboard_metrics();
```

## 📊 Índices Importantes

Los índices más críticos para performance:

```sql
-- Búsquedas por fecha (muy frecuente)
idx_registro_timestamp
idx_registro_fecha
idx_analisis_fecha

-- Búsquedas por agente
idx_registro_agente
idx_registro_agente_fecha
idx_analisis_agente_fecha

-- Filtros en dashboard
idx_registro_estado
idx_analisis_score
idx_analisis_probabilidad

-- Búsquedas en JSON (GIN)
idx_transcripciones_entidades
idx_analisis_alertas

-- Para Agente Coach
idx_analisis_coach (agente_id, created_at DESC)
```

## 🔧 Mantenimiento

### Refresh métricas agregadas

Ejecutar diariamente (idealmente via cron o trigger post-análisis):

```sql
SELECT refresh_metricas_agregadas(CURRENT_DATE);
```

### Limpiar datos antiguos (opcional)

```sql
-- Eliminar registros de hace más de 2 años
DELETE FROM registro_llamadas 
WHERE timestamp_inicio < NOW() - INTERVAL '2 years';

-- Archivar alertas resueltas antiguas
UPDATE alertas_anomalias 
SET estado = 'falso_positivo' 
WHERE estado = 'resuelta' 
  AND updated_at < NOW() - INTERVAL '6 months';
```

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Troubleshooting

### Error: "relation already exists"

```sql
-- Eliminar tabla existente
DROP TABLE IF EXISTS nombre_tabla CASCADE;
```

### Error en RLS

```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';

-- Eliminar todas las políticas
DROP POLICY IF EXISTS "policy_name" ON tabla;
```

### Performance lento

```sql
-- Ver queries lentas
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Analizar query específica
EXPLAIN ANALYZE SELECT ...;
```

---

¿Dudas? Revisar la documentación de Supabase o contactar al equipo.

