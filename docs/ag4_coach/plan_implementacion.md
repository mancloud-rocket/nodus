# Plan de Implementacion - Agente Coach

## Resumen

| Aspecto | Detalle |
|---------|---------|
| **Tiempo estimado** | 3-4 dias |
| **Complejidad** | Alta |
| **Dependencias** | Agente Analista funcionando, datos historicos |
| **Tecnologias** | Saturn Studio, Claude Opus 4.5, Supabase, Email |

---

## Objetivos del Sprint

1. Implementar cron diario a las 08:00 AM
2. Calcular metricas por agente
3. Implementar comparativa con equipo
4. Integrar Claude Opus para analisis y recomendaciones
5. Generar reportes personalizados
6. Configurar notificaciones a agentes y supervisores
7. Testing end-to-end

---

## Checklist Detallado

### Fase 1: Preparacion (Dia 1 - Manana)

#### 1.1 Configuracion de Entorno
- [ ] Verificar acceso a Saturn Studio
- [ ] Verificar API key de Anthropic (Claude Opus)
- [ ] Configurar variables de entorno:
  ```
  CLAUDE_API_KEY=sk-ant-xxx
  CLAUDE_MODEL_COACH=claude-opus-4-5-20250514
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_KEY=xxx
  SENDGRID_API_KEY=SG.xxx
  EMAIL_FROM=coaching@nodus.com
  ```

#### 1.2 Verificar Schema de Supabase
- [ ] Confirmar tabla `coaching_reports` existe con todos los campos
- [ ] Verificar tabla `agentes` tiene campo `equipo` y `supervisor_id`
- [ ] Crear indices para queries frecuentes:
  ```sql
  CREATE INDEX idx_coaching_agente_fecha ON coaching_reports(agente_id, fecha_reporte DESC);
  CREATE INDEX idx_analisis_agente_fecha ON analisis_llamadas(agente_id, created_at DESC);
  ```

#### 1.3 Verificar Datos Historicos
- [ ] Confirmar que hay al menos 1 semana de datos en analisis_llamadas
- [ ] Verificar que hay agentes activos con llamadas
- [ ] Identificar agentes de prueba para testing

---

### Fase 2: Obtencion de Datos (Dia 1 - Tarde)

#### 2.1 Crear Flujo Principal
- [ ] Crear nuevo flujo "Agente Coach"
- [ ] Configurar trigger: Cron `0 8 * * *` (08:00 diario)
- [ ] Timezone: America/Santiago
- [ ] Configurar timeout: 15 minutos

#### 2.2 Nodo: Obtener Agentes Activos
- [ ] Query agentes WHERE estado = 'activo'
- [ ] Filtrar por antiguedad > 7 dias
- [ ] Agrupar por equipo
- [ ] Obtener supervisor de cada equipo

#### 2.3 Nodo: Obtener Datos por Agente (Paralelo)
- [ ] Query: Ultimos 25 analisis del agente
- [ ] Query: Reporte de coaching anterior
- [ ] Query: Alertas de la semana
- [ ] Query: Benchmark del equipo
- [ ] Configurar paralelismo max 5 agentes

#### 2.4 Validacion de Datos
- [ ] Verificar minimo 5 llamadas para generar reporte
- [ ] Manejar agentes sin historial
- [ ] Logging de agentes saltados

---

### Fase 3: Calculo de Metricas (Dia 2 - Manana)

#### 3.1 Nodo: Calcular Metricas del Periodo
- [ ] Implementar funcion calcularMetricas()
- [ ] Calcular scores promedio
- [ ] Calcular tasa de validacion
- [ ] Calcular tasa de abandono
- [ ] Calcular distribucion de scores
- [ ] Calcular probabilidad cumplimiento promedio

#### 3.2 Nodo: Calcular Comparativa con Equipo
- [ ] Implementar funcion calcularComparativa()
- [ ] Calcular ranking en el equipo
- [ ] Calcular percentil
- [ ] Calcular distancia al mejor/promedio

#### 3.3 Nodo: Calcular Tendencia
- [ ] Comparar con reporte anterior
- [ ] Determinar direccion (mejorando/estable/empeorando)
- [ ] Calcular racha de mejora/caida

#### 3.4 Nodo: Preparar Muestra de Llamadas
- [ ] Seleccionar 3 mejores llamadas
- [ ] Seleccionar 3 peores llamadas
- [ ] Incluir razones de bajo score

---

### Fase 4: Analisis con LLM (Dia 2 - Tarde)

#### 4.1 Nodo: Construir Prompt
- [ ] Cargar template de prompt_analisis_agente.md
- [ ] Inyectar todas las variables:
  - Datos del agente
  - Metricas del periodo
  - Comparativa equipo
  - Reporte anterior
  - Alertas
  - Muestra de llamadas
- [ ] Validar que el prompt no exceda limites

#### 4.2 Nodo: Llamar Claude Opus
- [ ] Configurar:
  - Model: claude-opus-4-5-20250514
  - Temperature: 0.4
  - Max tokens: 3000
- [ ] Implementar retry con backoff
- [ ] Timeout: 60 segundos por agente

#### 4.3 Nodo: Parsear y Validar Respuesta
- [ ] Parsear JSON de respuesta
- [ ] Validar estructura esperada:
  - fortalezas: array de 3
  - gap_critico: objeto completo
  - plan_mejora: con objetivo y acciones
  - mensaje_motivacional: 50-300 chars
- [ ] Manejar errores de parsing

---

### Fase 5: Persistencia (Dia 3 - Manana)

