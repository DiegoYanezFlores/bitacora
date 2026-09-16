# Fase 1 — Auditoría de Bitácora v1

Fecha: 2026-09-15 · Commit auditado: `b9c07ab` · URL: https://bitacora-three-omega.vercel.app

## Resumen

Bitácora v1 es un tracker personal **muy acoplado a un único plan** (racha de inglés, búsqueda de empleo, deuda). Funciona offline y sincroniza, pero su modelo de datos (un único JSON por usuario) y su interfaz (una sola pantalla larga) no escalan hacia el producto pedido: proyectos, historial de actividad, progreso por periodo y registro rápido.

## Hallazgos por área

| # | Área | Estado actual | Problema / riesgo | Severidad |
|---|------|---------------|-------------------|-----------|
| 1 | Estructura | 15 archivos, 85 KB. `index.html` 967 líneas (CSS + HTML + JS juntos), `sync.js` 382, `sw.js` 70 | Monolito difícil de mantener y probar; cualquier cambio toca el mismo archivo | Media |
| 2 | HTML/CSS/JS | Vanilla JS, render por `innerHTML` de secciones completas, delegación de eventos | Re-render total en cada cambio; sin separación dominio/UI | Media |
| 3 | Dependencias | Ninguna de JS. Google Fonts (IBM Plex) como recurso de terceros | La fuente bloquea el render y envía la IP del usuario a Google | Baja |
| 4 | Arquitectura | Estático en Vercel; `localStorage` como fuente local; Supabase como copia remota | Correcta para una app pequeña; no para historial creciente | Media |
| 5 | Componentes | Secciones fijas: inglés, tareas, contadores, pendientes, historial, hoja de ruta, notas | Sin concepto de proyecto, actividad ni línea temporal | Alta (producto) |
| 6 | Estado | Un objeto `state` global; XP y nivel derivados | Sin capa de dominio; lógica de negocio mezclada con plantillas | Media |
| 7 | Persistencia | `localStorage['bitacora-v1']` (JSON completo) | Límite ~5 MB; escritura completa del documento en cada cambio | Media |
| 8 | Supabase | Tabla `bitacora_state` (1 fila JSON por usuario) + `bitacora_history` (instantánea horaria) | Se sube el documento **entero** en cada cambio; imposible consultar, filtrar o analizar; conflictos resueltos con una fusión ad hoc | Alta (escala) |
| 9 | Autenticación | Email/contraseña vía REST propio; sesión en `localStorage['bitacora:session']` | Sin Google, sin recuperación de contraseña, sin perfil, sin pantallas propias (solo un diálogo) | Alta |
| 10 | Variables de entorno | `config.js` con URL + publishable key (públicas por diseño). `.env.local` solo con token OIDC de Vercel, ignorado por git y por el despliegue | Correcto | OK |
| 11 | Seguridad | RLS activo y probado (escritura anónima rechazada). HSTS por Vercel | **Sin CSP**, sin `X-Content-Type-Options`, `Referrer-Policy` ni protección de *framing*. Tokens en `localStorage` (riesgo si hay XSS). 2 `<script>` inline | Media |
| 12 | Responsive | Mobile-first, 1 columna, max 600px | Sin aprovechar escritorio | Baja |
| 13 | Accesibilidad | Botones reales, `aria-pressed`, `aria-live` en toast, `prefers-reduced-motion` | Textos de 10–11 px en historial, sin estilos `:focus-visible`, calendario sin etiquetas, sin modo claro | Media |
| 14 | Performance | HTML 15 KB gz + sync 5 KB. Service worker *network-first* | Fuente de terceros; re-render completo; confeti en `<canvas>` en cada acción | Baja |
| 15 | UX | Una pantalla muy larga; "siguiente paso" útil | No responde "¿qué hice hoy?" ni "¿cómo evoluciona mi trabajo?"; "Cerrar semana" es manual y fácil de olvidar | Alta |
| 16 | UI | Tema oscuro saturado (lima, fuego, violeta) | Estética de videojuego; poco profesional; solo oscuro | Media |
| 17 | Navegación | Sin rutas; todo es scroll | No hay forma de ir a un proyecto o a un día concreto | Alta |
| 18 | Funciones | Racha de inglés, tareas semanales con prioridad, cerrar semana, contadores, capital, pendientes de terceros, historial semanal, hoja de ruta, notas, XP/niveles, confeti, siguiente paso | Todas específicas del plan del dueño; ver tabla de preservación | — |
| 19 | Export/Import | Exportar/importar JSON completo | Útil; se conserva | OK |
| 20 | Modelo de datos | `{started, week, tasks, english, apps, interviews, capital, capital0, waiting, hist, notes, roadmap, updatedAt, deleted, legacy}` | No relacional; sin fechas de actividad (los contadores no tienen fecha); `hist` guarda solo porcentajes | Alta |
| 21 | PWA | Manifest, iconos 192/512/180, SW con precache y offline | Sin `shortcuts`, sin `id`, `theme-color` único | Baja |
| 22 | Móvil nativo | Web pura sin build → empaquetable con Capacitor | Rutas inexistentes; sin separación de capa de datos | Media |
| 23 | Vercel | Estático, sin build, cabecera `no-cache` en `sw.js` | Sin cabeceras de seguridad | Media |
| 24 | Escalabilidad | Documento único crece sin límite (historial horario en servidor también) | Con un año de actividad, cada guardado subiría cientos de KB | Alta |
| 25 | Privacidad | Datos del usuario (incluida deuda) sincronizados por decisión suya; RLS | `bitacora_history` guarda instantáneas horarias **incluso de datos borrados**; Google Fonts expone IP | Media |

