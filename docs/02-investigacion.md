# Fase 2 — Investigación: hábito, motivación, gamificación y diseño ético

Criterio: se priorizan meta-análisis, revisiones y experimentos. Cada conclusión se etiqueta como
**[E] Evidencia**, **[H] Hipótesis razonable** o **[M] Mito / marketing**.

## 1. Lo que dice la evidencia

| Tema | Hallazgo | Nivel | Implicación para Bitácora |
|---|---|---|---|
| Monitorizar el progreso | Meta-análisis de 138 experimentos (N≈20.000): las intervenciones que aumentan la monitorización del progreso mejoran el logro de metas (d = 0,40); el efecto es mayor cuando el progreso **se registra físicamente** o se hace visible [1] | E | El registro de actividad **es** la intervención. El núcleo del producto es registrar y ver progreso, no los adornos |
| Progreso en trabajo significativo | Estudio de ~12.000 entradas de diario de trabajadores del conocimiento: avanzar en trabajo significativo, aunque sea poco, es el principal predictor de los "mejores días" [2] | E (diario, correlacional) | Mostrar pequeños avances ("+1 actividad", "72% → 74%") y el historial acumulado |
| Formación de hábitos | Automaticidad media en 66 días (rango 18–254); **saltarse un día no afectó** de forma relevante la formación del hábito [3]. La repetición en un contexto estable es lo que crea el hábito [4] | E | Rachas **indulgentes**: el indicador principal es "días activos esta semana" frente a una meta; la racha estricta se muestra sin castigo |
| Rachas | 7 estudios: resaltar una racha intacta aumenta la conducta; resaltar una rota la reduce, sobre todo si el usuario se atribuye la ruptura; el efecto se atenúa si la racha puede "repararse" [5] | E | No mostrar "perdiste tu racha". Registrar actividad pasada ("ayer hice…") repara el día legítimamente. Mostrar la mejor racha como récord, no como pérdida |
| Metas | Metas específicas y desafiantes + retroalimentación superan a "haz lo mejor que puedas" [6]. Intenciones de implementación ("cuándo/dónde") d = 0,65 [7] | E | Meta semanal de días activos elegida por el usuario; "siguiente acción" concreta |
| Efecto "nuevo comienzo" | Hitos temporales (lunes, inicio de mes) aumentan conductas aspiracionales [8] | E | Revisión semanal el lunes: cierre de la semana anterior y arranque limpio |
| Reflexión | 15 min de reflexión escrita al final del día mejoraron el rendimiento un 23% en un experimento de campo; 10 estudios, N = 4.340 [9] | E | Cierre del día opcional y breve ("¿qué salió bien?") |
| Recompensas y motivación intrínseca | Meta-análisis de 128 experimentos: recompensas tangibles y esperadas **reducen** la motivación intrínseca; la retroalimentación verbal positiva e **informativa** la aumenta [10]. Teoría de la autodeterminación: autonomía, competencia y relación [11] | E | Feedback informativo ("proyecto 74%") en vez de premios arbitrarios. Autonomía: nada obligatorio, el usuario decide sus metas |
| Gamificación | Revisión: efectos positivos pero dependientes del contexto y del diseño [12]. Meta-análisis en aprendizaje: efectos pequeños (cognitivo g = 0,49; motivacional g = 0,36; conductual g = 0,25), menos estables en motivación y conducta [13]. Insignias y gráficos de rendimiento satisfacen la necesidad de competencia [14] | E | Gamificación moderada: barras de progreso, hitos, récords y logros informativos. **Sin** XP ni niveles arbitrarios |
| Gradiente de meta | El esfuerzo aumenta al acercarse a la meta [15] | E | Barras de progreso de proyecto e hitos visibles |
| Notificaciones | Agrupar notificaciones 3 veces al día mejoró atención, ánimo y control; suprimirlas del todo aumentó la ansiedad/FoMO [16]. Las notificaciones aumentan la inatención [17] | E | Resúmenes agrupados (diario/semanal) controlados por el usuario; cero notificaciones promocionales |
| Sentido de agencia | Funciones como el scroll infinito y el autoplay reducen la sensación de control y el uso significativo [18] | E | Historial paginado ("Cargar más"), sin autoplay ni feeds infinitos |
| Patrones oscuros | Taxonomías de patrones oscuros (acoso, obstrucción, interferencia, etc.) y su prevalencia [19] | E | Lista de prohibiciones explícita en el diseño |
| Informática personal | Modelo por etapas: preparación → recolección → integración → reflexión → acción; los problemas en una etapa se propagan [20]. El abandono y el retorno son normales [21] | E | El *core loop* sigue estas etapas; volver tras días sin uso no se castiga |
| Tiempos de respuesta | 0,1 s se percibe instantáneo; 1 s mantiene el flujo [22] | E | Guardar localmente primero (<16 ms) y sincronizar después |
| Color | La psicología del color tiene evidencia limitada y dependiente del contexto; el rojo en tareas de logro puede asociarse a evitación [23] | E (limitada) | El color se usa para **jerarquía y estado**, no para "generar emociones". Nada rojo para trabajo incompleto |
| Polaridad | Texto oscuro sobre fondo claro mejora la lectura en condiciones normales [24]; el modo oscuro es preferencia y útil con poca luz | E | Tema del sistema por defecto, con claro y oscuro |
| Estética | Lo percibido como bello se percibe como más usable [25] | E | Pulido visual como parte de la usabilidad, no como adorno |
| Carga cognitiva | La memoria de trabajo es limitada; más opciones = más tiempo de decisión [26] | E | Hoy muestra 4 bloques; una sola acción recomendada |
| Retroalimentación háptica | Mejora el rendimiento en pantallas táctiles [27] | E | Vibración breve y opcional al completar (Android) |

