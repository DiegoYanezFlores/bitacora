# "GitHub para tu vida": Investigación de producto basada en evidencia sobre qué hace que las personas vuelvan a registrar su progreso

## TL;DR
- **Lo que hace volver a una persona no es la "gamificación bonita", sino la percepción repetida de progreso propio en algo que le importa.** La evidencia más sólida (Amabile & Kramer; Bandura; Deci & Ryan; goal-gradient de Kivetz) indica que el motor central es *progreso visible en trabajo significativo + sensación de competencia + autonomía*, no puntos ni insignias por sí mismos.
- **Los puntos, insignias, streaks y leaderboards tienen efectos reales pero pequeños, mixtos y frágiles.** El meta-análisis de referencia (Sailer & Homner, 2020, sobre 40 experimentos y 4.883 participantes) reporta efectos *pequeños*: cognitivos g=0.49 (IC 95% 0.30–0.69), motivacionales g=0.36 (IC 95% 0.18–0.54) y conductuales g=0.25 (IC 95% 0.04–0.46). Además pueden ser contraproducentes: la "ansiedad de streak" es una causa frecuente de abandono, y los leaderboards desmotivan a la mayoría que no gana. Deben usarse como andamiaje temporal, no como núcleo.
- **Recomendación central:** construir el core loop alrededor de VISIÓN→OBJETIVO→ETAPAS→MILESTONES→ACCIONES→EVIDENCIA→PROGRESO→LOGROS, con un "contribution graph de tu vida" y captura de evidencia como mecanismo distintivo, streaks "compasivos" (recovery, best streak, consistencia semanal) y feedback inmediato de progreso; evitando castigos, comparación social forzada y recompensas extrínsecas que erosionan la motivación intrínseca.

---

## 1. Executive Summary

La pregunta central —¿qué hace que alguien vuelva voluntariamente a registrar y continuar su progreso?— tiene una respuesta razonablemente clara en la literatura científica y en los patrones de producto observados: **las personas vuelven cuando la aplicación les devuelve, de forma inmediata y visible, la sensación de que avanzan en algo que ellas mismas eligieron y que les importa, y cuando esa acumulación de avances se convierte con el tiempo en evidencia tangible de "construí algo" y de "en quién me estoy convirtiendo".**

Los tres pilares con mayor respaldo son:

1. **El principio del progreso (Amabile & Kramer):** de todos los factores que elevan la motivación y las emociones positivas durante el día, el más potente es *hacer progreso en trabajo significativo*, incluso en pequeños pasos ("small wins"). Basado en el análisis de casi 12.000 entradas de diario aportadas por 238 empleados de 26 equipos de proyecto en 7 empresas de 3 industrias, recopiladas a lo largo de ~4 meses.
2. **Teoría de la autodeterminación (Deci & Ryan):** la motivación duradera (intrínseca e internalizada) requiere satisfacer autonomía, competencia y relación. Las recompensas extrínsecas mal diseñadas pueden *reducir* la motivación intrínseca (efecto de sobrejustificación; meta-análisis de Deci, Koestner & Ryan, 1999, 128 estudios).
3. **Auto-eficacia (Bandura):** la creencia "soy capaz" se construye sobre todo con *experiencias de dominio* (éxitos propios) y con submetas próximas, no distales.

La gamificación funciona, pero con matices críticos: los meta-análisis reportan efectos que van de pequeños (g≈0.25–0.49 en Sailer & Homner, 2020) a moderados-grandes (g≈0.82 en Li, Ma & Shi, 2023) con heterogeneidad altísima (I²>98% en algunos casos), fuertemente dependientes del diseño, la duración y el ajuste a las necesidades psicológicas. El "efecto novedad" es una hipótesis debatida (algunos estudios muestran que intervenciones cortas superan a las largas; otros, como Li et al. 2023, encuentran lo contrario). Los elementos más citados como causantes de efectos negativos son precisamente **insignias, leaderboards, competiciones y puntos** (revisión de mapeo sistemático de 87 estudios sobre efectos negativos en educación).

El diferenciador de producto más defendible frente a la competencia (Duolingo, Habitica, Finch, Notion, GitHub) es: (a) el **grafo de contribución de la vida** como representación visual de la constancia y la historia personal; (b) la **captura de evidencia** (foto, audio, documento, enlace, certificado) que convierte acciones en pruebas de dominio acumuladas —un "portafolio de tu vida"; y (c) un modelo de streaks y feedback **compasivo y orientado a la recuperación**, que evita la trampa perfeccionista que hace abandonar apps de hábitos.

---

## 2. Competitor Analysis

Nota metodológica: "Core loop", "Emotional design" y "Qué aprender" son **patrones observados en productos + hipótesis de diseño**, no evidencia científica.