## Qué hace cada función actual y si se conserva

| Función v1 | Qué aporta | Decisión v2 |
|---|---|---|
| Racha de inglés | Consistencia diaria en el hábito clave del plan | **Se generaliza**: racha de días activos + proyecto "Inglés" migrado con cada día como actividad |
| Tareas semanales (texto, por qué, prioridad) | Plan de la semana | **Se conserva** como tareas con prioridad, proyecto, estado y fecha |
| Cerrar semana (archiva % real) | Honestidad del cumplimiento | **Se automatiza**: la revisión semanal se calcula sola con datos reales (no se puede maquillar ni olvidar) |
| Contadores (aplicaciones, entrevistas) | Métricas de búsqueda de empleo | **Se migran** a un proyecto con actividades etiquetadas; los totales sin fecha quedan como nota histórica |
| Capital / capital inicial | Avance de deuda | **Se conserva** como proyecto con métrica (inicio → actual → meta) |
| Pendientes de terceros | Cosas bloqueadas por otros | **Se conserva** como estado de tarea "En espera" |
| Historial semanal | Evolución | **Se amplía** a vista Progreso (día/semana/mes/año, proyecto, mapa de actividad) |
| Hoja de ruta | Plan de 12 meses | **Se migra** a hitos de un proyecto "Plan 12 meses" |
| Notas | Texto libre | **Se migra** a actividad tipo nota |
| XP / niveles / confeti | Estímulo | **Se retira** (ver investigación: puntos arbitrarios y efectos grandes sin información aportan poco y se habitúan) |
| Siguiente paso | Reduce carga cognitiva | **Se conserva y mejora** con explicación de por qué se recomienda |
| Export/Import JSON | Portabilidad | **Se conserva** (exporta v2; importa v1 y v2) |
| Sync Supabase | Multi-dispositivo | **Se rehace** por filas con cola offline |

## Contradicciones detectadas entre la arquitectura v1 y la nueva especificación

1. **"Single-file, no reescribas index.html" (CLAUDE.md) vs. producto con 5 pantallas, auth y sync por filas.** Alternativa elegida: módulos ES nativos sin *bundler* ni dependencias (`/app/*.js`). Mantiene "sin build, sin frameworks" (lo esencial de la regla) y hace el código mantenible. El `index.html` v1 queda en el historial de git y en el despliegue anterior de Vercel (rollback inmediato).
2. **"No cambies el esquema sin plan de migración" vs. modelo relacional.** Se cumple con plan: backup lógico (las tablas `bitacora_state`/`bitacora_history` **no se tocan**), conversión determinista e idempotente v1→v2 en el cliente, y script de rollback SQL.
3. **"Datos solo en el dispositivo" (spec original) vs. sync.** Ya resuelto por decisión del dueño: se sincroniza con RLS.
4. **Jerarquía fija (inglés primero) vs. producto general.** El producto v2 es general; el inglés pasa a ser un proyecto más, y el usuario decide qué es importante.
5. **Estética oscura "dopamina" (última petición) vs. esta especificación (profesional, claro y oscuro, sin efectos exagerados).** Prevalece la especificación más reciente.
