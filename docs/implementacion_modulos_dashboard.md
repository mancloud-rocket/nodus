# Plan de Implementacion: Dashboard de Modulos de Analisis

## Vision General

Integrar los 3 pilares de Speech Analytics en el dashboard de NODUS:
1. **Contacto Directo** - Calidad de la comunicacion inicial
2. **Compromiso de Pago** - Efectividad en cerrar acuerdos
3. **Abandono de Llamadas** - Patrones de desconexion

---

## Mapeo: Presentacion vs Base de Datos

### La base de datos YA tiene la estructura correcta:

| Concepto Presentacion | Campo en `analisis_llamadas` |
|----------------------|------------------------------|
| Contacto Directo | `modulo_contacto_directo` JSONB |
| Compromiso de Pago | `modulo_compromiso_pago` JSONB |
| Abandono | `modulo_abandono` JSONB |
| Score Total | `score_total` INTEGER |
| Probabilidad | `probabilidad_cumplimiento` INTEGER |

### Estructura JSONB existente:

**modulo_contacto_directo:**
```json
{
  "score": 0,
  "desglose": {
    "monto_mencionado": {"presente": false, "puntos": 0, "max": 25},
    "fecha_vencimiento": {"presente": false, "puntos": 0, "max": 15},
    "consecuencias_impago": {"presente": false, "puntos": 0, "max": 20},
    "alternativas_pago": {"presente": false, "puntos": 0, "max": 15},
    "manejo_objeciones": {"calidad": 0, "puntos": 0, "max": 25}
  }
}
```

**modulo_compromiso_pago:**
```json
{
  "score": 0,
  "desglose": {
    "oferta_clara": {"presente": false, "puntos": 0, "max": 20},
    "alternativas_pago": {"presente": false, "puntos": 0, "max": 10},
    "fecha_especifica": {"presente": false, "puntos": 0, "max": 20},
    "validacion_cliente": {"presente": false, "tipo": "ninguna", "puntos": 0, "max": 50}
  }
}
```

**modulo_abandono:**
```json
{
  "hubo_abandono": false,
  "momento_segundos": null,
  "iniciado_por": null,
  "razon": null,
  "senales_previas": []
}
```

---

## Fase 1: Vistas SQL (Sin modificar tablas)

### Vista 1: Resumen Global de Modulos

```sql
CREATE OR REPLACE VIEW vista_modulos_global AS
SELECT
    -- Periodo
    DATE_TRUNC('day', fecha_llamada) as fecha,
    
    -- Totales
    COUNT(*) as total_llamadas,
    
    -- MODULO 1: Contacto Directo
    ROUND(AVG(score_contacto_directo), 1) as avg_contacto_directo,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'monto_mencionado'->>'puntos')::numeric), 1) as avg_monto,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'puntos')::numeric), 1) as avg_fecha_venc,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'puntos')::numeric), 1) as avg_consecuencias,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'alternativas_pago'->>'puntos')::numeric), 1) as avg_alternativas_cd,
    ROUND(AVG((modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'puntos')::numeric), 1) as avg_objeciones,
    
    -- Porcentaje de cumplimiento por variable
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'monto_mencionado'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_monto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'fecha_vencimiento'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_fecha,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_contacto_directo->'desglose'->'consecuencias_impago'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_menciona_consecuencias,
    
    -- MODULO 2: Compromiso de Pago
    ROUND(AVG(score_compromiso_pago), 1) as avg_compromiso_pago,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'oferta_clara'->>'puntos')::numeric), 1) as avg_oferta_clara,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'puntos')::numeric), 1) as avg_alternativas_cp,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'puntos')::numeric), 1) as avg_fecha_especifica,
    ROUND(AVG((modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'puntos')::numeric), 1) as avg_validacion,
    
    -- Porcentaje con validacion
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_con_validacion,
    
    -- MODULO 3: Abandono
    COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) as llamadas_con_abandono,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
    
    -- Probabilidad promedio
    ROUND(AVG(probabilidad_cumplimiento), 1) as avg_probabilidad_cumplimiento
    
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', fecha_llamada)
ORDER BY fecha DESC;
```

### Vista 2: Detalle de Compromiso por Elementos

