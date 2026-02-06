# Agente Detector - INSERT en Supabase

## Tabla Destino: `alertas_anomalias`

---

## SQL de INSERT Completo

```sql
INSERT INTO alertas_anomalias (
    tipo,
    severidad,
    codigo,
    descripcion,
    agente_id,
    agente_nombre,
    equipo,
    registro_id,
    analisis_id,
    datos,
    contexto,
    analisis_llm,
    accion_requerida,
    destinatarios,
    estado,
    leida,
    resuelta
) VALUES (
    $1,   -- tipo: 'individual' | 'patron' | 'sistemica'
    $2,   -- severidad: 'critica' | 'alta' | 'media' | 'baja'
    $3,   -- codigo: VARCHAR (ej: 'SCORE_CRITICO')
    $4,   -- descripcion: TEXT
    $5,   -- agente_id: UUID (null para sistemicas)
    $6,   -- agente_nombre: VARCHAR
    $7,   -- equipo: VARCHAR
    $8,   -- registro_id: UUID (null para sistemicas/patron)
    $9,   -- analisis_id: UUID (null para sistemicas/patron)
    $10,  -- datos: JSONB
    $11,  -- contexto: JSONB
    $12,  -- analisis_llm: JSONB (null si no aplica)
    $13,  -- accion_requerida: TEXT
    $14,  -- destinatarios: JSONB (array de strings)
    $15,  -- estado: 'activa' | 'en_revision' | 'resuelta'
    $16,  -- leida: BOOLEAN
    $17   -- resuelta: BOOLEAN
) RETURNING alerta_id;
```

---

## Ejemplos de INSERT (una linea)

### Alerta Individual

```sql
INSERT INTO alertas_anomalias (tipo, severidad, codigo, descripcion, agente_id, agente_nombre, equipo, registro_id, analisis_id, datos, contexto, analisis_llm, accion_requerida, destinatarios, estado, leida, resuelta) VALUES ('individual', 'alta', 'SCORE_BAJO', 'Score de llamada por debajo del umbral (42)', '11111111-2222-3333-4444-555555555555', 'Juan Perez', 'Equipo Norte', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', '{"score_total":42,"score_contacto":55,"score_compromiso":28,"umbral":50}'::JSONB, '{"es_patron":false,"score_promedio_agente":72}'::JSONB, NULL, 'Incluir en revision de coaching', '["supervisor"]'::JSONB, 'activa', false, false) RETURNING alerta_id;
```

### Alerta de Patron

```sql
INSERT INTO alertas_anomalias (tipo, severidad, codigo, descripcion, agente_id, agente_nombre, equipo, registro_id, analisis_id, datos, contexto, analisis_llm, accion_requerida, destinatarios, estado, leida, resuelta) VALUES ('patron', 'alta', 'PATRON_SCORES_BAJOS', '5 llamadas consecutivas con score bajo (promedio: 37)', '22222222-3333-4444-5555-666666666666', 'Pedro Ruiz', 'Equipo Sur', NULL, NULL, '{"scores":[38,42,35,40,32],"promedio":37.4,"umbral":50,"llamadas_evaluadas":5}'::JSONB, '{"es_patron":true,"score_promedio_historico":68}'::JSONB, '{"causa_probable":"Presion excesiva hacia el cierre","severidad_ajustada":"alta","intervencion_recomendada":"Supervisor escuchar proxima llamada"}'::JSONB, 'Intervencion inmediata - coaching urgente', '["supervisor","coach"]'::JSONB, 'activa', false, false) RETURNING alerta_id;
```

### Alerta Sistemica

