# Informe final — Bitácora v2

Fecha: 2026-09-15 · De `b9c07ab` (v1) a v2 · URL: https://bitacora-three-omega.vercel.app

## 1. Arquitectura anterior

Un `index.html` de 967 líneas (HTML + CSS + JS), `sync.js` (382) y `sw.js` (70). Estado en un único objeto guardado como JSON en `localStorage['bitacora-v1']`; copia remota en una sola fila de Supabase (`bitacora_state`) más instantáneas horarias (`bitacora_history`). Sin rutas, sin pantallas, sin capa de dominio. Autenticación por email/contraseña dentro de un diálogo.

## 2. Problemas encontrados

| # | Problema | Consecuencia |
|---|---|---|
| 1 | Producto atado a un plan personal (inglés, empleo, deuda) | No servía al público general pedido |
| 2 | Documento JSON único en cliente y servidor | Se resubía entero en cada cambio; imposible consultar, filtrar o analizar; no escala con el historial |
| 3 | Sin proyectos ni línea temporal | No respondía "¿en qué trabajo?" ni "¿qué hice?" |
| 4 | "Cerrar semana" manual | Si se olvidaba, el historial quedaba incompleto |
| 5 | XP, niveles y confeti en cada acción | Puntos sin significado; efecto que se habitúa; estética de videojuego |
| 6 | Sin cabeceras de seguridad ni CSP | Riesgo mayor ante XSS (con tokens en `localStorage`) |
| 7 | Google Fonts | Render bloqueado por un tercero y la IP del usuario enviada a Google |
| 8 | Solo tema oscuro, textos de 10–11 px, sin `:focus-visible` | Accesibilidad por debajo de AA en varios puntos |
| 9 | Sin Google, sin recuperación de contraseña, sin perfil | Requisitos de la nueva especificación |
| 10 | Monolito de 967 líneas | Cada cambio tocaba todo el archivo |

## 3. Cambios realizados