```sql
CREATE OR REPLACE VIEW vista_compromiso_elementos AS
WITH elementos AS (
    SELECT
        analisis_id,
        fecha_llamada,
        probabilidad_cumplimiento,
        (modulo_compromiso_pago->'desglose'->'oferta_clara'->>'presente')::boolean as tiene_oferta,
        (modulo_compromiso_pago->'desglose'->'alternativas_pago'->>'presente')::boolean as tiene_alternativas,
        (modulo_compromiso_pago->'desglose'->'fecha_especifica'->>'presente')::boolean as tiene_fecha,
        (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean as tiene_validacion
    FROM analisis_llamadas
    WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
),
clasificacion AS (
    SELECT
        *,
        CASE
            WHEN NOT tiene_oferta AND NOT tiene_alternativas AND NOT tiene_fecha AND NOT tiene_validacion THEN 'sin_elementos'
            WHEN tiene_oferta AND NOT tiene_alternativas AND NOT tiene_fecha AND NOT tiene_validacion THEN 'solo_oferta'
            WHEN tiene_oferta AND tiene_alternativas AND NOT tiene_fecha AND NOT tiene_validacion THEN 'oferta_alternativas'
            WHEN tiene_oferta AND tiene_alternativas AND tiene_fecha AND NOT tiene_validacion THEN 'tres_elementos'
            WHEN tiene_oferta AND tiene_alternativas AND tiene_fecha AND tiene_validacion THEN 'acuerdo_completo'
            ELSE 'parcial'
        END as categoria
    FROM elementos
)
SELECT
    categoria,
    COUNT(*) as total_llamadas,
    ROUND(AVG(probabilidad_cumplimiento), 1) as prob_promedio,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as porcentaje
FROM clasificacion
GROUP BY categoria
ORDER BY 
    CASE categoria
        WHEN 'sin_elementos' THEN 1
        WHEN 'solo_oferta' THEN 2
        WHEN 'oferta_alternativas' THEN 3
        WHEN 'tres_elementos' THEN 4
        WHEN 'acuerdo_completo' THEN 5
        ELSE 6
    END;
```

### Vista 3: Analisis de Abandonos

```sql
CREATE OR REPLACE VIEW vista_abandonos_detalle AS
SELECT
    -- Momento del abandono (rangos)
    CASE 
        WHEN (modulo_abandono->>'momento_segundos')::int <= 30 THEN '0-30 seg'
        WHEN (modulo_abandono->>'momento_segundos')::int <= 60 THEN '31-60 seg'
        WHEN (modulo_abandono->>'momento_segundos')::int <= 120 THEN '1-2 min'
        ELSE '> 2 min'
    END as momento_rango,
    
    -- Razon
    modulo_abandono->>'razon' as razon,
    
    -- Iniciado por
    modulo_abandono->>'iniciado_por' as iniciado_por,
    
    -- Conteos
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as porcentaje
    
FROM analisis_llamadas
WHERE 
    fecha_llamada >= CURRENT_DATE - INTERVAL '30 days'
    AND (modulo_abandono->>'hubo_abandono')::boolean = true
GROUP BY 
    momento_rango,
    modulo_abandono->>'razon',
    modulo_abandono->>'iniciado_por'
ORDER BY total DESC;
```

### Vista 4: Metricas por Agente (3 Modulos)

```sql
CREATE OR REPLACE VIEW vista_agente_modulos AS
SELECT
    a.agente_id,
    ag.nombre as agente_nombre,
    ag.equipo,
    
    -- Totales
    COUNT(*) as total_llamadas,
    
    -- Modulo 1: Contacto Directo
    ROUND(AVG(a.score_contacto_directo), 1) as score_contacto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_contacto_directo->'desglose'->'monto_mencionado'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_monto,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_contacto_directo->'desglose'->'manejo_objeciones'->>'calidad')::int >= 3) / NULLIF(COUNT(*), 0), 1) as pct_buen_manejo_objeciones,
    
    -- Modulo 2: Compromiso de Pago
    ROUND(AVG(a.score_compromiso_pago), 1) as score_compromiso,
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as pct_validacion,
    
    -- Modulo 3: Abandono
    ROUND(100.0 * COUNT(*) FILTER (WHERE (a.modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
    
    -- Score Total y Probabilidad
    ROUND(AVG(a.score_total), 1) as score_total,
    ROUND(AVG(a.probabilidad_cumplimiento), 1) as prob_cumplimiento
    
FROM analisis_llamadas a
JOIN agentes ag ON a.agente_id = ag.agente_id
WHERE a.fecha_llamada >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY a.agente_id, ag.nombre, ag.equipo
ORDER BY score_total DESC;
```

### Vista 5: Evolucion Semanal

