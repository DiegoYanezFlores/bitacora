# Impacable — Síntesis de investigación y Product Blueprint

> **Fase 2. Solo pensamiento de producto.** No se modifica código, no se instalan dependencias, no se diseña UI.
> Base: la investigación de la fase 1 (Amabile & Kramer, SDT/Deci, Bandura & Schunk, Kivetz et al., meta-análisis de gamificación de Sailer & Homner, ensayos STEP UP e iDiabetes, revisiones sobre efectos negativos de leaderboards/badges, análisis de Duolingo, Habitica, Finch, GitHub, Strava, Notion, etc.).
> Nota: el enunciado del Paso 2 llegó cortado en la sección 26 ("## I…"). Completé el Blueprint con las secciones que la estructura pedía de forma natural.

**Leyenda de clasificación (nunca se mezclan):**
- **[A] Evidencia científica**: respaldo razonable en investigación.
- **[B] Patrón observado en productos**: lo usan productos exitosos; no prueba causalidad.
- **[C] Hipótesis de producto**: prometedora, debe validarse.
- **[D] Riesgo / dark pattern**: sube engagement corto plazo a costa de autonomía o bienestar.

---

## 1. Síntesis: qué dice la investigación

### A. Evidencia científica
1. **El progreso en trabajo significativo es el mayor motor diario de motivación y emoción positiva** (Amabile & Kramer; ~12.000 entradas de diario, 238 personas). Implica que la app debe mostrar avance *en algo que le importa al usuario*, no actividad genérica.
2. **Submetas próximas construyen autoeficacia e interés intrínseco; las metas distales solas no** (Bandura & Schunk, 1981). Descomponer la visión en etapas y milestones es el mecanismo psicológico central, no un adorno.
3. **Efecto goal-gradient y progreso dotado** (Kivetz et al., 2006): se acelera el esfuerzo al acercarse a la meta; un arranque ya parcialmente cubierto ayuda; tras cobrar la recompensa hay un bajón ("post-reward reset").
4. **La motivación duradera requiere autonomía, competencia y relación** (SDT). Las recompensas tangibles esperadas pueden reducir la motivación intrínseca (Deci, Koestner & Ryan, 1999, 128 estudios), con condiciones: el feedback informativo sobre competencia no tiene ese efecto.
5. **La gamificación tiene efectos reales pero pequeños y muy heterogéneos** (Sailer & Homner, 2020: g≈0.25 conductual, 0.36 motivacional, 0.49 cognitivo). Depende de diseño, contexto y ajuste a necesidades psicológicas.
6. **Los efectos de incentivos/gamificación decaen al retirarlos** (STEP UP, iDiabetes). En esos estudios de actividad física la competencia rindió más que la colaboración, pero la transferencia a objetivos abiertos de vida no está demostrada.
7. **Leaderboards y comparación pueden dañar** el compromiso y la motivación de la mayoría (Michinov & Michinov, 2025; Hanus & Fox, 2015).
8. **La dopamina codifica sobre todo errores de predicción de recompensa, no "placer"** (Schultz; Keiflin & Janak). No se usa como argumento de diseño "X libera dopamina".
9. **Mayor continuidad con el yo futuro se asocia a menos descuento temporal y más ahorro/ejercicio** (Hershfield; Rutchick). Correlacional en buena parte.
10. **Journaling/escritura expresiva: efecto pequeño y heterogéneo** (Smyth d≈0.47 vs. Frattaroli d≈0.075). No es una palanca fuerte por sí sola.

### B. Patrones observados en productos
- **Heatmap de contribuciones** (GitHub): lectura instantánea de constancia e historia; efecto colateral: optimizar el cuadro verde.
- **Streaks con freeze** (Duolingo): mueven retención; la misma mecánica genera ansiedad al romperse.
- **Motivación compasiva sin castigo** (Finch): retiene a quienes las apps duras expulsan.
- **Kudos/reconocimiento** (Strava): apoyo social positivo funciona mejor que ranking para principiantes.
- **Reducir la acción del día a algo mínimo** (Duolingo): baja fricción de entrada.
- **Página en blanco** (Notion) y **complejidad** (Habitica): abandono temprano.
- **Onboarding narrado por etapas** (Fabulous).

### C. Hipótesis de producto (a validar)
- Adjuntar **evidencia** aumenta la sensación de logro y la retención a largo plazo.
- Separar **Avance** (qué se logró) de **Constancia** (ritmo) reduce la ansiedad de racha.
- Un **recap narrativo** retiene más que estadísticas.
- Mostrar **"retratos de identidad" basados en datos propios** fortalece autoeficacia.
- La constancia **semanal** es más sana que la diaria para objetivos de vida.

### D. Riesgos / dark patterns
- Streak con reset a cero y notificaciones de culpa.
- Monetizar el miedo a perder rachas.
- Recompensas variables tipo casino.
- Leaderboards globales por defecto.
- Puntos sin significado (inflación de XP).
- Presión de "mantener el verde" convertida en objetivo en sí mismo.
- Hacer difícil pausar o abandonar una meta.

---

## 2. Matriz de mecanismos y decisión

Decisión: **ADOPTAR** / **ADAPTAR** / **EXPERIMENTAR** / **EVITAR**. Las categorías [A–D] indican la naturaleza del respaldo.

