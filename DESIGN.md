---
name: Bitácora
description: Cuaderno de campo digital para el registro de trabajo personal — cálido, plano y sin ruido de gamificación.
colors:
  ink: "#16201C"
  ink-soft: "#55625C"
  ink-faint: "#64706A"
  paper: "#F6F7F5"
  surface: "#FFFFFF"
  surface-sunken: "#EFF1EE"
  line: "#DFE4E0"
  line-strong: "#CDD4CE"
  accent: "#0B7A5C"
  accent-ink: "#FFFFFF"
  accent-soft: "#E4F1EC"
  streak: "#C2410C"
  streak-soft: "#FCEDE4"
  warn: "#A64B00"
  warn-soft: "#FBF0E2"
  danger: "#B42318"
  project-teal: "#0E8A75"
  project-blue: "#2563EB"
  project-violet: "#7C3AED"
  project-rose: "#BE185D"
  project-orange: "#C2410C"
  project-amber: "#A16207"
  project-green: "#15803D"
  project-slate: "#475569"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  metric-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1
  metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  metric-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  metric-xl:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  label-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  hairline: "3px"
  xs: "7px"
  tick: "8px"
  sm: "10px"
  md: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "26px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  pill-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 13px"
    height: "44px"
---

# Design System: Bitácora

## Overview

**Creative North Star: "El Cuaderno de Campo"**

Bitácora se ve como una herramienta de trabajo, no como un producto de consumo. La superficie es un papel cálido casi blanco, no un blanco de laboratorio; el texto es tinta oscura de alto contraste; y hay exactamente una tinta de color —un verde profundo— reservada para lo que importa: la acción principal y el estado positivo. Todo lo demás vive en grises cálidos. No hay gradientes decorativos, ilustraciones ni imágenes de marca: la jerarquía se construye con tipografía del sistema, espacio y ese único acento, nunca con adornos.

El sistema es deliberadamente plano y silencioso. Las tarjetas se separan del fondo con un borde de 1px, no con sombra teatral; la sombra fuerte se reserva para lo que literalmente flota sobre el contenido (hoja modal, toast, botón flotante). La app rechaza activamente el lenguaje visual de los juegos —sin XP, niveles, confeti ni recompensas variables— y aplica la misma regla a la propia paleta: el color comunica estado y jerarquía, nunca "premia" ni "castiga" emocionalmente. Este comentario está escrito literalmente en el CSS fuente del proyecto y es la ley del sistema.

Es una interfaz para usarse en segundos, muchas veces al día, con una mano, y para leerse en una sesión de reflexión más larga los lunes. Por eso las densidades cambian por vista (una tarjeta grande de "siguiente acción" arriba; listas compactas de actividad debajo) pero el vocabulario visual —tarjeta, borde, acento único— nunca cambia.

**Key Characteristics:**
- Neutros cálidos (no grises fríos ni blanco puro) + una sola tinta de acento.
- Plano en reposo; el borde de 1px hace el trabajo de separación, no la sombra.
- Tipografía exclusivamente del sistema operativo — cero fuentes de terceros, cero KB de red.
- Radios que crecen con el tamaño del elemento: 7px en detalles pequeños, 10px en controles, 14px en superficies grandes, 999px en píldoras y controles circulares.
- Un color por proyecto (paleta categórica de 8 tonos) es la única superficie donde el color se usa libremente; en el resto de la interfaz es escaso a propósito.
- Claro/oscuro nativos vía `prefers-color-scheme`, con anulación manual (`data-theme`); cada token tiene su par exacto en ambos modos.

## Colors

Paleta de neutros cálidos con una sola tinta de acento; los tonos de proyecto son la única zona categórica y libre del sistema.

### Primary
- **Verde Bitácora** (`#0B7A5C` claro / `#3CD3A0` oscuro): la única tinta "activa" del sistema — botón primario, tab activo, marca de tarea completada, barra de progreso, icono de sincronización correcta, logo. Contraste AA verificado con script propio en ambos modos (ver `PRODUCT.md`).

