# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El dueño (ingeniero de datos en Quito) es hoy el único usuario real: un registro de trabajo personal para sostener un plan de largo plazo con pocas horas semanales. Decisión del 2026-09-18: **uso personal ahora, comercialización después**. La arquitectura ya es multiusuario y segura (Supabase Auth, RLS y FK compuestas de propiedad); lo específico de abrir a terceros (borrado de cuenta, cuotas, correo propio, textos legales) se agrupa en el gate F9b del plan técnico.

## Product Purpose

Ver y construir progreso real en objetivos importantes: qué intento lograr, en qué punto estoy, qué sigue y qué he construido. Objetivos con etapas e hitos que tienen criterios de "hecho"; el avance sale solo de esos criterios e hitos (las acciones alimentan la constancia, nunca el %). Captura rápida vinculada al hito activo, evidencia y reflexión de una línea. Éxito = el dueño mantiene el hábito de registrar con fricción mínima y, con el tiempo, puede decir "realmente construí algo".

## Positioning

Registro en un toque + siguiente acción con motivo, calculada localmente sin IA ni configuración manual. Frente a Notion/Todoist/un diario/una hoja de cálculo, Bitácora no pide organizar primero: capturas y el sistema decide qué sigue (puntuación por urgencia/prioridad/inactividad) y explica por qué. Se diferencia también por lo que rechaza deliberadamente: sin XP, niveles, rachas punitivas, recompensas variables, confeti ni notificaciones para inflar métricas — ver Brand Commitments.

## Operating Context

Uso diario breve (captura en 1 toque, atajos `N` / `⌘K`) y una reflexión semanal los lunes (resumen de la semana anterior + elegir foco). PWA instalable, con datos locales primero (IndexedDB) y sincronización fila a fila con Supabase cuando hay conexión; funciona sin cuenta en modo prueba (datos solo locales, se adoptan al crear cuenta). Vercel para hosting/deploy (`vercel --prod --yes`), proyecto `bitacora` en el equipo `nuevo-porvenir`, prod: https://bitacora-three-omega.vercel.app.

## Capabilities and Constraints

- Pantallas: Inicio, Objetivos (+detalle con camino: etapas → hitos → criterios; panel de hito), Historia (Actividad y Registro), Tú, Captura rápida, Acceso, Onboarding.
- Modelo relacional en Supabase con RLS por usuario y FK compuestas `(user_id, padre)`: `profiles`, `projects` (objetivos), `stages`, `milestones` (peso S/M/L), `criteria`, `tasks`, `activities`, `evidence`, `reflections`, `achievements`, `day_marks`, `goal_log`, `recaps`, `events`, vista `daily_stats`. Migraciones 002 y 003 aplicadas.
- Sincronización: cada fila con `updated_at`/`deleted_at`/`synced_at`; conflictos resueltos por "gana la edición más reciente", reforzado por trigger en servidor. v1 (`bitacora_state`, `bitacora_history`, `bitacora_state_backup_v1`) intacto; migración v1→v2 determinista e idempotente en el cliente.
- Auth: email/contraseña y Google (botón visible solo si el proveedor está activo en Supabase) vía REST directo (sin SDK), recuperación de contraseña, sesión persistente, perfil.
- **Restricción técnica dura**: sin frameworks, sin build, sin dependencias. Todo en ES modules nativos servidos tal cual. Si algo requiere un bundler, se replantea el enfoque en vez de añadirlo.
- **El esquema no cambia sin migración** (SQL numerado + conversión en cliente + rollback); los datos v1 no se tocan nunca.
- Pendiente / no resuelto: notificaciones push (requiere Edge Function + VAPID; en iOS solo con la PWA instalada), evidencia en archivo (Supabase Storage, F6), empaquetado móvil con Capacitor si se decide publicar en tiendas; el proveedor Google es opcional.

## Brand Commitments

- Nombre: Bitácora. Voz breve, directa, sin lenguaje de videojuego.
- **Sin patrones oscuros**: sin culpa, sin miedo a perder rachas, sin recompensas variables, sin notificaciones para inflar métricas, sin scroll infinito.
- Gamificación deliberadamente moderada (Blueprint): sí avance por hitos con criterios, constancia semanal, momentum, logros reales/de progreso/de recuperación y celebraciones proporcionales; explícitamente no XP, puntos, niveles arbitrarios (los "niveles" son las etapas), clasificaciones, recompensas variables, confeti ni racha diaria (decisión basada en evidencia, ver `docs/IMPACABLE PRODUCT BLUEPRINT v1.0.md`).
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
