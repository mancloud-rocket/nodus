# Plan de Implementacion - Agente Detector (Modo Periodico 24h)

## Resumen

| Aspecto | Detalle |
|---------|---------|
| **Tiempo estimado** | 1-1.5 dias |
| **Complejidad** | Baja |
| **Dependencias** | Agente Analista funcionando, datos en analisis_llamadas |
| **Tecnologias** | Saturn Studio (SQL), Supabase Functions, Slack, Email |

---

## Arquitectura Simplificada

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
├─────────────────────────────────────────────────────────────┤
│  FUNCIONES:                                                  │
│  - evaluar_alertas_agente(nombre, horas)                    │
│  - evaluar_alertas_todos_agentes(horas)                     │
│  - evaluar_alertas_sistemicas(horas)                        │
│  - ejecutar_detector(horas, dias_dedup)                     │
│  - obtener_metricas_periodo(horas)                          │
│                                                              │
│  VISTAS:                                                     │
│  - v_alertas_agentes_24h                                    │
│  - v_alertas_sistemicas_24h                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SATURN STUDIO                             │
├─────────────────────────────────────────────────────────────┤
│  CRON 07:00 AM                                               │
│  └── Nodo 1: SQL → ejecutar_detector() + INSERT             │
│  └── Nodo 2: SQL → obtener_metricas_periodo()               │
│  └── Nodo 3: SQL → INSERT notificaciones_usuarios           │
│  └── Nodo 4: Condicional → hay alertas criticas/altas?      │
│  └── Nodo 5: HTTP → Slack (si aplica)                       │
│  └── Nodo 6: HTTP → Email (si aplica)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist Detallado

### Fase 1: Crear Funciones en Supabase (2-3 horas)

#### 1.1 Preparar Archivo SQL
- [ ] Revisar `supabase/functions/detector_functions.sql`
- [ ] Ajustar umbrales si es necesario:
  - Score critico: < 40
  - Score bajo: < 55
  - Abandono alto: > 20%
  - Validacion minima: < 15%

#### 1.2 Ejecutar en Supabase
- [ ] Conectar a Supabase SQL Editor
- [ ] Ejecutar el script completo
- [ ] Verificar que las funciones se crearon:
  ```sql
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name LIKE 'evaluar%' OR routine_name LIKE 'ejecutar%';
  ```

#### 1.3 Probar Funciones Manualmente
- [ ] Test: `SELECT * FROM evaluar_alertas_agente('NombreAgente', 24);`
- [ ] Test: `SELECT * FROM evaluar_alertas_todos_agentes(24);`
- [ ] Test: `SELECT * FROM evaluar_alertas_sistemicas(24);`
- [ ] Test: `SELECT * FROM ejecutar_detector(24, 3);`
- [ ] Test: `SELECT * FROM obtener_metricas_periodo(24);`

---

### Fase 2: Configurar Saturn Studio (2-3 horas)

#### 2.1 Crear Flujo Principal
- [ ] Crear nuevo flujo "Agente Detector"
- [ ] Configurar trigger: Cron `0 7 * * *`
- [ ] Timezone: America/Santiago
- [ ] Timeout: 2 minutos

#### 2.2 Nodo 1: Ejecutar Detector e Insertar
- [ ] Tipo: SQL Query
- [ ] Query:
  ```sql
  INSERT INTO alertas_anomalias (
      tipo, severidad, codigo, descripcion, agente_id, 
      agente_nombre, equipo, datos, accion_requerida, 
      estado, leida, resuelta
  )
  SELECT 
      tipo, severidad, codigo, descripcion, agente_id,
      agente_nombre, equipo, datos, accion_requerida,
      'activa', false, false
  FROM ejecutar_detector(24, 3)
  WHERE es_nueva = true
  RETURNING alerta_id, tipo, severidad, codigo, agente_nombre, descripcion;
  ```
- [ ] Guardar resultado en variable `alertas_insertadas`

#### 2.3 Nodo 2: Obtener Resumen
- [ ] Tipo: SQL Query
- [ ] Query:
  ```sql
  WITH metricas AS (SELECT * FROM obtener_metricas_periodo(24)),
  conteo AS (
      SELECT 
          COUNT(*) FILTER (WHERE severidad = 'critica') as criticas,
          COUNT(*) FILTER (WHERE severidad = 'alta') as altas,
          COUNT(*) FILTER (WHERE severidad = 'media') as medias,
          COUNT(*) as total
      FROM alertas_anomalias WHERE DATE(created_at) = CURRENT_DATE
  ),
  agentes AS (
      SELECT agente_nombre, ARRAY_AGG(codigo) as alertas
      FROM alertas_anomalias 
      WHERE DATE(created_at) = CURRENT_DATE AND agente_id IS NOT NULL
      GROUP BY agente_nombre
  )
  SELECT m.*, c.*, 
         (SELECT JSONB_AGG(jsonb_build_object('nombre', agente_nombre, 'alertas', alertas)) FROM agentes) as agentes_con_alertas
  FROM metricas m, conteo c;
  ```