| App | Categoría | Core loop | Feedback / Reward | Progreso | Streak | Social | Qué funciona | Qué es débil / NO copiar |
|---|---|---|---|---|---|---|---|---|
| **Duolingo** | Educación | Trigger→lección corta→XP/animación→streak↑→liga | XP, animaciones, sonido, cofres | Árbol de habilidades, corona, % | Streak con freeze + Streak Society; recuperación de pago | Ligas/leaderboards, streak como identidad | Reducir objetivo a "1 lección/día"; streak freeze; notificaciones personalizadas (sistema de bandits contextual) | Notificaciones que fabrican pánico/culpa; monetizar el miedo a perder el streak |
| **Habitica** | Hábitos RPG | Tarea→XP/oro→subir nivel→ítems→party quest | XP, oro, ítems, daño | Nivel de avatar, equipo | Dailies con daño de HP | Party: fallar daña a tus amigos | Accountability social; identidad de personaje; free | **Castigo (HP)** activa el "abstinence violation"; complejidad abruma; estética infantil no encaja en metas adultas; se abandona por novelty |
| **Finch** | Bienestar | Tarea de autocuidado→energía→mascota crece/aventura | Energía, piedras, cosméticos | Evolución de la mascota, sitios | **Sin castigo** por fallar | Amigos, árbol, apoyo | **Motivación externalizada compasiva**: cuidas al pájaro→te cuidas; sin vergüenza; widgets de presencia | Riesgo de fatiga por notificaciones/compras; algunos lo borran por "manipulación" |
| **GitHub** | Progreso/proyectos | Commit→cuadro verde→streak→historial | Grafo de contribución, verde | **Contribution graph** (heatmap anual) | Streak de commits (comunidad lo gamificó) | Perfil público, estrellas | Heatmap = "mejor interfaz de tracking jamás enviada"; evidencia real de trabajo | Optimizar el gráfico (commits vacíos, apps para "mantener el verde") en lugar del trabajo real |
| **Notion** | Productividad | Abrir→estructurar→escribir→enlazar | Ninguno intrínseco | Manual (bases de datos) | No | Compartir, plantillas | Flexibilidad, personalización total, autonomía | Sin feedback de progreso ni "victoria"; friction alta; página en blanco |
| **Streaks / Loop / Habitify** | Hábitos | Check-in→streak↑ | Marca, streak | Calendario, % completion | Streak clásico (reset a 0) | Mínimo | Check-in <10s; simplicidad | Streak all-or-nothing → ansiedad, "day 51 breaking point" |
| **Todoist / Things / TickTick** | Productividad | Capturar→completar→tachar | Karma (Todoist) | Listas, gráficos | TickTick tiene streaks | Compartir proyectos | Fricción baja, captura rápida | Completar ≠ progreso significativo; sin narrativa de objetivo mayor |
| **Strava** | Fitness social | Actividad→kudos→segmentos→ranking | Kudos, PRs, trofeos | Historial, gráficos | Rachas semanales | **Kudos, clubs, segmentos** | Reconocimiento social positivo (kudos) + comparación opcional | Comparación puede desmotivar a principiantes ("discouragement by peer excellence") |
| **Fabulous** | Bienestar | Rutina→completar→viaje narrado | Narrativa, celebraciones | "Journey" por etapas | Suave | — | Onboarding basado en ciencia del comportamiento; narrativa de viaje | Puede sentirse prescriptivo |
| **SuperBetter** | Salud mental gamificada | Quest→power-up→aliados | Puntos de resiliencia | Épica personal | — | **Aliados (cooperación)** | Marco cooperativo para conducta emocionalmente significativa | Evidencia de eficacia clínica modesta |

**Síntesis competitiva:** Duolingo domina la ejecución de streaks/hábito diario pero con mecánicas de presión que criticaríamos éticamente. Finch demuestra que la **motivación compasiva sin castigo** retiene a largo plazo a quienes las apps duras expulsan. GitHub aporta la metáfora visual más poderosa (heatmap + evidencia de trabajo real). Ninguno combina *objetivo de vida de largo plazo + etapas + evidencia + grafo de contribución + journaling*, que es el hueco que ocupa nuestra visión.

---

## 3. Psychological Principles (con nivel de evidencia)

Diferenciamos: **[EVIDENCIA]** (respaldo empírico sólido, replicado o meta-analítico), **[EVIDENCIA MIXTA]**, **[HIPÓTESIS DE DISEÑO]**, **[PATRÓN DE PRODUCTO]**.

1. **Principio del progreso / small wins [EVIDENCIA].** Amabile & Kramer (Harvard), análisis de casi 12.000 entradas de diario de 238 personas en 26 equipos de 7 empresas: el progreso en trabajo significativo es el factor diario más potente para la "vida interior de trabajo" (emoción, motivación, percepción). Implicación: la app debe hacer *visible el progreso diario* y enmarcarlo como significativo.

2. **Auto-determinación (autonomía, competencia, relación) [EVIDENCIA].** Deci & Ryan. La motivación se internaliza cuando el usuario siente "yo elegí esto" (autonomía), "estoy mejorando/soy capaz" (competencia) y conexión con otros (relación). Meta-análisis en educación muestran que la gamificación afecta más la motivación *extrínseca* que la intrínseca salvo que soporte estas necesidades psicológicas básicas.

