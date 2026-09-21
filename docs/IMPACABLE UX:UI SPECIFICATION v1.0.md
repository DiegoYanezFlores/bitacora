# IMPACABLE UX/UI SPECIFICATION v1.0

> Fuente de verdad de experiencia para la fase de implementación.
> Deriva de: **Impacable Product Blueprint v1.0** (`docs/IMPACABLE_PRODUCT_BLUEPRINT.md`).
> **Estado del proyecto actual:** esta especificación se escribió *sin acceso al código*. Lo que ya existe, qué se reutiliza y qué se rediseña debe determinarse en la **Fase 0 (auditoría)** descrita en la sección 34. Donde diga "pendiente de auditoría", no se asume nada.
> Criterio central: el usuario mira la app y piensa **"Estoy avanzando"**; meses después, **"Realmente construí algo"**.

---

## 1. Design Philosophy

**Metáfora rectora: sedimentación.** Impacable no es un tablero de tareas; es un lugar donde el trabajo se *deposita en capas* y con el tiempo se vuelve un terreno visible. Cada acción añade una capa fina; cada hito, una capa sólida. Esto guía la visualización (densidad acumulada, no marcadores de falta), el tono (calma, claridad) y la retención (el valor se acumula).

**Cuatro reglas de diseño**
1. **Cada elemento justifica su existencia** respondiendo a una de cuatro preguntas: ¿qué decisión ayuda a tomar?, ¿qué información ayuda a comprender?, ¿qué acción facilita?, ¿qué emoción refuerza? Si no responde ninguna, se elimina.
2. **Una cosa importa ahora.** Cada pantalla tiene un foco primario evidente; lo demás es secundario o terciario.
3. **Avance ≠ actividad** (Blueprint). La interfaz separa siempre *Avance* (hitos) de *Constancia* (ritmo).
4. **Calma sobre estímulo.** Pocos colores, movimiento con significado, celebraciones proporcionales. Nada infantil, nada de videojuego.

**Sensaciones objetivo:** claridad, construcción, competencia, continuidad, identidad, curiosidad, satisfacción.
**Tono de voz:** directo, cálido, sobrio; segunda persona del singular; nunca culpa ni urgencia.

---

## 2. Information Architecture

Decisión basada en el Blueprint: el producto tiene tres momentos (**hacer**, **ver lo construido**, **reflexionar**). La navegación se limita a lo esencial; estadísticas y logros no son destinos independientes.

```
Inicio            (foco actual + lo construido + siguiente paso)
Objetivos         (lista → detalle: etapas, hitos, acciones, evidencia)
Historia          (Actividad · Timeline · Evidencia · Logros · Reflexiones)
Recaps            (semanal · mensual · anual)
Tú                (perfil, visión, ajustes, notificaciones, exportar)
```

**Por qué no hay "Estadísticas" ni "Diario" ni "Logros" como destinos primarios**
- *Estadísticas*: se integran en el detalle del objetivo y en Historia > Actividad. Una pantalla de números aislada invita a mirar métricas sin contexto (riesgo de obsesión).
- *Diario*: la reflexión está conectada a acciones, hitos y decisiones; vive como pestaña "Reflexiones" en Historia, y como campo contextual al registrar/cerrar.
- *Logros*: son pocos y significativos; pestaña de Historia + aparecen en timeline.

**Objetos y jerarquía:** Visión → Objetivo → Etapa → Hito → Acción → Evidencia (según Blueprint §4). Progreso y Logros son derivados.

**Regla de profundidad:** desde Inicio, cualquier dato se alcanza en máximo 2 toques/clics. Acción rápida: 1.

---

## 3. Navigation

| Breakpoint | Patrón | Detalle |
|---|---|---|
| **Desktop ≥1440** | Sidebar fija expandida (240 px) | Logo, 5 destinos, botón **+ Registrar** destacado, "Tú" al pie. Contenido centrado con ancho máximo |
| **Laptop 1024–1439** | Sidebar colapsable (rail de 72 px por defecto si el ancho < 1200) | Iconos + tooltip; se expande al hover/fijar |
| **Tablet 640–1023** | Rail de iconos (72 px) o barra superior + drawer | Orientación horizontal: rail; vertical: barra inferior |
| **Mobile <640** | **Bottom navigation** de 4 destinos + botón central **+** | Inicio · Objetivos · **+** · Historia · Tú. Recaps se accede desde Tú y desde notificaciones |

**Acción global "Registrar" (Quick Add):** siempre disponible. Desktop: botón en sidebar y atajo de teclado `N` (o `/`). Mobile: botón central de la barra inferior, alcanzable con el pulgar.
**Estados:** destino activo con indicador claro (no solo color); breadcrumbs solo dentro de Objetivos (Objetivo › Etapa › Hito).
**Atajos (desktop):** `N` registrar, `G` luego `I/O/H/R` navegar, `?` ayuda de atajos.

---

## 4. Dashboard (Inicio)

**Función:** responder en segundos: ¿qué construyo?, ¿en qué trabajo?, ¿cuánto avancé?, ¿qué hice?, ¿qué puedo hacer ahora?, ¿qué conseguí?
**Historia que cuenta:** *"Esto es lo que estás construyendo → esto es lo que importa ahora → mira lo que ya has depositado → esto es lo reciente."*

**Jerarquía (desktop, 12 columnas, contenido centrado):**

```
┌────────────────────────────────────────────────────────────────────┐
│ [Saludo breve + fecha]                                    [+ Registrar]│  ← PRIMARY
├────────────────────────────────────────────────────────────────────┤
│  HERO · FOCO ACTUAL  (8 col)                    │  RITMO (4 col)     │  ← PRIMARY
│  Objetivo › Etapa                               │  Constancia: 5/8   │
│  Hito actual + criterios (2 de 5)               │  semanas activas   │
│  Progreso segmentado + "63% · 3 de 5 hitos"     │  Momentum: word +  │
│  [Siguiente acción sugerida]  [Registrar otra]  │  sparkline         │
├────────────────────────────────────────────────────────────────────┤
│  LO QUE HAS CONSTRUIDO  · Contribution Graph 12 meses (12 col)        │  ← SECONDARY
│  "87 días activos · 21 semanas activas · 4 hitos"                     │
├───────────────────────────────┬────────────────────────────────────┤
│  RECIENTE (6 col)             │  EVIDENCIA Y LOGROS (6 col)          │  ← SECONDARY
│  últimas 3–5 acciones         │  última evidencia destacada +        │
│                               │  último logro                        │
└───────────────────────────────┴────────────────────────────────────┘
```

**Reglas**
- **Un solo botón primario visible** (la siguiente acción sugerida); Registrar es secundario pero omnipresente.
- **Máximo 5 bloques** por pantalla. Cero tarjetas decorativas ni "10 métricas".
- Si hay varios objetivos activos: el Hero muestra el **foco** (el que el usuario fija o el de mayor actividad reciente); los demás aparecen como fila compacta "Otros objetivos" (título + barra fina).
- **Tablet:** Hero a ancho completo, Ritmo bajo el Hero, grafo con scroll horizontal o rango de 6 meses, Reciente y Evidencia apiladas o en 2 columnas.
- **Mobile:** una sola columna: Hero (con CTA fija), Ritmo en fila horizontal compacta, grafo de 3–6 meses, Reciente, Evidencia.
- **Estado vacío / regreso tras inactividad:** ver §15 y §19.

---

## 5. Goals (Objetivos)

