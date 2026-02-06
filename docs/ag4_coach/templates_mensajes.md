# Templates de Mensajes Motivacionales

## Categorias de Mensajes

Los mensajes motivacionales se seleccionan basandose en:
1. **Tendencia**: mejorando / estable / empeorando
2. **Posicion en equipo**: top25 / medio / bottom25
3. **Antigüedad**: nuevo (<30 dias) / establecido

---

## 1. Mejorando + Top 25%

**Contexto**: Agente de alto rendimiento que sigue mejorando

```
¡Excelente trabajo, {{nombre}}! Tu dedicacion esta dando frutos: pasaste del puesto {{ranking_anterior}} al {{ranking_actual}} en el equipo. Tu score de {{score}} te pone entre los mejores. Esta semana, el desafio es alcanzar el 90: ¡sabemos que puedes!
```

```
{{nombre}}, eres un ejemplo para el equipo. Tu mejora del {{porcentaje_mejora}}% demuestra que el esfuerzo constante funciona. Ahora que dominas lo basico, enfocate en {{gap_critico}} para llegar al siguiente nivel. ¡El top 3 esta a tu alcance!
```

```
Felicitaciones {{nombre}}: {{total_llamadas}} llamadas esta semana con un score promedio de {{score}}. Tu consistencia es admirable. El siguiente paso es convertir esas validaciones implicitas en explicitas. ¡Un pequeno ajuste para resultados grandes!
```

---

## 2. Mejorando + Medio (26-75%)

**Contexto**: Agente en progreso, necesita mantenimiento

```
{{nombre}}, tu progreso es notable: +{{puntos_mejora}} puntos vs la semana pasada. Estas en el camino correcto. Esta semana, enfocate en {{gap_critico}} y veras como subes mas posiciones. ¡Sigue asi!
```

```
Buen trabajo {{nombre}}. Pasaste de {{score_anterior}} a {{score_actual}}, eso es mejora real. Tu fortaleza en {{fortaleza_principal}} es clara. Ahora, si trabajas en {{gap_critico}}, podras alcanzar el top 5. ¡Animo!
```

```
{{nombre}}, estas mejorando y se nota. Esta semana lograste {{logro_especifico}}. Mantén el foco en {{gap_critico}} y la proxima semana hablaremos de tus nuevos exitos. ¡Tú puedes!
```

---

## 3. Mejorando + Bottom 25%

**Contexto**: Agente que estaba bajo pero esta subiendo

```
{{nombre}}, lo importante no es donde empezaste sino hacia donde vas. Tu mejora del {{porcentaje_mejora}}% esta semana demuestra que tienes lo que se necesita. Sigue enfocado en {{gap_critico}} y pronto dejaras de ser parte del bottom. ¡Estamos contigo!
```

```
¡Vamos {{nombre}}! Subiste {{puntos_mejora}} puntos esta semana. Cada llamada es una oportunidad de mejorar y la estas aprovechando. Tu {{fortaleza_principal}} es solida, ahora trabaja en {{gap_critico}}. ¡No te rindas!
```

```
{{nombre}}, reconocemos tu esfuerzo. Pasar de {{score_anterior}} a {{score_actual}} no es facil, pero lo lograste. Esta semana enfocate SOLO en {{accion_principal}}. Un paso a la vez. ¡Vamos que se puede!
```

---

## 4. Estable + Cualquier Posicion

**Contexto**: Agente sin cambios significativos

```
{{nombre}}, tu consistencia es valiosa: mantuviste tu score en {{score}} esta semana. Ahora es momento de dar el siguiente paso. Tu nuevo objetivo: {{objetivo_semanal}}. ¡Es hora de crecer!
```

```
Semana estable {{nombre}}, y eso esta bien. Pero estable no significa estancado. Esta semana, te propongo un desafio: mejorar tu {{gap_critico}} en un 10%. ¿Aceptas?
```

```
{{nombre}}, mantienes un buen ritmo con {{score}} de promedio. Para subir al siguiente nivel, enfocate esta semana en {{gap_critico}}. A veces un pequeno cambio hace una gran diferencia.
```

---

## 5. Empeorando + Top 50%

**Contexto**: Agente bueno que tuvo una mala semana

```
{{nombre}}, sabemos que esta semana fue dificil. Tu score bajo de {{score_anterior}} a {{score_actual}}, pero tu historial demuestra que esto es solo un bache. Revisemos juntos que paso y recuperemos el ritmo. ¡Confio en ti!
```