```sql
INSERT INTO alertas_anomalias (tipo, severidad, codigo, descripcion, agente_id, agente_nombre, equipo, registro_id, analisis_id, datos, contexto, analisis_llm, accion_requerida, destinatarios, estado, leida, resuelta) VALUES ('sistemica', 'critica', 'SISTEMA_TASA_ABANDONO', 'Tasa de abandono del 32% en la ultima hora (umbral: 30%)', NULL, NULL, NULL, NULL, NULL, '{"tasa_abandono":0.32,"umbral":0.30,"total_llamadas":45,"abandonos":14}'::JSONB, '{"afecta_equipos":["Equipo Norte","Equipo Sur"],"hora_pico":true}'::JSONB, '{"posibles_causas":["Cartera dificil","Problema en script"]}'::JSONB, 'Revision inmediata de operaciones', '["director","supervisor","operaciones"]'::JSONB, 'activa', false, false) RETURNING alerta_id;
```

---

## Mapeo de Campos

| Campo | Tipo | Individual | Patron | Sistemica |
|-------|------|------------|--------|-----------|
| `tipo` | ENUM | 'individual' | 'patron' | 'sistemica' |
| `severidad` | ENUM | Segun regla | Segun regla | Segun regla |
| `codigo` | VARCHAR | SCORE_*, ABANDONO_* | PATRON_* | SISTEMA_* |
| `agente_id` | UUID | Requerido | Requerido | NULL |
| `registro_id` | UUID | Requerido | NULL | NULL |
| `analisis_id` | UUID | Requerido | NULL | NULL |
| `analisis_llm` | JSONB | Opcional | Frecuente | Opcional |

---

## Queries de Consulta Frecuentes

### Alertas activas por agente
```sql
SELECT * FROM alertas_anomalias
WHERE agente_id = $1
  AND estado = 'activa'
ORDER BY created_at DESC;
```

### Alertas criticas ultima hora
```sql
SELECT * FROM alertas_anomalias
WHERE severidad = 'critica'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Alertas no leidas para supervisor
```sql
SELECT aa.* 
FROM alertas_anomalias aa
WHERE aa.leida = false
  AND aa.destinatarios ? 'supervisor'
ORDER BY 
  CASE aa.severidad 
    WHEN 'critica' THEN 1 
    WHEN 'alta' THEN 2 
    WHEN 'media' THEN 3 
    ELSE 4 
  END,
  aa.created_at DESC;
```

---

## Supabase JS SDK

```javascript
// INSERT alerta individual
const { data, error } = await supabase
  .from('alertas_anomalias')
  .insert({
    tipo: 'individual',
    severidad: 'alta',
    codigo: 'SCORE_BAJO',
    descripcion: 'Score de llamada por debajo del umbral (42)',
    agente_id: '11111111-2222-3333-4444-555555555555',
    agente_nombre: 'Juan Perez',
    equipo: 'Equipo Norte',
    registro_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    analisis_id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    datos: { score_total: 42, umbral: 50 },
    contexto: { es_patron: false },
    accion_requerida: 'Incluir en revision de coaching',
    destinatarios: ['supervisor'],
    estado: 'activa',
    leida: false,
    resuelta: false
  })
  .select('alerta_id')
  .single();

// Marcar como leida
await supabase
  .from('alertas_anomalias')
  .update({ leida: true })
  .eq('alerta_id', alertaId);

// Resolver alerta
await supabase
  .from('alertas_anomalias')
  .update({ 
    estado: 'resuelta', 
    resuelta: true,
    resolucion: {
      fecha: new Date(),
      usuario: userId,
      notas: 'Se hablo con el agente'
    }
  })
  .eq('alerta_id', alertaId);
```

---

## Notificaciones In-App

Despues del INSERT de alerta, crear notificaciones:

```javascript
async function crearNotificacionesInApp(alerta) {
  const usuarios = await obtenerUsuariosPorRol(alerta.destinatarios);
  
  const notificaciones = usuarios.map(usuario => ({
    usuario_id: usuario.usuario_id,
    tipo: `alerta_${alerta.severidad}`,
    titulo: `Alerta: ${alerta.codigo}`,
    mensaje: alerta.descripcion,
    datos: {
      alerta_id: alerta.alerta_id,
      agente_id: alerta.agente_id,
      severidad: alerta.severidad
    },
    leida: false
  }));
  
  await supabase
    .from('notificaciones_usuarios')
    .insert(notificaciones);
}
```

