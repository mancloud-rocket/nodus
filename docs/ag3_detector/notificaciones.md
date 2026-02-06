# Configuracion de Notificaciones - Agente Detector (Modo Periodico 24h)

## Vision General

El Detector envia un **resumen diario** con todas las alertas detectadas en las ultimas 24 horas. Las notificaciones se envian despues de la ejecucion del cron (07:00 AM).

---

## Canales de Notificacion

### 1. Slack

**Webhook**: Configurar en Saturn Studio como variable de entorno

```javascript
const slackConfig = {
  webhook_url: process.env.SLACK_WEBHOOK_URL,
  channel: '#alertas-cobranza',
  username: 'NODUS Detector',
  icon_emoji: ':chart_with_upwards_trend:'
};
```

**Template de Mensaje (Resumen Diario)**:
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "{{emoji}} Reporte de Alertas - {{fecha}}",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Llamadas:* {{total_llamadas}}"},
        {"type": "mrkdwn", "text": "*Score:* {{score_promedio}} {{vs_ayer_score}}"},
        {"type": "mrkdwn", "text": "*Abandono:* {{tasa_abandono}}%"},
        {"type": "mrkdwn", "text": "*Validacion:* {{tasa_validacion}}%"}
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Alertas Detectadas:*\n:red_circle: {{criticas}} criticas | :orange_circle: {{altas}} altas | :yellow_circle: {{medias}} medias"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Agentes con alertas:*\n{{lista_agentes}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Ver en NODUS"},
          "url": "{{url_dashboard}}/alertas"
        }
      ]
    }
  ]
}
```

**Cuando enviar Slack**:
- Si hay al menos 1 alerta critica
- Si hay al menos 1 alerta alta
- NO enviar si solo hay alertas medias/bajas

---

### 2. Email

**Servicio**: SendGrid / SMTP

**Template HTML (Resumen Diario)**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: {{color_header}}; color: white; padding: 20px; text-align: center; }
    .metricas { display: flex; justify-content: space-around; padding: 20px; background: #f3f4f6; }
    .metrica { text-align: center; }
    .metrica-valor { font-size: 24px; font-weight: bold; }
    .alertas { padding: 20px; }
    .alerta-critica { border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; background: #fef2f2; }
    .alerta-alta { border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; background: #fffbeb; }
    .alerta-media { border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; background: #eff6ff; }
    .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte de Alertas - {{fecha}}</h1>
    <p>Periodo: {{periodo_inicio}} a {{periodo_fin}}</p>
  </div>
  
  <div class="metricas">
    <div class="metrica">
      <div class="metrica-valor">{{total_llamadas}}</div>
      <div>Llamadas</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">{{score_promedio}}</div>
      <div>Score Promedio</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">{{tasa_abandono}}%</div>
      <div>Abandono</div>
    </div>
    <div class="metrica">
      <div class="metrica-valor">{{tasa_validacion}}%</div>
      <div>Validacion</div>
    </div>
  </div>
  
  <div class="alertas">
    <h2>Alertas Detectadas ({{total_alertas}})</h2>
    
    {{#if alertas_criticas}}
    <h3>Criticas ({{count_criticas}})</h3>
    {{#each alertas_criticas}}
    <div class="alerta-critica">
      <strong>{{codigo}}</strong> - {{agente_nombre}}<br>
      {{descripcion}}<br>
      <em>Accion: {{accion_requerida}}</em>
    </div>
    {{/each}}
    {{/if}}
    
    {{#if alertas_altas}}
    <h3>Altas ({{count_altas}})</h3>
    {{#each alertas_altas}}
    <div class="alerta-alta">
      <strong>{{codigo}}</strong> - {{agente_nombre}}<br>
      {{descripcion}}
    </div>
    {{/each}}
    {{/if}}
    
    {{#if alertas_medias}}
    <h3>Medias ({{count_medias}})</h3>
    {{#each alertas_medias}}
    <div class="alerta-media">
      <strong>{{codigo}}</strong> - {{agente_nombre}}<br>
      {{descripcion}}
    </div>
    {{/each}}
    {{/if}}
  </div>
  
  <center>
    <a href="{{url_dashboard}}/alertas" class="btn">Ver Detalles en NODUS</a>
  </center>
</body>
</html>
```

