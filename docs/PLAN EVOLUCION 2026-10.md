# Plan de evolución — octubre de 2026

Ampliación de Bitácora con personalización visual, celebraciones, actividades recurrentes,
diario estoico y frases de construcción del yo, sobre la aplicación existente.

Regla: primero las dependencias compartidas, después cada módulo. Nada se reconstruye sin motivo.

## Estado por fase

| Fase | Qué incluye | Estado |
|---|---|---|
| 1 | Diagnóstico y reparación de la sincronización + panel de estado | **Implementada y probada** (PR #13) |
| 2 | Arquitectura compartida: preferencias, almacenamiento de imágenes, migración 006 | **Implementada y probada** |
| 3 | Actividades recurrentes e itinerario | **Implementada y probada** |
| 4 | Sistema visual: temas, paletas, fondos, biblioteca e imágenes propias | **Implementada y probada** |
| 5 | Celebraciones al completar | **Implementada y probada** |
| 6 | Diario y filosofía estoica | Pendiente |
| 7 | Construcción del yo: frases y cierre de la interfaz | Pendiente |
| 8 | Pruebas integrales y documentación | Pendiente |

## Dependencias detectadas en el análisis

- **Todo lo visual depende de `profiles.prefs`** (jsonb ya existente y ya sincronizado). Las paletas,
  el fondo, la intensidad de las celebraciones y la visibilidad de las frases viven ahí: no hace falta
  tabla nueva ni migración para las preferencias.
- **Las imágenes propias dependen del bucket `evidence`** y del patrón de subida que ya existe
  (003 creó el bucket privado por carpeta de usuario). Se reutiliza con un prefijo propio en vez de
  crear otro mecanismo. La tabla `files` de IndexedDB ya guarda archivos pendientes de subir.
- **Las recurrencias dependen de `tasks`**: una serie es una tarea con regla de repetición y sus
  ocurrencias se generan en el cliente; las excepciones se guardan en `task_log`, que ya existe.
  Esto evita duplicar filas por cada día del semestre.
- **Las celebraciones dependen de `completeTask()` y `closeMilestone()`**, que ya son los únicos
  puntos donde algo se da por hecho. No se crea un detector paralelo.
- **El diario depende de `reflections`** (tabla ya existente con `type`, `body`, `prompt`,
  `occurred_at` y vínculos opcionales). Un diario es una reflexión de tipo `journal`: no se crea
  una tabla paralela; solo hará falta ampliar el `check` de `type` y añadir título y etiquetas.
- **Las frases no dependen de datos del servidor**: catálogo local en `app/domain/`, con la
  preferencia de visibilidad en `prefs`.

Conclusión: una sola migración (006) cubre lo que falta — ampliar `reflections` para el diario y
añadir a `tasks` la regla de repetición. Las preferencias y las imágenes no necesitan esquema nuevo.

## Decisiones que cambian criterios anteriores

- **Celebraciones.** `docs/03-diseno.md` y `CLAUDE.md` prohibían el confeti por ser un patrón de
  recompensa vacía. El dueño pide celebraciones explícitamente: se implementan **desactivables**,
  con tres intensidades, respetando `prefers-reduced-motion`, y solo cuando algo se completa de
  verdad (nunca al planificar). Se documenta el cambio de criterio en lugar de borrarlo.
- **Frases.** Se distinguen siempre cita textual (con autor y obra), traducción y reflexión propia.
  Ninguna frase se atribuye sin fuente.

## Fase 5 — resultado

- Confeti propio en canvas (sin dependencias), háptica y sonido, con tres niveles: ninguna,
  discreta (mensaje sin confeti) y completa. `prefers-reduced-motion` baja a discreta solo.
- Enganchadas a los puntos reales de finalización, no a los datos: completar una tarea, cerrar un
  hito y marcar un objetivo como terminado. Sincronizar o repintar nunca celebra.
- Deduplicación por clave: la misma tarea, hito, día, objetivo o marca de racha se celebra una
  sola vez, aunque la acción se repita o se recargue la app.
- El día se celebra **solo al cerrar lo último que quedaba**, y la racha solo en 7, 30, 100 y 365.
- Al cambiar el nivel en Ajustes se ve una muestra inmediata, para decidir con el resultado delante.

Comprobado en el navegador: el confeti aparece y se limpia solo; apagadas no dejan rastro;
discretas no pintan confeti; cerrar la penúltima tarea del día no celebra el día y cerrar la última
sí; y repintar la pantalla no genera celebraciones.

## Fase 4 — resultado

- **9 paletas** además de la base (pastel, psicodélicas, naturales, minimalista, oscura), generadas
  con `scripts/make-palettes.mjs`: los tonos se ajustan solos hasta cumplir AA y el verificador
  revisa las 20 combinaciones de tema y paleta.
- **Biblioteca de 10 fondos** propios en SVG (`img/bg/`, 32 KB en total): montañas, bosque, océano,
  ciudad, constancia, respiración, libros, red de ideas y dos abstractos. Sin fotos de terceros,
  sin servicios externos y sin enlaces que se puedan romper.
- **Fotos propias**: subir varias, previsualizar, elegir cuál es el fondo, borrar y volver al fondo
  por defecto. Validación con motivo claro (formato, 8 MB, 12 fotos) y uso sin conexión.
- **Ajustes del fondo**: encuadre, velo para leer mejor, desenfoque y cambio de imagen cada día.
- Todo persiste y se sincroniza en `profiles.prefs`; "Restaurar" devuelve la apariencia por defecto
  sin tocar el resto de preferencias ni los datos.

Dos fallos encontrados al revisar las capturas y corregidos: el bloque protagonista perdía su color
sólido sobre un fondo con imagen, y el velo estaba invertido (más valor daba menos legibilidad).

## Fase 3 — resultado

- `app/domain/recurrence.js` con 12 pruebas: reglas diaria/semanal/mensual con intervalo, días de la
  semana, fecha final, meses sin día 31, tope de generación, cruce con ocurrencias guardadas,
  ocurrencias movidas, agenda con huecos, avisos de solape y texto en palabras de la regla.
- Formulario de tarea: horas de inicio y fin, y bloque "Se repite" con frecuencia, días, intervalo
  y fecha final, con la regla explicada debajo en lenguaje natural.
- Calendario: marca propia para los días que se repiten, agenda del día con horas y huecos libres,
  y aviso de solapes. El resumen del periodo cuenta lo recurrente aparte de lo puntual.
- Al tocar un día de una serie: completarlo, decir qué pasó, omitirlo, cambiar solo ese día,
  cambiar ese día y los siguientes, o cambiar toda la serie. Borrar una serie avisa de cuántos
  días ya registrados se van con ella y permite deshacer.

Comprobado en el navegador con el caso real (clases de 07:00 a 11:00, de lunes a viernes, un
semestre): 10 días en dos semanas con **una sola fila** en la base, el sábado vacío, marcar un día
como no realizado crea exactamente una fila sin duplicar el día, y dividir la serie desde el
miércoles deja la anterior terminando el martes.

## Fase 2 — resultado

Base común lista, sin interfaz todavía (eso llega en las fases 3 a 7).

- **Migración 006** (+ reversión + `006_test.sql`): `tasks` gana `repeat` (regla de repetición),
  `series_id`, `occurrence_date`, `start_time` y `end_time`; `reflections` gana `title` y `tags`,
  acepta el tipo `journal` y amplía el cuerpo a 20 000 caracteres. Nada se borra ni se reescribe.
  Probada en Postgres 18 local: dos pasadas seguidas, reversión y vuelta a aplicar.
- **`app/domain/prefs.js`**: una sola fuente de verdad para apariencia, celebraciones y frases, con
  valores por defecto válidos y normalización de todo lo guardado. Un `prefs` corrupto no rompe la
  pantalla: vuelve a los valores por defecto. `store.prefs()` ya pasa por aquí.
- **`app/domain/media.js` + `app/media.js`**: fotos propias con validación (JPG/PNG/WebP, 8 MB, 12
  fotos), guardado local en IndexedDB para que se vean sin conexión, y subida al bucket privado
  `evidence` bajo la carpeta del usuario. La referencia viaja en `prefs.media`; el binario nunca va
  a la base de datos. Borrar la foto activa devuelve a un fondo válido.
- **Sincronización:** `schema.v6` se detecta preguntando por una columna (42703 = falta la
  migración). Mientras no esté aplicada, esas columnas se quitan del envío y nada se pierde en este
  dispositivo; el panel de Ajustes muestra el estado de las tres migraciones.

## Fase 1 — resultado

Causas reales del fallo de sincronización, cada una reproducida con una prueba:

1. Sin token válido el estado se quedaba en «Sincronizando» indefinidamente.
2. Un 401 dejaba un error técnico y la cola parada, sin pedir entrar de nuevo.
3. Las filas de una tabla que el servidor aún no tenía quedaban en cola sin explicación.
4. El esquema se detectaba una sola vez por sesión: aplicar la migración no se notaba sin recargar.

Causa de entorno, fuera del código: con la confirmación de correo activa y el correo gratuito de
Supabase limitado, una cuenta que no puede entrar deja la app funcionando solo en local.

Además se añadió el panel de estado en Ajustes (sin tokens ni claves) y un botón para copiarlo.