### Crear objetivo (extremadamente fácil)
- **Paso mínimo:** un único campo: *"¿Qué quieres construir?"* + chips de plantillas (Aprender un idioma, Conseguir empleo, Terminar una carrera, Escribir un libro, Correr un maratón, Crear una empresa, Otro).
- Todo lo demás (descripción, categoría, fecha, prioridad, visión) es **opcional y posterior**, mediante "Añadir detalles" en el detalle del objetivo.
- Con plantilla: se propone una estructura de etapas y hitos **editable**, jamás obligatoria.

### Configuración (campos)
| Campo | Obligatorio | Nota |
|---|---|---|
| Nombre | Sí | |
| Porqué / visión | No | Una o dos frases; se muestra en el Hero como línea secundaria |
| Categoría | No | Color e icono personalizables |
| Fecha objetivo | No | Solo para ritmo de referencia, sin alertas rojas |
| Prioridad | No | Solo para elegir el foco del dashboard (Foco / Activo / Pausado) |
| Etapas / hitos | No | Se construyen con ayuda (plantilla, sugerencias) |

### Vista del objetivo (pantalla)
**Encabezado (GoalHeader):** nombre, visión en una línea, estado (Activo/Pausado/Cerrado), **progreso segmentado por etapas**, ritmo (Constancia y Momentum).
**Cuerpo (pestañas o secciones):** *Camino* (etapas → hitos), *Actividad* (acciones), *Evidencia*, *Historia* (timeline del objetivo), *Estadísticas* (2–4 métricas con contexto).
**Acciones:** Registrar acción, Añadir hito, Editar, Pausar, Cerrar objetivo (con reflexión), Archivar.
**Regla:** nunca eliminar por accidente; pausar/archivar/cerrar preservan historial (Blueprint §11).

---

## 6. Stages (Etapas)

**Qué son:** los "capítulos" del objetivo; funcionan como los *niveles reales* (Blueprint §10).
**Ejemplo:** Aprender inglés → *Fundamentos · Conversación · Escritura · Preparación TOEFL*.

**Presentación:** lista vertical de **StageCard** en la pestaña Camino, o "carriles" horizontales en desktop ancho.
Cada etapa muestra: nombre, **barra segmentada por hitos**, texto "2 de 4 hitos", evidencia asociada (miniaturas), estado (Pendiente / En curso / Completada).
**Etapa en curso:** expandida por defecto; las demás colapsadas para reducir densidad.
**Creación:** botón "Añadir etapa" en línea; reordenar por arrastre (desktop) o menú (mobile).
**Ajuste:** una etapa puede omitirse o marcarse como "no aplica" sin afectar el cálculo (los pesos se recalculan).

---

## 7. Milestones (Hitos)

**Debe sentirse distinto de una tarea:** *"Llegué a un punto importante."*

**Diferenciación visual**
- Icono propio: **rombo** (◆), lenguaje distinto al check circular de las acciones.
- Tarjeta con mayor peso visual y espacio; contiene **criterios de finalización**, no notas sueltas.
- Color de acento propio (ámbar "brasa") reservado para hitos y logros reales.

**Creación (ligera):** título + 2–5 criterios (líneas de texto) + peso opcional S/M/L (por defecto M) + evidencia esperada (opcional) + fecha (opcional). El sistema sugiere criterios a partir de la plantilla.
**Progreso:** anillo/segmentos según criterios cumplidos: "2 de 5".
**Completar (flujo "Cerrar hito"):**
1. El último criterio se marca (o "Cerrar hito" manual con confirmación).
2. Hoja/panel: *"¡Llegaste aquí!"* con resumen (fecha, acciones, tiempo).
3. **Invitación a evidencia** (no obligatoria): "¿Qué te gustaría guardar de este momento?".
4. Reflexión de una línea (opcional): "¿Qué aprendiste?".
5. Celebración nivel 2 (§13).
6. **Siguiente hito sugerido** ya abierto (evita el bajón post-recompensa).
**Aparición en timeline:** siempre, con rombo y evidencia.
**Impacto en progreso global:** según peso; el cambio se anima en la barra del objetivo.

---

## 8. Actions (Acciones)

**Objetivo:** abrir → registrar → feedback → continuar, en menos de 15 segundos.

**Quick Add (hoja inferior en mobile; panel/modal ligero o paleta en desktop)**
- Campo principal: *"¿Qué hiciste?"* (una línea).
- **Chip de hito** preseleccionado (el hito actual del foco); tocable para cambiar. Si no hay hito: "Sin hito" con aviso suave.
- Opcionales, colapsados ("Más"): duración, evidencia (+), nota, etiquetas, fecha (por defecto hoy; permite registrar días anteriores), repetición ("hacer esto cada semana").
- **Enter** guarda. Después de guardar: la hoja se cierra o muestra "Registrar otra".

**Feedback inmediato (nivel 0):** check con transición sutil, el cuadro del día se ilumina (si el gráfico está visible), mensaje breve informativo ("Sesión 12 · Hito Conversación: criterio 3 de 5 en progreso").
**Lista de acciones (ActionItem):** una línea con texto, hito, hora, indicador de evidencia; se agrupan por día.
**Edición:** tocar la acción abre panel lateral/hoja con todos los campos; deshacer visible por 8 segundos tras guardar.
**Anti-formulario:** el formulario largo no existe; los campos avanzados son revelado progresivo.

---

## 9. Evidence (Evidencia)

**Principio:** diferenciar visualmente **ACTIVIDAD** de **EVIDENCIA DE RESULTADO** (Blueprint §6).

| | Actividad | Evidencia de resultado |
|---|---|---|
| Qué es | Lo que hice | Lo que puedo mostrar |
| Icono | Punto/check | Sello/ancla (📎-like) con tipo |
| Ubicación | Lista de acciones | Portafolio, hitos, timeline |
| Peso visual | Ligero | Medio-alto (miniatura/vista previa) |

**Añadir evidencia:** botón "+ Evidencia" en acción y en hito. Selector por tipo: Foto, Archivo, Enlace, Nota/Reflexión, Certificado, Resultado/Métrica, Captura, Commit (enlace). Arrastrar y soltar en desktop; cámara/galería en mobile.
**Nivel de respaldo** (0–3, Blueprint §6): indicador discreto por elemento (por ejemplo, 1 a 3 marcas). Tooltip: "Con artefacto", "Verificable externamente".
**EvidenceCard:** miniatura o icono de tipo, título, fecha, hito/objetivo asociado, nivel. Vista ampliada con contexto ("Guardaste esto al cerrar el hito X").
**Portafolio (Historia > Evidencia):** cuadrícula filtrable (por objetivo, tipo, año). Es el "portafolio de tu vida".
**Privacidad:** privada por defecto; indicador de candado; compartir es explícito.
**Cero presión:** nunca se muestra "te falta evidencia". Se muestra logro cuando existe: "60% de tus hitos con evidencia".

---

## 10. Progress (Progreso)

**Jerarquía:** progreso global → etapa → hito → acción.

| Nivel | Visualización | Texto de contexto |
|---|---|---|
| Objetivo | **Barra segmentada por etapas** (o anillo en compactos) + porcentaje ponderado | "63% · 2 etapas de 4 · 9 de 14 hitos" |
| Etapa | **Segmentos = hitos** | "3 de 5 hitos" |
| Hito | **Segmentos = criterios** | "2 de 5 criterios" |
| Acción | Sin porcentaje | Registro de actividad (alimenta Constancia) |