3. **Auto-eficacia y submetas próximas [EVIDENCIA].** Bandura & Schunk (1981, *J. Personality and Social Psychology* 41(3):586–598): 40 niños de 7,3–10,1 años con "grandes déficits y desinterés en tareas matemáticas"; los que recibieron submetas próximas lograron mayor dominio, auto-eficacia e interés intrínseco, mientras que "las metas distales no tuvieron efectos demostrables". Las *experiencias de dominio* son la fuente más potente de auto-eficacia. Implicación: descomponer VISIÓN→ETAPAS→MILESTONES→ACCIONES no es cosmético; es el mecanismo psicológico central.

4. **Efecto goal-gradient y progreso dotado [EVIDENCIA].** Kivetz, Urminsky & Zheng (2006, *Journal of Marketing Research* 43(1):39–58): en tarjetas de café, los clientes aceleraban compras al acercarse a la meta (los tiempos entre compras caían ~20% cerca de la recompensa); una tarjeta de 12 sellos con 2 pre-rellenados se completaba en 12,7 días frente a 15,6 días con una de 10 vacía (casi 3 días / 20% más rápido, "endowed progress"). También documentaron el "post-reward reset": la energía cae tras cobrar la recompensa. Implicación: mostrar progreso granular hacia milestones, dar "arranque dotado", y **abrir nuevas metas antes de que se cierre la anterior** para evitar el bajón post-recompensa.

5. **Aversión a la pérdida y efecto dotación [EVIDENCIA para el sesgo; MIXTA aplicada a streaks].** Perder duele ~2x más que ganar lo equivalente. Los streaks explotan esto, pero el mismo mecanismo que engancha las primeras semanas causa abandono cuando se rompe.

6. **Efecto de sobrejustificación / crowding-out [EVIDENCIA con condiciones].** Deci, Koestner & Ryan (1999), meta-análisis de 128 estudios (94 artículos + 19 tesis): las recompensas tangibles esperadas socavan la motivación intrínseca de libre elección —contingentes al *engagement* d=−0.40, a la *finalización* d=−0.36 y al *desempeño* d=−0.28. El efecto es condicional: recompensas verbales/de desempeño informativas o inesperadas pueden no dañar o incluso reforzar. Implicación: cuidado con puntos/premios por actividades que el usuario ya hace por interés propio.

7. **Flow (Csikszentmihalyi) [EVIDENCIA para condiciones; HIPÓTESIS aplicada a la app].** El flow requiere balance reto-habilidad, metas claras y feedback inmediato. Implicación: la app puede crear *condiciones* de flow (metas claras, feedback inmediato, siguiente acción del tamaño adecuado) sin convertirse en videojuego.

8. **Futuro yo / continuidad del yo futuro [EVIDENCIA].** Hershfield (2011) y Ersner-Hershfield et al. (2009): mayor continuidad con el yo futuro predice menor descuento temporal y más ahorro; Rutchick et al. (2018) la asocia con más ejercicio. Implicación: visualizar "en quién te conviertes" puede aumentar la persistencia —siempre sin predicciones falsas.

9. **Escritura expresiva / journaling [EVIDENCIA MIXTA].** Meta-análisis de Smyth (1998) d≈0.47; pero Frisina et al. (2004) d≈0.19 en clínicos y Frattaroli (2006) d≈0.075 general; efecto nulo en varios RCT (p.ej., pacientes con cáncer). El journaling ayuda pero su efecto es pequeño y heterogéneo, y suele haber un aumento *inmediato* de malestar antes de beneficios a largo plazo. Implicación: journaling ligero, opcional y vinculado a evidencia/progreso, no diario obligatorio.

---

## 4. Scientific Evidence (qué está respaldado y con qué nivel)

**Dopamina — [EVIDENCIA con precisión necesaria].** La neurociencia (Schultz, 2016, *Nature Reviews Neuroscience*; Keiflin & Janak, 2015, *Neuron*; Gershman et al., 2024, *Nature Neuroscience*) sostiene que la dopamina codifica principalmente el **error de predicción de recompensa (RPE)**: la diferencia entre la recompensa esperada y la recibida. **No es "la molécula del placer"**; es una señal de aprendizaje y anticipación. Las neuronas dopaminérgicas se activan ante recompensas *inesperadas* y reducen su tasa ante omisiones esperadas. Advertencia obligatoria: es una simplificación decir "X libera dopamina y por eso te hace feliz". La aplicación honesta de esto: la sorpresa/novedad y la incertidumbre moderada en el feedback pueden reforzar el aprendizaje de un hábito, pero (a) sigue en debate si el RPE explica toda la actividad dopaminérgica (movimiento, motivación, planificación) y (b) explotar recompensas variables al estilo casino es éticamente problemático y roza el diseño adictivo.