## 2. Hipótesis razonables (no demostradas para este caso)

- **[H]** Reducir el tiempo hasta la primera actividad (<60 s) aumenta la activación y la retención del día 1. Es un principio de la industria sin evidencia experimental pública para esta categoría de producto.
- **[H]** Un "modo prueba sin cuenta" reduce el abandono en el registro; se mide con eventos internos.
- **[H]** Detectar el proyecto y el tipo de actividad a partir del texto reduce la fricción sin quitar control, si la detección es visible y editable.
- **[H]** Mostrar patrones propios ("sueles registrar a las 19:00") aumenta la autoconciencia y la reflexión (se apoya en [1] y [20], sin prueba directa).
- **[H]** Los sonidos de confirmación ayudan a algunos usuarios pero molestan a otros: van desactivados por defecto.
- **[H]** Un único color de acento sobre neutros transmite profesionalidad (patrón observado en Linear, GitHub, Stripe y Apple; no es evidencia causal).

## 3. Mitos y marketing

- **[M] "Más dopamina = mejor app".** La dopamina codifica el **error de predicción** de la recompensa y la motivación ("querer"), no el placer ni el bienestar [28, 29]. Maximizar "dosis" es un objetivo de uso compulsivo, no de valor.
- **[M] "21 días para crear un hábito".** Sin base; los datos reales muestran 18–254 días [3].
- **[M] "El verde calma, el naranja activa, el rojo urge…" como regla universal.** La evidencia no respalda asociaciones color-emoción generalizables para diseñar productividad [23].
- **[M] Recompensas variables (tipo tragamonedas) como "buena práctica de engagement".** Producen persistencia conductual, pero es el mecanismo de los juegos de azar: se descarta por ético.
- **[M] "Las rachas estrictas siempre funcionan".** Funcionan mientras están intactas; al romperse desmotivan [5].

## 4. Principios extraídos de productos de referencia (sin copiar diseño)

| Referencia | Principio |
|---|---|
| GitHub | El historial acumulado (mapa de contribuciones, *feed*) como prueba visible de trabajo |
| Linear | Velocidad percibida, atajos de teclado, neutros con un acento, densidad moderada |
| Notion | Captura sin estructura previa; la estructura aparece después |
| Todoist | Captura rápida con lenguaje natural ("mañana", "#proyecto") |
| Apple | Jerarquía tipográfica clara, tipografía del sistema, respeto por las preferencias del sistema |
| Stripe | Precisión en cifras, colores semánticos contenidos, gráficos simples |
| Duolingo | Metas diarias y feedback inmediato; **evitar** su uso de la culpa en notificaciones |
| Arc | Personalidad visual sutil sin sacrificar funcionalidad |

## 5. Prohibiciones de diseño (derivadas de [16–19])

Sin culpa ("¡vas a perder tu racha!"), sin castigos, sin miedo artificial, sin notificaciones promocionales, sin recompensas variables, sin interrupciones, sin scroll infinito, sin ocultar cómo se calculan racha, progreso y recomendaciones (hay una sección "Cómo funciona").

