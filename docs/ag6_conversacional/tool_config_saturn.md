# Configuracion de Tool: filterTable

## Para Saturn Studio Q&A Agent

---

## 1. Tool Definition (JSON Schema)

Copia y pega esto en Saturn Studio cuando configures la tool `filterTable`:

```json
{
  "name": "filterTable",
  "description": "Consulta una tabla de Supabase con filtros opcionales. Devuelve array de objetos JSON. REGLA CRITICA: Solo llamar UNA VEZ por consulta del usuario - NO reintentar si el array esta vacio.",
  "parameters": {
    "type": "object",
    "properties": {
      "table_name": {
        "type": "string",
        "description": "Tabla a consultar",
        "enum": [
          "vista_resumen_agentes",
          "alertas_anomalias",
          "analisis_llamadas",
          "coaching_reports"
        ]
      },
      "filter_column": {
        "type": "string",
        "description": "Columna para filtrar. Dejar vacio ('') para obtener todos los registros.",
        "default": ""
      },
      "filter_value": {
        "type": "string",
        "description": "Valor del filtro. Dejar vacio ('') si filter_column esta vacio.",
        "default": ""
      }
    },
    "required": ["table_name"]
  }
}
```

---

## 2. Implementacion de la Tool en Saturn

La tool debe ejecutar una query de Supabase siguiendo esta logica:

### Pseudocodigo

```javascript
async function filterTable({ table_name, filter_column = '', filter_value = '' }) {
  // Conectar a Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Query base
  let query = supabase.from(table_name).select('*')
  
  // Aplicar filtro si existe
  if (filter_column && filter_value) {
    query = query.eq(filter_column, filter_value)
  }
  
  // Ejecutar
  const { data, error } = await query
  
  if (error) {
    return { error: error.message, data: [] }
  }
  
  // Devolver datos (puede ser array vacio)
  return { data: data || [], count: data?.length || 0 }
}
```

### Importante

- **Devuelve array vacio `[]` si no hay resultados** (NO error)
- **NO lanzar excepciones** por queries sin resultados
- **Log** las queries para debugging

---

## 3. Valores de Retorno Esperados

### Caso 1: Datos encontrados

```json
{
  "data": [
    {
      "nombre": "Maria Lopez",
      "equipo": "Equipo Norte",
      "llamadas_semana": 15,
      "score_semana": 78.5
    }
  ],
  "count": 1
}
```

### Caso 2: Sin datos (NO ES ERROR)

```json
{
  "data": [],
  "count": 0
}
```

### Caso 3: Error de base de datos

```json
{
  "error": "relation 'tabla_inexistente' does not exist",
  "data": []
}
```

---

## 4. Configuracion del Model en Saturn

### Settings Recomendados

| Parametro | Valor | Razon |
|-----------|-------|-------|
| **Model** | `gpt-4o-mini` o `claude-sonnet-4` | Balance costo/calidad |
| **Temperature** | `0.2` | Comportamiento consistente |
| **Max Tokens** | `400` | Respuestas concisas |
| **Top P** | `0.9` | Default |
| **Frequency Penalty** | `0.3` | Evita repeticion |
| **Presence Penalty** | `0.0` | Default |

### Por que Temperature 0.2?

- Temperatura baja = respuestas mas deterministicas
- Reduce la probabilidad de tool calls innecesarios
- Hace que el modelo siga las instrucciones del prompt mas fielmente

---

## 5. Testing de la Tool

### Test 1: Query con filtro

**Input:**
```json
{
  "table_name": "vista_resumen_agentes",
  "filter_column": "nombre",
  "filter_value": "Maria Lopez"
}
```

**Output esperado:**
```json
{
  "data": [{ "nombre": "Maria Lopez", "equipo": "...", ... }],
  "count": 1
}
```

### Test 2: Query sin filtro (todos)

**Input:**
```json
{
  "table_name": "alertas_anomalias",
  "filter_column": "",
  "filter_value": ""
}
```