**Destinatarios por Severidad**:
```javascript
const destinatariosEmail = {
  critica: ['director@empresa.com', 'supervisor@empresa.com'],
  alta: ['supervisor@empresa.com'],
  media: ['supervisor@empresa.com'],
  baja: []  // No se envia email para bajas
};
```

---

### 3. In-App (Supabase Realtime)

**Tabla**: `notificaciones_usuarios`

```sql
-- Crear notificacion por cada alerta
INSERT INTO notificaciones_usuarios (
  usuario_id,
  tipo,
  titulo,
  mensaje,
  datos,
  leida
) VALUES (
  $1,  -- usuario_id del supervisor
  'alerta_detector',
  'Alerta: {{codigo}}',
  '{{descripcion}}',
  '{"alerta_id": "{{alerta_id}}", "severidad": "{{severidad}}", "agente_id": "{{agente_id}}"}'::JSONB,
  false
);
```

**Notificacion de Resumen**:
```sql
-- Notificacion resumen para supervisores
INSERT INTO notificaciones_usuarios (
  usuario_id,
  tipo,
  titulo,
  mensaje,
  datos,
  leida
) VALUES (
  $1,
  'resumen_alertas',
  'Resumen de Alertas - {{fecha}}',
  '{{total_alertas}} alertas: {{criticas}} criticas, {{altas}} altas',
  '{"fecha": "{{fecha}}", "total": {{total_alertas}}}'::JSONB,
  false
);
```

---

## Logica de Envio

```javascript
async function notificarResumen(resumen, alertas) {
  const tareas = [];
  
  // Determinar severidad maxima
  const tieneCriticas = alertas.some(a => a.severidad === 'critica');
  const tieneAltas = alertas.some(a => a.severidad === 'alta');
  const tieneMedias = alertas.some(a => a.severidad === 'media');
  
  // Slack: solo si hay criticas o altas
  if (tieneCriticas || tieneAltas) {
    const emoji = tieneCriticas ? ':rotating_light:' : ':warning:';
    tareas.push(enviarSlack(resumen, emoji));
  }
  
  // Email: segun severidad maxima
  if (tieneCriticas) {
    tareas.push(enviarEmail(resumen, alertas, destinatariosEmail.critica));
  } else if (tieneAltas) {
    tareas.push(enviarEmail(resumen, alertas, destinatariosEmail.alta));
  } else if (tieneMedias) {
    tareas.push(enviarEmail(resumen, alertas, destinatariosEmail.media));
  }
  
  // In-App: siempre (si hay alertas)
  if (alertas.length > 0) {
    tareas.push(crearNotificacionesInApp(resumen, alertas));
  }
  
  // Ejecutar en paralelo
  await Promise.all(tareas);
}
```

---

## Resumen de Notificaciones

| Severidad | Slack | Email | In-App |
|-----------|-------|-------|--------|
| Critica | Si (resumen) | Si (director + supervisor) | Si |
| Alta | Si (resumen) | Si (supervisor) | Si |
| Media | No | Si (supervisor) | Si |
| Baja | No | No | Si |

---

## Variables de Entorno Requeridas

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
SLACK_CHANNEL=#alertas-cobranza

# Email
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=alertas@nodus.com
EMAIL_SUPERVISOR=supervisor@empresa.com
EMAIL_DIRECTOR=director@empresa.com

# Dashboard
NODUS_DASHBOARD_URL=https://app.nodus.com
```

---

## Ejemplo de Resumen Enviado

### Slack
```
:rotating_light: Reporte de Alertas - 2026-02-04

*Llamadas:* 450        *Score:* 72 (-2)
*Abandono:* 8%         *Validacion:* 38%

---

*Alertas Detectadas:*
:red_circle: 1 criticas | :orange_circle: 3 altas | :yellow_circle: 5 medias

*Agentes con alertas:*
- Pedro Ruiz: AGENTE_SCORE_CRITICO, PATRON_LLAMADAS_CRITICAS
- Maria Lopez: AGENTE_ABANDONO_ALTO
- Juan Garcia: AGENTE_SIN_VALIDACION

[Ver en NODUS]
```

### Email (Asunto)
```
URGENTE: 1 Alerta Critica + 3 Altas - Reporte 2026-02-04
```