**Gamificación (efecto global) — [EVIDENCIA MIXTA].** Hamari, Koivisto & Sarsa (2014, HICSS) "¿Funciona la gamificación?": sí, condicional. Sailer & Homner (2020, *Educational Psychology Review*, 40 experimentos, 4.883 participantes): efectos *positivos pero pequeños* —cognitivos g=0.49 (IC 95% 0.30–0.69, k=19), motivacionales g=0.36 (IC 95% 0.18–0.54, k=16), conductuales g=0.25 (IC 95% 0.04–0.46, k=9). En el otro extremo, Li, Ma & Shi (2023) reportan g≈0.82 en resultados de aprendizaje y, notablemente, encuentran que los despliegues más largos daban efectos *mayores* —contradiciendo la hipótesis del efecto novedad. La heterogeneidad entre meta-análisis (I² hasta 98,8%) es el hallazgo más robusto. Consenso: **puntos e insignias solos hacen poco; reto significativo, narrativa y autonomía impulsan las ganancias.**

**Streaks — [EVIDENCIA MIXTA / patrón de producto].** Duolingo mejoró su retención al día siguiente gracias a streaks y al streak freeze; el APM del equipo de retención descubrió que alcanzar un streak de 10 días reducía sustancialmente la probabilidad de abandono (advirtiendo explícitamente que gran parte era correlación/sesgo de selección). Pero múltiples fuentes de producto y una referencia recurrente a CHI 2020 señalan la "ansiedad de streak" como causa frecuente de abandono. **Nota de calidad:** cifras muy citadas como "63% más probabilidad de abandonar" o "+23% de retención por el streak freeze" circulan en literatura gris/blogs y **no pude verificarlas en la fuente primaria**; se reportan como afirmaciones de la industria, no como evidencia revisada por pares.

**Incentivos sociales (competencia vs. colaboración vs. apoyo) — [EVIDENCIA RCT sólida].** Patel et al., **STEP UP RCT** (*JAMA Internal Medicine*, 2019;179(12):1624–1632; N=602 adultos con sobrepeso/obesidad de 40 estados de EE.UU., 36 semanas): las tres ramas aumentaron la actividad durante la intervención, y **la competencia fue la más efectiva (+920 pasos/día vs. control; IC 95% 513–1328; P<.001)** frente a apoyo (+689; IC 95% 267–977) y colaboración (+637; IC 95% 258–1017). Crucialmente, en el seguimiento de 12 semanas *sin* gamificación, **solo la competencia siguió siendo significativa (+569 pasos/día; IC 95% 142–996; P=.009)**; apoyo (+428; P=.04) no superó el umbral ajustado por multiplicidad y colaboración (+126; P=.49) desapareció. El **iDiabetes RCT** (*JAMA Network Open*, 2021;4(5):e2110255) replicó a 1 año: competencia +606 (P=.003) y apoyo +503 (P=.01) significativos, colaboración no (+280; P=.16); la competencia declinó menos con el tiempo. **Matiz importante:** estos efectos se dan con metas concretas y grupos de 3 personas; el análisis secundario (Chen et al., *PLOS ONE* 2020) muestra que la competencia "no fue la mejor para todos" —hay fenotipos conductuales que solo responden a la competencia. Y todas las ramas *decaen* al retirar la gamificación: la mecánica es andamiaje, no cura.

**Competencia vs. cooperación (otros dominios) — [EVIDENCIA MIXTA; validez externa a flag].** Morschheuser, Hamari & Maedche (2019, *Computers in Human Behavior*): en un experimento de campo de crowdsourcing, la **competencia inter-equipos** (híbrido: cooperación intra-equipo + competencia entre equipos) generó mayor motivación intrínseca y contribución que la cooperación pura o la competencia pura. Dindar et al. (2021, *BJET*): no hubo diferencia significativa entre cooperación y competencia gamificadas en esfuerzo/logro, pero la cooperación produjo mayor relación social. Conclusión: la elección competencia/cooperación depende del *resultado psicológico buscado* y del perfil del usuario.

**Framing de pérdida — [EVIDENCIA RCT].** Patel et al. (*Annals of Internal Medicine*, 2016;164(6):385–394, N=281): incentivos enmarcados como *pérdida* fueron los más efectivos para alcanzar metas de pasos (diferencia 0.16 en proporción de días con meta; IC 95% 0.06–0.26; P=.001); el efecto desapareció en el seguimiento.

**Leaderboards / comparación social — [EVIDENCIA de daño].** Michinov & Michinov (2025, *J. Computing in Higher Education*): un leaderboard redujo el compromiso social de estudiantes, independientemente de su orientación competitiva inicial. Hanus & Fox (2015, *Computers & Education*): añadir insignias+leaderboards+monedas *redujo* la motivación intrínseca, la satisfacción y el rendimiento a lo largo del tiempo. Rogers & Feller: "discouragement by peer excellence" —ver a pares excelentes puede minar la motivación. Los leaderboards macro dañan a la mayoría que no gana.

**Personalización / player types — [EVIDENCIA MIXTA].** Hallifax et al. (adaptive gamification) y Orji, Tondello & Nacke (2018, CHI) mapean estrategias a tipos Hexad; la personalización tiende a superar el "one-size-fits-all" en intención y disfrute autorreportados, pero **no está garantizada** (un concepto personalizado mal ajustado puede fallar), y la evidencia sobre desempeño *objetivo* es mixta.