| Mecanismo | Evidencia | Beneficio potencial | Riesgo | Decisión para Impacable |
|---|---|---|---|---|
| Progreso visible | [A] Amabile; Bandura | Sensación de avanzar | Progreso engañoso si mide actividad | **ADOPTAR**, pero ligado a milestones (ver §5) |
| Contribution graph / heatmap | [B] GitHub; coherente con [A] small wins | Historia visual de constancia | Obsesión por el cuadro verde | **ADAPTAR**: intensidad por significancia, días de descanso, sin contador de racha |
| Milestones | [A] Bandura & Schunk | Submetas próximas, autoeficacia | Milestones vagos | **ADOPTAR** con criterios de finalización explícitos |
| Barras de progreso | [A] goal-gradient | Aceleración cercana a la meta | Post-reward reset | **ADOPTAR** con arranque dotado y siguiente milestone visible |
| Feedback inmediato | [A] parcial (mixto) | Refuerzo de la acción | Ruido si es excesivo | **ADOPTAR**, sobrio y informativo |
| Pequeñas victorias | [A] Amabile | Motivación y emoción positiva | Trivializar | **ADOPTAR**: reconocer acciones ligadas a un milestone |
| Streaks | [B]; efecto mixto | Constancia inicial | Ansiedad, abandono al romperse [D] | **ADAPTAR** → "constancia semanal", el mejor histórico nunca se borra |
| Recuperación de streak | [B] | Reduce abandono tras fallar | Pay-to-recover [D] | **ADOPTAR** como recuperación gratuita y celebrada |
| Momentum | [C] | Ritmo sin reset a cero | Complejidad | **ADOPTAR** simple: actividad de últimos 28 días vs. tu propio ritmo |
| XP | [A] pequeño efecto de puntos | Feedback cuantificado | Crowding-out, inflación | **EVITAR en MVP**; ver §10 |
| Niveles | [B] | Sensación de progresión | Arbitrarios | **ADAPTAR**: los "niveles" son las **Etapas** reales del objetivo |
| Badges | [A] efecto pequeño | Reconocimiento | Trivialización | **ADAPTAR**: solo logros con significado (§9) |
| Achievements | [B] | Hitos memorables | Ruido | **ADAPTAR**: pocos, significativos |
| Puntos | [A] efecto pequeño | — | Recompensas arbitrarias | **EVITAR** |
| Recompensas (extrínsecas) | [A] crowding-out | — | Erosión intrínseca | **EVITAR**; permitir **autorrecompensas** definidas por el usuario (**EXPERIMENTAR**) |
| Celebraciones | [B]; [C] | Emoción positiva | Exceso | **ADOPTAR** breves, proporcionales al hito |
| Notificaciones | [B]/[D] | Retorno | Spam, culpa | **ADAPTAR**: filosofía en §16 |
| Recordatorios | [B] | Ayuda a iniciar | Fatiga | **ADOPTAR** elegidos por el usuario |
| Deadlines | [A] mixto | Urgencia | Estrés | **ADAPTAR**: fechas objetivo opcionales, "ritmo estimado", no castigo |
| Goal gradient | [A] Kivetz | Impulso al cierre | Bajón post-meta | **ADOPTAR** |
| Visualización histórica | [B] | Sensación de haber construido | — | **ADOPTAR** |
| Timeline | [B]; [C] | Narrativa de historia personal | Convertirse en log de tareas | **ADOPTAR** (§8) |
| Journaling | [A] efecto pequeño | Reflexión | Diario aburrido | **ADAPTAR**: reflexión de una línea ligada a la acción |
| Evidencia | [C] | Prueba y orgullo | Fricción | **ADOPTAR**, opcional en acciones, central en milestones |
| Reflexión | [A] leve | Aprendizaje | Obligatoriedad | **ADAPTAR** opcional, en cierres de milestone |
| Estadísticas | [B] | Autoconocimiento | Abrumar | **ADAPTAR**: pocas, con narrativa |
| Recap semanal | [C] | Sensación de constancia | Ruido | **ADOPTAR** |
| Recap mensual | [C] | Cambio visible | — | **ADOPTAR** |
| Recap anual | [B] (estilo Wrapped) | "Construí algo" | Costo de producción | **ADOPTAR** en V2 |
| Personalización | [A] mixto | Autonomía | Complejidad | **ADAPTAR**: configurable en lo esencial |
| Autonomía | [A] SDT | Motivación internalizada | — | **ADOPTAR** como principio |
| Competencia (sensación) | [A] SDT | "Soy capaz" | — | **ADOPTAR** como principio |
| Relación/social | [A] SDT (relatedness) | Apoyo | Presión social | **EXPERIMENTAR** (V2) |
| Comparación social | [A] daño frecuente | — | Desmotivación | **EVITAR** |
| Accountability | [A] STEP UP (apoyo) | Compromiso | Presión | **EXPERIMENTAR**: un compañero opcional |
| Identidad | [A] parcial | Persistencia | Manipulación | **ADAPTAR**: basada en datos del propio usuario |
| Future self | [A] correlacional | Persistencia | Falsas predicciones | **EXPERIMENTAR** con rangos honestos |
| Narrativa | [A] no significativa en gamificación | Sentido | Fantasía impuesta | **ADAPTAR**: narrativa = la historia real del usuario |
| Rachas | ver Streaks | | | ver Streaks |
| Variable rewards | [A] (RPE) pero [D] aplicado | — | Diseño adictivo | **EVITAR** |
| Sorpresa | [A] (RPE) | Delight | Manipulación si es variable | **EXPERIMENTAR**: sorpresas *informativas* (ej. "hace 90 días empezabas con…") |
| Onboarding | [B] | Activación | Fricción | **ADOPTAR** (ver MVP, §19) |
| Gamificación (en general) | [A] pequeño y heterogéneo | — | Fatiga, crowding-out | **ADAPTAR** en dosis mínimas, como andamiaje |

---

## 3. Core loop

### Veredicto sobre el loop propuesto
`ACCIÓN → FEEDBACK → PROGRESO → EVIDENCIA → PEQUEÑA VICTORIA → MOTIVACIÓN → SIGUIENTE ACCIÓN` es un buen punto de partida, pero la investigación sugiere tres ajustes:

1. **Falta el paso de orientación al inicio** ("¿dónde estoy y qué sigue?"). Sin él, se cae en la trampa de la página en blanco.
2. **La evidencia no siempre va después del progreso**: es lo que *convierte* una acción en avance real. Debe ser opcional en la acción y exigida (o al menos fuertemente invitada) en el cierre de milestone.
3. **Falta un loop mayor** (milestone → cierre → siguiente milestone) que evite el bajón post-recompensa de Kivetz.