#### 5.1 Nodo: Construir Reporte Completo
- [ ] Combinar metricas calculadas + output LLM
- [ ] Agregar metadata (modelo, tiempo, version)
- [ ] Validar objeto completo antes de INSERT

#### 5.2 Nodo: INSERT en coaching_reports
- [ ] INSERT con RETURNING reporte_id
- [ ] Manejar errores de constraint
- [ ] Logging de reportes creados

#### 5.3 Nodo: Agrupar Reportes por Equipo
- [ ] Agrupar para resumen de supervisor
- [ ] Calcular metricas agregadas del equipo
- [ ] Identificar top performers
- [ ] Identificar agentes que requieren atencion

---

### Fase 6: Notificaciones (Dia 3 - Tarde)

#### 6.1 Notificacion a Agentes (In-app)
- [ ] INSERT en notificaciones_usuarios
- [ ] Incluir:
  - Score y tendencia
  - Ranking en equipo
  - Link al reporte completo
- [ ] Configurar badge en dashboard

#### 6.2 Notificacion a Supervisores (Email)
- [ ] Crear template HTML de resumen
- [ ] Incluir:
  - Score promedio del equipo
  - Top 3 performers
  - Agentes que requieren atencion
  - Link al dashboard
- [ ] Enviar a las 08:15 (despues de procesar)

#### 6.3 Casos Especiales
- [ ] Email a agente nuevo (< 30 dias)
- [ ] Email a agente en bottom 10%
- [ ] Alerta a supervisor si agente con racha negativa > 3

---

### Fase 7: Testing (Dia 4)

#### 7.1 Tests de Calculo de Metricas
- [ ] Test: Calcular score promedio correcto
- [ ] Test: Calcular tasa validacion correcta
- [ ] Test: Ranking se calcula bien con empates
- [ ] Test: Tendencia detecta mejora/caida

#### 7.2 Tests de Analisis LLM
- [ ] Test: Prompt se construye correctamente
- [ ] Test: Respuesta se parsea correctamente
- [ ] Test: Validacion rechaza fortalezas < 3
- [ ] Test: Mensaje motivacional cumple limites

#### 7.3 Tests de Integracion
- [ ] Test E2E: Agente mejorando
  - Input: Agente con score subiendo
  - Expected: Tendencia "mejorando", mensaje celebratorio
- [ ] Test E2E: Agente empeorando
  - Input: Agente con score bajando
  - Expected: Tendencia "empeorando", mensaje de apoyo
- [ ] Test E2E: Agente nuevo
  - Input: Agente con 10 dias
  - Expected: Mensaje de bienvenida, objetivos basicos

#### 7.4 Tests de Notificaciones
- [ ] Test: Agente recibe notificacion in-app
- [ ] Test: Supervisor recibe email con resumen
- [ ] Test: Email contiene datos correctos del equipo

#### 7.5 Tests de Performance
- [ ] Procesar 10 agentes en < 2 min
- [ ] Procesar 50 agentes en < 5 min
- [ ] LLM no excede timeout de 60s

---

## Procesamiento en Paralelo

```javascript
// Configuracion de paralelismo
const CONFIG = {
  max_concurrent_agents: 5,      // Max agentes procesando LLM simultaneo
  batch_size: 5,                 // Agentes por batch
  delay_between_batches: 1000,   // 1s entre batches
  llm_timeout: 60000,            // 60s timeout por agente
  total_timeout: 900000          // 15 min timeout total
};
```

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|--------------|---------|------------|
| Claude timeout | Media | Alto | Retry + skip si falla |
| Agente sin datos | Alta | Bajo | Validar minimo 5 llamadas |
| Reporte duplicado | Baja | Medio | Verificar fecha antes de INSERT |
| LLM genera JSON invalido | Media | Medio | Validacion estricta + retry |
| Cron no ejecuta | Baja | Alto | Alerta si no hay reportes a 09:00 |

---

## Metricas de Exito

| Metrica | Target | Critico |
|---------|--------|---------|
| Tiempo total (50 agentes) | < 5 min | > 15 min |
| Tiempo por agente | < 10s | > 30s |
| Tasa de exito | > 98% | < 90% |
| Errores LLM | < 5% | > 15% |
| Reportes generados | 100% agentes activos | < 90% |

---

## Cronograma

```
Dia 1 (Manana):  Preparacion + Schema
Dia 1 (Tarde):   Obtencion de datos
Dia 2 (Manana):  Calculo de metricas
Dia 2 (Tarde):   Analisis con LLM
Dia 3 (Manana):  Persistencia
Dia 3 (Tarde):   Notificaciones
Dia 4:           Testing completo
```

---

## Criterios de Aceptacion

1. El cron se ejecuta todos los dias a las 08:00 sin fallos
2. Cada agente activo (> 7 dias, > 5 llamadas) recibe un reporte
3. El reporte contiene exactamente 3 fortalezas
4. El gap critico es relevante y accionable
5. El plan de mejora tiene maximo 3 acciones especificas
6. El mensaje motivacional es personalizado segun tendencia
7. Los supervisores reciben resumen del equipo por email
8. Los agentes ven notificacion in-app con su reporte
9. El tiempo total de procesamiento es < 5 minutos para 50 agentes
10. La tasa de exito es > 98%

---

## Dependencias con Otros Agentes

| Agente | Dependencia | Tipo |
|--------|-------------|------|
| Analista | Datos de analisis_llamadas | Requerido |
| Detector | Alertas en alertas_anomalias | Opcional |
| Estratega | Consume reportes de coaching | Downstream |
| Conversacional | Consulta reportes | Downstream |