### Secondary
- **Ámbar Racha** (`#C2410C` claro / `#FB923C` oscuro): reservado para la racha (flama) y para "logro" en el registro de actividad. Es la segunda tinta emocional del sistema y solo aparece en esos dos contextos — nunca decorativo.

### Tertiary
- **Ámbar Aviso** (`#A64B00` claro / `#F2B24C` oscuro): estado de advertencia (sync pendiente, notas de fricción). Con fondo suave propio (`streak-soft`/`warn-soft`).
- **Rojo Alerta** (`#B42318` claro / `#F87171` oscuro): destructivo/error únicamente — botón de eliminar, borrar cuenta.
- **Paleta de Proyectos** (8 tonos categóricos, misma luminosidad y saturación pensadas para convivir): `project-teal` `#0E8A75`, `project-blue` `#2563EB`, `project-violet` `#7C3AED`, `project-rose` `#BE185D`, `project-orange` `#C2410C`, `project-amber` `#A16207`, `project-green` `#15803D`, `project-slate` `#475569`. El usuario elige uno por proyecto al crearlo; es la única superficie del sistema donde el color se usa con libertad, porque su función es distinguir, no jerarquizar.

### Neutral
- **Papel Cálido** (`#F6F7F5` claro / `#0D1210` oscuro): fondo de página.
- **Superficie** (`#FFFFFF` claro / `#141A17` oscuro): tarjetas, hojas, barra de navegación, inputs.
- **Superficie Hundida** (`#EFF1EE` claro / `#1B231F` oscuro): fondo de barra de progreso vacía, chip neutro, hover de botón de icono — un nivel por debajo de Superficie.
- **Tinta** (`#16201C` claro / `#E8EEEA` oscuro): texto primario.
- **Tinta Suave** (`#55625C` claro / `#A2AEA8` oscuro): texto secundario, metadatos, etiquetas de campo.
- **Tinta Tenue** (`#64706A` claro / `#86938D` oscuro): el nivel más bajo de texto — placeholders, fecha del encabezado del día, etiquetas de eje de gráfico.
- **Línea** (`#DFE4E0` claro / `#26302B` oscuro): borde de tarjeta, divisor de lista, borde de tabbar.
- **Línea Marcada** (`#CDD4CE` claro / `#33403A` oscuro): borde de botón ghost, borde de input, borde de píldora — más presente que `line` porque delimita algo interactivo.

### Named Rules
**La Regla de Estado, No Emoción.** El color comunica estado y jerarquía — nunca gamificación ni recompensa emocional. Si un nuevo color no responde a "¿qué estado señala?", no se agrega.

**La Regla de la Sola Voz.** El acento verde aparece en un solo lugar por vista como máximo la mayoría de las veces (una acción primaria, un tab activo, una barra). Su escasez es lo que lo hace legible como "esto importa".

## Typography

**Display/Body/Label Font:** fuente del sistema (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) — una sola familia para todo, sin fuente de marca ni fuente mono separada.

**Character:** una sola tipografía nativa que cambia de personalidad solo por tamaño, peso y tracking — nunca por familia. Los números de métricas usan `font-variant-numeric: tabular-nums` para que las cifras no salten al actualizarse.

### Hierarchy
- **Display** (700, 25px, 1.2, `-0.02em`): títulos de vista (`<h1>` de Hoy/Proyectos/Progreso/Ajustes) y encabezado de las pantallas de acceso (26px ahí, misma familia de rol).
- **Headline** (700, 18px, 1.3): título de hoja modal (`sheet-title`) y título de la tarjeta de "siguiente acción" (`next-title`, baja a 16px en variante compacta).
- **Metric** — cuatro pasos, no uno solo, todos peso 700 y tracking negativo, tamaño según cuánto protagonismo tiene la cifra en esa pantalla:
  - **Metric SM** (19px): tarjetas pequeñas de Récords (seis a la vez, la más discreta).
  - **Metric** (24px): mosaicos KPI de Progreso (`tile-n`).
  - **Metric LG** (26px): contador de registros/racha del día en Hoy (`stat-n`).
  - **Metric XL** (28px): porcentaje del periodo en Progreso (`prog-pct`) — la cifra más grande de toda la app.