**Reglas**
- **Nunca un porcentaje solo.** Siempre acompañado de una fracción y de un contexto ("63% — te faltan 2 hitos para cerrar Conversación").
- Fracciones para lo discreto; porcentaje para lo agregado (Blueprint §5).
- **Constancia** (semanas activas) y **Momentum** se muestran *aparte* del Avance, con otro estilo visual (puntos/pills vs. barra) para no confundirlos.
- **Indicador de respaldo:** "9 de 14 hitos con evidencia" en el detalle, no en el Hero.
- **Ritmo de referencia** (si hay fecha): línea fina bajo la barra ("a este ritmo: cierre estimado entre X y Y"), color neutro, con tooltip explicando que es solo una referencia.
- **Animación del cambio:** la barra transiciona (400 ms) desde el valor anterior; el delta se comunica en texto ("+1 hito").

---

## 11. Contribution Graph

**Pregunta que responde:** *"¿Cuánto he estado construyendo?"* / *"¿Qué he construido durante este período?"*

**Estructura:** cuadrícula de semanas (columnas) × días (filas L–D o D–S según locale); meses etiquetados arriba.
**Escala temporal (selector):** **Semana** (7 celdas grandes con detalle), **Mes**, **12 meses** (por defecto), **Año** (selector de año), **Todo** (filas por año, densidad reducida).

**Celda**
- Desktop: 12–14 px con 3 px de separación; mobile: 10–12 px, con scroll horizontal fluido hasta hoy, o rango por defecto de 26 semanas.
- **Intensidad (5 niveles)** según *significancia* (Blueprint §7): 0 = sin actividad (superficie neutra), 1–4 = escala de un solo tono (cobalto) con pasos claramente distinguibles.
- **Marcadores:** ◆ (ámbar) = hito cerrado; punto = evidencia agregada; guion (–) = día de descanso intencional; borde marcado = hoy.
- **Estados:** vacío, con actividad, con hito, descanso, futuro (más tenue), **pausa** (banda continua para períodos ≥7 días sin actividad, con etiqueta "Pausa" en el eje).

**Día sin actividad — diseño explícito**
- **Neutro**, nunca rojo, tachado ni con "X". Es "espacio sin construir", no un fallo.
- En el tooltip: "Sin actividad" (sin mensaje moral). Opción "Marcar como descanso".
- Los huecos largos se muestran como *pausa* y desde ahí la app ofrece retomar (§15).
- No hay contador de racha en el gráfico ni junto a él.

**Interacción**
- **Hover/focus (desktop):** tooltip con fecha, nº de acciones, hitos/evidencias ese día, objetivos involucrados.
- **Clic/tap:** abre el **Panel del día** (lateral en desktop, hoja inferior en mobile) con acciones, evidencias, reflexiones y botón "Añadir a este día".
- **Teclado:** flechas navegan celdas, Enter abre el día, Esc cierra.
- **Filtros:** por objetivo (color), por etapa, "solo hitos", "con evidencia". Leyenda siempre visible.
- **Resumen textual arriba** (sustituto accesible y narrativo): *"87 días activos · 21 semanas activas · 4 hitos · 36 evidencias"*.
- **Relación con objetivos/hitos/evidencia:** filtrar por objetivo recolorea; el marcador ◆ enlaza al hito; el punto enlaza a la evidencia.
- **Vista semanal opcional** (una celda por semana) para quien prefiere no medir por día (Blueprint §7).

**Fuera de alcance:** puntuaciones, comparación con otros, "mejor día".

---

## 12. Timeline

**Sensación:** una historia, no un log técnico.

**Estructura:** línea vertical central (mobile: lateral izquierda). **Capítulos** por objetivo/etapa con encabezados narrativos automáticos ("Marzo · Empezaste la etapa Conversación").
**Tipos de evento (jerarquía visual):**
| Evento | Peso | Representación |
|---|---|---|
| Objetivo creado / completado | Alto | Marcador grande, título de capítulo |
| Etapa completada | Alto | Marcador ancho |
| Hito completado | Alto | ◆ ámbar + evidencia asociada |
| Logro | Medio-alto | Sello con nombre |
| Evidencia añadida | Medio | Tarjeta con miniatura |
| Reflexión destacada | Medio | Cita breve |
| Cambio de rumbo (pausa, pivote, reinicio) | Medio | Marca neutral con texto |
| Acciones repetitivas | Bajo | **Colapsadas**: "12 sesiones de práctica en marzo" (expandible) |

**Filtros:** por objetivo, tipo de evento, rango temporal; "solo lo destacado" (por defecto).
**Tono en pausas:** "Pausa · 21 días" con el rastro de lo anterior; sin tono negativo. Al retomar: "Volviste."
**Compartir un capítulo:** V2, privado por defecto.

---

## 13. Achievements (Logros)

**Ubicación:** Historia > Logros; aparecen también en el timeline y en el bloque "Evidencia y logros" del dashboard.
**Principio:** pocos, significativos, anclados a evidencia (Blueprint §9).

| Tipo | Ejemplo | Presentación | ¿Celebración? |
|---|---|---|---|
| **Real** | Primera certificación | Tarjeta grande con evidencia adjunta | Sí (nivel 2–4) |
| **Progreso** | 50% de una etapa | Tarjeta mediana | Sí, suave (nivel 1–2) |
| **Constancia** | 10 días activos este mes | Frase descriptiva, sin trofeo | No (aparece en recap) |
| **Recuperación** | Volviste tras 21 días | Tarjeta con tono cálido | Sí, suave |
| **Exploratorio** | Probaste una estrategia | — | V2 |

**Pantalla:** rejilla limitada, orden cronológico inverso; cada logro con "por qué lo conseguiste" (evidencia, fecha, hito). **No** hay lista de "logros bloqueados" ni contadores tipo "12/87". **Logros personales:** el usuario puede crear los suyos.
**Anti-ruido:** máximo un logro nuevo anunciado por sesión (los demás se acumulan en el recap).

---

## 14. Streak / Momentum

**Decisión (Blueprint §10):** no hay *streak diario*. Existen dos indicadores separados:

**Constancia (continuidad semanal)**
- Visual: **fila de 8 pills** (últimas 8 semanas); relleno = semana activa (≥N días activos, N elegido por el usuario; por defecto 2); vacía = neutro.
- Texto: "Semanas activas: 5 de 8".
- **Mejor histórico:** "Tu mejor racha: 9 semanas" (dato *mostrado*, pero jamás se pierde ni compara).
- No hay reseteo dramático; una semana vacía simplemente no se rellena.

**Momentum (tendencia reciente)**
- Basado en 28 días vs. tu propio ritmo.
- Visual: **palabra + minigráfico** ("Retomando", "Constante", "Acelerando") con flecha sutil. Sin rojo ni advertencia.
- Tooltip: "Compara tus últimas 4 semanas con tu ritmo habitual."

**Ambos existen** porque responden a preguntas distintas (¿mantengo continuidad? / ¿voy en subida o bajada?). Ninguno tiene sonido, animación de pérdida ni notificación de amenaza.
**Presencia:** en el bloque "Ritmo" del dashboard y en el detalle del objetivo; no en la barra superior.

---

## 15. Recovery (Regreso)

**Disparador:** el usuario abre la app tras **≥7 días** sin actividad (o ≥14 según ajuste).

**Pantalla de bienvenida (una sola vez por regreso; descartable):**
1. **"Bienvenido de vuelta."** (tono cálido, sin mención de racha ni tiempo perdido).
2. **"Esto fue lo que construiste antes de parar."** Tarjeta con 3 datos (acciones totales, hitos cerrados, última evidencia) y mini vista del gráfico.
3. **Un solo paso pequeño sugerido** ("Tu siguiente paso: 5 minutos de práctica") con botón principal **"Continuar"**.
4. Alternativas discretas: **"Ajustar mi objetivo"**, **"Pausar por ahora"**.
5. Tras la primera acción de regreso: celebración suave + **logro de recuperación** ("Volviste después de N días").

