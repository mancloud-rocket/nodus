# Agente #3: Detector

## Vision General

El Agente Detector identifica anomalias y patrones problematicos a nivel de agentes y del sistema en general. Opera en modo periodico, ejecutandose diariamente a las 07:00 AM para analizar las ultimas 24 horas.

**Enfoque:** La logica de deteccion esta encapsulada en **funciones SQL de Supabase**, y la persistencia/notificacion se maneja via **queries SQL directos en Saturn Studio**.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ evaluar_alertas_agente(nombre, horas)                │   │
│  │ evaluar_alertas_todos_agentes(horas)                 │   │
│  │ evaluar_alertas_sistemicas(horas)                    │   │
│  │ ejecutar_detector(horas, dias_dedup)                 │   │
│  │ obtener_metricas_periodo(horas)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        Cron 07:00 AM │ Queries SQL
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SATURN STUDIO                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ INSERT FROM ejecutar_detector() → alertas_anomalias  │   │
│  │ SELECT obtener_metricas_periodo() → resumen          │   │
│  │ Notificaciones: Slack, Email, In-app                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Funciones SQL de Supabase

| Funcion | Parametros | Descripcion |
|---------|------------|-------------|
| `evaluar_alertas_agente` | nombre, horas | Evalua reglas para un agente especifico |
| `evaluar_alertas_todos_agentes` | horas | Evalua todos los agentes activos |
| `evaluar_alertas_sistemicas` | horas | Evalua reglas a nivel sistema |
| `ejecutar_detector` | horas, dias_dedup | Combina todo + deduplicacion |
| `obtener_metricas_periodo` | horas | Metricas para el resumen diario |

**Archivo:** `supabase/functions/detector_functions.sql`

---

## Tipos de Alertas

### Por Agente
| Codigo | Severidad | Condicion |
|--------|-----------|-----------|
| `AGENTE_SCORE_CRITICO` | Critica | Score < 40 |
| `AGENTE_SCORE_BAJO` | Alta | Score 40-55 |
| `AGENTE_ABANDONO_ALTO` | Alta | Tasa > 20% |
| `AGENTE_SIN_VALIDACION` | Alta | Tasa < 15% |
| `AGENTE_CAIDA_SCORE` | Media | Caida > 15% |
| `PATRON_LLAMADAS_CRITICAS` | Alta | >= 5 criticas |
| `AGENTE_PROBABILIDAD_BAJA` | Media | Prob < 30% |

### Sistemicas
| Codigo | Severidad | Condicion |
|--------|-----------|-----------|
| `SISTEMA_TASA_ABANDONO` | Critica | > 25% global |
| `SISTEMA_CAIDA_SCORES` | Alta | Caida > 10% |
| `SISTEMA_VALIDACION_BAJA` | Alta | < 25% global |
| `SISTEMA_VOLUMEN_BAJO` | Media | < 70% esperado |

---

## Uso Rapido

### Evaluar un agente
```sql
SELECT * FROM evaluar_alertas_agente('Pedro Ruiz', 24);
```

### Evaluar todos
```sql
SELECT * FROM evaluar_alertas_todos_agentes(24);
```

### Ejecutar detector completo (con deduplicacion)
```sql
SELECT * FROM ejecutar_detector(24, 3) WHERE es_nueva = true;
```

### Persistir alertas
```sql
INSERT INTO alertas_anomalias (tipo, severidad, codigo, descripcion, agente_id, agente_nombre, equipo, datos, accion_requerida, estado, leida, resuelta)
SELECT tipo, severidad, codigo, descripcion, agente_id, agente_nombre, equipo, datos, accion_requerida, 'activa', false, false
FROM ejecutar_detector(24, 3)
WHERE es_nueva = true;
```

### Obtener metricas
```sql
SELECT * FROM obtener_metricas_periodo(24);
```

---

## Output de ejecutar_detector()

```json
{
  "tipo": "agente",
  "severidad": "critica",
  "codigo": "AGENTE_SCORE_CRITICO",
  "descripcion": "Score promedio critico (36) en ultimas 24 horas",
  "agente_id": "uuid-aqui",
  "agente_nombre": "Pedro Ruiz",
  "equipo": "Equipo Sur",
  "datos": {
    "score_promedio": 36,
    "total_llamadas": 20,
    "llamadas_criticas": 12,
    "umbral": 40
  },
  "accion_requerida": "Intervencion inmediata - coaching urgente",
  "es_nueva": true
}
```

---

## Tabla de Destino

**alertas_anomalias**
| Campo | Tipo | Fuente |
|-------|------|--------|
| tipo | TEXT | funcion |
| severidad | TEXT | funcion |
| codigo | TEXT | funcion |
| descripcion | TEXT | funcion |
| agente_id | UUID | funcion |
| agente_nombre | TEXT | funcion |
| equipo | TEXT | funcion |
| datos | JSONB | funcion |
| accion_requerida | TEXT | funcion |
| estado | TEXT | 'activa' |
| leida | BOOLEAN | false |
| resuelta | BOOLEAN | false |

---

## Estructura de Archivos

```
docs/ag3_detector/
├── README.md                    # Este archivo
├── reglas_deteccion.md          # Detalle de cada regla
├── config_umbrales.json         # Umbrales configurables
├── notificaciones.md            # Config Slack/Email
├── input_ejemplo.json           # Ejemplo de datos
├── output_ejemplo.json          # Ejemplo de alertas
├── flujo_completo.md            # E2E con queries
├── insert_supabase.md           # SQL de insercion
└── plan_implementacion.md       # Checklist

supabase/functions/
└── detector_functions.sql       # Funciones SQL completas
```

---

## Ventajas de este Enfoque

1. **Logica en Supabase:** Las reglas estan en funciones SQL, faciles de modificar sin tocar Saturn Studio
2. **Queries directos:** Saturn Studio solo ejecuta queries, sin logica compleja
3. **Deduplicacion automatica:** La funcion `ejecutar_detector()` incluye deduplicacion
4. **Testeable:** Puedes ejecutar las funciones manualmente para probar
5. **Performante:** Todo se ejecuta en la base de datos, sin transferencia de datos

---

## Tiempo de Implementacion

| Fase | Tiempo |
|------|--------|
| Crear funciones SQL | 2-3h |
| Configurar Saturn Studio | 2-3h |
| Configurar notificaciones | 1-2h |
| Testing | 2-3h |
| **Total** | **1-1.5 dias** |
