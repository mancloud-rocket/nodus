# Agente Analista - INSERT en Supabase

## Tabla Destino: `analisis_llamadas`

---

## SQL de INSERT Completo

```sql
INSERT INTO analisis_llamadas (
    registro_id,
    transcripcion_id,
    agente_id,
    score_total,
    score_contacto_directo,
    score_compromiso_pago,
    modulo_contacto_directo,
    modulo_compromiso_pago,
    modulo_abandono,
    probabilidad_cumplimiento,
    nivel_cumplimiento,
    factores_prediccion,
    alertas,
    recomendaciones,
    modelo_usado,
    version_prompt,
    confianza_analisis,
    tiempo_procesamiento_ms,
    fecha_llamada
) VALUES (
    $1,   -- registro_id UUID
    $2,   -- transcripcion_id UUID
    $3,   -- agente_id UUID
    $4,   -- score_total INTEGER
    $5,   -- score_contacto_directo INTEGER
    $6,   -- score_compromiso_pago INTEGER
    $7,   -- modulo_contacto_directo JSONB
    $8,   -- modulo_compromiso_pago JSONB
    $9,   -- modulo_abandono JSONB
    $10,  -- probabilidad_cumplimiento INTEGER
    $11,  -- nivel_cumplimiento ENUM
    $12,  -- factores_prediccion JSONB
    $13,  -- alertas JSONB
    $14,  -- recomendaciones JSONB
    $15,  -- modelo_usado VARCHAR
    $16,  -- version_prompt VARCHAR
    $17,  -- confianza_analisis DECIMAL
    $18,  -- tiempo_procesamiento_ms INTEGER
    $19   -- fecha_llamada DATE
) RETURNING analisis_id;
```

---

## Ejemplo con Datos Reales (una línea)

```sql
INSERT INTO analisis_llamadas (registro_id, transcripcion_id, agente_id, score_total, score_contacto_directo, score_compromiso_pago, modulo_contacto_directo, modulo_compromiso_pago, modulo_abandono, probabilidad_cumplimiento, nivel_cumplimiento, factores_prediccion, alertas, recomendaciones, modelo_usado, version_prompt, confianza_analisis, tiempo_procesamiento_ms, fecha_llamada) VALUES ('f9725fdd-20db-43cf-a9fa-231ecbcbe3d5', 'e9066fbe-7c7c-4ec0-9bf0-8c1e68511ca9', '58e5acda-193c-4bd2-ad34-ddbb0130a9c0', 80, 80, 80, '{"score":80,"desglose":{"monto_mencionado":{"presente":true,"puntos":25,"max":25,"evidencia":"deuda de 405,302 pesos"},"fecha_vencimiento":{"presente":true,"puntos":15,"max":15,"evidencia":"antes del viernes"},"consecuencias_impago":{"presente":false,"puntos":15,"max":20,"evidencia":"No mencionadas pero cliente pagando"},"alternativas_pago":{"presente":true,"puntos":15,"max":15,"evidencia":"APP, web, sucursal"},"manejo_objeciones":{"calidad":0.4,"puntos":10,"max":25,"objeciones_detectadas":0,"detalle":"Sin objeciones"}}}'::JSONB, '{"score":80,"desglose":{"oferta_clara":{"presente":true,"puntos":20,"max":20,"evidencia":"128,888 CLP por 405,302 CLP"},"alternativas_pago":{"presente":true,"puntos":10,"max":10,"evidencia":"APP, web"},"fecha_especifica":{"presente":true,"puntos":20,"max":20,"fecha":"el sábado"},"validacion_cliente":{"presente":true,"tipo":"explicita","puntos":30,"max":50,"frase_exacta":"Sí yo creo que el sábado cancelo ese de 128"}}}'::JSONB, '{"hubo_abandono":false,"momento_segundos":null,"iniciado_por":null,"razon":null,"senales_previas":[]}'::JSONB, 78, 'alta', '{"factores_positivos":["Cliente ya pagó ayer","Validación explícita","Fecha específica acordada","Actitud colaborativa"],"factores_negativos":["Múltiples créditos pendientes"],"razonamiento":"La cliente demuestra patrón activo de pago...","historial_cliente_considerado":false,"confianza_prediccion":0.85}'::JSONB, '[]'::JSONB, '[{"prioridad":"alta","destinatario":"sistema","accion":"Bloquear oferta hasta sábado","cuando":"inmediato"},{"prioridad":"media","destinatario":"agente","accion":"Confirmar pagos el lunes","cuando":"lunes"}]'::JSONB, 'claude-opus-4-5-20250514', 'v1.0', 0.92, 3200, '2026-01-31') RETURNING analisis_id;
```