**Feedback inmediato vs. diferido — [EVIDENCIA MIXTA].** El feedback inmediato favorece la motivación, la corrección en tiempo real y (en varios estudios) la retención a largo plazo; el diferido puede favorecer la reflexión y la autorregulación. Para el *refuerzo motivacional tras completar una acción*, la evidencia apoya feedback inmediato de progreso.

---

## 5. Gamification Mechanics — ficha por elemento

Para cada uno: problema que resuelve · mecanismo psicológico · evidencia · cuándo funciona/falla · riesgo · uso propuesto.

**Barras de progreso / % completado [USAR].** Problema: hacer visible el avance. Mecanismo: goal-gradient + small wins. Evidencia: sólida (Kivetz). Falla: si la meta es vaga o el progreso es "busywork". Riesgo: post-reward reset. Uso: barras granulares por milestone, con arranque dotado. Nota "7/10 vs 70%": ambos son válidos; "7/10" comunica *pasos discretos alcanzables* (más cercano a submetas próximas de Bandura y más motivador en tareas contables), mientras "70%" comunica *proximidad continua a la meta* (activa mejor el goal-gradient cerca del final). **Hipótesis de diseño:** usar fracciones para acciones/milestones discretos y porcentaje para la barra de etapa global.

**Grafo de contribución / heatmap [USAR — diferenciador].** Mecanismo: constancia visible + identidad ("mira lo que he construido"). Evidencia: patrón de producto (GitHub) muy fuerte; alineado con small wins y auto-eficacia. Riesgo: presión de "mantener el verde", optimizar el gráfico en vez del trabajo. Uso: heatmap de acciones/evidencia de la vida, celebrando densidad y no solo consecutividad.

**Milestones / etapas [USAR — núcleo].** Mecanismo: submetas próximas (Bandura & Schunk) + goal-gradient. Evidencia: sólida. Uso: VISIÓN→OBJETIVO→ETAPAS→MILESTONES→ACCIONES.

**XP / puntos [USAR CON CAUTELA].** Mecanismo: feedback cuantificado. Evidencia: solos hacen poco; pueden crowd-out (d=−0.28 a −0.40). Riesgo: sobrejustificación. Uso: puntos ligados a *esfuerzo/consistencia* y no canjeables por premios extrínsecos; enfatizar información de competencia, no control.

**Insignias / logros [USAR CON CAUTELA].** Mecanismo: reconocimiento de competencia, hitos. Evidencia: efecto pequeño; funcionan mejor si son significativos y sorpresivos. Riesgo: inflación y trivialización. Uso: logros que marquen dominio real y momentos de evidencia ("primera entrevista en inglés grabada").

**Streaks [USAR REDISEÑADO].** Mecanismo: aversión a la pérdida + consistencia. Evidencia: engancha corto plazo, causa abandono si es rígido. Uso: **streak compasivo** — best streak que nunca se borra, freeze/grace days, consistencia semanal/mensual, "momentum" y "recovery" en vez de reset a 0.

**Niveles [OPCIONAL].** Mecanismo: progresión. Riesgo: arbitrariedad. Uso: niveles ligados a etapas reales del objetivo, no abstractos.

**Leaderboards [EVITAR por defecto].** Ver §6.

**Recompensas variables [EVITAR / usar con ética].** Mecanismo: RPE/novedad. Riesgo: diseño adictivo, crowd-out. Uso: como mucho, *variedad de celebración* (no premios aleatorios tipo casino).

**Avatares / narrativa [OPCIONAL].** Mecanismo: identidad, relación. Evidencia: la "game fiction" no mejoró significativamente los resultados en el meta-análisis de Sailer & Homner. Uso: narrativa personal del propio objetivo ("tu historia"), no fantasía impuesta.

**Personalización / customización [USAR — diferenciador].** Mecanismo: autonomía (SDT) + ajuste a player type. Evidencia: la personalización tiende a superar el "one-size-fits-all", pero no está garantizada. Uso: dejar elegir objetivos, categorías, métricas, colores, visualizaciones.

**Celebraciones [USAR].** Mecanismo: emoción positiva del progreso. Uso: micro-celebración inmediata tras completar acción/evidencia.

---

## 6. Mechanics To Avoid

1. **Streak all-or-nothing con reset a 0.** Causa el "abstinence violation effect" ("ya lo arruiné, para qué sigo") y es una causa frecuente de abandono. Un solo día perdido no afecta materialmente la formación de hábitos (Lally et al., 2010, UCL).
2. **Castigo / pérdida de vida (estilo Habitica HP).** Activa autocrítica y vergüenza; expulsa justo a quienes ya son duros consigo mismos.
3. **Leaderboards globales / comparación forzada.** Desmotivan a la mayoría que no gana; reducen el compromiso social (Michinov & Michinov 2025); pueden bajar rendimiento e intrínseca (Hanus & Fox 2015). Si hay competencia, que sea **opcional, entre pares similares o inter-equipos**, y elegida por el usuario.
4. **Recompensas extrínsecas tangibles por conductas intrínsecamente motivadas.** Riesgo de crowding-out (Deci et al. 1999).
5. **Notificaciones que fabrican pánico/culpa** (estilo "tu streak morirá"). Éticamente cuestionable y erosiona la relación a largo plazo.
6. **Monetizar el miedo a perder** (recuperar streak de pago).
7. **Complejidad excesiva** (trampa Habitica) y **página en blanco** (trampa Notion): ambas aumentan fricción y abandono temprano.
8. **Recompensas variables tipo casino:** rozan el patrón oscuro.