- **Body** (400, 15px, 1.5): texto de párrafo, ítems de lista, campos de formulario. Ancho de columna limitado por el contenedor de vista (640px), no por una medida de caracteres explícita.
- **Body SM** (400, 14px, 1.4): texto compacto dentro de tarjeta o fila — avisos, ítems de patrones/distribución, "Cómo funciona", cuerpo del toast. Un paso por debajo de Body para contenido secundario que vive dentro de un contenedor ya delimitado, no para texto de nivel de página.
- **Label** (600, 12px, `0.06em`, mayúsculas): eyebrows de sección, texto de switch/ajuste secundario.
- **Label SM** (500, 13px): el texto secundario más frecuente del sistema — metadatos de lista (`.small`), texto de píldora, etiquetas de campo de formulario.
- **Micro** (600, 11px): el nivel más pequeño con texto real — etiqueta de la barra de navegación inferior, `kbd`. Nunca por debajo de esto para texto que se debe leer, no solo distinguir.

Tres valores quedan fuera de la escala a propósito, como excepciones de un solo uso y no como pasos a repetir: 10px en las etiquetas del eje del gráfico de barras (una sola instancia, ilegible como texto de lectura, solo de referencia visual), 16px en los campos de formulario (evita el zoom automático de iOS al enfocar, no es una decisión tipográfica), y 22px en el logo (marca única, no texto de interfaz). Ningún componente nuevo debe copiar estos tres valores.

### Named Rules
**La Regla de la Familia Única.** Cero fuentes de terceros, cero KB de red, cero huella de IP enviada a un proveedor de fuentes — decisión de privacidad tomada explícitamente tras auditar la v1 del producto, no solo de rendimiento.

## Layout

Contenedor centrado de ancho máximo 640px (`--sp: 16px` de margen lateral) para todas las vistas de contenido — optimizado para lectura de una columna, nunca para multi-columna en móvil. El ritmo vertical entre bloques de una vista es 26px (`.block`); dentro de una lista, los ítems se separan por 8–10px.

Mobile-first con navegación inferior fija (`tabbar`, 4 destinos) y un botón de acción flotante circular centrado sobre ella para capturar una actividad en un toque; ambos respetan `env(safe-area-inset-bottom)`. A partir de 1000px de ancho la navegación migra a una barra lateral fija de 232px (`navside`) y el tabbar/FAB desaparecen — no es un colapso de la misma barra, es un cambio real de patrón de navegación entre densidades. Los mosaicos de progreso pasan de 2 a 4 columnas en el mismo punto de quiebre. La hoja modal es de ancho completo con esquinas superiores redondeadas en móvil y se centra como diálogo de 560px de ancho a partir de 620px.

## Elevation & Depth

Sistema plano con profundidad de borde: en reposo, ninguna superficie usa sombra para separarse visualmente — lo hace un borde de 1px (`line`) sobre un fondo de tono distinto (`surface` sobre `paper`). La sombra existe pero es casi imperceptible en ese estado de reposo (`--shadow`, opacidad de sombra 0.05) y funciona como un acabado sutil, no como señal de jerarquía. La sombra se vuelve protagonista solo cuando un elemento literalmente flota por encima del contenido: hoja modal, toast y botón flotante usan `--shadow-lg` (opacidad 0.16, mucho más difusa y profunda) — ese salto de intensidad es la señal de "esto es un overlay", no un valor decorativo.

### Shadow Vocabulary
- **Reposo** (`box-shadow: 0 1px 2px rgba(22,32,28,.05), 0 4px 16px rgba(22,32,28,.05)`): tarjetas, mosaicos, gráfico de barras — casi invisible, complementa al borde.
- **Overlay** (`box-shadow: 0 12px 40px rgba(22,32,28,.16)`): hoja modal, toast, interruptor (knob).
- **Acento flotante** (`box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent)`): botón flotante de captura — única sombra que lleva el color del acento en vez de negro/tinta.