## Referencias

1. Harkin, B., Webb, T. L., Chang, B. P. I., et al. (2016). Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence. *Psychological Bulletin, 142*(2), 198–229. https://pubmed.ncbi.nlm.nih.gov/26479070/
2. Amabile, T. M., & Kramer, S. J. (2011). *The Progress Principle*. Harvard Business Review Press.
3. Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *European Journal of Social Psychology, 40*(6), 998–1009. https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674
4. Gardner, B., Lally, P., & Wardle, J. (2012). Making health habitual. *British Journal of General Practice, 62*(605), 664–666.
5. Silverman, J., & Barasch, A. (2023). On or off track: How (broken) streaks affect consumer decisions. *Journal of Consumer Research, 49*(6), 1095–1117. https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414
6. Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation. *American Psychologist, 57*(9), 705–717.
7. Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis. *Advances in Experimental Social Psychology, 38*, 69–119.
8. Dai, H., Milkman, K. L., & Riis, J. (2014). The fresh start effect. *Management Science, 60*(10), 2563–2582.
9. Di Stefano, G., Gino, F., Pisano, G. P., & Staats, B. R. (2014/2016). Learning by thinking: How reflection aids performance. HBS Working Paper 14-093. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2414478
10. Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin, 125*(6), 627–668.
11. Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation. *American Psychologist, 55*(1), 68–78.
12. Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does gamification work? A literature review of empirical studies on gamification. *HICSS 2014*, 3025–3034.
13. Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77–112. https://eric.ed.gov/?id=EJ1245270
14. Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). How gamification motivates. *Computers in Human Behavior, 69*, 371–380.
15. Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research, 43*(1), 39–58.
16. Fitz, N., Kushlev, K., Jagannathan, R., Lewis, T., Paliwal, D., & Ariely, D. (2019). Batching smartphone notifications can improve well-being. *Computers in Human Behavior, 101*, 84–94. https://www.sciencedirect.com/science/article/abs/pii/S0747563219302596
17. Kushlev, K., Proulx, J., & Dunn, E. W. (2016). "Silence your phones": Smartphone notifications increase inattention and hyperactivity symptoms. *CHI 2016*.
18. Lukoff, K., Lyngs, U., Zade, H., et al. (2021). How the design of YouTube influences user sense of agency. *CHI 2021*. · Lukoff, K., et al. (2018). What makes smartphone use meaningful or meaningless? *IMWUT, 2*(1).
19. Gray, C. M., Kou, Y., Battles, B., Hoggatt, J., & Toombs, A. L. (2018). The dark (patterns) side of UX design. *CHI 2018*. · Mathur, A., et al. (2019). Dark patterns at scale. *CSCW 2019*.
20. Li, I., Dey, A., & Forlizzi, J. (2010). A stage-based model of personal informatics systems. *CHI 2010*.
21. Epstein, D. A., Ping, A., Fogarty, J., & Munson, S. A. (2015). A lived informatics model of personal informatics. *UbiComp 2015*.
22. Card, S. K., Robertson, G. G., & Mackinlay, J. D. (1991). The information visualizer. *CHI 1991* · Miller, R. B. (1968). Response time in man-computer conversational transactions.
23. Elliot, A. J., & Maier, M. A. (2014). Color psychology: Effects of perceiving color on psychological functioning in humans. *Annual Review of Psychology, 65*, 95–120. · Elliot, A. J., et al. (2007). Color and psychological functioning. *JEP: General, 136*(1), 154–168.
24. Piepenbrock, C., Mayr, S., Mund, I., & Buchner, A. (2013). Positive display polarity is advantageous for both younger and older adults. *Ergonomics, 56*(7), 1116–1124.
25. Tractinsky, N., Katz, A. S., & Ikar, D. (2000). What is beautiful is usable. *Interacting with Computers, 13*(2), 127–145.
26. Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science, 12*(2), 257–285. · Hick, W. E. (1952). On the rate of gain of information.
27. Hoggan, E., Brewster, S. A., & Johnston, J. (2008). Investigating the effectiveness of tactile feedback for mobile touchscreens. *CHI 2008*.
28. Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science, 275*(5306), 1593–1599.
29. Berridge, K. C., & Robinson, T. E. (1998). What is the role of dopamine in reward: hedonic impact, reward learning, or incentive salience? *Brain Research Reviews, 28*(3), 309–369.