**En el resto de la app:** el gráfico muestra la pausa como banda neutra; el Hero no cambia a tono de alerta; sin recordatorios de "te atrasaste".
**Otros casos:** falla un día (sin mensaje), falla varios (momentum suave baja), abandona (pausar/archivar/cerrar con reflexión), cambia de objetivo (pivote que conserva historial), completó antes (ajustar próximo hito). Ver Blueprint §11.

---

## 16. Journal (Reflexiones)

**No es un diario en blanco.** Es **reflexión conectada**.

**Tipos de entrada:** Aprendizaje · Decisión · Obstáculo · Reflexión libre · Cierre de hito.
**Puntos de entrada (contextuales):**
- Al guardar una acción: campo opcional de 1 línea ("¿Qué aprendiste?").
- Al cerrar un hito/etapa/objetivo: prompt contextual.
- Desde el detalle de un objetivo: "Añadir reflexión".
- Desde Historia > Reflexiones: entrada libre.

**Prompts** cambian según contexto y son opcionales ("¿Qué fue lo más difícil de este hito?", "¿Qué decisión tomaste y por qué?").
**Vista (Historia > Reflexiones):** lista cronológica de citas con el objetivo/hito/evidencia relacionada; búsqueda; filtro por tipo; **"Aprendizajes destacados"** (favoritos que alimentan los recaps).
**Privacidad:** privado por defecto; edición y exportación.
**Meta:** construir una narrativa personal ("por qué lo hice, cómo cambié").

---

## 17. Recaps

**Formato:** secuencia vertical de tarjetas (como historia narrativa) con **serif** para los titulares y **contenido visual** (miniaturas de evidencia, mini gráfico). Cada recap responde: **¿Qué hice? · ¿Qué avancé? · ¿Qué conseguí? · ¿Qué aprendí? · ¿Qué sigue?**

**Semanal — "Esto construiste esta semana"**
1. Frase-resumen (narrativa, no números fríos).
2. Lo hecho (acciones destacadas) y evidencia.
3. Avance (hitos/criterios movidos).
4. Conseguido (logros, si los hubo).
5. Aprendí (cita de reflexión).
6. Sigue: una sugerencia y una pregunta reflexiva.
*Semana baja:* mensaje neutro y cálido, sin comparaciones.

**Mensual — "Esto cambió este mes"**
Comparación **con el mes anterior propio**, hitos movidos, evidencia principal, cambio de momentum, un aprendizaje, propuesta de foco.

**Anual — "Esto construiste durante el año"**
Capítulos por objetivo, galería de evidencia, gráfico anual, hitos, retornos tras pausas, antes/después (primera y última evidencia), cierre reflexivo. Es el **momento emocional máximo**.

**Entrega:** notificación opcional (semanal por defecto); accesible siempre desde Recaps. **Exportable** como imagen/PDF (V2).

---

## 18. Onboarding

**Meta:** de "no tengo nada" a "ya estoy construyendo mi primer objetivo" en **3 pasos y <2 minutos**.

| Paso | Pantalla | Contenido | Feedback |
|---|---|---|---|
| **1. Visión → Objetivo** | "¿Qué quieres construir?" | Un campo + chips de plantillas. Texto de apoyo: "Puedes cambiarlo después." | Se muestra el objetivo como GoalHeader en vacío |
| **2. Primera acción** | "¿Cuál es el primer paso?" | Sugerencia editable según plantilla ("Definir mi nivel actual"). Campo único | — |
| **3. Hacerlo y verlo** | "Hazlo y regístralo" | Botón "Lo hice"; se ilumina el **primer cuadro** del gráfico y aparece el hito inicial sugerido | Micro-celebración nivel 0 + "Ya empezaste a construir" |

**Después (revelado progresivo, no bloqueante):** tarjeta en el dashboard: *"¿Convertimos esto en etapas?"* con estructura sugerida (plantilla), en 1–2 toques, y la opción "más tarde".
**Ideas:** **progreso dotado**: el primer hito ya empieza con 1 criterio cumplido ("Definiste tu objetivo").
**Notificaciones:** se piden **después** de la primera acción, con explicación y control de frecuencia.
**Saltar:** todo paso es saltable.
**Cuentas/permisos:** sin muros previos.

---

## 19. Empty States

Cada estado vacío explica **qué es**, **por qué importa**, **qué hacer** y ofrece **una acción clara**.

| Pantalla | Texto guía (ejemplo) | Acción |
|---|---|---|
| Inicio sin objetivo | "Aquí verás lo que estás construyendo. Empieza con una idea: aprender algo, terminar algo, crear algo." | **Crear mi primer objetivo** |
| Objetivo sin etapas | "Un objetivo grande se vuelve alcanzable por etapas. ¿Empezamos con una estructura sugerida?" | **Usar plantilla** · Añadir manualmente |
| Etapa sin hitos | "Los hitos marcan puntos importantes del camino." | **Añadir un hito** |
| Hito sin acciones | "Cada acción que registres acerca este hito." | **Registrar la primera acción** |
| Sin evidencia | "La evidencia convierte lo que hiciste en algo que puedes mostrar." | **Añadir evidencia** |
| Contribution graph vacío | "Cada día que construyes deja una marca aquí." | **Registrar hoy** |
| Timeline vacío | "Tu historia empieza con el primer paso." | **Crear objetivo** |
| Logros vacío | "Tus primeros logros aparecerán cuando cierres un hito." | **Ver mi hito actual** |
| Reflexiones vacías | "Anotar qué aprendiste vuelve visibles tus decisiones." | **Escribir una reflexión** |
| Recaps sin datos | "Tu primer resumen semanal aparecerá tras tus primeras acciones." | — |
| Búsqueda sin resultados | "No encontramos coincidencias." | Limpiar filtros |
| Error genérico | "No pudimos cargar esto. Tu información está a salvo." | **Reintentar** |

---

## 20. Responsive Strategy

**Problema a resolver (según brief):** contenido pegado a la izquierda en desktop, distribución pobre. La solución no es `width: 100%`, sino **layout con contenedores y sistema de grid** definido por breakpoint.

### Breakpoints
| Nombre | Rango | Uso |
|---|---|---|
| `xs` | <640 | Mobile |
| `sm/md` | 640–1023 | Tablet |
| `lg` | 1024–1439 | Laptop |
| `xl` | ≥1440 | Desktop |

### Estructura de la app shell
```
[ Sidebar fija ] [ Región principal fluida ]
                  └── Contenedor: max-width 1200 (xl: hasta 1320), margin-inline: auto,
                      padding-inline: 24 (lg/xl) · 20 (md) · 16 (xs)
```
- El **contenido nunca se alinea a la izquierda por defecto**: el contenedor se centra en la región principal.
- Pantallas de lectura (Recaps, Journal, detalle de hito): **ancho de lectura 720 px** centrado.
- Pantallas de datos (Dashboard, Historia): contenedor amplio con grid.

### Grid
| Breakpoint | Columnas | Gutter | Comportamiento |
|---|---|---|---|
| xs | 4 | 12 | Una columna, tarjetas apiladas |
| md | 8 | 16 | 2 columnas para secundarios |
| lg | 12 | 20–24 | Hero 8 + Ritmo 4 |
| xl | 12 | 24 | Igual que lg con más aire y un panel de detalle contextual opcional |

