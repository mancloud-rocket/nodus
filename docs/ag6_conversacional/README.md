# Agente #6: Conversacional (LiveChat)

## Descripcion General

El Agente Conversacional es la interfaz de chat inteligente que permite a supervisores y agentes hacer preguntas en lenguaje natural sobre el sistema NODUS. Utiliza un Q&A Agent con acceso a las tablas de Supabase para responder consultas sobre metricas, agentes, llamadas, alertas y reportes.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Chat Component                        │    │
│  │  - Input de mensaje                                      │    │
│  │  - Historia de conversacion                              │    │
│  │  - Indicador de typing                                   │    │
│  │  - Visualizaciones dinamicas                             │    │
│  └─────────────────────┬───────────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────────┘
                          │ POST /webhook
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SATURN STUDIO                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Receive    │───▶│   Q&A       │───▶│  Response   │         │
│  │  Webhook    │    │   Agent     │    │  Webhook    │         │
│  └─────────────┘    └──────┬──────┘    └─────────────┘         │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │  Tool: Filter │                            │
│                    │  Table        │                            │
│                    └───────┬───────┘                            │
│                            │                                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  agentes | registro_llamadas | analisis_llamadas | alertas ...  │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

1. **Usuario escribe mensaje** en el chat del frontend
2. **Frontend envia** mensaje + historia via webhook POST
3. **Saturn recibe** el payload con el contexto completo
4. **Q&A Agent** procesa la pregunta:
   - Analiza la intencion del usuario
   - Decide si necesita consultar Supabase
   - Ejecuta queries via Tool (filterTable)
   - Genera respuesta en lenguaje natural
5. **Response webhook** devuelve la respuesta
6. **Frontend muestra** la respuesta con formato rico

## Componentes

### 1. Saturn Studio Flow
- **Nodo 1**: Receive Webhook (POST)
- **Nodo 2**: Q&A Agent con prompt y tools
- **Nodo 3**: Tool - Filter Table (Supabase)
- **Nodo 4**: Response Webhook

### 2. Frontend (Chat.tsx)
- Componente de chat con historial
- Indicador de "typing" mientras espera
- Renderizado de respuestas con markdown
- Visualizaciones embebidas (tablas, metricas)

### 3. Prompt del Agente
- Conocimiento completo del esquema de BD
- Instrucciones para interpretar preguntas
- Formato de respuesta estructurado

## Capacidades del Agente

| Categoria | Ejemplos de Preguntas |
|-----------|----------------------|
| **Metricas** | "Cual es el score promedio de hoy?" |
| **Agentes** | "Como esta rindiendo Maria Lopez?" |
| **Llamadas** | "Muestrame las ultimas 5 llamadas con score bajo" |
| **Alertas** | "Hay alertas criticas activas?" |
| **Coaching** | "Cual es el gap critico de Carlos?" |
| **Tendencias** | "Como ha evolucionado la tasa de validacion?" |
| **Comparativas** | "Quien es el mejor agente del Equipo Norte?" |

## Archivos del Agente

```
docs/ag6_conversacional/
├── README.md                 # Este archivo
├── prompt_completo.md        # Prompt detallado para Q&A Agent
├── payload_estructura.md     # Estructura del webhook
├── flujo_saturn.md           # Configuracion del flujo
└── plan_implementacion.md    # Plan paso a paso
```

## Integracion con Frontend

El componente `Chat.tsx` se conectara al webhook de Saturn y mostrara:
- Mensajes del usuario (alineados a la derecha)
- Respuestas del agente (alineados a la izquierda)
- Indicador de carga mientras procesa
- Tarjetas de datos cuando corresponda