---

## 7. Core Loop Proposal

**Loop diario (micro):**
Trigger (interno: "quiero avanzar en mi objetivo" / externo suave) → Abrir app → **Ver mi progreso y mi siguiente acción clara** (condición de flow) → Elegir/registrar una acción → **Adjuntar evidencia** (opcional: foto/audio/enlace/nota) → **Feedback inmediato de progreso** (barra del milestone sube, cuadro del heatmap se llena, micro-celebración) → Ver cómo esto acerca el milestone/etapa → Reflexión ligera opcional (journal de 1 línea) → Planear siguiente acción → Salir con sensación de "avancé hoy".

**Loop de medio plazo (semanal/mensual):**
Revisión de consistencia (heatmap, best streak, completion semanal) → Cierre/celebración de milestone → **Apertura del siguiente milestone antes de cerrar el anterior** (anti post-reward reset de Kivetz) → Actualización de "en quién me estoy convirtiendo" (futuro yo).

**Loop de largo plazo (identidad):**
Acumulación de evidencia → "Portafolio de tu vida" / timeline → Narrativa "realmente construí algo" → Refuerzo de auto-eficacia (experiencias de dominio) e identidad → Fijar nuevo objetivo/visión.

La **inversión** (en el sentido de Eyal, usada éticamente) es la evidencia y la historia que el usuario acumula: cuanto más registra, más valioso y personal se vuelve su archivo, y más razones tiene para volver —sin necesidad de manipular.

---

## 8. Retention Model

- **Activación (día 0–7):** onboarding que convierte UNA visión en objetivo→primer milestone→primera acción en <5 min (reducir a "una acción hoy", estilo Duolingo). Arranque dotado (endowed progress) en la primera barra. Primera captura de evidencia como "aha moment".
- **Hábito temprano (semana 1–6):** feedback inmediato de progreso, streak compasivo + consistencia semanal, recordatorios personalizados y respetuosos. Combatir el posible efecto novedad con *profundidad de significado* (no más mecánicas), recordando el "porqué" del objetivo.
- **Retención media (mes 2–6):** cierre de milestones con celebración, apertura anticipada del siguiente, revisión mensual de progreso, evidencia acumulada visible. Introducir capa social **opcional** (apoyo/accountability, no competencia forzada).
- **Retención larga (6+ meses):** el "realmente construí algo" — timeline/portafolio, comparación con el yo pasado (no con otros), proyección de futuro yo. La retención pasa de mecánica a *identidad*.

Métrica norte: no "días de streak" sino **% de milestones activos con progreso en los últimos 14 días** y **evidencias capturadas por objetivo**.

---

## 9. Emotional Design

Diseñar para un espectro de emociones, no solo "felicidad":
- **Accomplishment / logro:** micro-celebración inmediata + cierre de milestone.
- **Competence / capacidad:** feedback que informa dominio ("lo lograste"), no que controla.
- **Autonomy / autonomía:** el usuario elige objetivo, ruta, métricas, ritmo.
- **Progress / progreso:** heatmap + barras + timeline.
- **Anticipation / anticipación:** siguiente milestone visible; futuro yo.
- **Curiosity / curiosidad:** desbloqueo de siguiente etapa; variedad sana.
- **Pride / orgullo:** portafolio de evidencia ("mira lo que construí").
- **Hope / esperanza:** "si continúas con este ritmo…" (proyección honesta, con rango, sin promesas falsas).
- **Belonging / pertenencia:** apoyo social opcional, celebración de otros.
- **Satisfaction / satisfacción:** revisión semanal/mensual, sensación de cierre.

Referencia emocional clave: Finch demuestra que la **calidez y la ausencia de castigo** retienen a largo plazo mejor que la presión.

---

## 10. Product Principles (máx. 10)

1. **El progreso propio es el producto.** Todo debe devolver la sensación "avancé" y, con el tiempo, "construí algo".
2. **Autonomía primero:** el usuario elige el objetivo y la ruta; nunca imponemos metas ajenas.
3. **Competencia sobre puntos:** el feedback informa capacidad y dominio, no premia por premiar.
4. **Evidencia > actividad:** convertir acciones en pruebas tangibles es el corazón diferenciador.
5. **Compasión sobre castigo:** nunca borramos progreso ni avergonzamos; recuperación siempre posible.
6. **Constancia sobre perfección:** medimos consistencia y momentum, no rachas frágiles.
7. **Significado sobre mecánica:** combatimos el efecto novedad con propósito, no con más gamificación.
8. **Social opcional y de apoyo:** accountability y celebración por defecto; competencia solo si el usuario la elige.
9. **Honestidad sobre proyecciones:** mostramos tendencias con rango, nunca predicciones falsas.
10. **Ética antes que enganche:** sin patrones oscuros, sin fabricar ansiedad, sin monetizar el miedo.