### Por elemento
| Elemento | Desktop/Laptop | Tablet | Mobile |
|---|---|---|---|
| Navegación | Sidebar 240 / rail 72 | Rail o barra | Bottom nav + botón + |
| Cards | Padding 20–24, radio 16 | 16–20 | 16, ancho completo |
| Columnas | 2–3 | 1–2 | 1 |
| Tipografía | Escala completa | Escala −0 | Titulares −1 paso, cuerpo 16 px mínimo |
| Contribution graph | 12 meses completos | 6–12 meses | 26 semanas con scroll suave o vista mensual |
| Timeline | Línea central, eventos alternados o a la derecha | Línea lateral | Línea izquierda, tarjetas a ancho completo |
| Modales | Diálogo centrado (≤560) o panel lateral (≤480) | Panel lateral/hoja | **Bottom sheet** (drag handle) |
| Formularios | Inline, 2 columnas si aplica | 1 columna | 1 columna, campos grandes |
| Charts | Con leyenda lateral | Leyenda inferior | Simplificados, con resumen textual |
| Spacing | Escala base 4/8 con más aire | Reducido | Compacto pero táctil |

**Densidad:** desktop = *cómoda-media*; mobile = *compacta pero táctil* (zona táctil ≥44 px).
**Orientación:** en tablet horizontal se prefiere el layout de laptop en 8 columnas.
**Verificación:** cada pantalla debe validarse en 4 anchos (390, 768, 1280, 1728) y en 1920/2560 para asegurar que no se estire ni se pegue a la izquierda.

### 20.1 Desktop
- **Max-width** del contenido: 1200 (1320 en pantallas ≥1728).
- **Contenido centrado** en la región principal (junto a sidebar fija).
- **Columnas:** Hero 8/4; secundarios 6/6.
- **Paneles contextuales:** el detalle del día o hito se abre como **panel lateral derecho (420 px)** sin abandonar la vista.
- **Densidad:** aire generoso; sin cajas vacías.
- Debe sentirse como una app profesional de escritorio: atajos, foco visible, hover states, paneles.

### 20.2 Mobile (mobile-first en Quick Add, Inicio y Timeline)
- **Desaparece:** columnas laterales, tooltips (se convierten en toques), sidebar.
- **Se reorganiza:** Hero arriba con CTA fijo; Ritmo en fila; gráfico reducido.
- **Bottom sheets:** Quick Add, panel del día, cierre de hito, filtros, selector de evidencia.
- **Navegación inferior:** 4 destinos + botón **+** central; alcance con el pulgar.
- **Menú:** Recaps, ajustes y perfil bajo "Tú".
- **Una mano:** acciones primarias en la mitad inferior; confirmaciones cerca del pulgar.

---

## 21. Visual Design System

**Concepto:** *"papel cálido + tinta + una sola voz de color"*. Sobrio, claro, con un acento reservado para hitos.

### Color (conceptual; validar contraste al implementar)
| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| Fondo | `#FAF8F4` (papel) | `#12141A` | Fondo de app |
| Superficie | `#FFFFFF` | `#1B1E26` | Tarjetas |
| Superficie alta | `#F3F0EA` | `#242832` | Paneles, celdas vacías |
| Texto primario | `#14171F` | `#F2F1EE` | |
| Texto secundario | `#555B6B` | `#A9AEBB` | |
| Borde | `#E4E0D8` | `#2E323D` | |
| **Primario (Construcción)** | `#3A56D4` | `#7C93F0` | Acción, progreso, gráfico |
| Escala del gráfico (5) | `#EEF0FA → #C9D2F3 → #93A5E8 → #5F7ADB → #3A56D4` | Inversa | Intensidad de actividad |
| **Acento (Brasa)** | `#E39A2D` | `#F0B45A` | Hitos ◆, logros reales |
| Éxito | `#2F8F6B` | `#5CC79D` | Completado |
| Aviso | `#B7791F` | `#E0A94A` | Precaución suave |
| Error | `#C24141` | `#F08080` | Errores reales (no inactividad) |
| Info | `#2F6FA8` | `#7FB2E5` | |

**Reglas de color:** el rojo **nunca** representa inactividad. El acento ámbar se reserva a hitos y logros reales (para que signifique "importante"). No más de un tono de color + neutros + acento en una pantalla.

### Tipografía
- **UI:** sans humanista legible (p. ej., Inter/Manrope/Instrument Sans), con **números tabulares** en progreso y estadísticas.
- **Narrativa** (recaps, títulos de capítulo, cierre de hitos): serif de lectura (p. ej., Source Serif / Fraunces).
- **Escala** (base 16, razón ~1.25): 12 · 14 · 16 · 18 · 20 · 24 · 32 · 44.
- **Jerarquía:** Display (44) recaps/celebraciones · H1 (32) título de pantalla · H2 (24) sección · H3 (18–20) tarjeta · Body (16) · Small (14) · Caption (12, uso limitado).
- **Interlineado:** 1.5 cuerpo, 1.2–1.3 títulos.

### Espaciado
Base **4 px**. Escala: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64. Separación entre bloques de dashboard: 24–32; dentro de tarjetas: 16–24.

### Bordes, radios, sombras
- **Bordes:** 1 px, color sutil; preferir borde a sombra.
- **Radios:** 6 (controles pequeños) · 10 (botones/inputs) · 16 (tarjetas) · 999 (pills, avatar).
- **Sombras (3):** *sm* (hover), *md* (paneles), *lg* (modales/hojas); muy suaves, con tinte cálido.

### Iconografía
Iconos de línea (1.5 px), esquinas redondeadas, consistentes. Símbolos propios: **◆ hito** (ámbar), **sello** evidencia, **check** acción, **semilla/capa** para creación de objetivos. Nunca solo icono: acompañados de texto o tooltip cuando sea ambiguo.

### Estados semánticos
| Estado | Tratamiento |
|---|---|
| Neutral | Superficie alta + texto secundario |
| Active | Primario, borde y fondo tintado suave |
| Completed | Verde éxito + check; en hitos, ámbar + ◆ relleno |
| Success | Verde + icono |
| Warning | Ámbar suave + icono (nunca para inactividad) |
| Error | Rojo + icono + texto |
| Info | Azul + icono |
| Paused | Gris cálido + icono de pausa |

---

## 22. Design Tokens (conceptual)

```
color.bg.app | surface | surface-raised | overlay
color.text.primary | secondary | muted | on-primary | on-accent
color.border.default | strong | focus
color.brand.primary.{50..900}
color.accent.milestone.{light..dark}
color.state.success | warning | error | info | paused
color.viz.activity.{0..4}     # escala del gráfico
color.viz.rest | pause | today

space.{1..16}                 # 4, 8, 12, 16, 20, 24, 32, 48, 64
radius.sm | md | lg | pill    # 6, 10, 16, 999
shadow.sm | md | lg

font.family.ui | narrative
font.size.{xs..display}       # 12…44
font.weight.regular | medium | semibold
line.height.tight | normal | relaxed

motion.duration.instant 80 | fast 120 | base 200 | slow 400 | celebrate 800–1200
motion.easing.standard | decelerate | accelerate | emphasized
motion.reduced                # alternativa sin movimiento

bp.xs 0 | md 640 | lg 1024 | xl 1440 | xxl 1728
layout.sidebar.expanded 240 | rail 72
layout.container.max 1200 | wide 1320 | reading 720
layout.gutter.{xs..xl}

z.base | sticky | sidebar | overlay | modal | toast
touch.min 44
```
Los tokens deben existir en **claro y oscuro** desde el inicio (modo oscuro V1.5, pero tokens listos).

---

## 23. Microinteractions

**Principio:** el movimiento comunica *estado*, no decora. Duración corta, easing natural, siempre respetando `prefers-reduced-motion`.