```sql
CREATE OR REPLACE VIEW vista_evolucion_semanal AS
SELECT
    DATE_TRUNC('week', fecha_llamada) as semana,
    
    -- Scores promedio
    ROUND(AVG(score_total), 1) as score_total,
    ROUND(AVG(score_contacto_directo), 1) as score_contacto,
    ROUND(AVG(score_compromiso_pago), 1) as score_compromiso,
    
    -- Tasa de validacion (clave del modelo)
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_compromiso_pago->'desglose'->'validacion_cliente'->>'presente')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_validacion,
    
    -- Tasa de abandono
    ROUND(100.0 * COUNT(*) FILTER (WHERE (modulo_abandono->>'hubo_abandono')::boolean) / NULLIF(COUNT(*), 0), 1) as tasa_abandono,
    
    -- Probabilidad promedio
    ROUND(AVG(probabilidad_cumplimiento), 1) as prob_cumplimiento,
    
    -- Volumen
    COUNT(*) as total_llamadas
    
FROM analisis_llamadas
WHERE fecha_llamada >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', fecha_llamada)
ORDER BY semana DESC;
```

---

## Fase 2: Nuevas Paginas del Dashboard

### Estructura de Navegacion Propuesta

```
Dashboard (Home)
|-- Vision General (nuevo)         <- Pagina 1
|-- Modulo 1: Contacto Directo    <- Pagina 2
|-- Modulo 2: Compromiso de Pago  <- Pagina 3
|-- Modulo 3: Abandono            <- Pagina 4
|-- Agentes
|-- Llamadas
|-- Alertas
|-- Chat
```

---

### Pagina 1: Vision General (`/modulos`)

**Contenido:**
- Header con titulo "Tres Pilares para la Excelencia en Cobranza"
- 3 cards grandes (Contacto, Compromiso, Abandono) con:
  - Score promedio del periodo
  - Tendencia vs semana anterior
  - KPI principal de cada modulo
- Grafico de evolucion semanal (line chart con 3 lineas)
- Tabla de agentes con los 3 scores

**Componentes:**
- `ModuloCard` - Card grande para cada pilar
- `EvolucionChart` - Grafico de lineas
- `TablaAgentesModulos` - Tabla comparativa

---

### Pagina 2: Contacto Directo (`/modulos/contacto`)

**Header:** "Analisis del Contacto Directo: La Primera Impresion es Definitiva"

**Seccion 1: Variables Analizadas**
- Cards para cada variable:
  - Claridad en entrega de informacion (monto, fechas, consecuencias)
  - Presentacion de alternativas de pago
  - Manejo de objeciones

**Seccion 2: Cumplimiento por Variable**
- Grafico de barras horizontales mostrando % de llamadas que cumplen cada variable
- Comparativo vs periodo anterior

**Seccion 3: Ranking de Agentes**
- Tabla ordenada por score de contacto directo
- Indicador de fortalezas/debilidades por variable

**Componentes:**
- `VariableCard` - Card con metrica y descripcion
- `CumplimientoBarChart` - Barras horizontales
- `TablaRankingContacto` - Tabla de agentes

---

### Pagina 3: Compromiso de Pago (`/modulos/compromiso`)

**Header:** "Calidad del Compromiso: Convirtiendo Conversaciones en Resultados"

**Seccion 1: Los 4 Pilares**
- 4 cards con las ponderaciones:
  - Oferta Clara (20%)
  - Alternativas de Pago (10%)
  - Fecha Especifica (20%)
  - Validacion del Cliente (50%)

**Seccion 2: Diagrama de Flujo de Probabilidad**
- Visualizacion tipo funnel/steps mostrando:
  - Inicio: 0%
  - +Oferta clara: 20%
  - +Alternativas: 30%
  - +Fecha especifica: 50%
  - +Validacion: 100%

**Seccion 3: Impacto por Elementos**
- Grafico de barras (como en la presentacion):
  - Sin elementos
  - Solo oferta
  - Oferta + alternativas
  - Tres elementos
  - Acuerdo completo

**Seccion 4: Detalle de Validaciones**
- % de llamadas con validacion explicita
- Tipos de validacion detectados
- Frases de cierre mas efectivas (si disponibles)

**Componentes:**
- `PilarCard` - Card con porcentaje de peso
- `ProbabilidadFlow` - Diagrama de flechas/steps
- `ImpactoElementosChart` - Grafico de barras
- `ValidacionMetrics` - Metricas de validacion

---

### Pagina 4: Abandono de Llamadas (`/modulos/abandono`)

**Header:** "Analisis del Abandono de Llamadas: Prevenir la Desconexion"

