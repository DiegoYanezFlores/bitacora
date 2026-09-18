# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El dueño (ingeniero de datos en Quito) como único usuario real: un registro de trabajo personal para sostener un plan de largo plazo con pocas horas semanales disponibles. La app es técnicamente multiusuario (Supabase Auth + RLS por fila), pero eso es una decisión de robustez y seguridad, no una meta de producto — no se espera ni se diseña activamente para que otras personas se registren.

## Product Purpose

Responder, en segundos, tres preguntas: qué hice, en qué avanzo, qué sigue. Captura rápida de actividades y tareas por proyecto, con progreso derivado (barras, racha sin castigo, patrones) y una "siguiente acción" calculada localmente. Éxito = el dueño mantiene el hábito de registrar con fricción mínima y siempre sabe, sin pensar, cuál es el siguiente paso.

## Positioning

Registro en un toque + siguiente acción con motivo, calculada localmente sin IA ni configuración manual. Frente a Notion/Todoist/un diario/una hoja de cálculo, Bitácora no pide organizar primero: capturas y el sistema decide qué sigue (puntuación por urgencia/prioridad/inactividad) y explica por qué. Se diferencia también por lo que rechaza deliberadamente: sin XP, niveles, rachas punitivas, recompensas variables, confeti ni notificaciones para inflar métricas — ver Brand Commitments.

## Operating Context

Uso diario breve (captura en 1 toque, atajos `N` / `⌘K`) y una reflexión semanal los lunes (resumen de la semana anterior + elegir foco). PWA instalable, con datos locales primero (IndexedDB) y sincronización fila a fila con Supabase cuando hay conexión; funciona sin cuenta en modo prueba (datos solo locales, se adoptan al crear cuenta). Vercel para hosting/deploy (`vercel --prod --yes`), proyecto `bitacora` en el equipo `nuevo-porvenir`, prod: https://bitacora-three-omega.vercel.app.

## Capabilities and Constraints

- Pantallas: Hoy, Proyectos (+detalle), Registro, Progreso, Ajustes, Captura rápida, Acceso, Onboarding.
- Modelo relacional en Supabase con RLS por usuario: `profiles`, `projects`, `milestones`, `tasks` (todo/doing/waiting/done), `activities` (done/progress/note/win), `events`, vista `daily_stats`.
- Sincronización: cada fila con `updated_at`/`deleted_at`/`synced_at`; conflictos resueltos por "gana la edición más reciente", reforzado por trigger en servidor. v1 (`bitacora_state`, `bitacora_history`, `bitacora_state_backup_v1`) intacto; migración v1→v2 determinista e idempotente en el cliente.
- Auth: email/contraseña y Google (botón visible solo si el proveedor está activo en Supabase) vía REST directo (sin SDK), recuperación de contraseña, sesión persistente, perfil.
- **Restricción técnica dura**: sin frameworks, sin build, sin dependencias. Todo en ES modules nativos servidos tal cual. Si algo requiere un bundler, se replantea el enfoque en vez de añadirlo.
- **El esquema no cambia sin migración** (SQL numerado + conversión en cliente + rollback); los datos v1 no se tocan nunca.
- Pendiente / no resuelto: notificaciones push (requiere Edge Function + VAPID; en iOS solo con la PWA instalada), empaquetado móvil con Capacitor si se decide publicar en tiendas. El owner aún debe ejecutar `supabase/migrations/002_v2.sql` en producción y, opcionalmente, activar el proveedor Google.

## Brand Commitments

- Nombre: Bitácora. Voz breve, directa, sin lenguaje de videojuego.
- **Sin patrones oscuros**: sin culpa, sin miedo a perder rachas, sin recompensas variables, sin notificaciones para inflar métricas, sin scroll infinito.
- Gamificación deliberadamente moderada: sí barras de progreso, feedback de completado, días activos con meta propia, racha sin castigo, hitos, récords y logros informativos; explícitamente no XP, niveles, clasificaciones, recompensas variables ni confeti (decisión basada en evidencia, ver `docs/02-investigacion.md` y `docs/03-diseno.md`).
- "Todo lo que se muestra se explica": si un número no se puede explicar (Ajustes → Cómo funciona), no se muestra.
- Tipografía del sistema exclusivamente (0 KB, sin terceros, sin enviar la IP del usuario a Google Fonts — decisión tomada tras auditar v1).
- Contenido de usuario siempre escapado (`esc()`) antes de insertarse en HTML.

## Evidence on Hand

- Proyecto ya auditado, investigado, diseñado y reconstruido como v2 (2026-09-15): `docs/01-auditoria.md` (problemas de v1), `docs/02-investigacion.md` (evidencia con referencias sobre hábito/motivación/gamificación), `docs/03-diseno.md` (core loop, pantallas, gamificación, color, datos, privacidad), `docs/04-informe-final.md` (qué cambió y por qué), `docs/metricas.sql` (consultas de activación/retención/uso).
- Deploy real en producción: https://bitacora-three-omega.vercel.app.
- No hay testimonios, casos de estudio ni prensa — producto de uso estrictamente personal; no inventar evidencia de ese tipo en trabajo futuro.

## Product Principles

1. Capturar primero, organizar después — la fricción de registrar debe ser casi cero (1 toque, atajos de teclado).
2. El sistema decide y explica la siguiente acción; el usuario no tiene que mantener una lista mental.
3. Ningún patrón oscuro ni mecánica de juego que no informe algo real sobre el progreso.
4. Cada dato mostrado debe ser explicable; si no se puede explicar, no se muestra.
5. Sin frameworks/build/dependencias — cualquier cambio que las requiera se replantea antes de añadirlas.

## Accessibility & Inclusion

Contraste AA verificado (script propio) en todos los textos, claro/oscuro. Objetivos táctiles ≥44 px (mínimo 24 px en elementos secundarios). Animaciones cortas y funcionales, desactivadas con `prefers-reduced-motion`. `:focus-visible` presente (ausente en v1, corregido en v2).