| Momento | Interacción | Duración | Comunica |
|---|---|---|---|
| Hover (desktop) | Elevación sutil/borde, cursor | 120 ms | Elemento interactivo |
| Focus | Anillo de 2 px alto contraste | instantáneo | Dónde estoy |
| Press | Escala 0.98 / oscurecer | 80 ms | Recibí tu acción |
| Completar acción | Check dibuja trazo + cuadro del día se ilumina | 250–400 ms | "Hecho, cuenta" |
| Criterio cumplido | Tachado suave + segmento se llena | 300 ms | Progreso real |
| Cerrar hito | Rombo se "asienta", hoja de resumen | 800–1200 ms | Punto importante |
| Loading | Skeletons con la forma del contenido; spinner solo <1 s de espera | — | Estructura en camino |
| Success | Toast breve, texto claro | 3 s | Confirmación |
| Error | Mensaje en línea + acción de reintento; **sin sacudidas** | — | Qué pasó, cómo resolverlo |
| Transición de vista | Fundido/traslación corta | 200 ms | Continuidad |
| Barra de progreso | Interpola desde valor previo | 400 ms | El avance ocurrió |
| Drag & drop | Elevación + hueco indicativo | — | Reordenar etapas/hitos/criterios |
| Deshacer | Snackbar con "Deshacer" | 8 s | Control sobre errores |

**Prohibido:** animaciones continuas, confetti en acciones rutinarias, rebotes largos, notificaciones que parpadean.

---

## 24. Accessibility

- **Contraste:** WCAG 2.1 AA mínimo (4.5:1 texto, 3:1 componentes/gráficos); verificar escala del gráfico en ambos temas.
- **No depender solo del color:** intensidad del gráfico + patrón/etiquetas; estados con icono y texto; ◆ y símbolos además del color ámbar.
- **Teclado:** todo operable; orden lógico; atajos documentados y **desactivables**; el gráfico navegable con flechas.
- **Foco visible:** anillo de 2 px con contraste; no eliminar `outline`.
- **Lectores de pantalla:** landmarks (`nav`, `main`), encabezados jerárquicos, **resumen textual** del gráfico ("87 días activos…"), `aria-label` en iconos, `aria-live` para toasts y cambios de progreso, roles correctos para hojas/diálogos, atrapamiento de foco y cierre con Esc.
- **Reduced motion:** sustituir animaciones por cambios de estado instantáneos o fundidos mínimos; celebraciones estáticas.
- **Tamaño táctil:** ≥44×44 px; espacio entre objetivos ≥8 px.
- **Legibilidad:** cuerpo ≥16 px en mobile; soporte de zoom 200% sin pérdida; líneas ≤75 caracteres en lectura.
- **Formularios:** etiquetas visibles, errores asociados, no depender de placeholders.
- **Idioma:** `lang` correcto; textos localizables.
- **Sensibilidad emocional:** contenido sin culpa; opción de silenciar mensajes de ánimo.

---

## 25. Core User Flows

### Flow 1 — Primer ingreso → crear objetivo → primera acción → completar
**START:** abre la app por primera vez.
**STEPS:** (1) Pantalla "¿Qué quieres construir?" → elige plantilla o escribe. (2) "¿Cuál es el primer paso?" → confirma sugerencia. (3) Toca "Lo hice".
**FEEDBACK:** primer cuadro del gráfico se ilumina; check animado; mensaje "Ya empezaste a construir."; primer criterio del hito inicial marcado (progreso dotado).
**END STATE:** Dashboard con Hero, objetivo con 1 acción y 1 criterio; tarjeta "¿Convertimos esto en etapas?".

### Flow 2 — Objetivo → milestone → acción → evidencia → progreso
**START:** detalle del objetivo.
**STEPS:** Añadir hito (título + criterios) → Registrar acción vinculada → "+ Evidencia" → guardar.
**FEEDBACK:** criterio avanza; barra segmentada del hito se actualiza; evidencia aparece en la acción con sello.
**END STATE:** hito con progreso parcial y evidencia; Constancia y gráfico actualizados.

### Flow 3 — Completar milestone → celebración → timeline
**START:** último criterio marcado o "Cerrar hito".
**STEPS:** Hoja de cierre → confirmar → invitación a evidencia → reflexión (opcional) → celebración nivel 2 → siguiente hito sugerido.
**FEEDBACK:** rombo se asienta; barra global avanza con "+1 hito"; ◆ aparece en el gráfico.
**END STATE:** evento destacado en la timeline; siguiente hito activo; opción de ver la historia.

### Flow 4 — Volver después de inactividad
**START:** abre la app tras ≥7 días.
**STEPS:** Pantalla "Bienvenido de vuelta" → ve lo construido → elige "Continuar" (paso pequeño) o "Ajustar/Pausar".
**FEEDBACK:** celebración suave tras la primera acción; logro de recuperación.
**END STATE:** dashboard normal, pausa mostrada como banda neutra, sin mensajes de culpa.

### Flow 5 — Completar objetivo
**START:** último hito de la última etapa cerrado (o "Cerrar objetivo" manual).
**STEPS:** Pantalla "Lo que construiste": resumen narrativo, línea de tiempo del objetivo, evidencia destacada → reflexión final → opción "Guardar en mi portafolio" → siguiente paso: "¿Qué quieres construir ahora?".
**FEEDBACK:** celebración nivel 4 (nivel 5 si es el primer objetivo, con carta al yo futuro opcional).
**END STATE:** objetivo en "Completado", visible en Historia; recap del objetivo generado.

### Flow 6 — Revisar progreso histórico
**START:** Historia.
**STEPS:** Actividad (gráfico) → cambiar período/filtros → clic en día/hito → panel de detalle → saltar a timeline o evidencia.
**FEEDBACK:** panel contextual con acciones, evidencia y reflexiones.
**END STATE:** el usuario entiende "qué construí en este período" y puede exportar/ver recap.

### Flow 7 — Crear nuevo objetivo
**START:** "+ Nuevo objetivo" (Objetivos o Hero).
**STEPS:** Nombre → (plantilla opcional) → Crear → sugerencia de primer hito/acción.
**FEEDBACK:** el objetivo aparece con estructura mínima; se ofrece fijarlo como foco.
**END STATE:** nuevo objetivo activo; el Hero puede cambiar de foco (con confirmación).

---

## 26. User Journey

| Momento | Qué ve / hace | Qué siente | Qué valor se ha acumulado |
|---|---|---|---|
| **Día 0** | Onboarding en 3 pasos | Claridad, esperanza | Primer objetivo definido |
| **Día 1** | Primera acción real | "Hice algo" | Primer cuadro, primera marca |
| **Semana 1** | Primer recap semanal; primeras acciones con nota | "Estoy siendo constante" | Primer patrón visible |
| **Mes 1** | Primer hito cerrado; recap mensual | "Ya avancé bastante" | Primer hito + evidencia |
| **Mes 3** | Portafolio con evidencia; timeline con capítulos | "Tengo pruebas de lo que hago" | Evidencia acumulada, gráfico denso |
| **Mes 6** | Etapa completada; retrato de progreso | "Se nota que cambié" | Transformación visible: antes/después |
| **Año 1** | Recap anual: historia personal | **"Realmente construí algo"** | Historia completa |

**¿Qué hace que valga más a los 6 meses que el primer día?** Porque cada cosa que el usuario hace se convierte en **capital acumulado**: evidencia, historia, contexto (reflexiones), recaps más ricos, un gráfico denso, hitos cerrados y un retrato de quién es ahora. El primer día, la app es una promesa; a los 6 meses, es un **archivo propio, irreemplazable**.

