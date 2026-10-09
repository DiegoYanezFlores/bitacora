# Plan de evolución — octubre de 2026

Ampliación de Bitácora con personalización visual, celebraciones, actividades recurrentes,
diario estoico y frases de construcción del yo, sobre la aplicación existente.

Regla: primero las dependencias compartidas, después cada módulo. Nada se reconstruye sin motivo.

## Estado por fase

| Fase | Qué incluye | Estado |
|---|---|---|
| 1 | Diagnóstico y reparación de la sincronización + panel de estado | **Implementada y probada** (PR #13) |
| 2 | Arquitectura compartida: preferencias, almacenamiento de imágenes, migración 006 | Pendiente |
| 3 | Actividades recurrentes e itinerario | Pendiente |
| 4 | Sistema visual: temas, paletas, fondos, biblioteca e imágenes propias | Pendiente |
| 5 | Celebraciones al completar | Pendiente |
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

## Fase 1 — resultado

Causas reales del fallo de sincronización, cada una reproducida con una prueba:

1. Sin token válido el estado se quedaba en «Sincronizando» indefinidamente.
2. Un 401 dejaba un error técnico y la cola parada, sin pedir entrar de nuevo.
3. Las filas de una tabla que el servidor aún no tenía quedaban en cola sin explicación.
4. El esquema se detectaba una sola vez por sesión: aplicar la migración no se notaba sin recargar.

Causa de entorno, fuera del código: con la confirmación de correo activa y el correo gratuito de
Supabase limitado, una cuenta que no puede entrar deja la app funcionando solo en local.

Además se añadió el panel de estado en Ajustes (sin tokens ni claves) y un botón para copiarlo.