---

## 11. Proposed Feature Set (priorizada)

**P0 (núcleo):**
- Estructura VISIÓN→OBJETIVO→ETAPAS→MILESTONES→ACCIONES.
- Registro rápido de acción (<15s) + captura de evidencia (foto/audio/enlace/texto/certificado).
- Feedback inmediato de progreso (barra de milestone + micro-celebración).
- Grafo de contribución de la vida (heatmap).
- Progreso por milestone con arranque dotado.
- Journal de 1 línea opcional ligado a la acción.

**P1:**
- Streak compasivo: best streak, freeze/grace, consistencia semanal/mensual, momentum, recovery.
- Revisión semanal/mensual (dashboard de progreso).
- Personalización (categorías, colores, métricas, visualizaciones).
- Timeline / portafolio de evidencia ("realmente construí algo").
- Logros significativos ligados a dominio.

**P2:**
- Capa social opcional: apoyo/accountability con pares, celebración de hitos, reacciones (no leaderboards por defecto).
- Futuro yo: proyección honesta "si mantienes este ritmo…".
- Plantillas de objetivos (aprender inglés, primer empleo, maratón, ahorrar para casa, escribir un libro, etc.).
- Notificaciones personalizadas y respetuosas.

**P3 / Future:**
- Competencia/colaboración opt-in entre pares similares o inter-equipos (basado en STEP UP: la competencia funciona y es más duradera, pero debe ser opcional y para quien la elija; considerar el híbrido inter-equipos de Morschheuser et al.).
- Insights de patrones personales.
- Integraciones (calendario, wearables, GitHub real, etc.).

---

## 12. MVP (qué construir primero)

**Objetivo del MVP:** validar que el loop "acción→evidencia→progreso visible→sensación de avance" hace volver a la gente.

Construir solo P0:
1. Crear UN objetivo con la cadena visión→milestones→acciones.
2. Registrar acciones con evidencia.
3. Barra de progreso por milestone + heatmap de contribución.
4. Micro-celebración y feedback inmediato.
5. Revisión simple ("esta semana avanzaste en X").

**Métricas de éxito del MVP:** retención D7/D30; nº de acciones con evidencia por usuario; % de usuarios que cierran ≥1 milestone en 30 días; sensación autoreportada de "estoy avanzando".

**Umbral que cambiaría la estrategia:** si la captura de evidencia NO incrementa la retención frente a solo-acciones, reducir su peso y fricción. Si la retención D30 no supera a un tracker simple, el problema es el *significado del objetivo*, no las mecánicas → reforzar onboarding de "porqué". Si el social opt-in (P2) no mejora retención en cohortes que lo activan, no invertir en competencia.

---

## 13. Future Features

- Social opt-in (apoyo primero; luego competencia/colaboración inter-equipos para quien la elija).
- Futuro yo y proyecciones honestas (con rango e incertidumbre).
- Recomendación de "siguiente acción del tamaño adecuado" (condiciones de flow adaptativas: balance reto-habilidad).
- Comunidad por tipo de objetivo.
- IA que ayude a descomponer una visión difusa en milestones accionables.

---

## 14. Risks

**Psicológicos:**
- Ansiedad de streak y perfeccionismo → mitigado con streaks compasivos.
- Sobrejustificación (crowd-out, d=−0.28 a −0.40) si abusamos de recompensas extrínsecas.
- Comparación social dañina ("discouragement by peer excellence") → social de apoyo por defecto.
- Presión de "mantener el verde" (como en GitHub) → celebrar densidad y recuperación, no solo consecutividad.
- Dependencia de recompensas externas → enfatizar competencia/autonomía/significado.

**UX / producto:**
- Complejidad (trampa Habitica) vs. página en blanco (trampa Notion): el onboarding debe equilibrar estructura y simplicidad.
- Fricción en captura de evidencia → hacerla opcional y ultrarrápida.
- Efecto novedad: la retención puede caer a las 3–6 semanas → profundidad de significado, no más mecánicas.
- Fatiga de notificaciones.

**De negocio / ético:**
- Tentación de usar patrones oscuros para métricas de engagement → contradice los principios y daña la confianza.
- Generalidad ("para cualquier objetivo") puede diluir el foco → plantillas por caso de uso.
- Proyecciones de futuro yo mal calibradas = promesas falsas → mostrar rangos e incertidumbre.
- Toda la evidencia RCT muestra que los efectos *decaen al retirar la mecánica*: el valor real debe residir en la utilidad y el significado, no solo en el juego.

---

## 15. Sources