---

## 27. Retention Through Value

**No se usan:** notificaciones agresivas, rachas que castigan, miedo a perder progreso, recompensas artificiales.
**Se usa: acumulación de valor.**

| Capa | Qué se acumula | Cómo se hace visible |
|---|---|---|
| Evidencia | Pruebas del trabajo | Portafolio, hitos, recaps |
| Historia | Timeline y capítulos | Timeline, recap anual |
| Progreso | Hitos y etapas cerradas | Barras segmentadas, logros reales |
| Contexto | Reflexiones y decisiones | Historia > Reflexiones, "aprendizajes destacados" |
| Identidad | Retrato basado en datos propios | "En 4 meses hiciste…" (V2) |
| Recaps | Cada vez más ricos | Semanal, mensual, anual |
| Libertad | Exportar, pausar, archivar sin perder nada | Ajustes claros y accesibles |

**Regla ética:** exportación completa y "pausar/cerrar" siempre visibles; el usuario puede irse sin fricción. Retención por valor, no por cautiverio.
**Notificaciones (Blueprint §16):** mínimas, elegidas, con tope y "sunset"; recap semanal por defecto.

---

## 28. Information Density

Evaluación por pantalla con jerarquía **P**rimary / **S**econdary / **T**ertiary:

| Pantalla | ¿Demasiado / poco? | Primary | Secondary | Tertiary (tras un clic) |
|---|---|---|---|---|
| Inicio | Riesgo de saturación → limitar a 5 bloques | Hero + siguiente acción | Gráfico, Reciente, Evidencia | Estadísticas detalladas, otros objetivos |
| Objetivos (lista) | Ligera | Nombre + progreso + estado | Última actividad | Descripción, categoría |
| Detalle de objetivo | Media | Progreso por etapas | Hitos de la etapa actual | Estadísticas, acciones antiguas |
| Detalle de hito | Baja | Criterios y progreso | Evidencia asociada | Historial de acciones |
| Historia > Actividad | Alta por naturaleza | Gráfico | Resumen textual, filtros | Panel del día |
| Timeline | Media | Hitos, logros, capítulos | Evidencia | Acciones colapsadas |
| Logros | Baja | Logro + evidencia | Fecha | Historial |
| Reflexiones | Baja | Citas | Contexto vinculado | Filtros |
| Recaps | Media | Narrativa | Evidencia y números clave | Detalle |
| Quick Add | Mínima | Campo + hito | Más opciones | Etiquetas, repetición |

**Reglas:** máximo **una** estadística grande por tarjeta; máximo **5** bloques por pantalla; revelado progresivo; densidad mayor en desktop, menor en mobile; ninguna pantalla debe presentar más de **una acción primaria**.

---

## 29. Anti-patterns

**No hacer:**
1. Dashboard saturado (10 tarjetas + gráficos + estadísticas).
2. Exceso de colores; uso del rojo para inactividad.
3. Exceso de badges/logros triviales.
4. Estadísticas sin contexto (un "63%" solo).
5. Animaciones constantes o celebraciones en cada tarea.
6. Modales innecesarios; modales sobre modales.
7. Formularios gigantes; obligar a completar estructura completa.
8. Gamificación infantil o estética de videojuego.
9. Culpa, presión, urgencia artificial, contadores de pérdida.
10. Notificaciones agresivas o personalizadas de forma manipuladora.
11. Ocultar pausar/archivar/exportar/eliminar.
12. Leaderboards o comparación por defecto.
13. Números de racha protagonistas.
14. Ocultar pérdida de datos como "penalización".
15. Pantallas vacías con "No hay datos".
16. Contenido pegado a la izquierda en desktop o layouts que se estiran sin control.
17. Dependencia de hover para funciones esenciales.
18. Copiar la identidad de GitHub/Notion/Linear/Todoist.

---

## 30. Component Inventory

**Núcleo**
- `AppShell` (sidebar/rail/bottom nav, contenedor)
- `PageHeader`, `SectionHeader`
- `QuickAdd` (hoja/panel/paleta), `QuickAddTrigger` (botón +)
- `GoalCard`, `GoalHeader`, `GoalProgress` (barra segmentada + anillo compacto)
- `StageCard`, `StageProgress`
- `MilestoneCard`, `CriteriaList`, `MilestoneCloseSheet`
- `ActionItem`, `ActionList`
- `EvidenceCard`, `EvidencePicker`, `EvidenceGallery`, `EvidenceLevel`
- `FocusHero` (Foco actual)
- `ContributionGraph`, `GraphLegend`, `DayPanel`, `PeriodSelector`, `GraphFilters`
- `Timeline`, `TimelineEvent`, `TimelineChapter`, `CollapsedRun`
- `ConsistencyPills` (Constancia), `MomentumIndicator`
- `AchievementCard`, `AchievementDetail`
- `ReflectionEntry`, `ReflectionPrompt`, `ReflectionList`
- `RecapCard`, `RecapStory`
- `WelcomeBack`
- `Celebration` (niveles 0–5), `Toast`, `UndoSnackbar`
- `EmptyState`, `Skeleton`, `ErrorState`
- `OnboardingStep`, `TemplatePicker`
- `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Chip`, `Tag`, `Tabs`, `Tooltip`, `Popover`, `Sheet/Drawer`, `Dialog`, `Menu`, `Progress` (lineal), `Avatar`, `Switch`, `DatePicker`
- `SettingsSection`, `NotificationSettings`, `ExportPanel`

**Estados:** cada componente define *default / hover / focus / pressed / disabled / loading / empty / error* cuando aplique.

---

## 31. Screen Inventory

| # | Pantalla | Propósito | Info principal | Acciones principales / secundarias | Vacío | Cargando | Error | Responsive |
|---|---|---|---|---|---|---|---|---|
| 1 | **Onboarding (3 pasos)** | Llegar al primer objetivo | Campo objetivo, primer paso | Crear, Lo hice / Saltar | — | Botón con estado | Reintentar | Pantalla completa mobile; tarjeta centrada desktop |
| 2 | **Inicio** | Foco y contexto | Hero, Ritmo, gráfico, Reciente | Registrar, siguiente acción / abrir objetivo | Sin objetivo (§19) | Skeleton de Hero + gráfico | Bloques con reintento | 12→8→4 col |
| 3 | **Objetivos (lista)** | Ver y gestionar objetivos | Cards con progreso | Nuevo objetivo / filtrar, archivar | Crear primer objetivo | Skeleton cards | Reintentar | Grid 3→2→1 |
| 4 | **Detalle de objetivo** | Trabajar un objetivo | Camino, progreso, ritmo | Registrar, añadir hito / pausar, cerrar | Sin etapas/hitos | Skeleton | Reintentar | Pestañas; panel lateral desktop |
| 5 | **Detalle de etapa** (inline/panel) | Gestionar una etapa | Hitos, progreso | Añadir hito / reordenar | Sin hitos | Skeleton | — | Panel/sheet |
| 6 | **Detalle de hito** | Cerrar puntos importantes | Criterios, evidencia, acciones | Marcar criterio, cerrar / editar | Sin acciones | Skeleton | — | Panel lateral / pantalla completa mobile |
| 7 | **Quick Add** | Registrar acción | Campo, hito | Guardar / evidencia, más | — | Guardando | Error en línea | Bottom sheet mobile; panel/modal desktop |
| 8 | **Historia > Actividad** | Ver lo construido | Gráfico, resumen | Filtros, período / exportar | Gráfico vacío | Skeleton | Reintentar | Grafo escalado |
| 9 | **Historia > Timeline** | Contar la historia | Eventos y capítulos | Filtrar, expandir | Timeline vacío | Skeleton | Reintentar | Línea lateral mobile |
| 10 | **Historia > Evidencia** | Portafolio | Cuadrícula | Añadir, filtrar | Sin evidencia | Skeleton | — | Grid 4→3→2 |
| 11 | **Historia > Logros** | Reconocer hitos | Tarjetas | Ver detalle | Sin logros | Skeleton | — | Grid |
| 12 | **Historia > Reflexiones** | Narrativa | Citas | Escribir, buscar | Sin reflexiones | Skeleton | — | 1 col |
| 13 | **Recaps** | Revisar períodos | Lista de recaps + detalle | Abrir, compartir (V2) | Sin datos aún | Skeleton | Reintentar | Story vertical |
| 14 | **Bienvenida de regreso** | Recuperar | Lo construido, paso pequeño | Continuar / ajustar, pausar | — | — | — | Pantalla completa mobile; tarjeta desktop |
| 15 | **Cierre de hito / objetivo** | Celebrar y consolidar | Resumen, evidencia | Confirmar / reflexión | — | — | — | Sheet / pantalla |
| 16 | **Tú (perfil y ajustes)** | Control | Visión, notificaciones, exportar | Editar, exportar, eliminar cuenta | — | Skeleton | Reintentar | Lista → secciones |
| 17 | **Notificaciones (ajustes)** | Autonomía | Tipos, horarios, topes | Activar/desactivar | — | — | — | Lista |
| 18 | **Exportar / privacidad** | Libertad | Formatos, alcance | Exportar, borrar | — | Progreso | Reintentar | Lista |