### Named Rules
**La Regla del Borde Hace el Trabajo.** Ninguna tarjeta en reposo depende de la sombra para leerse como superficie separada; si el borde de 1px se quitara, la sombra sola no bastaría. Reserva la sombra fuerte para lo que de verdad flota.

## Shapes

El radio de esquina escala con el tamaño y la importancia del elemento, en cinco pasos discretos más la píldora: 3px (`hairline`, celdas fijas diminutas — punto del día de la semana, celda del mapa de calor), 7px (`--r-xs`, iconos pequeños, detalles), 8px (`tick`, la casilla cuadrada de completar tarea — a medio camino entre `hairline` y `sm` porque su tamaño de toque es mayor que una celda pero menor que un botón), 10px (`--r-sm`, botones, inputs, mosaicos pequeños), 14px (`--r`, tarjetas, superficies grandes, hoja modal). Los controles que deben leerse como "seleccionables de un toque" —píldoras de filtro, chips, tags, badges, interruptor— usan radio completo (999px). Los elementos circulares puros (botón flotante, punto de progreso semanal) son la excepción deliberada a la escala: marcan una acción o un estado singular, no una superficie de contenido. Bordes siempre de 1px, nunca gruesos; sin recortes (`clip-path`) ni siluetas irregulares en ningún componente.

Tres valores existen fuera de esta escala a propósito y no se documentan como pasos reutilizables: el radio de 4px del anillo de foco global y de `kbd` es una utilidad genérica, no una decisión de forma de componente; los 13px del logo son un valor único de una sola marca; y el 2px en la esquina inferior de la barra del gráfico semanal y en los puntos de onboarding es un detalle de silueta de un solo elemento diminuto, no un paso de escala. Ninguno de los tres debe copiarse a un componente nuevo — si un componente nuevo necesita radio, usa uno de los cinco pasos de arriba.

## Components

### Buttons
- **Shape:** radio 10px (`--r-sm`), altura mínima 44px (objetivo táctil).
- **Primary:** fondo `accent`, texto `accent-ink`, sin borde; usado una vez por pantalla como máximo.
- **Ghost:** fondo `surface`, borde `line-strong`, texto `ink` — acción secundaria junto a una primaria.
- **Danger / Danger-text:** fondo `danger` sólido para confirmaciones destructivas; variante de solo texto en rojo con borde tenue para acciones destructivas de bajo énfasis (p. ej. dentro de un formulario).
- **Google:** mismo tratamiento que ghost, ancho completo, con el logo multicolor de Google sin recolorear — única excepción a "un acento" del sistema porque es un logo de terceros, no un color propio.
- **Active/Loading:** se encoge a 97.5% al presionar (`transform: scale`); en carga muestra un spinner de borde que gira, sin cambiar de texto ni tamaño.

### Chips, Pills & Tags
- **Pill (filtro):** fondo `surface`, borde `line-strong`, radio completo; estado activo cambia a fondo `accent-soft` + texto `accent` + peso 600 — nunca cambia de forma, solo de color y peso.
- **Tag:** más pequeño y sin borde, fondo `surface-sunken`; variantes semánticas `tag-accent` (fondo `accent-soft`) y `tag-warn` (fondo `warn-soft`).
- **Chip de proyecto:** combina un punto de color categórico (`pdot`, uno de los 8 tonos de proyecto) con el nombre — es la única unidad de interfaz que lleva color libre de la Paleta de Proyectos.

### Cards / Containers
- **Corner Style:** 14px (`--r`).
- **Background:** `surface` sobre `paper`; variante "siguiente acción" (`.next`) usa un degradado sutil de `accent-soft` a `surface` para diferenciarse como la tarjeta protagonista de Hoy sin romper el sistema plano.
- **Shadow Strategy:** reposo, ver Elevation & Depth.
- **Border:** 1px `line` en todas las tarjetas; `.next` usa un borde teñido con el acento (`color-mix` al 30%).
- **Internal Padding:** 16px estándar.

