# INSERT en Supabase - Agente Transcriptor

## Flujo de Datos

```
Gemini Output (output_transcriptor.json)
           +
Claude Output (output_analisispreliminar.json)
           ↓
    Combinar datos
           ↓
  ┌────────┴────────┐
  ↓                 ↓
registro_llamadas  transcripciones
```

---

## 1. INSERT en `registro_llamadas`

### Datos del Webhook Inicial + Gemini

```javascript
// Datos que vienen del webhook/Drive
const webhookData = {
  audio_url: "https://drive.google.com/...",
  audio_id_externo: "1abc123def456",
  campana: "Cobranza Q1 2026",  // Hardcodeado o del nombre del archivo
  // timestamp_inicio y timestamp_fin pueden ser null o generados
};

// Datos extraídos de Gemini
const geminiOutput = { /* output_transcriptor.json */ };

// INSERT
const registroLlamada = {
  // Referencia al audio
  audio_url: webhookData.audio_url,
  audio_id_externo: webhookData.audio_id_externo,
  
  // Timestamps (pueden ser null si no los tenemos)
  timestamp_inicio: webhookData.timestamp_inicio || null,
  timestamp_fin: webhookData.timestamp_fin || null,
  duracion_segundos: geminiOutput.duracion_segundos, // 268
  
  // Participantes extraídos de Gemini
  cliente_nombre: geminiOutput.participantes?.cliente?.nombre_completo, // "Yessenia Andrea González Díaz"
  cliente_ref: geminiOutput.participantes?.cliente?.nombre_corto || null, // "Yessenia"
  agente_nombre: geminiOutput.participantes?.agente?.nombre_completo, // "Silvano Machado"
  agente_id: null, // Se puede buscar después por nombre
  
  // Empresas
  empresa_acreedora: geminiOutput.participantes?.empresa_acreedora, // "Caja Los Andes"
  empresa_cobranza: geminiOutput.participantes?.empresa_cobranza, // "Redsap"
  
  // Contexto
  campana: webhookData.campana || "Sin campaña",
  tipo_deuda: null, // Se puede inferir o dejar null
  monto_deuda: null, // Se puede tomar del análisis
  dias_mora: null,
  
  // Estado
  estado: 'transcrito', // Se actualizará a 'analizado' después
  
  // Metadata
  metadata_externa: {
    source: "google_drive",
    file_name: webhookData.file_name || null,
    processed_at: new Date().toISOString()
  }
};
```

### SQL de INSERT

```sql
INSERT INTO registro_llamadas (
  audio_url,
  audio_id_externo,
  timestamp_inicio,
  timestamp_fin,
  duracion_segundos,
  cliente_nombre,
  cliente_ref,
  agente_nombre,
  agente_id,
  empresa_acreedora,
  empresa_cobranza,
  campana,
  estado,
  metadata_externa
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'transcrito', $13
)
RETURNING registro_id;
```

---

## 2. INSERT en `transcripciones`

### Combinar Outputs de Gemini y Claude

```javascript
const geminiOutput = { /* output_transcriptor.json */ };
const claudeOutput = { /* output_analisispreliminar.json */ };

const transcripcion = {
  registro_id: registroId, // Del INSERT anterior
  
  // ═══════════════════════════════════════
  // DATOS DE GEMINI
  // ═══════════════════════════════════════
  
  transcripcion_completa: geminiOutput.transcripcion_completa,
  
  segmentos: geminiOutput.segmentos_raw,
  
  metricas_conversacion: {
    // De estadisticas_basicas
    palabras_totales: geminiOutput.estadisticas_basicas.palabras_totales,
    palabras_agente: geminiOutput.estadisticas_basicas.palabras_agente,
    palabras_cliente: geminiOutput.estadisticas_basicas.palabras_cliente,
    total_segmentos: geminiOutput.estadisticas_basicas.total_segmentos,
    confianza_promedio: geminiOutput.estadisticas_basicas.confianza_promedio,
    
    // De metricas_conversacion (si existe)
    ratio_habla: geminiOutput.metricas_conversacion?.ratio_habla_agente 
      || (geminiOutput.estadisticas_basicas.palabras_agente / geminiOutput.estadisticas_basicas.palabras_totales),
    interrupciones: geminiOutput.metricas_conversacion?.interrupciones?.length || 0,
    silencios_largos: geminiOutput.metricas_conversacion?.silencios_prolongados?.length || 0,
    
    // Velocidades (si no las tenemos, dejar 0)
    velocidad_promedio_agente: 0,
    velocidad_promedio_cliente: 0
  },
  
  analisis_emocional: geminiOutput.analisis_emocional,
  
  // ═══════════════════════════════════════
  // DATOS DE CLAUDE
  // ═══════════════════════════════════════
  
  entidades: claudeOutput.entidades,
  
  patrones_script: claudeOutput.patrones_script,
  
  resultado_preliminar: claudeOutput.resultado_llamada,
  
  resumen_ejecutivo: claudeOutput.resumen_ejecutivo,
  
  referencias_creditos: claudeOutput.entidades.referencias_creditos,
  
  seguimiento: claudeOutput.seguimiento,
  
  // ═══════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════
  
  calidad_audio: {
    score: geminiOutput.estadisticas_basicas.confianza_promedio * 100,
    ruido_fondo: false,
    cortes: 0,
    inaudibles: 0
  },
  
  modelo_transcripcion: "gemini-2.0-flash",
  modelo_emociones: "gemini-2.0-flash",
  modelo_entidades: "claude-sonnet-4.5",
  tiempo_procesamiento_ms: null // Medir si es necesario
};
```