---

## 32. Prioritization

### P0 — imprescindible (MVP)
- AppShell responsive (sidebar/rail/bottom nav, contenedor centrado, grid).
- Sistema de tokens (claro; oscuro preparado).
- Onboarding 3 pasos, plantillas mínimas.
- Inicio con `FocusHero`, Ritmo (Constancia + Momentum), gráfico, Reciente.
- Objetivos (lista + detalle), Etapas, Hitos con criterios, Acciones, `QuickAdd`.
- Evidencia (añadir, ver, nivel).
- Progreso segmentado con contexto.
- `ContributionGraph` con panel del día, descansos, pausa, hitos, filtros básicos.
- Feedback inmediato y celebraciones niveles 0–2.
- Bienvenida de regreso.
- Empty states clave.
- Recap semanal simple.
- Accesibilidad base (teclado, foco, contraste, reduced motion).

### P1 — importante
- Timeline completa con capítulos.
- Logros (reales/progreso/recuperación) y pantalla.
- Reflexiones/journal conectado.
- Recap mensual; cierre de objetivo con pantalla especial (nivel 4–5).
- Modo oscuro completo; personalización básica (colores/categorías).
- Portafolio de evidencia con filtros.
- Notificaciones configurables y exportación.
- Ritmo de referencia por fecha objetivo.

### P2 — futuro
- Recap anual completo y exportable.
- Retrato de identidad y proyección de yo futuro (rangos).
- Accountability opt-in y reacciones.
- Autorrecompensas.
- Sugerencias inteligentes de descomposición de objetivos.
- Vista semanal alternativa del gráfico.
- Compartir capítulos.
- Integraciones (calendario, GitHub, wearables).

---

## 33. Quality Criteria (evaluación del diseño)

| Criterio | Pregunta | Cómo lo cumple el diseño | Riesgo/observación |
|---|---|---|---|
| **Claridad** | ¿Entiendo qué hago? | Hero con un único foco y una acción principal | Múltiples objetivos pueden competir → regla de "foco" |
| **Progreso** | ¿Veo que avanzo? | Progreso segmentado con contexto + gráfico + recap | Evitar porcentajes solos |
| **Agencia** | ¿Controlo mis objetivos? | Estructura opcional, pausar/pivotar/exportar, notificaciones elegidas | — |
| **Emoción** | ¿Los logros importantes se sienten importantes? | Celebración proporcional, acento ámbar reservado, recaps narrativos | Vigilar que la sobriedad no reste emoción |
| **Historia** | ¿Veo lo que construí? | Timeline, portafolio, gráfico, recaps | Depende de acumulación (necesita tiempo) |
| **Recuperación** | ¿Puedo volver tras fallar? | Bienvenida, pausas neutras, logro de recuperación | — |
| **Simplicidad** | ¿Lo uso sin aprender un sistema complejo? | Onboarding en 3 pasos, revelado progresivo, Quick Add mínimo | Seis entidades: ocultar Visión/Etapas al inicio |
| **Escalabilidad** | ¿Funciona para objetivos distintos? | Estructura universal + plantillas + métricas ancla | Objetivos difusos requieren criterios cualitativos |
| **Responsive** | ¿Funciona en desktop, tablet y mobile? | Sistema de grid, contenedor centrado, patrones por breakpoint | Debe verificarse con capturas en 4+ anchos |

**Criterio central de aceptación:** un usuario con 3 meses de datos abre Inicio y, en <10 segundos, puede decir *qué construye, en qué punto está y qué evidencia tiene*; y con 6+ meses, al abrir Historia o el recap, siente que **realmente construyó algo**.

---

## 34. Open Questions

**Sobre el proyecto actual (Fase 0, obligatorio antes de cualquier cambio)**
1. ¿Cuál es el stack (framework, estilos, gestor de estado, backend/BD)? *Pendiente de auditoría.*
2. ¿Qué entidades y relaciones existen hoy (bitácora, tareas, proyectos, etiquetas…)? ¿Cómo mapean a Visión/Objetivo/Etapa/Hito/Acción/Evidencia?
3. ¿Qué funciones existentes deben preservarse tal cual?
4. ¿Cuál es la causa raíz del problema de layout en desktop (contenedor, ancho, grid, sidebar)?
5. ¿Existe ya sistema de diseño/componentes reutilizables o estilos ad hoc?
6. ¿Hay autenticación, almacenamiento de archivos y modelo de datos compatibles con evidencia (archivos/enlaces)?
7. ¿Hay pruebas, CI o convenciones a respetar?

**Sobre el producto**
8. ¿Cuál será el nombre final y tono de marca ("Impacable")? ¿Idioma(s) soportado(s)?
9. ¿Modo oscuro desde el MVP o en P1?
10. ¿Cuántos objetivos activos concurrentes se esperan, y cómo se elige el "foco"?
11. ¿Límites de tamaño y tipos de evidencia (archivos pesados, audio)?
12. ¿Umbral por defecto de "semana activa" (N días) y de "regreso" (7/14 días)?
13. ¿Qué plantillas de objetivos entran en el MVP?
14. ¿Necesita el producto acceso offline / PWA en mobile?
15. ¿Uso previsto: personal privado o futuro social? (afecta modelo de datos y privacidad).

**Sobre validación**
16. Prototipar y probar con 5–8 usuarios: ¿el Hero comunica "qué importa ahora"? ¿el gráfico se entiende sin explicación? ¿la separación Avance/Constancia se comprende?
17. ¿La celebración de hitos se percibe proporcionada y no infantil?
18. ¿La evidencia opcional se usa o se ignora? (métrica: % de hitos con evidencia).

---

## 35. Siguiente paso

Convertir esta especificación en un **plan técnico de implementación** (tras la auditoría del proyecto): fases (fundación de tokens y shell responsive → dashboard → objetivos/hitos/acciones → evidencia → gráfico/timeline → celebraciones/recuperación → recaps), con criterios de aceptación verificables por pantalla y capturas en 390, 768, 1280 y 1728 px.