---

## UPDATE de registro_llamadas

Después del INSERT, actualizar el registro:

```sql
UPDATE registro_llamadas 
SET 
    estado = 'analizado',
    analisis_id = 'UUID_DEL_ANALISIS_INSERTADO',
    updated_at = NOW()
WHERE registro_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**Una línea**:
```sql
UPDATE registro_llamadas SET estado = 'analizado', analisis_id = 'UUID_DEL_ANALISIS', updated_at = NOW() WHERE registro_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

---

## Mapeo de Campos

| Campo SQL | Tipo | Fuente | Notas |
|-----------|------|--------|-------|
| `registro_id` | UUID | Webhook | FK a registro_llamadas |
| `transcripcion_id` | UUID | Webhook | FK a transcripciones |
| `agente_id` | UUID | Query registro | FK a agentes |
| `score_total` | INTEGER | Claude módulos | 0-100 |
| `score_contacto_directo` | INTEGER | Claude módulos | 0-100 |
| `score_compromiso_pago` | INTEGER | Claude módulos | 0-100 |
| `modulo_contacto_directo` | JSONB | Claude módulos | Desglose completo |
| `modulo_compromiso_pago` | JSONB | Claude módulos | Desglose completo |
| `modulo_abandono` | JSONB | Claude módulos | Info abandono |
| `probabilidad_cumplimiento` | INTEGER | Claude predicción | 0-100 |
| `nivel_cumplimiento` | ENUM | Calculado | 'baja'/'media'/'alta' |
| `factores_prediccion` | JSONB | Claude predicción | Factores +/- |
| `alertas` | JSONB | Generado | Array de alertas |
| `recomendaciones` | JSONB | Generado | Array de acciones |
| `modelo_usado` | VARCHAR | Config | claude-opus-4-5 |
| `version_prompt` | VARCHAR | Config | v1.0 |
| `confianza_analisis` | DECIMAL | Claude | 0.00-1.00 |
| `tiempo_procesamiento_ms` | INTEGER | Medido | Tiempo total |
| `fecha_llamada` | DATE | Registro | Fecha de llamada |

---

## Validaciones Pre-INSERT

```javascript
function validarAnalisis(analisis) {
  // Scores en rango
  if (analisis.score_total < 0 || analisis.score_total > 100) {
    throw new Error('score_total fuera de rango');
  }
  
  // Nivel cumplimiento válido
  if (!['baja', 'media', 'alta'].includes(analisis.nivel_cumplimiento)) {
    throw new Error('nivel_cumplimiento inválido');
  }
  
  // Probabilidad en rango
  if (analisis.probabilidad_cumplimiento < 0 || analisis.probabilidad_cumplimiento > 100) {
    throw new Error('probabilidad_cumplimiento fuera de rango');
  }
  
  // Confianza en rango
  if (analisis.confianza_analisis < 0 || analisis.confianza_analisis > 1) {
    throw new Error('confianza_analisis fuera de rango');
  }
  
  // JSONs no nulos
  if (!analisis.modulo_contacto_directo || !analisis.modulo_compromiso_pago) {
    throw new Error('Módulos de análisis incompletos');
  }
  
  return true;
}
```

---

## Supabase JS SDK

```javascript
const { data, error } = await supabase
  .from('analisis_llamadas')
  .insert({
    registro_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    transcripcion_id: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
    agente_id: '11111111-2222-3333-4444-555555555555',
    score_total: 80,
    score_contacto_directo: 80,
    score_compromiso_pago: 80,
    modulo_contacto_directo: { score: 80, desglose: {...} },
    modulo_compromiso_pago: { score: 80, desglose: {...} },
    modulo_abandono: { hubo_abandono: false },
    probabilidad_cumplimiento: 78,
    nivel_cumplimiento: 'alta',
    factores_prediccion: { factores_positivos: [...], factores_negativos: [...] },
    alertas: [],
    recomendaciones: [...],
    modelo_usado: 'claude-opus-4-5-20250514',
    version_prompt: 'v1.0',
    confianza_analisis: 0.92,
    tiempo_procesamiento_ms: 3200,
    fecha_llamada: '2026-01-31'
  })
  .select('analisis_id')
  .single();

if (error) throw error;

// Update registro
await supabase
  .from('registro_llamadas')
  .update({ 
    estado: 'analizado', 
    analisis_id: data.analisis_id 
  })
  .eq('registro_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```


