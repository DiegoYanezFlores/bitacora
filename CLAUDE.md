# Bitácora — guía del proyecto

## Qué es

Registro de trabajo personal: qué hice, en qué avanzo, qué falta y qué sigue. Web estática en Vercel (https://bitacora-three-omega.vercel.app), instalable como PWA, con datos locales (IndexedDB) y sincronización por filas con Supabase.

Público: general y profesional (no solo programadores). El dueño es ingeniero de datos en Quito y lo usa para sostener un plan de largo plazo con pocas horas semanales.

## Arquitectura

```
index.html          cáscara (nav, hoja modal, toast)
app/main.js         arranque, router por hash, acciones globales, sesión
app/db.js           IndexedDB + memoria (lecturas instantáneas)
app/store.js        mutaciones, cola de cambios (outbox), perfil y preferencias
app/sync.js         subida/bajada por filas con Supabase
app/api.js          Auth + REST de Supabase con fetch (sin SDK)
app/model.js        fachada memorizada: lee db y delega en app/domain/*
app/domain/*.js     lógica pura y probada: days (racha/mapa), period, progress (motor de avance §8), templates, calendar (rejillas de mes/semana, reparto por día, vencidas)
app/structure.js    etapas, hitos con criterios, panel y cierre de hito, evidencia (nota/enlace), plantillas, goal_log
tests/*.test.js     node --test (entorno mínimo en tests/setup.js)
scripts/check-precache.mjs  verifica la precaché del service worker
app/actions.js      acciones con feedback y deshacer + formularios
app/capture.js      captura rápida y detección local (tipo, #proyecto, "ayer", tarea parecida)
app/migrate.js      conversión v1 → v2 (determinista), exportar/importar
app/ui.js           iconos, hoja modal, toast, filas, barras
app/views/*.js      Hoy, Proyectos, Proyecto, Tareas, Registro, Progreso, Ajustes, Acceso, Onboarding
supabase/migrations 001_v1.sql (modelo viejo, intacto), 002_v2.sql (+down), 003_impacable.sql (+down): etapas, criterios, evidencia, reflexiones, logros, descansos, cambios de rumbo, recaps; 004_hardening.sql (+down): sin acceso anónimo a ninguna tabla, funciones de trigger no invocables
supabase/tests      00_supabase_stub.sql (simula roles y auth.uid en Postgres local) + 003_test.sql + 004_isolation_test.sql (un usuario no ve, edita, borra ni suplanta nada de otro, en todas las tablas)
docs/               auditoría, investigación, diseño, informe final, métricas.sql
```

## Reglas de trabajo

- **Sin frameworks, sin build, sin dependencias.** Módulos ES nativos servidos tal cual. Si algo necesita un bundler, se replantea.
- **Ediciones parciales.** No reescribas archivos completos salvo que el cambio lo exija de verdad.
- **Multiusuario y repositorio público:** cualquiera puede crear cuenta. El aislamiento lo da RLS (`auth.uid() = user_id`) en todas las tablas; nunca añadas una tabla sin RLS ni acceso anónimo (004 falla si pasa). En el navegador, cerrar sesión o entrar con otra cuenta borra los datos locales y las copias `bitacora:backup:*` de la anterior; los datos de "Probar sin cuenta" solo pasan a una cuenta si quien entra lo confirma.
- **El esquema no se cambia sin migración** (SQL numerado + conversión en cliente + rollback). Los datos v1 (`bitacora_state`, `bitacora_history`, `bitacora_state_backup_v1`) no se tocan nunca.
- **Nada de patrones oscuros**: sin culpa, sin miedo a perder rachas, sin recompensas variables, sin notificaciones para inflar métricas, sin scroll infinito. Ver `docs/02-investigacion.md`.
- **Todo lo que se muestra se explica** (Ajustes → Cómo funciona). Si un número no se puede explicar, no se muestra.
- **Escapa siempre** el contenido del usuario con `esc()` antes de insertarlo en HTML.
- **Pruebas antes de cada deploy** (sin dependencias, Node ≥ 22): `node --test "tests/*.test.js"`, `node scripts/check-precache.mjs` y `node scripts/contrast.mjs` (todo archivo nuevo de `app/` debe estar en `PRECACHE` de `sw.js`; sube también `CACHE`). La lógica derivada nueva va en `app/domain/` como funciones puras con su prueba.
- **Migraciones SQL:** pruébalas en un Postgres local antes de pedir que se apliquen: base nueva → `00_supabase_stub.sql` → 001 → 002 → 003 (dos veces, idempotencia) → `003_test.sql` (debe terminar en `OK`) → down → 003 otra vez. La app detecta si el servidor aún no tiene 003 (`sync.schema.v3`) y no envía tablas ni columnas nuevas hasta entonces.
- **Verifica antes de decir que está listo.** El servidor local de Python se bloquea por el permiso de macOS a Documentos; usa el de Node (`.claude/launch.json` → `bitacora`) o prueba en la URL de Vercel.
- Respuestas cortas en el chat.

## Sistema de diseño (F2)

Blanco frío + **cobalto vivo como color protagonista**: bloques enteros donde está el foco (tarjeta de siguiente acción, destino activo del menú y el "+" central de la barra inferior; en escritorio "Registrar" va con contorno para que el destino activo sea el único bloque sólido del menú); el resto en neutros. **Ámbar solo para hitos y logros reales.** El rojo nunca significa inactividad. Tipografía del sistema (0 KB, sin terceros). Radios 6/10/16. Objetivos táctiles ≥44 px. Claro y oscuro según el sistema, con anulación manual. Contraste AA verificado con `node scripts/contrast.mjs` (córrelo si tocas un color). El cambio de un valor (p. ej. el % de una barra) se anima desde el anterior con `app/motion.js` (`bar(pct, cls, key)`); `prefers-reduced-motion` lo apaga.

| Token | Claro | Oscuro |
|---|---|---|
| `--bg` / `--surface` | #F5F7FB / #FFFFFF | #0B1020 / #121833 |
| `--text` / `--text-2` | #0F1733 / #4A5470 | #EEF1FA / #A9B2CC |
| `--accent` (acción, progreso) | #2F4BF5 | #8FA2FF |
| `--block` (bloque protagonista, texto blanco) | #2F4BF5 | #3551F2 |
| `--milestone` / `--milestone-ink` | #FFA826 / #A35A00 | #FFB547 |

Navegación: móvil y tablet con barra inferior Inicio · Objetivos · + · Calendario · Historia · Tú (a partir de 6 celdas el cuerpo baja a 10 px bajo 400 px para que quepa el nombre completo); rail de 72 px entre 1024 y 1199; barra lateral de 240 px desde 1200. Contenido centrado (máx. 1200, 1320 desde 1728; 760 en vistas de lista). Rutas: `#/home`, `#/goals`, `#/goal/:id`, `#/next`, `#/calendar`, `#/history` (Actividad) y `#/history/log` (Registro), `#/you`; las antiguas redirigen.

**Calendario (`app/views/calendar.js`):** planificación temporal sobre las tareas que ya existen, sin tabla nueva. `due_date` = cuándo planeo hacerlo, `completed_at` = cuándo lo terminé, `occurred_at` = cuándo ocurrió la actividad; no se mezclan. Las fechas de tarea son fechas de calendario (`YYYY-MM-DD`), nunca marcas de tiempo, para que no se desplacen de día según la zona horaria. Las tareas sin fecha no se colocan en ningún día: se cuentan aparte y enlazan a `#/next`. Planificar no genera actividad ni mueve racha, avance ni estadísticas; solo completar lo hace, por el `completeTask()` de siempre.

## Modelo de datos (Supabase, todo con RLS por usuario)

`profiles` · `projects` (en la interfaz: **Objetivos**; `goal` = porqué, métrica = indicador aparte) · `stages` · `milestones` (peso 1/2/3 = S/M/L, `status` open/done/skipped) · `criteria` (criterios de "hecho", máx. 8) · `tasks` · `activities` (acciones; `milestone_id` opcional) · `evidence` · `reflections` · `achievements` · `day_marks` · `goal_log` (pausas, cierres, ajustes de alcance) · `recaps` · `events` · vista `daily_stats`. FK compuestas `(user_id, padre)`.

**Avance (app/domain/progress.js):** solo criterios e hitos lo mueven; hito = criterios cumplidos / totales (cerrado = 100 %), objetivo = media ponderada por peso de sus hitos no omitidos. Las acciones y tareas **nunca** suben el %: son constancia. Borrar u omitir un hito se registra como `scope_changed`.

Cada fila: `id` UUID del cliente, `updated_at` (edición), `deleted_at` (borrado lógico que vacía el contenido) y `synced_at` (servidor, para bajadas incrementales). Conflictos: gana la edición más reciente, aplicado también por trigger en el servidor.

## Gamificación (moderada, ver docs/03-diseno.md)

Sí: barras de progreso, feedback de completado, días activos por semana con meta propia, racha sin castigo, hitos, récords, logros informativos.
No: XP, niveles, clasificaciones, recompensas variables, confeti.

## Pendiente / siguiente

- Notificaciones push (requiere Edge Function + VAPID; en iOS solo con la PWA instalada).
- Google Sign-In: el botón aparece solo si el proveedor está activo en Supabase.
- Empaquetado móvil con Capacitor cuando se quiera publicar en tiendas.