### Loop diario (micro)
1. **Orientarse**: al abrir ve su visión, el milestone activo y la **siguiente acción sugerida**.
2. **Actuar y registrar**: elige o crea una acción vinculada a un milestone (menos de 15 segundos).
3. **Evidenciar (opcional)**: adjunta foto, archivo, enlace o nota.
4. **Recibir feedback**: el cuadro del día se ilumina en el gráfico, avanza el criterio del milestone, breve mensaje informativo ("Ya van 3 de 5 criterios de esta etapa").
5. **Reflexionar (opcional, una línea)**: "¿Qué aprendiste?".
6. **Ver el siguiente paso**: la app deja lista la próxima acción, para que volver sea fácil.

### Loop de milestone (medio plazo)
Cerrar milestone con evidencia → celebración proporcional → **abrir el siguiente antes de que el usuario salga** → actualizar el retrato del objetivo.

### Loop de identidad (largo plazo)
Evidencia acumulada → timeline → recap → "En quién me estoy convirtiendo" → nuevo objetivo o etapa.

### Respuestas
- **¿Qué hace el usuario?** Elige una acción vinculada a un milestone y la registra.
- **¿Qué feedback recibe?** Inmediato, sobrio, informativo sobre competencia (no puntos).
- **¿Qué cambia visualmente?** El cuadro del día en el gráfico y el avance del milestone.
- **¿Qué sensación?** "Hice algo, y cuenta".
- **¿Qué lleva a la siguiente acción?** La siguiente acción ya sugerida y el siguiente milestone visible (goal-gradient).

---

## 4. Modelo conceptual

Regla de simplicidad: **seis entidades principales**. Todo lo demás son atributos.

```
Visión ─┬─ Objetivo ─┬─ Etapa ── Milestone ── Acción ── Evidencia
        │            │
        └─ (varios)  └─ Logro (derivado)         Progreso (calculado)
```

| Elemento | Qué representa | Para qué sirve | Quién lo crea | Cuándo se completa | Relaciones | Contenido |
|---|---|---|---|---|---|---|
| **Visión** | La persona en la que quiere convertirse o el porqué profundo | Dar sentido, base de la identidad | Usuario (1–2 frases, opcional al inicio) | No se "completa"; se revisa | Agrupa uno o más objetivos | Texto propio, fecha de creación, revisiones |
| **Objetivo** | Resultado concreto con fin identificable | Foco principal de la experiencia | Usuario (con plantillas opcionales) | Al cerrar su última etapa o por decisión del usuario | Pertenece a una visión; contiene etapas | Título, porqué, indicador de éxito, fecha objetivo opcional, estado (activo/pausado/cerrado) |
| **Etapa** | Fase mayor del camino | Estructura y sensación de niveles reales | Usuario, con ayuda de plantillas | Cuando sus milestones ponderados se cierran | Contiene milestones | Nombre, orden, descripción |
| **Milestone** | Hito verificable | Unidad de avance significativo | Usuario | Al cumplir sus **criterios de finalización** | Contiene acciones y criterios; puede requerir evidencia | Título, 2–5 criterios, peso (S/M/L), evidencia esperada, fecha opcional |
| **Acción** | Cosa hecha en un momento | Registrar esfuerzo y constancia | Usuario | Al registrarse | Vinculada a un milestone (o "suelta" con aviso) | Fecha, descripción breve, duración opcional, evidencia opcional, reflexión opcional |
| **Evidencia** | Prueba de una acción o milestone | Respaldar y recordar | Usuario | No se completa; se adjunta | Vinculada a acción o milestone | Tipo, contenido/enlace, nivel de verificación (§6) |
| **Progreso** | Cálculo derivado | Responder "¿cuánto avancé?" | Sistema | — | Se calcula de milestones y criterios | Avance, constancia, momentum |
| **Logro** | Reconocimiento derivado | Marcar hitos memorables | Sistema (más hitos personales) | — | Se genera de eventos reales | Tipo, fecha, evidencia asociada |

**Decisión de simplicidad:** el usuario **crea** visión, objetivo, etapas, milestones, acciones y evidencia. Progreso y logros **se derivan**. Las plantillas por tipo de objetivo pre-rellenan etapas y milestones para evitar la página en blanco.

---

## 5. Sistema de progreso (el punto más importante)

### Comparación de modelos

| Modelo | Fortaleza | Debilidad |
|---|---|---|
| Por acciones | Simple, feedback inmediato | **Manipulable**: 100 tareas pequeñas = 100% |
| Por milestones | Mide avance significativo | Feedback lento si los milestones son grandes |
| Ponderado | Refleja diferencias de esfuerzo/importancia | Pesos subjetivos |
| Por etapas | Claro y narrativo | Grueso |
| Temporal | Da ritmo | Castiga si se usa como juicio |
| Cualitativo | Sirve donde no hay métrica | Subjetivo |
| Basado en evidencia | Difícil de inflar | Fricción |

### Modelo propuesto: **Avance ponderado por milestones con criterios de finalización, respaldado por evidencia, y separado de Constancia** [C]

1. **Dos ejes, nunca mezclados:**
   - **Avance** = qué se ha logrado (milestones y criterios cumplidos).
   - **Constancia** = con qué ritmo se trabaja (semanas activas, momentum).
   - Así, muchas acciones pequeñas suben la Constancia, **no** el Avance.
2. **Cálculo del Avance:**
   - Cada **milestone** tiene 2–5 **criterios de finalización** definidos *antes* de trabajar (tipo "definition of done").
   - El avance del milestone = criterios cumplidos / totales. Las acciones **no** suben el % por sí solas; sirven para cumplir criterios.
   - **Etapa** = promedio de sus milestones ponderado por peso (S=1, M=2, L=3).
   - **Objetivo** = promedio ponderado de sus etapas.