- **Producto nuevo** alrededor de 5 pantallas: Hoy, Proyectos (+ detalle), Registro, Progreso, Ajustes, con captura rápida desde cualquier sitio (`+`, `N`, `⌘K`).
- **Modelo relacional** en Supabase (`profiles`, `projects`, `milestones`, `tasks`, `activities`, `events` + vista `daily_stats`) con RLS y políticas probadas.
- **Sincronización por filas** con cola offline (IndexedDB), bajadas incrementales y resolución "gana la última edición" también en el servidor.
- **Migración v1 → v2** determinista e idempotente, con respaldo lógico previo y script de rollback.
- **Autenticación completa**: email/contraseña, Google (cuando se active), recuperación, sesión persistente, perfil y modo prueba sin cuenta.
- **Gamificación moderada** basada en evidencia; se retiran XP, niveles y confeti.
- **Diseño nuevo**: claro/oscuro, tipografía del sistema, contraste AA, objetivos táctiles ≥44 px.
- **Seguridad**: CSP estricta, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`; cero scripts inline.
- **Documentación**: auditoría, investigación con referencias, diseño, este informe y consultas de métricas.

## 4. Nueva arquitectura

```
Navegador (PWA)
 ├─ index.html  cáscara mínima, sin scripts inline
 ├─ app/*.js    módulos ES nativos (sin build, sin dependencias)
 │   main → router + acciones      model → dominio derivado
 │   store → mutaciones + outbox   db → IndexedDB + memoria
 │   sync ↔ api → Supabase REST    views/* → pantallas
 └─ sw.js       red primero + respaldo offline
        │
        ▼ HTTPS (solo el dominio de Supabase permitido por CSP)
Supabase: Auth (JWT) + PostgREST + Postgres con RLS por usuario
```

Escritura: memoria → render (<16 ms) → IndexedDB → cola → subida (~1 s después). Lectura al abrir: memoria; en paralelo se bajan los cambios de otros dispositivos.

## 5. Modelo de datos

| Tabla | Campos clave | Notas |
|---|---|---|
| `profiles` | `display_name`, `timezone`, `focus_areas`, `prefs` jsonb, `onboarded_at`, `migrated_v1_at` | 1:1 con `auth.users`, creada por trigger |
| `projects` | nombre, objetivo, estado, color, etiquetas, fechas, `metric_start/current/target/unit`, `progress_manual` | Progreso por métrica, o por hitos y tareas |
| `milestones` | `project_id`, título, fecha, `done_at`, orden | Peso doble en el progreso |
| `tasks` | `project_id?`, título, notas, estado (`todo/doing/waiting/done`), prioridad, fecha, `waiting_on`, `completed_at` | "En espera" sustituye a los pendientes de terceros |
| `activities` | `project_id?`, `task_id?`, tipo (`done/progress/note/win`), título, cuerpo, `occurred_at`, etiquetas, origen | El registro; `occurred_at` permite fechar en pasado |
| `events` | nombre, `props`, fecha | Métricas internas, desactivables |

Comunes: `id` UUID de cliente, `created_at`, `updated_at`, `deleted_at` (borrado lógico que **vacía el contenido**), `synced_at` (servidor).

**No se crearon** `preferences` (van en `profiles.prefs`), `achievements` ni `daily_stats` (se calculan; queda la vista) ni `notifications` (los avisos son locales; la tabla llegará con las push).

## 6. Decisiones de UX

1. **Registrar antes que navegar**: botón `+` siempre visible; guardar en 2 toques.
2. **Una sola recomendación** en Hoy, con el motivo a la vista y opción "Otra".
3. **Detección local y visible** en la captura (tipo, `#proyecto`, "ayer", tarea parecida): se puede cambiar antes de guardar.
4. **Deshacer** en cada acción importante, en vez de diálogos de confirmación.
5. **Sin "cerrar semana"**: el cumplimiento se calcula solo; no se puede olvidar ni maquillar.
6. **Paginación explícita** ("Cargar más"), nunca scroll infinito.
7. **Proyecto sin meta** muestra el número de registros, no un 0% que se lee como fracaso.
8. **Transparencia**: Ajustes → "Cómo funciona" explica racha, progreso, recomendación y logros.

## 7. Decisiones de gamificación

Se implementan barras de progreso, feedback de completado, **días activos por semana con meta elegida por el usuario** (indicador principal), racha sin castigo, hitos, récords personales y 15 logros informativos derivados de datos reales.
Se descartan XP y niveles (puntos arbitrarios; riesgo de sobrejustificación, Deci et al. 1999), clasificaciones (producto personal), recompensas variables (mecánica de azar) y confeti (se habitúa y resta seriedad).
La racha nunca se presenta como pérdida: el registro con fecha pasada permite "reparar" un día olvidado, algo que la evidencia sobre rachas rotas recomienda (Silverman & Barasch 2023).

## 8. Justificación de los colores

Neutros cálidos heredados de la marca (#1B2321 / #E9EBE6) + **un acento** verde azulado para progreso y acción principal, ámbar para racha, y semánticos contenidos. El color señala **estado y jerarquía**, no "emociones": la psicología del color tiene evidencia limitada y dependiente de contexto (Elliot & Maier 2014). Nunca rojo para trabajo pendiente (el rojo se asocia a evitación en tareas de logro); el rojo queda solo para acciones destructivas. Claro por defecto según el sistema (mejor legibilidad en condiciones normales, Piepenbrock et al. 2013) y oscuro disponible. Contraste verificado con script: texto 15,5:1; secundario 5,9:1; acento 5,3:1; racha 4,8:1 (AA en todos).

## 9. Justificación de las microinteracciones

Cada acción responde en menos de 100 ms porque primero se escribe en memoria (umbral de "instantáneo", Card et al. 1991). El feedback es informativo, no decorativo: check dibujado en 340 ms, transición de la barra de progreso en 450 ms, toast con el cambio real ("Plan 12 meses 43% → 57%") y Deshacer durante 5 s. Vibración de 10 ms opcional (mejora el rendimiento táctil, Hoggan et al. 2008); sonido opcional desactivado por defecto. Estados definidos para foco, pulsado, cargando (solo en red), error y vacío. `prefers-reduced-motion` desactiva todo el movimiento.

## 10. Estrategia de retención (ética)

Valor acumulativo (historial, mapa de actividad, récords), continuidad (siguiente acción, revisión semanal en lunes por el efecto "nuevo comienzo"), personalización (patrones propios) y ausencia de culpa al volver tras una pausa. Ninguna mecánica busca uso compulsivo: no hay notificaciones de reenganche, ni rachas que se "pierden", ni recompensas aleatorias. La razón para volver es ver el progreso propio.

## 11. Estrategia de notificaciones

MVP sin servidor: avisos **dentro de la app**, máximo uno visible, descartables y con frecuencia configurable (todos / solo importantes / ninguno): resumen semanal, hito cercano, proyecto parado ≥5 días y logros. Las push quedan diseñadas para la siguiente fase (Edge Function + cron + VAPID; en iOS solo con la PWA instalada) y serán **agrupadas**, porque agrupar notificaciones mejora atención y ánimo mientras que suprimirlas del todo aumenta la ansiedad (Fitz et al. 2019).

## 12. Seguridad

- RLS en todas las tablas con `select/insert/update/delete` solo del propietario. Probado en un Postgres local simulando Supabase: otro usuario no ve ni modifica datos ajenos, ni con `upsert` sobre un id conocido ni suplantando `user_id`; el rol anónimo no tiene acceso.
- CSP estricta (`script-src 'self'`, `connect-src` limitado al proyecto de Supabase), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, HSTS de Vercel. Sin scripts inline.
- Todo el contenido del usuario se escapa antes de insertarse en HTML.
- Solo claves públicas en el cliente; la publishable key está protegida por RLS. `.env*` fuera del repositorio y del despliegue.
- Borrado lógico que vacía el contenido, y botón para borrar todo (local y nube).

## 13. Performance

Sin build ni dependencias: 21 módulos, 179 KB sin comprimir; con gzip, los tres archivos principales pesan ~19 KB en total. `modulepreload` evita cascadas. Precarga del service worker de 28 archivos, red primero con respaldo offline y caché inmutable para iconos. En local: `DOMContentLoaded` en 25 ms. Escritura local antes de cualquier llamada de red, de modo que registrar es instantáneo incluso sin conexión.

## 14. PWA

Manifest con `id`, `scope`, `display: standalone`, iconos 192/512/maskable + apple-touch-icon, atajos ("Registrar actividad", "Ver progreso") y `theme_color` por tema. Funciona offline (cáscara + datos locales) y sincroniza al volver la conexión. Instalable en Android (Chrome) y iPhone (Compartir → Añadir a pantalla de inicio).

## 15. Preparación para móvil

Comparativa: **Capacitor** es la opción razonable (reutiliza el 100% del código, coste solo de cuentas de tienda, una base de código); React Native exigiría reescribir la interfaz; TWA sirve solo para Android. La arquitectura ya es compatible: rutas por hash, sin servidor propio, datos en IndexedDB y auth por REST. Falta solo configurar *deep links* para el retorno de Google en nativo.

## 16. Preparación para IA

Los datos quedan consultables (`activities`, `daily_stats`) y el cliente ya produce "patrones" con estadística simple en `model.insights()`, con un contrato `{id, icon, text}` que una Edge Function podrá alimentar más adelante (resumen semanal, detección de patrones, sugerencias). El MVP **no llama a ningún modelo** y no tiene coste de IA.

## 17. Costos actuales

| Concepto | Coste |
|---|---|
| Vercel (Hobby) | 0 USD |
| Supabase (Free: 500 MB de base, 50.000 usuarios activos/mes) | 0 USD |
| Dominio | 0 USD (subdominio .vercel.app) |
| IA / analítica de terceros | 0 USD (no se usan) |
| **Total** | **0 USD/mes** |

## 18. Costos futuros (estimación)

| Escenario | Coste aproximado |
|---|---|
| Dominio propio | 10–15 USD/año |
| Supabase Pro (si se superan los límites o se quiere evitar la pausa por inactividad) | 25 USD/mes |
| Push (Edge Functions + cron) | 0 USD en el plan gratuito |
| Publicar en tiendas con Capacitor | 99 USD/año (Apple) + 25 USD una vez (Google) |
| Resúmenes con IA | Según uso; un resumen semanal por usuario es de centavos al mes |

## 19. Riesgos

| Riesgo | Mitigación |
|---|---|
| La migración 002 aún no está aplicada en Supabase | La app funciona en local y avisa ("Falta aplicar la migración"); nada se pierde |
| Conflictos entre dispositivos | "Gana la última edición" por fila, en cliente y servidor; la cola no se pierde offline |
| Proyecto Supabase gratuito se pausa tras una semana sin uso | Uso habitual lo evita; si pasa, se reactiva desde el panel |
| Datos solo en un dispositivo en modo prueba | Aviso visible y adopción al crear cuenta |
| `localStorage` guarda el token (riesgo ante XSS) | CSP estricta, escape total, sin scripts inline ni dependencias externas |
| Crecimiento del historial | Modelo relacional, bajadas incrementales y paginación |
| Login con Google no probado de extremo a extremo | Requiere activarlo en Supabase + Google Cloud; el botón aparece solo si está activo |

## 20. Próximas funcionalidades recomendadas

1. Aplicar la migración y activar Google Sign-In (10 minutos).
2. Push agrupadas (resumen diario/semanal) con Edge Function + VAPID.
3. Resumen semanal con IA, opcional y bajo demanda.
4. Vista de calendario y filtros guardados en el Registro.
5. Plantillas de proyecto por área (curso, cliente, hábito).
6. Compartir un informe de progreso (enlace de solo lectura) para reuniones o clientes.
7. Empaquetado con Capacitor para Android/iOS.
8. Recordatorio a la hora habitual detectada, opcional y con un solo toque para desactivar.

---

## Qué cambié y por qué

| Cambio | Motivo |
|---|---|
| Producto general con proyectos y registro | Lo pedido: GitHub + diario profesional + gestor de progreso |
| Modelo relacional con sincronización por filas | El documento único no escala ni se puede consultar |
| Módulos ES en vez de un solo archivo | 3.500 líneas en un archivo no son mantenibles; sigue sin build ni dependencias |
| Fuera XP, niveles y confeti | Evidencia: recompensas arbitrarias no aportan y pueden restar motivación intrínseca |
| Tema claro + oscuro, tipografía del sistema | Legibilidad, contexto de uso, privacidad y rendimiento |
| Cabeceras de seguridad y CSP | No existían |
| Auth completa + modo prueba | Requisito, y reduce la fricción inicial |
| Avisos locales en vez de notificaciones push | Valor sin servidor ni spam; las push llegan después bien diseñadas |

## Qué NO cambié y por qué

| No cambiado | Motivo |
|---|---|
| Tablas `bitacora_state` y `bitacora_history` | Son el respaldo de tus datos v1; se añadió además `bitacora_state_backup_v1` |
| Vercel + Supabase + estático sin build | Funciona, cuesta 0 y cumple los requisitos; cambiarlo sería sobreingeniería |
| Ausencia de dependencias | Es una ventaja real de mantenimiento y seguridad; PostgREST y GoTrue se usan bien con `fetch` |
| El icono y el nombre | Identidad ya establecida en tu teléfono |
| La clave `bitacora:session` | Mantiene la sesión abierta tras la actualización |
| Exportar/importar JSON | Ya funcionaba; ahora acepta copias v1 y v2 |
| El hábito de inglés como concepto | Se conserva como proyecto migrado con su historial diario, pero deja de estar cableado en la app |