**Académicas (evidencia):**
- Amabile, T., & Kramer, S. (2011). *The Progress Principle*. Harvard Business Review Press. / Amabile & Kramer (2011), "The Power of Small Wins", *Harvard Business Review*. https://hbr.org/2011/05/the-power-of-small-wins
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627–668. https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf
- Ryan, R. M., & Deci, E. L. — Self-Determination Theory. https://selfdeterminationtheory.org/
- Bandura, A., & Schunk, D. H. (1981). Cultivating competence, self-efficacy, and intrinsic interest through proximal self-motivation. *Journal of Personality and Social Psychology*, 41(3), 586–598.
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The Goal-Gradient Hypothesis Resurrected. *Journal of Marketing Research*, 43(1), 39–58. https://www.columbia.edu/~rk566/Session4/Goal-Gradient_Illusionary_Goal_Progress.pdf
- Tang, S.-H., & Hall, V. C. (1995). The overjustification effect: A meta-analysis. *Applied Cognitive Psychology*.
- Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*.
- Hershfield, H. E. (2011). Future self-continuity. *Annals of the NY Academy of Sciences*. https://www.researchgate.net/publication/51738840 / Ersner-Hershfield et al. (2009), *Judgment and Decision Making*. https://www-apache.anderson.ucla.edu/faculty_pages/hal.hershfield/resources/Research/2009-Ersner-Hershfield.pdf / Rutchick et al. (2018), *J. Exp. Psychology: Applied*.
- Schultz, W. (2016). Dopamine reward prediction-error signalling: a two-component response. *Nature Reviews Neuroscience*, 17. / Keiflin & Janak (2015), *Neuron* 88(2):247–263. https://www.sciencedirect.com/science/article/pii/S089662731500731X / Gershman et al. (2024), *Nature Neuroscience* 27:1645–1655.
- Sailer, M., & Homner, L. (2020). The Gamification of Learning: a Meta-analysis. *Educational Psychology Review*. https://link.springer.com/article/10.1007/s10648-019-09498-w
- Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does Gamification Work? *HICSS*.
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom. *Computers & Education*. https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000
- Michinov, N., & Michinov, E. (2025). More competition, less interaction: gamifying lectures using a leaderboard reduces female students' social engagement. *Journal of Computing in Higher Education*. https://link.springer.com/article/10.1007/s12528-025-09438-4
- Toda et al. / Systematic mapping (2023). Negative Effects of Gamification in Education Software. https://arxiv.org/pdf/2305.08346
- Smyth (1998); Frisina et al. (2004); Frattaroli (2006); Baikie & Wilhelm (2005), *Advances in Psychiatric Treatment* — journaling/escritura expresiva. https://www.cambridge.org/core/journals/advances-in-psychiatric-treatment/article/emotional-and-physical-health-benefits-of-expressive-writing/ED2976A61F5DE56B46F07A1CE9EA9F9F
- Lally et al. (2010) — formación de hábitos (UCL).
- Patel, M. S., et al. (2019). STEP UP RCT. *JAMA Internal Medicine*, 179(12), 1624–1632. https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761
- Patel, M. S., et al. (2021). iDiabetes RCT. *JAMA Network Open*, 4(5), e2110255. https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2780065
- Patel, M. S., et al. (2016). Framing Financial Incentives. *Annals of Internal Medicine*, 164(6), 385–394. https://www.acpjournals.org/doi/10.7326/m15-1635
- Chen, X. S., et al. (2020). Behavioral phenotypes, STEP UP secondary analysis. *PLOS ONE*, 15(10):e0239288. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0239288
- Morschheuser, Hamari & Maedche (2019). Cooperation or competition. *Computers in Human Behavior*. https://www.sciencedirect.com/science/article/abs/pii/S1071581918305822
- Dindar et al. (2021). *British Journal of Educational Technology*. https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.12977
- Orji, Tondello & Nacke (2018). Personalizing persuasive strategies to gamification user types. *CHI*. / Hallifax et al. — adaptive gamification.
- Li, Ma & Shi (2023) — meta-análisis de gamificación en educación superior (g≈0.82). https://journals.sagepub.com/doi/10.1177/21582440261421375

**Producto (patrones observados):**
- GitHub contribution graph; estudio sobre gamificación en desarrolladores (arXiv 2006.02371). Duolingo (streaks/freeze, ligas; Lenny's Newsletter "How Duolingo reignited user growth"). Habitica (RPG/HP). Finch (self-care pet; Deconstructor of Fun). Strava (kudos). Notion; Streaks/Loop/Habitify; SuperBetter.
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products* (Hook Model) — usado con criterio ético.

---

*Nota final: conforme al encargo, este documento NO implementa nada. Presenta la investigación y la propuesta de producto. Una segunda fase convertirá esto en Product Specification → UX Flows → Features → Design System → Implementation Plan. Se ha diferenciado de forma explícita EVIDENCIA CIENTÍFICA (respaldo empírico), EVIDENCIA MIXTA, HIPÓTESIS DE DISEÑO y PATRONES DE PRODUCTO; las cifras de streaks no verificadas en fuente primaria (p. ej. "63%", "+23%") se han marcado como afirmaciones de la industria y no como evidencia revisada por pares.*