**Output esperado:**
```json
{
  "data": [{ "alerta_id": "...", ... }, { ... }],
  "count": 5
}
```

### Test 3: Sin resultados

**Input:**
```json
{
  "table_name": "vista_resumen_agentes",
  "filter_column": "nombre",
  "filter_value": "Agente Inexistente"
}
```

**Output esperado:**
```json
{
  "data": [],
  "count": 0
}
```

### Test 4: Error (tabla incorrecta)

**Input:**
```json
{
  "table_name": "tabla_que_no_existe",
  "filter_column": "",
  "filter_value": ""
}
```

**Output esperado:**
```json
{
  "error": "relation 'tabla_que_no_existe' does not exist",
  "data": []
}
```

---

## 6. Debugging: Como Detectar Problemas

### Problema: Multiple tool calls

**Sintomas:** El LLM llama a filterTable 2+ veces seguidas con los mismos parametros

**Causas:**
- Temperature muy alta (>0.5)
- Prompt no tiene la regla "MAXIMO 1 TOOL CALL" clara
- La tool no devuelve resultados en el formato esperado

**Solucion:**
1. Bajar temperature a 0.2
2. Verificar que el prompt tenga "REGLA #1: MAXIMO 1 TOOL CALL" al inicio
3. Loggear el output de la tool para verificar formato

### Problema: Tool calls en saludos

**Sintomas:** El LLM llama a filterTable cuando el usuario dice "hola"

**Causas:**
- Prompt no tiene ejemplos claros de cuando NO usar tools
- Temperature alta

**Solucion:**
1. Agregar tabla de decision al prompt
2. Bajar temperature a 0.2
3. Agregar ejemplos de saludos en el prompt

### Problema: Reintenta cuando no hay datos

**Sintomas:** El LLM llama a filterTable, recibe `[]`, y vuelve a llamar

**Causas:**
- La tool devuelve null en vez de `[]`
- Prompt no tiene instruccion "NO reintentes"

**Solucion:**
1. Asegurarse que la tool devuelve `{"data": [], "count": 0}` cuando no hay resultados
2. Agregar instruccion "Si no hay datos, responde honestamente y NO reintentes"

---

## 7. Checklist de Implementacion

### En Saturn Studio

- [ ] Tool `filterTable` creada con el JSON schema de arriba
- [ ] Tool conectada a Supabase correctamente
- [ ] Tool devuelve `{"data": [], "count": 0}` cuando no hay resultados (NO null, NO error)
- [ ] Model configurado con temperature 0.2
- [ ] Max tokens = 400
- [ ] System prompt cargado desde `prompt_completo.md`

### Testing

- [ ] Test: "Hola" → Sin tool calls, responde JSON
- [ ] Test: "Como esta Maria Lopez?" → 1 tool call, responde con datos
- [ ] Test: "Como esta Juan Perez?" (inexistente) → 1 tool call, responde "No encontre"
- [ ] Test: "Hay alertas?" → 1 tool call a alertas_anomalias
- [ ] Test: Enviar 5 mensajes seguidos → Cada mensaje tiene max 1 tool call

### Monitoring

- [ ] Log cada tool call con timestamp y parametros
- [ ] Log cada respuesta del LLM
- [ ] Alertar si >1 tool call en una sola respuesta
- [ ] Medir latencia (deberia ser <3s por respuesta)

---

## 8. Formato de Logs Recomendado

```
[2026-02-04 05:30:15] USER: "Como esta Maria Lopez?"
[2026-02-04 05:30:15] TOOL_CALL: filterTable(vista_resumen_agentes, nombre, Maria Lopez)
[2026-02-04 05:30:16] TOOL_RESULT: {"data": [...], "count": 1}
[2026-02-04 05:30:17] ASSISTANT: {"message": "Maria Lopez...", "suggestions": [...]}
[2026-02-04 05:30:17] METRICS: tool_calls=1, latency=2.1s, tokens=245
```

Esto te permite detectar rapidamente si el LLM esta haciendo multiples llamadas o comportamientos anomalos.