3. **Anti-trampa (sin policía):**
   - Las acciones sueltas o sin milestone cuentan para Constancia, no para Avance.
   - Los pesos están acotados (S/M/L), evitando inflar con miles de milestones triviales; se sugiere un máximo razonable de milestones activos por etapa.
   - Los criterios pueden requerir **evidencia** para marcarse "verificados"; el progreso muestra qué proporción está respaldada.
4. **Indicador de respaldo:** junto al % de avance se muestra "X de Y milestones con evidencia". Es informativo, no bloqueante: el usuario decide.
5. **Métricas ancla para objetivos difusos:** en objetivos como "mejorar inglés", un milestone puede ser un **resultado medible** (examen, nivel de rúbrica, entrevista grabada) más que horas estudiadas. Se propone al usuario definirlos.
6. **Progreso cualitativo:** cada cierto tiempo, una **autoevaluación breve** ("¿cómo te sientes en este aspecto?") queda registrada como dato del retrato de progreso, no como % oficial.
7. **Progreso temporal:** si hay fecha, se muestra un **ritmo de referencia** ("a este ritmo estarías en X"), sin colores de alarma. [C]
8. **Visualización:** fracción "3/5" para criterios y milestones discretos (submetas próximas); porcentaje para etapa y objetivo (proximidad continua). [C]

**Por qué este modelo:** ancla el avance a *hitos verificables* (Bandura: submetas próximas y experiencias de dominio), mantiene feedback frecuente (criterios) y separa actividad de logro.

---

## 6. Sistema de evidencia

### Qué puede ser evidencia
Texto, foto, archivo, enlace, commit, certificado, resultado, documento, reflexión, métrica, captura, proyecto terminado.

### Niveles de respaldo [C]

| Nivel | Nombre | Ejemplo |
|---|---|---|
| 0 | **Registrado** | "Estudié inglés" (solo declaración) |
| 1 | **Reflexionado / medido** | Nota con lo aprendido; métrica autoinformada |
| 2 | **Con artefacto** | Foto, audio, archivo, captura, enlace a lo producido |
| 3 | **Verificable externamente** | Certificado, resultado oficial, commit, publicación |

### Respuesta a la pregunta fundamental
> *¿Cómo diferenciamos "registré que hice algo" de "puedo demostrar que hice algo"?*

Con el **nivel de respaldo**: visible en cada acción y milestone (ícono/etiqueta sutil), agregado en el objetivo ("60% de tus milestones tienen evidencia nivel 2 o 3"). No se bloquea el progreso; se hace **visible** la diferencia.

### Reglas
- **Acciones:** evidencia opcional; nivel 0 es válido.
- **Milestones:** se **invita** a adjuntar evidencia al cierre; los logros "reales" (§9) exigen nivel ≥2.
- **Privacidad por defecto:** toda evidencia es privada; el usuario decide si compartir.
- **La evidencia es para el yo futuro del usuario**, no para una audiencia ni para "auditar" al usuario.
- **Fricción mínima:** adjuntar en un toque; capturar desde el momento de la acción.
- **Hipótesis a validar:** convertir acciones en evidencia aumenta sensación de logro y retención [C].

---

## 7. Contribution graph adaptado a la vida

**Pregunta que responde:** *"¿Qué he construido durante este período?"*

- **Qué representa cada día:** un cuadro por día con lo construido ese día.
- **Intensidad (4 niveles) [C]:** función de *significancia*, no solo cantidad: acciones registradas con tope logarítmico + presencia de evidencia + eventos de milestone. Cerrar un milestone genera un marcador especial visible.
- **Día vacío:** neutro, **sin color de "falta"** ni rojo. Existe además el **día de descanso intencional** (marcable por el usuario), visualmente distinto y sin penalización.
- **Períodos:** vista por defecto de 12 meses; alternar a mes, año o toda la historia (filas por año).
- **Filtros:** por objetivo, por etapa, por tipo de acción, por "con evidencia".
- **Hover/click:** hover = resumen del día; click = detalle (acciones, evidencias, reflexiones, hitos).
- **Relación con objetivos:** cada objetivo tiene su color; una vista "todo" superpone.
- **Evitar la obsesión por la racha:**
  - **No** mostrar contador de racha sobre el gráfico.
  - Métricas resumen por período: **"días activos"** y **"semanas activas"**, no "días consecutivos".
  - Opción de **vista semanal** (una celda por semana) para quienes se estresan con lo diario. [C]
  - Los descansos no rompen nada.
- **Advertencia de diseño:** el mismo gráfico que motiva puede llevar a "optimizar el cuadro"; la significancia ponderada y los marcadores de hito buscan que lo visible sea *construcción*, no ruido.

---

## 8. Timeline / historia personal

Objetivo: *"Estoy viendo la historia de lo que construí"*, no un log de tareas.

- **Estructura:** línea temporal por capítulos = **Etapas y objetivos**, con acciones agrupadas y colapsadas por defecto.
- **Qué destaca:** milestones cerrados, logros, evidencias con imagen o archivo, reflexiones, cambios de rumbo (pausas, pivotes, reinicios), objetivos completados.
- **Qué se colapsa:** acciones repetitivas ("12 sesiones de práctica en marzo").
- **Vistas:** por objetivo, global, y "solo lo destacado".
- **Tono:** encabezados narrativos automáticos ("Marzo: empezaste tu segunda etapa").
- **Los períodos de inactividad se muestran como pausas**, sin juicio.
- Base en [B] (GitHub, apps de journaling) y [C] para el efecto narrativo.

---

## 9. Achievements

Cuatro tipos, con veredicto sobre su utilidad:

| Tipo | Ejemplo | Utilidad | Decisión |
|---|---|---|---|
| **Logros reales** | "Completaste tu primera certificación" | Alta: hito con evidencia (nivel ≥2) | **ADOPTAR** |
| **Logros de progreso** | "Completaste el 50% de una etapa" | Media-alta: reconocen avance real | **ADOPTAR** |
| **Logros de constancia** | "Trabajaste 10 días este mes" | Media; riesgo de convertirse en meta en sí | **ADAPTAR**: frases descriptivas, sin trofeo llamativo |
| **Logros exploratorios** | "Probaste una nueva estrategia" | Baja en MVP | **EXPERIMENTAR** |

**Reglas:**
- Pocos y significativos; nunca por trivialidades.
- **Logros de recuperación** ("Volviste después de 21 días") con el mismo estatus que los de constancia (§11).
- Nada de badges por actividad genérica; evita inflación.
- Los logros del usuario pueden ser **personales**: puede crear el suyo ("Primera entrevista en inglés").
- El logro se asocia a la evidencia que lo respalda.

---

## 10. XP, niveles y gamificación

| Mecanismo | ¿Incluir? | Razonamiento |
|---|---|---|
| **XP** | **No en MVP** | Efecto pequeño [A], riesgo de crowding-out [A], y "puntos" sin referente real dañan el principio *"progreso, no actividad"*. |
| **Niveles** | **Sí, pero reales** | Las **Etapas** son los niveles: significan avance verificable, no números arbitrarios. |
| **Puntos** | **No** | Recompensa arbitraria. |
| **Streaks** | **Adaptado** | "Constancia semanal": semanas con ≥N días activos (N elegido por el usuario); el **mejor historial nunca se borra**. |
| **Momentum** | **Sí** | Actividad reciente (28 días) relativa al ritmo propio. Sin reset a cero. |
| **Recompensas** | **No extrínsecas**; **autorrecompensas** opcionales | El usuario puede definir "cuando cierre este milestone me regalo X" [C]. |

**Evaluación por criterio (motivación / autonomía / competencia / sostenibilidad / riesgo de obsesión / riesgo de abandono / utilidad):**
- XP: baja utilidad real, riesgo de obsesión medio, no aporta competencia informativa.
- Niveles-como-etapas: alta competencia, alta autonomía, riesgo bajo.
- Constancia semanal: sostenibilidad alta, riesgo de abandono bajo (no hay "reset a cero").
- Momentum: competencia percibida sin castigo.

**Si en el futuro se experimenta con XP**, debe representar **avance verificado** (criterios cumplidos, milestones con evidencia), nunca simple actividad, y jamás ser canjeable.

---

## 11. Recuperación

Principio: **premiar el regreso, no solo la perfección.**

| Situación | Qué ocurre | Mensaje / tono |
|---|---|---|
| **Falla un día** | Nada cambia: el día queda neutro | Sin mensaje |
| **Falla varios días** | El momentum baja suave; no hay reset | "Puedes retomar cuando quieras; tu siguiente paso está listo" |
| **Abandona un objetivo** | Opciones: **Pausar**, **Archivar** o **Cerrar con reflexión** (¿qué aprendí?). Nada se borra | "Lo que construiste sigue aquí" |
| **Cambia de objetivo** | **Pivote**: conserva historial y evidencia; puede reutilizar etapas | Sin culpa |
| **Pierde motivación** | Ofrece reducir el tamaño de la próxima acción, revisar el porqué o pausar | "¿Reducimos el paso de hoy?" |
| **Regresa tras semanas** | Pantalla de bienvenida con el retrato de lo ya hecho + **una sola** acción pequeña sugerida; **logro de recuperación** | "Bienvenido de vuelta: ya tienes X construido" |
| **Completa algo antes de lo esperado** | Celebración + opción de **ajustar el siguiente milestone** o abrir uno nuevo (evita post-reward reset) | "Vas adelantado; ¿quieres un reto mayor o mantener el ritmo?" |

**Métrica de recuperación:** "regresaste N veces después de una pausa" como dato de resiliencia. [C]

---

## 11b. Dashboard conceptual (jerarquía de información)

Al abrir Impacable, el orden de importancia responde a tus siete preguntas:

1. **¿Qué intento conseguir?**: objetivo activo y visión en una línea (arriba).
2. **¿Qué estoy haciendo ahora?**: milestone activo y criterios pendientes.
3. **¿Cuánto avancé?**: **Avance** (ponderado) y, separado, **Constancia** (semanas activas + momentum).
4. **¿Qué hice recientemente?**: últimas acciones y evidencias (2–5).
5. **¿Qué debería hacer ahora?**: **la siguiente acción sugerida**, un solo botón principal.
6. **¿Qué he conseguido?**: logros recientes y hitos cerrados.
7. **¿Qué evidencia tengo?**: fragmento del portafolio (últimas evidencias destacadas) y gráfico compacto.

Principio: **una acción principal clara**, el resto secundario. Sin abrumar.

---

## 12. Recaps

No solo estadísticas: **narrativa** de progreso. [C]

- **Semanal — "Esto construiste esta semana":** hitos y criterios avanzados, evidencias destacadas, una frase de constancia, **una pregunta reflexiva** y **una sugerencia** para la próxima semana. Siempre positivo o neutro, incluso en semanas bajas ("Esta semana fue más ligera; tus X seguían disponibles").
- **Mensual — "Esto cambió este mes":** comparación con **el mes anterior del propio usuario** (nunca con otros), milestones movidos, aprendizajes citados de sus reflexiones, cambios en el retrato.
- **Anual — "Esto construiste durante el año":** capítulos por objetivo, galería de evidencia, antes/después, hitos, retorno tras pausas. Es el momento de máxima emoción de la revisión ("Realmente construí algo").
- **Reglas:** opt-out fácil; sin comparación con terceros; nunca culpa.

---

## 13. Personalización

### Universal (no configurable)
Estructura Visión→Objetivo→Etapa→Milestone→Acción→Evidencia; separación Avance/Constancia; principios anti-dark-pattern; privacidad por defecto.