- [ ] Guardar resultado en variable `resumen`

#### 2.4 Nodo 3: Crear Notificaciones In-App
- [ ] Tipo: SQL Query
- [ ] Query:
  ```sql
  INSERT INTO notificaciones_usuarios (usuario_id, tipo, titulo, mensaje, datos, leida)
  SELECT u.usuario_id, 'resumen_alertas',
         'Reporte de Alertas - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
         format('%s alertas: %s criticas, %s altas', 
                {{resumen.total}}, {{resumen.criticas}}, {{resumen.altas}}),
         jsonb_build_object('fecha', CURRENT_DATE, 'total', {{resumen.total}}),
         false
  FROM usuarios u WHERE u.rol IN ('supervisor', 'director');
  ```

#### 2.5 Nodo 4: Condicional
- [ ] Tipo: Conditional
- [ ] Condicion: `resumen.criticas > 0 OR resumen.altas > 0`
- [ ] Si true: continuar a Nodo 5
- [ ] Si false: terminar

#### 2.6 Nodo 5: Enviar Slack
- [ ] Tipo: HTTP Request
- [ ] Method: POST
- [ ] URL: `{{SLACK_WEBHOOK_URL}}`
- [ ] Body: Template de mensaje con datos del resumen

#### 2.7 Nodo 6: Enviar Email
- [ ] Tipo: HTTP Request (SendGrid API)
- [ ] Method: POST
- [ ] URL: `https://api.sendgrid.com/v3/mail/send`
- [ ] Headers: `Authorization: Bearer {{SENDGRID_API_KEY}}`
- [ ] Body: Template de email con resumen

---

### Fase 3: Configurar Notificaciones (1-2 horas)

#### 3.1 Slack
- [ ] Crear canal #alertas-cobranza (si no existe)
- [ ] Crear Incoming Webhook en Slack
- [ ] Agregar URL a variables de Saturn Studio
- [ ] Probar envio manual

#### 3.2 Email
- [ ] Configurar cuenta SendGrid (si no existe)
- [ ] Obtener API Key
- [ ] Crear template de email en SendGrid
- [ ] Agregar credenciales a Saturn Studio
- [ ] Probar envio manual

---

### Fase 4: Testing (2-3 horas)

#### 4.1 Test de Funciones SQL
- [ ] Ejecutar cada funcion con datos reales
- [ ] Verificar que retorna alertas correctas
- [ ] Verificar deduplicacion funciona

#### 4.2 Test del Flujo Completo
- [ ] Ejecutar flujo manualmente en Saturn Studio
- [ ] Verificar alertas insertadas en tabla
- [ ] Verificar notificaciones in-app creadas
- [ ] Verificar mensaje de Slack recibido
- [ ] Verificar email recibido

#### 4.3 Test de Casos Borde
- [ ] Sin datos en las ultimas 24h: no debe fallar
- [ ] Sin alertas: no enviar Slack/Email
- [ ] Todas las alertas son duplicadas: no insertar nada

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| Sin datos suficientes | Media | Bajo | Funciones retornan vacio |
| Funcion SQL falla | Baja | Alto | Probar exhaustivamente |
| Timeout en cron | Baja | Medio | Timeout de 2 min |
| Slack no disponible | Baja | Bajo | No es critico |

---

## Metricas de Exito

| Metrica | Target | Critico |
|---------|--------|---------|
| Tiempo total | < 10s | > 30s |
| Alertas detectadas | 100% | < 90% |
| Deduplicacion | > 99% | < 90% |
| Entrega Slack | > 99% | < 95% |

---

## Cronograma

```
Dia 1 (Manana):  Crear funciones en Supabase + Probar
Dia 1 (Tarde):   Configurar Saturn Studio (Nodos 1-4)
Dia 2 (Manana):  Configurar notificaciones (Nodos 5-6)
Dia 2 (Tarde):   Testing completo
```

---

## Criterios de Aceptacion

1. Las funciones SQL se ejecutan sin errores
2. El cron se ejecuta todos los dias a las 07:00
3. Las alertas se insertan correctamente en la tabla
4. No hay alertas duplicadas (ventana 3 dias)
5. Las notificaciones llegan segun severidad
6. El tiempo total es < 10 segundos

---

## Queries de Verificacion

### Ver alertas de hoy
```sql
SELECT * FROM alertas_anomalias 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY severidad, created_at;
```

### Ver historial de ejecuciones
```sql
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as alertas,
    COUNT(*) FILTER (WHERE severidad = 'critica') as criticas
FROM alertas_anomalias
GROUP BY DATE(created_at)
ORDER BY fecha DESC
LIMIT 7;
```

### Verificar deduplicacion
```sql
-- Alertas que serian duplicadas si se ejecutara ahora
SELECT codigo, agente_nombre, COUNT(*)
FROM alertas_anomalias
WHERE created_at >= NOW() - INTERVAL '3 days'
GROUP BY codigo, agente_nombre
HAVING COUNT(*) > 1;
```