```
Una semana complicada {{nombre}}, pero no te defines por una mala semana. Tu promedio historico es {{score_historico}}, muy superior al actual. Identifiquemos que cambio y volvamos a la normalidad. ¿Estres? ¿Cartera dificil? Hablemos.
```

```
{{nombre}}, todos tenemos semanas dificiles. Lo importante es no quedarnos ahi. Esta semana enfocate en lo basico: {{accion_basica}}. Volveras a tu nivel, estoy seguro.
```

---

## 6. Empeorando + Bottom 50%

**Contexto**: Agente que necesita apoyo urgente

```
{{nombre}}, veo que las cosas no estan siendo faciles. Quiero que sepas que estamos aqui para ayudarte. Esta semana, olvidemos los numeros y enfoquemonos en UNA cosa: {{accion_principal}}. Paso a paso.
```

```
{{nombre}}, se que puede ser frustrante ver los numeros bajar. Pero cada dia es una nueva oportunidad. Esta semana tu unico objetivo es: {{objetivo_simple}}. Solo eso. Cuentas con nuestro apoyo.
```

```
{{nombre}}, hablemos claro: necesitas apoyo y lo vas a tener. Tu supervisor esta al tanto y te acompanara de cerca esta semana. Enfocate en {{accion_principal}} y no te preocupes por el resto. Juntos salimos de esto.
```

---

## 7. Agente Nuevo (<30 dias)

**Contexto**: Agente en curva de aprendizaje

```
{{nombre}}, llevas {{dias_activo}} dias y ya muestras potencial. Tu score de {{score}} esta dentro de lo esperado para un agente nuevo. Esta semana, enfocate en dominar {{habilidad_basica}}. ¡El crecimiento viene con la practica!
```

```
¡Bienvenido al equipo {{nombre}}! {{dias_activo}} dias y ya tienes {{llamadas}} llamadas completadas. Tu fortaleza en {{fortaleza_principal}} es prometedora. Esta semana, trabaja en {{gap_critico}} con calma. Estamos para guiarte.
```

```
{{nombre}}, ser nuevo puede ser abrumador, pero lo estas haciendo bien. No te compares con agentes de 6 meses. Tu progreso es lo que importa. Esta semana: {{objetivo_simple}}. ¡Vamos!
```

---

## Funcion de Seleccion

```javascript
function seleccionarTemplate(agente, metricas, reporteAnterior) {
  const tendencia = calcularTendencia(metricas, reporteAnterior);
  const posicion = calcularPosicion(metricas.ranking, metricas.total_agentes);
  const esNuevo = agente.dias_activo < 30;
  
  if (esNuevo) {
    return templates.agente_nuevo;
  }
  
  if (tendencia === 'mejorando') {
    if (posicion === 'top25') return templates.mejorando_top;
    if (posicion === 'medio') return templates.mejorando_medio;
    return templates.mejorando_bottom;
  }
  
  if (tendencia === 'estable') {
    return templates.estable;
  }
  
  if (tendencia === 'empeorando') {
    if (posicion === 'top50') return templates.empeorando_top;
    return templates.empeorando_bottom;
  }
}

function calcularTendencia(metricas, reporteAnterior) {
  if (!reporteAnterior) return 'estable';
  
  const diff = metricas.score_promedio - reporteAnterior.metricas_periodo.score_promedio;
  
  if (diff > 3) return 'mejorando';
  if (diff < -3) return 'empeorando';
  return 'estable';
}

function calcularPosicion(ranking, total) {
  const percentil = (1 - (ranking / total)) * 100;
  
  if (percentil >= 75) return 'top25';
  if (percentil >= 50) return 'medio';
  if (percentil >= 25) return 'medio';
  return 'bottom25';
}
```

---

## Variables Disponibles para Templates

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `{{nombre}}` | Nombre del agente | "Maria" |
| `{{score}}` | Score promedio actual | 72 |
| `{{score_anterior}}` | Score semana pasada | 68 |
| `{{ranking_actual}}` | Posicion en equipo | 5 |
| `{{ranking_anterior}}` | Posicion anterior | 7 |
| `{{total_llamadas}}` | Llamadas del periodo | 25 |
| `{{dias_activo}}` | Dias desde ingreso | 45 |
| `{{porcentaje_mejora}}` | % de mejora | 15 |
| `{{puntos_mejora}}` | Puntos ganados | 4 |
| `{{gap_critico}}` | Area a mejorar | "validacion" |
| `{{fortaleza_principal}}` | Mejor area | "rapport" |
| `{{objetivo_semanal}}` | Objetivo propuesto | "40% validacion" |
| `{{accion_principal}}` | Accion prioritaria | "cerrar con pregunta" |