### SQL de INSERT

```sql
INSERT INTO transcripciones (
  registro_id,
  transcripcion_completa,
  segmentos,
  metricas_conversacion,
  analisis_emocional,
  entidades,
  patrones_script,
  resultado_preliminar,
  resumen_ejecutivo,
  referencias_creditos,
  seguimiento,
  calidad_audio,
  modelo_transcripcion,
  modelo_emociones,
  modelo_entidades,
  tiempo_procesamiento_ms
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
RETURNING transcripcion_id;
```

---

## 3. UPDATE `registro_llamadas` con transcripcion_id

```sql
UPDATE registro_llamadas 
SET 
  transcripcion_id = $1,
  estado = 'transcrito',
  updated_at = NOW()
WHERE registro_id = $2;
```

---

## 4. Código Completo (JavaScript/TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function insertTranscripcion(
  webhookData: WebhookInput,
  geminiOutput: GeminiOutput,
  claudeOutput: ClaudeOutput
) {
  // 1. INSERT registro_llamadas
  const { data: registro, error: registroError } = await supabase
    .from('registro_llamadas')
    .insert({
      audio_url: webhookData.audio_url,
      audio_id_externo: webhookData.audio_id_externo,
      timestamp_inicio: webhookData.timestamp_inicio || null,
      timestamp_fin: webhookData.timestamp_fin || null,
      duracion_segundos: geminiOutput.duracion_segundos,
      cliente_nombre: geminiOutput.participantes?.cliente?.nombre_completo,
      cliente_ref: geminiOutput.participantes?.cliente?.nombre_corto,
      agente_nombre: geminiOutput.participantes?.agente?.nombre_completo,
      empresa_acreedora: geminiOutput.participantes?.empresa_acreedora,
      empresa_cobranza: geminiOutput.participantes?.empresa_cobranza,
      campana: webhookData.campana || 'Sin campaña',
      estado: 'procesando',
      metadata_externa: {
        source: 'google_drive',
        file_name: webhookData.file_name,
        processed_at: new Date().toISOString()
      }
    })
    .select('registro_id')
    .single();

  if (registroError) throw registroError;
  const registroId = registro.registro_id;

  // 2. INSERT transcripciones
  const { data: transcripcion, error: transcripcionError } = await supabase
    .from('transcripciones')
    .insert({
      registro_id: registroId,
      transcripcion_completa: geminiOutput.transcripcion_completa,
      segmentos: geminiOutput.segmentos_raw,
      metricas_conversacion: buildMetricasConversacion(geminiOutput),
      analisis_emocional: geminiOutput.analisis_emocional,
      entidades: claudeOutput.entidades,
      patrones_script: claudeOutput.patrones_script,
      resultado_preliminar: claudeOutput.resultado_llamada,
      resumen_ejecutivo: claudeOutput.resumen_ejecutivo,
      referencias_creditos: claudeOutput.entidades.referencias_creditos,
      seguimiento: claudeOutput.seguimiento,
      calidad_audio: {
        score: Math.round(geminiOutput.estadisticas_basicas.confianza_promedio * 100),
        ruido_fondo: false,
        cortes: 0,
        inaudibles: 0
      },
      modelo_transcripcion: 'gemini-2.0-flash',
      modelo_emociones: 'gemini-2.0-flash',
      modelo_entidades: 'claude-sonnet-4.5'
    })
    .select('transcripcion_id')
    .single();

  if (transcripcionError) throw transcripcionError;
  const transcripcionId = transcripcion.transcripcion_id;

  // 3. UPDATE registro_llamadas con transcripcion_id
  await supabase
    .from('registro_llamadas')
    .update({
      transcripcion_id: transcripcionId,
      estado: 'transcrito',
      updated_at: new Date().toISOString()
    })
    .eq('registro_id', registroId);

  // 4. Retornar IDs para el webhook al Agente Analista
  return {
    registro_id: registroId,
    transcripcion_id: transcripcionId,
    resultado_preliminar: claudeOutput.resultado_llamada
  };
}

function buildMetricasConversacion(gemini: GeminiOutput) {
  const stats = gemini.estadisticas_basicas;
  const metricas = gemini.metricas_conversacion || {};
  
  return {
    palabras_totales: stats.palabras_totales,
    palabras_agente: stats.palabras_agente,
    palabras_cliente: stats.palabras_cliente,
    ratio_habla: metricas.ratio_habla_agente || (stats.palabras_agente / stats.palabras_totales),
    interrupciones: metricas.interrupciones?.length || 0,
    silencios_largos: metricas.silencios_prolongados?.length || 0,
    velocidad_promedio_agente: 0,
    velocidad_promedio_cliente: 0
  };
}
```

---

## 5. Webhook al Agente Analista

Después de insertar, trigger al siguiente agente:

```javascript
// POST https://saturn.rocketbot.com/webhooks/nodus-analista
const webhookPayload = {
  registro_id: registroId,
  transcripcion_id: transcripcionId,
  agente_id: null, // Se buscará por nombre
  agente_nombre: geminiOutput.participantes?.agente?.nombre_completo,
  timestamp: new Date().toISOString(),
  resultado_preliminar: claudeOutput.resultado_llamada
};
```

---

## Resumen de Flujo

```
1. Webhook recibe audio de Drive
2. Gemini transcribe + emociones + participantes
3. Claude extrae entidades + análisis
4. INSERT registro_llamadas
5. INSERT transcripciones
6. UPDATE registro_llamadas.transcripcion_id
7. Webhook → Agente Analista
```