### Configurable
Categorías y colores; tipo de objetivo (plantillas); frecuencia de constancia (N días/semana); métricas visibles; tipos de evidencia preferidos; horarios de recordatorio; intensidad de celebraciones; vista del gráfico (diaria/semanal); autorrecompensas.

| Persona | Adaptación clave |
|---|---|
| **A. Objetivo profesional** | Milestones tipo entregables (proyecto, entrevista, certificación); evidencia con enlaces y documentos |
| **B. Aprender un idioma** | Milestones con métricas ancla (nivel, examen); evidencia audio; constancia alta |
| **C. Ponerse en forma** | Métricas numéricas (peso, distancias); constancia semanal; evidencia fotos y datos |
| **D. Construir una empresa** | Etapas largas, milestones de negocio, evidencia de resultados; mucho trabajo no visible |
| **E. Estudiar** | Milestones por unidad/examen; fechas objetivo; evidencia de notas y trabajos |

Evidencia [A] mixta: personalizar tiende a mejorar el ajuste, pero no está garantizado; por eso se personaliza lo esencial y se evita una sobrecarga de opciones.

---

## 14. Identidad y future self

Pregunta: *¿Puede Impacable ayudar a ver evidencia de en quién se está convirtiendo el usuario?* **Sí, con evidencia propia y sin manipulación.**

- **Retrato de progreso (MVP-lite, V2):** frases derivadas de datos reales del usuario: *"En 4 meses hiciste 46 sesiones de práctica, cerraste 3 milestones y grabaste 5 audios"*. Es identidad basada en **hechos**, no en etiquetas impuestas. [C]
- **Declaración de identidad opcional:** el usuario escribe "Estoy en camino de ser alguien que…"; la app la muestra junto a la evidencia. Coherente con identity-based motivation [A parcial].
- **Autoeficacia:** el retrato recuerda **experiencias de dominio** (Bandura): milestones cerrados, obstáculos superados.
- **Future self:** carta al yo futuro; visión visible. Evidencia sobre continuidad con el yo futuro es en parte correlacional [A]. 
- **Proyección "si continúas con este ritmo…"** [C, EXPERIMENTAR]: solo con **rangos** y advertencias, basada en el historial del usuario; nunca una promesa. No se activa sin historial suficiente.
- **Límites éticos:** no imponer una identidad, no crear ansiedad ("serás fracasado si…"), y permitir desactivarlo.

---

## 15. Social

| Función | Valor potencial | Riesgo | Decisión |
|---|---|---|---|
| Amigos | Relación (SDT) | Presión | V2 opcional |
| **Accountability** (una persona de confianza que ve tu recap) | Apoyo; en STEP UP el apoyo social mostró efecto | Presión si se abusa | **EXPERIMENTAR** en V2 |
| Compartir objetivos/logros | Orgullo | Comparación y exposición | Opcional, privado por defecto |
| Reacciones/celebraciones de otros | Reconocimiento (estilo kudos) | Baja | **EXPERIMENTAR** en V2 |
| Equipos/comunidades | Pertenencia | Complejidad | Futuro |
| Colaboración | Cooperación (efecto menor que competencia en STEP UP, pero mayor relación social en otros estudios) | Depende | Futuro |
| **Comparación / leaderboards** | La competencia funcionó en estudios de actividad física | Daño frecuente en otros contextos [A] | **EVITAR por defecto**; jamás global. Solo **opt-in** entre pares y en el futuro |

**Regla:** lo social es **opcional, privado por defecto y de apoyo**, nunca una condición para que el producto funcione. La evidencia de competencia proviene de actividad física con metas concretas; su transferencia a objetivos abiertos de vida es una **hipótesis**.

---

## 16. Notificaciones

**Filosofía:** *la app se ofrece, no reclama.* Las notificaciones sirven a los objetivos que el **usuario** definió.

- **Por defecto, mínimas.** Solo el **recap semanal** y los recordatorios que el usuario cree.
- **Tipos:**
  - **Recordatorio elegido:** hora y frecuencia decididas por el usuario.
  - **Milestone cercano (opt-in):** "Te falta 1 criterio para cerrar esta etapa".
  - **Recap semanal/mensual.**
  - **Regreso tras inactividad:** ver abajo.
- **Cuándo NO notificar:** en pausa del objetivo, en días de descanso marcados, fuera de horario elegido, más de una vez al día, y nunca con culpa.
- **Frecuencia:** tope por defecto de **1 por día** y **3 por semana**; el usuario puede cambiarlo.
- **Inactividad:** como máximo **una** notificación amable hacia ~10 días y **una** hacia ~30; después, **silencio** (sunset). Ejemplo de tono: *"Tu siguiente paso está listo cuando quieras."*
- **Prohibido:** "¡Perderás tu racha!", mensajes personificados que culpan, urgencia artificial, contadores de pérdida.
- **Personalización:** canal, hora, tipo, tono.
- **Evidencia:** Duolingo optimiza notificaciones [B]; la ansiedad de racha y la fatiga son riesgos [D]. La política de tope y sunset es una **hipótesis de producto** [C].

---

## 17. Principios anti-dark-pattern

**ENGAGEMENT POR VALOR, NO POR MANIPULACIÓN.** Impacable **no** debe:

1. Generar culpa deliberadamente.
2. Castigar la ausencia (pérdida de datos, reset a cero, vidas).
3. Usar miedo a perder una racha como palanca.
4. Enviar spam ni notificaciones de presión.
5. Manipular al usuario para abrir la app con falsas urgencias.
6. Crear recompensas arbitrarias sin valor (puntos inflados, cofres aleatorios).
7. Ocultar acciones importantes (pausar, exportar, eliminar, cancelar).
8. Dificultar el abandono de una meta o de la cuenta.
9. Generar presión social innecesaria (rankings globales, exposición por defecto).
10. Monetizar la ansiedad (pagar por recuperar una racha).
11. Usar recompensas variables tipo casino.
12. Hacer proyecciones falsas sobre el futuro del usuario.