### Inputs / Fields
- **Style:** fondo `surface`, borde 1px `line-strong`, radio 10px, padding 11px/13px, tamaño de fuente 16px (evita zoom automático en iOS).
- **Focus:** borde transparente + anillo de foco sólido de 2px en `accent`, desplazado hacia adentro (`outline-offset: -1px`) — mismo tratamiento en todos los campos, checkboxes visuales y controles segmentados.
- **Segmented / Swatch pickers:** el control de radio nativo se oculta visualmente; el estado marcado se expresa con fondo `accent-soft` (segmentado) o un anillo `ink` con separación de fondo (swatch de color).
- **Stepper:** para un valor numérico pequeño y acotado (p. ej. la meta semanal, 1–7), dos `icon-btn` (iconos `back`/`arrow`, los mismos de la navegación de periodo de Progreso) enmarcan el número en tipografía Metric SM — nunca una lista plana de más de 4 botones para elegir un número dentro de un rango corto.

### Navigation
- **Móvil (tabbar):** fija al fondo, 4 destinos en grid, fondo `surface` semitransparente con `backdrop-filter: blur`, ítem activo en `accent`; el botón flotante de captura se superpone al centro, empujando los ítems 2 y 3 hacia los costados.
- **Escritorio (navside):** barra lateral fija de 232px, ítems con icono + etiqueta, hover a `surface-sunken`, activo a fondo `accent-soft` + texto `accent` en negrita — mismo lenguaje de "estado activo" que el resto del sistema, solo cambia el contenedor.

### Next Action Card (signature)
La tarjeta de mayor peso visual de toda la app: única superficie con degradado (siempre sutil, `accent-soft` → `surface`) y borde teñido de acento. Contiene el título de la próxima tarea sugerida, chips explicando el motivo del cálculo (`next-why`) y los botones de acción — es la expresión directa del principio de producto "el sistema decide y explica la siguiente acción".

### Toast (signature)
Notificación flotante centrada (o esquina inferior derecha en escritorio), con icono circular de estado, cuerpo de dos líneas y acción de deshacer en texto de acento — nunca autodestructiva sin posibilidad de deshacer cuando la acción lo permite. Usa `--shadow-lg`, igual que la hoja modal, porque también es un overlay.

## Do's and Don'ts

### Do:
- **Do** limitar el acento verde a una acción o estado por vista; su escasez es la señal (La Regla de la Sola Voz).
- **Do** separar tarjetas del fondo con borde de 1px + sombra casi invisible; reservar sombra fuerte (`--shadow-lg`) solo para overlays reales (hoja, toast, FAB).
- **Do** escalar el radio con el tamaño del elemento (7 → 10 → 14px) y usar radio completo (999px) solo en controles seleccionables de un toque.
- **Do** usar la Paleta de Proyectos libremente para distinguir proyectos — es la única zona categórica del sistema.
- **Do** mantener objetivos táctiles ≥44px en controles primarios (mínimo 24px en elementos secundarios) y respetar `prefers-reduced-motion` apagando toda animación no funcional.
- **Do** escapar (`esc()`) todo contenido de usuario antes de insertarlo en HTML.

### Don't:
- **Don't** introducir una segunda tipografía, un CDN de fuentes, o cualquier fuente que no sea la del sistema operativo.
- **Don't** usar color para premiar o "gamificar" — sin XP, niveles, clasificaciones, recompensas variables, confeti ni notificaciones diseñadas para inflar métricas.
- **Don't** mostrar un número, barra o estadística que no se pueda explicar en Ajustes → Cómo funciona.
- **Don't** añadir sombra decorativa a una tarjeta en reposo; si necesita más separación, sube el contraste de borde antes que la sombra.
- **Don't** usar `--danger` (rojo) fuera de acciones destructivas o errores reales.
- **Don't** requerir un framework, build o dependencia para un cambio visual — si algo lo exige, se replantea el enfoque (restricción técnica dura del proyecto).
