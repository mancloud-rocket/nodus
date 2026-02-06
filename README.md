# NODUS - Sistema de Análisis Inteligente de Llamadas de Cobranza

![NODUS](https://img.shields.io/badge/NODUS-Speech_Analytics-00F5D4?style=for-the-badge)

Sistema de análisis inteligente para llamadas de cobranza desarrollado con React, TypeScript, y una arquitectura de agentes de IA.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Animaciones**: Framer Motion
- **Gráficos**: Recharts
- **Routing**: React Router v7
- **State**: Zustand

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/           # Componentes base (shadcn)
│   ├── layout/       # Layout y navegación
│   ├── charts/       # Componentes de visualización
│   ├── dashboard/    # Componentes del dashboard
│   ├── llamadas/     # Componentes de llamadas
│   └── ...
├── pages/            # Páginas de la aplicación
├── types/            # Definiciones de tipos TypeScript
├── data/             # Datos mock para desarrollo
├── lib/              # Utilidades
└── hooks/            # Custom hooks
```

## 🎨 Tema y Diseño

El sistema utiliza un tema oscuro "Command Center" con:

- **Fondo**: `#06070A` (casi negro con subtono azul)
- **Primario**: `#00F5D4` (cyan eléctrico)
- **Secundario**: `#8B5CF6` (púrpura vibrante)
- **Destructivo**: `#FF4757` (coral para alertas)
- **Éxito**: `#10B981` (esmeralda)

### Tipografía

- **Display/Headers**: General Sans
- **Body**: Plus Jakarta Sans
- **Monospace/Data**: JetBrains Mono

## 📊 Páginas Principales

1. **Dashboard** (`/`) - Vista general con KPIs, alertas, y tendencias
2. **Llamadas** (`/llamadas`) - Lista y gestión de llamadas
3. **Detalle Llamada** (`/llamadas/:id`) - Análisis completo con audio y transcripción
4. **Agentes** (`/agentes`) - Ranking y métricas del equipo
5. **Alertas** (`/alertas`) - Centro de anomalías y alertas
6. **Chat** (`/chat`) - Asistente conversacional con IA

## 🔌 Integración con Backend

El frontend está diseñado para integrarse con:

- **Saturn Studio**: Orquestación de agentes de IA
- **AI Studio**: Transcripción y análisis de emociones
- **Claude API**: Análisis contextual y coaching

### Endpoints esperados

```
POST /webhooks/nueva-llamada    # Ingesta de llamadas
GET  /api/v1/analisis/{id}      # Obtener análisis
GET  /api/v1/agentes/{id}/metricas
POST /api/v1/chat/mensaje       # Chat conversacional
```

## 📝 Arquitectura de Agentes

El sistema utiliza 6 agentes especializados:

1. **Transcriptor** - Audio → Texto estructurado
2. **Analista** - Scoring y predicción
3. **Coach** - Feedback personalizado
4. **Detector** - Alertas y anomalías
5. **Estratega** - Análisis macro
6. **Conversacional** - Chat con RAG

## 🧪 Desarrollo

```bash
# Lint
npm run lint

# Preview build
npm run preview
```

## 📄 Licencia

Propiedad de 360 Consultores & Rocketbot.

---

Desarrollado con ❤️ para el equipo de cobranzas.