**Regla de oro:** *si el usuario se enterara exactamente de por qué estamos mostrando algo, ¿seguiría de acuerdo?* Si no, no se hace.

---

## 18. Mapa de momentos emocionales

| Momento | Sensación deseada | Cómo se apoya (conceptualmente) |
|---|---|---|
| **Primera apertura** | Claridad y esperanza ("esto puede ayudarme") | Onboarding breve, visión en pocas frases, sin página en blanco |
| **Primera acción** | "Hice algo" | Feedback inmediato, primer cuadro iluminado, arranque dotado |
| **Primer milestone** | Orgullo y competencia | Cierre celebrado, evidencia guardada, siguiente milestone visible |
| **Primera semana** | "Estoy siendo constante" | Recap semanal con narrativa |
| **Primer mes** | "Ya avancé bastante" | Recap mensual, gráfico con densidad, comparación con el yo pasado |
| **Primer objetivo completado** | Satisfacción profunda y sentido de identidad | Celebración mayor, portafolio, carta al yo futuro, propuesta de siguiente reto |
| **Regreso tras abandonar** | "Puedo volver a empezar", alivio | Bienvenida sin culpa, mostrar lo ya construido, un paso pequeño |
| **Revisión anual** | "Realmente construí algo" | Recap anual: capítulos, evidencia, antes/después |

---

## 19. Definición del MVP

### MVP absolutamente necesario
Lo mínimo que produce la experiencia diferenciadora (*progreso visible + evidencia*):

1. **Estructura:** Objetivo → Etapa → Milestone (con criterios) → Acción (la Visión puede ser un campo de texto simple).
2. **Registro rápido de acción** (<15 s) vinculada a un milestone.
3. **Evidencia:** adjuntar texto, foto, archivo o enlace (opcional en acciones).
4. **Progreso** con el modelo de dos ejes: **Avance** (milestones ponderados) y **Constancia** (semanas activas + momentum).
5. **Contribution graph** con intensidad por significancia, días de descanso y marcadores de hito.
6. **Feedback inmediato** sobrio (cuadro del día, criterio avanzado, celebración breve al cerrar milestone).
7. **Dashboard** con jerarquía §11b y "siguiente acción" sugerida.
8. **Recuperación básica:** pausa/archivo, bienvenida de regreso sin culpa.
9. **Onboarding** corto con plantillas de objetivos.
10. **Recap semanal** (versión simple narrativa).

### Versión 2
Timeline narrativa completa; logros reales/de progreso/recuperación; recap mensual y anual; personalización ampliada; retrato de identidad; notificaciones personalizadas; accountability opcional (una persona); autorrecompensas.

### Futuro
Reacciones y comunidades opt-in; colaboración/competencia opt-in entre pares; proyecciones de future self con rangos; asistente que ayude a descomponer la visión en milestones; sugerencias adaptativas de siguiente acción (balance reto-habilidad); integraciones (calendario, GitHub, wearables).

### Fuera de MVP explícitamente
XP, puntos, badges triviales, leaderboards, avatar, tienda, feed social, gamificación narrativa fantástica.

---

## 20. Principios de producto (10)

1. **El progreso propio es el producto.** Todo existe para que el usuario sienta "avancé" y, con el tiempo, "construí algo".
2. **Avance ≠ actividad.** La app muestra avance significativo (hitos), separado de la constancia.
3. **Autonomía primero.** El usuario define su objetivo, su ritmo y sus reglas; la app propone, nunca impone.
4. **Competencia por encima de puntos.** El feedback informa capacidad y dominio, no premia arbitrariamente.
5. **La evidencia hace real el progreso.** Se distingue "registré" de "puedo demostrar", sin vigilar al usuario.
6. **Compasión sobre castigo.** Nada se pierde, todo se puede retomar; se premia el regreso.
7. **Constancia sobre perfección.** Se mide ritmo y recuperación, no racha frágil.
8. **Significado sobre mecánica.** Se combate la novedad con propósito, no con más gamificación.
9. **Lo social es apoyo, opcional y privado.** Nunca comparación forzada.
10. **Honestidad y ética.** Sin dark patterns, sin predicciones falsas, engagement por valor.

---

## 21. PRODUCT DECISIONS

| Decisión | Elección | Evidencia / razonamiento | Confianza |
|---|---|---|---|
| **Core loop** | Orientarse → actuar → evidenciar (opcional) → feedback → reflexión (opcional) → siguiente paso; loop mayor de milestone con apertura del siguiente | Goal-gradient, post-reward reset [A]; low friction [B] | Media-Alta |
| **Estructura de objetivos** | Visión (texto) → Objetivo → Etapa → Milestone; plantillas | Submetas próximas [A]; evitar página en blanco [B] | Alta |
| **Milestones** | Con 2–5 criterios de finalización y peso S/M/L | Bandura & Schunk [A]; anti-inflación [C] | Alta |
| **Acciones** | Vinculadas a milestone; alimentan Constancia, no Avance | Evita "100 tareas = 100%" [C] | Media-Alta |
| **Evidencia** | 4 niveles; opcional en acciones, invitada en milestones; privada por defecto | Diferenciador [C]; fricción a validar | Media (hipótesis central) |
| **Progreso** | Dos ejes (Avance ponderado / Constancia); fracciones para lo discreto, % para etapa/objetivo | Small wins [A]; goal-gradient [A]; separación [C] | Media |
| **Contribution graph** | Significancia ponderada, día de descanso, marcadores de hito, sin contador de racha | Patrón GitHub [B]; riesgo de obsesión [D] | Media |
| **Timeline** | Narrativa por etapas, acciones colapsadas | Narrativa [C] | Media |
| **Achievements** | Reales, de progreso y de recuperación; pocos; constancia solo descriptiva | Badges de efecto pequeño [A]; riesgo de ruido [D] | Media |
| **XP** | No en MVP; si se prueba, ligado a avance verificado | Crowding-out y efecto pequeño [A] | Media-Alta |
| **Niveles** | Las Etapas son los niveles | Coherencia con avance real [C] | Media-Alta |
| **Streaks** | Constancia semanal; el mejor histórico nunca se borra | Ansiedad de racha [B/D]; Lally (un día perdido no arruina el hábito) [A] | Media-Alta |
| **Momentum** | Ventana de 28 días respecto al ritmo propio | Alternativa sin reset [C] | Media |
| **Recompensas** | No extrínsecas; autorrecompensas opcionales | Deci et al. [A] | Alta |
| **Recaps** | Semanal en MVP, mensual y anual en V2, narrativos | Amabile: reflexión sobre progreso [A]; narrativa [C] | Media |
| **Social** | Fuera del MVP; después, accountability opt-in; sin leaderboards por defecto | STEP UP (contexto específico) [A]; daño por comparación [A] | Media |
| **Notificaciones** | Mínimas, elegidas por el usuario, con tope y sunset; sin culpa | Riesgos de spam [D]; política propia [C] | Media |
| **Personalización** | Universal en estructura y ética; configurable en categorías, ritmo, vistas, evidencia | SDT [A]; ajuste mixto [A] | Media |
| **Onboarding** | Visión corta → primer objetivo con plantilla → primer milestone → primera acción en <5 minutos | Activación [B]; progreso dotado [A] | Media-Alta |