**Seccion 1: KPIs Principales**
- 3 donut charts grandes:
  - % Abandono en primeros 30 seg
  - % Abandono al mencionar monto
  - % Abandono durante objeciones

**Seccion 2: Recurrencia de Abandonos**
- Patrones detectados:
  - Por agente
  - Por horario
  - Por tipo de deuda
  - Por campana

**Seccion 3: Mapeo del Script**
- Visualizacion de en que parte del script ocurren mas abandonos
- Secciones problematicas identificadas

**Seccion 4: Comparativo por Agente**
- Tabla con tasa de abandono por agente
- Highlight de agentes con alta tasa

**Componentes:**
- `DonutChart` - Grafico circular con porcentaje
- `PatronesAbandono` - Lista de patrones
- `ScriptMapChart` - Heatmap del script
- `TablaAbandonoAgentes` - Tabla comparativa

---

## Fase 3: Componentes Reutilizables

### Nuevos Componentes a Crear

```
src/components/modulos/
|-- ModuloHeader.tsx        # Header con badge y titulo
|-- PilarCard.tsx           # Card para cada pilar/variable
|-- ScoreGauge.tsx          # Gauge circular para scores
|-- TrendIndicator.tsx      # Flecha con % cambio
|-- ProbabilidadFlow.tsx    # Diagrama de flujo
|-- CumplimientoBar.tsx     # Barra de progreso con %
|-- DonutMetric.tsx         # Donut chart con valor central
|-- ModuloTable.tsx         # Tabla generica para modulos
```

### Hooks Nuevos

```
src/hooks/
|-- useModulosGlobal.ts     # Datos de vista_modulos_global
|-- useCompromisoElementos.ts # Datos de vista_compromiso_elementos
|-- useAbandonos.ts          # Datos de vista_abandonos_detalle
|-- useAgentesModulos.ts     # Datos de vista_agente_modulos
|-- useEvolucionSemanal.ts   # Datos de vista_evolucion_semanal
```

---

## Fase 4: Checklist de Implementacion

### SQL (Supabase)

- [ ] Crear `vista_modulos_global`
- [ ] Crear `vista_compromiso_elementos`
- [ ] Crear `vista_abandonos_detalle`
- [ ] Crear `vista_agente_modulos`
- [ ] Crear `vista_evolucion_semanal`
- [ ] Insertar datos de prueba con modulos completos

### Frontend - Setup

- [ ] Crear carpeta `src/components/modulos/`
- [ ] Crear carpeta `src/pages/modulos/`
- [ ] Agregar rutas en `App.tsx`
- [ ] Actualizar navegacion en `Sidebar.tsx`

### Frontend - Pagina 1: Vision General

- [ ] Crear `ModulosOverview.tsx`
- [ ] Implementar `ModuloCard.tsx`
- [ ] Implementar grafico de evolucion
- [ ] Conectar con `useModulosGlobal`

### Frontend - Pagina 2: Contacto Directo

- [ ] Crear `ContactoDirecto.tsx`
- [ ] Implementar cards de variables
- [ ] Implementar grafico de cumplimiento
- [ ] Tabla de ranking

### Frontend - Pagina 3: Compromiso de Pago

- [ ] Crear `CompromisoPago.tsx`
- [ ] Implementar `PilarCard.tsx` con pesos
- [ ] Implementar `ProbabilidadFlow.tsx`
- [ ] Implementar grafico de impacto por elementos

### Frontend - Pagina 4: Abandono

- [ ] Crear `AbandonoLlamadas.tsx`
- [ ] Implementar donut charts
- [ ] Implementar seccion de patrones
- [ ] Tabla de agentes

### Integracion

- [ ] Conectar Realtime a las nuevas vistas
- [ ] Agregar a dashboardStore
- [ ] Testing con datos reales

---

## Cronograma Estimado

| Fase | Duracion | Dependencias |
|------|----------|--------------|
| Fase 1: SQL Views | 1 dia | Ninguna |
| Fase 2: Estructura paginas | 1 dia | Fase 1 |
| Fase 3: Componentes | 2 dias | Fase 2 |
| Fase 4: Integracion | 1 dia | Fase 3 |
| Testing | 1 dia | Fase 4 |

**Total estimado: 6 dias**

---

## Notas Importantes

1. **No se modifica el schema existente** - Solo se crean vistas
2. **Datos de prueba necesarios** - Las vistas necesitan datos en `analisis_llamadas` con los campos JSONB poblados
3. **Realtime** - Las vistas se pueden suscribir igual que las tablas
4. **Performance** - Considerar agregar `MATERIALIZED VIEW` si las queries son lentas