---

## 22. PRODUCT BLUEPRINT FINAL

### PRODUCT VISION
Impacable es el lugar donde una persona **construye y ve su progreso real** en algo importante para su vida, con evidencia acumulada a lo largo del tiempo. Al mirar atrás debe poder pensar: *"Realmente construí algo."*

### USER PROBLEM
Las personas empiezan objetivos importantes pero:
- pierden la percepción de avance y abandonan (metas distales sin submetas);
- confunden **actividad** con **progreso**;
- se sienten mal al fallar (all-or-nothing) y no vuelven;
- no conservan **evidencia** de lo que lograron;
- ven sus herramientas actuales como listas de tareas, hábitos o diarios desconectados.

### CORE EXPERIENCE
Abrir la app y ver: qué intento lograr, dónde estoy, mi siguiente paso y la historia de lo construido. Registrar una acción es rápido, deja huella visible y, si se desea, evidencia. El usuario siente **avance, competencia y autonomía**, y al volver tras una pausa siente **"puedo retomar"**.

### CORE LOOP
Orientarse → actuar → (evidenciar) → feedback inmediato → (reflexionar) → siguiente paso. Loop mayor: cerrar milestone → celebrar → abrir el siguiente → actualizar retrato.

### MODELO CONCEPTUAL
Visión → Objetivo → Etapa → Milestone (con criterios) → Acción → Evidencia; Progreso y Logros derivados.

### SISTEMA DE PROGRESO
Dos ejes: **Avance** (milestones y criterios ponderados, respaldado por evidencia) y **Constancia** (semanas activas + momentum). Las acciones alimentan Constancia; los criterios cumplidos alimentan Avance.

### SISTEMA DE EVIDENCIA
Niveles 0–3; opcional en acciones, invitada en milestones; privada por defecto; visible como indicador de respaldo.

### VISUALIZACIÓN Y NARRATIVA
Contribution graph por significancia con descansos y marcadores de hito; timeline por capítulos; recaps narrativos.

### GAMIFICACIÓN (postura)
Mínima y significativa: niveles=etapas, logros reales/de progreso/recuperación, constancia semanal, momentum. Sin XP, sin puntos, sin leaderboards por defecto.

### RECUPERACIÓN
Nada se pierde; bienvenida sin culpa; pausar/archivar/pivotar; logros de recuperación.

### SOCIAL
No en MVP; luego accountability opt-in; sin comparación por defecto.

### NOTIFICACIONES
Mínimas, elegidas, con tope y sunset; sin culpa.

### PRINCIPIOS
Los 10 de la sección 20.

### MVP
El de la sección 19.

### MÉTRICAS DE VALIDACIÓN
- **Retención** D7/D30/D90.
- **% de usuarios que cierran ≥1 milestone en 30 días.**
- **Acciones con evidencia por usuario** y su relación con la retención.
- **Tasa de regreso tras ≥14 días de inactividad.**
- **Encuesta breve:** "Siento que estoy avanzando" (1–5) y "Siento presión por mantener mi racha" (1–5): la segunda debe ser baja.
- **Señal de alerta:** si la constancia sube pero el Avance no, la gente está registrando actividad sin progresar.

### HIPÓTESIS CLAVE A VALIDAR
1. La evidencia aumenta sensación de logro y retención [C].
2. Separar Avance y Constancia reduce el abandono tras fallar [C].
3. La constancia semanal es más sostenible que la diaria [C].
4. Los recaps narrativos aumentan el retorno frente a estadísticas [C].
5. Los criterios de finalización mejoran la sensación de progreso frente a tareas libres [C].

### RIESGOS
- **Fricción** de crear milestones y criterios (mitigación: plantillas, sugerencias, onboarding guiado).
- **Complejidad** (seis entidades pueden resultar demasiadas para algunos): esconder Visión/Etapas hasta que se necesiten.
- **Sesgo hacia objetivos medibles:** algunos objetivos son difusos; se necesitan milestones cualitativos y autoevaluaciones.
- **Obsesión por el gráfico** aun sin racha explícita.
- **Novedad:** la retención puede caer a las 3–6 semanas; la solución es significado (milestones, evidencia), no más mecánicas.
- **Cifras de la industria** sobre streaks (ej. porcentajes de abandono) no están verificadas en fuentes primarias; no se usan como base.

### SIGUIENTE FASE
Convertir este blueprint en: **Product Specification → UX Flows → Features → Design System → Implementation Plan**, y solo entonces usar Claude Code.
