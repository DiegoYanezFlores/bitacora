# IMPACABLE TECHNICAL IMPLEMENTATION PLAN v1.0: Bitácora

> **El producto se sigue llamando Bitácora.** "Impacable" es el nombre de la serie de documentos (research → blueprint → UX → este plan). Impeccable es la herramienta de diseño que se usa en el proyecto, no el nombre de la app.

> **Paso 4: análisis y planificación técnica.** No se modificó código, no se instalaron dependencias y no se ejecutaron migraciones.
> Proyecto auditado: `trakerPersonal/` (repo `DiegoYanezFlores/bitacora`, rama `docs/impacable-blueprint`, último commit de código `eb92cc9`).
> Fecha: 2026-09-18.

**Decisiones tomadas por el dueño (2026-09-18)**

| ID | Decisión | Efecto en el plan |
|---|---|---|
| P-01 | El nombre sigue siendo **Bitácora** | No se renombra nada, ni lo visible ni lo interno. TDR-10 queda simplificado y desaparece el riesgo R9 |
| P-02 | **Uso personal ahora, comercialización después** | La arquitectura se diseña para varios usuarios desde ya (RLS, FK compuestas, cuotas). Se añade un **gate de comercialización** (F9b, §24) con lo imprescindible antes de abrir a terceros |
| P-05 | Se adopta cobalto + ámbar **en versión de colores vivos** | §17.3 define la paleta viva y su verificación de contraste |
| P-07 | Se puede cerrar un hito con criterios pendientes | Con confirmación y la etiqueta "Cerrado con 3 de 5 criterios" (§8.4) |

**Convenciones de este documento**

| Etiqueta | Significado |
|---|---|
| **[EXISTE]** | Está en el código y funciona así hoy (verificado leyendo el código, no la documentación) |
| **[MODIFICAR]** | Existe, pero requiere cambios importantes |
| **[NUEVO]** | Requiere desarrollo nuevo |
| **[OPCIONAL]** | Útil, pero no bloquea nada |
| **[FUTURO]** | Fuera del alcance de este plan (V2+ o P2/P3) |
| **DECISIÓN PENDIENTE** | No se puede decidir con la información disponible; ver §29 |

Complejidad aproximada: **S** (≤ 1 módulo, sin cambios de esquema) · **M** (varios módulos o un cambio de esquema pequeño) · **L** (módulo nuevo completo o cambio de esquema con migración de datos) · **XL** (infraestructura nueva o cambio transversal). No se estiman horas.

---

## 1. Executive Summary

**Qué hay hoy.** Bitácora v2 es una PWA estática sin frameworks ni build: módulos ES nativos (unas 3.400 líneas de JS y CSS), IndexedDB como almacén local con una cola de cambios (outbox), sincronización por filas con Supabase (PostgREST + Auth por `fetch`, sin SDK), RLS por usuario y despliegue manual en Vercel. Es sólida en lo que ya hace: captura en un toque, offline-first, conflictos resueltos por "gana la edición más reciente" en cliente y servidor, migración v1→v2 idempotente y borrado lógico que vacía el contenido.

**Qué pide la nueva especificación.** Pasar de "registro de trabajo con proyectos y tareas" a "construir progreso real con evidencia": Visión → Objetivo → Etapa → Hito (con criterios) → Acción → Evidencia, con dos ejes separados (**Avance** y **Constancia**), un contribution graph por significancia, recaps narrativos y una gamificación mínima sin rachas diarias.

**Veredicto técnico.** **No hace falta rehacer la arquitectura.** El patrón actual (datos locales, outbox, filas con `updated_at`/`deleted_at`/`synced_at`, RLS y lógica de dominio derivada en el cliente) sirve para todo lo que pide el producto. Tampoco hacen falta backend propio ni jobs en segundo plano en el MVP: progreso, gráfico, timeline y recaps se calculan en el cliente a partir de los datos locales. Solo hay **tres piezas de infraestructura nuevas**:

1. **Supabase Storage** para la evidencia en archivo (bucket privado, políticas por carpeta de usuario, URLs firmadas y cola de subida offline).
2. **Migración 003**: 8 tablas nuevas y columnas en 4 existentes, todo aditivo, con propiedad reforzada por claves foráneas compuestas.
3. **Una capa mínima de animación y paneles** encima del render por `innerHTML`, porque el render actual redibuja la vista entera y hace imposible animar el cambio de progreso (motivo real por el que se quitaron las transiciones de las barras).

**Lo que más cambia es la lógica, no la infraestructura.** El cálculo de progreso actual cuenta tareas (`(hitos×2 + tareas) / total`), justo el "100 tareas = 100%" que el Blueprint prohíbe. La racha diaria con llama, los logros por volumen ("100 actividades") y la lista de logros bloqueados con contador contradicen el Blueprint y la especificación UX. Todo eso se sustituye.

**Recomendación de secuencia (§24):** preparación y pruebas → esquema 003 y sync → fundación visual (tokens, contenedor centrado, navegación) → estructura y motor de progreso → Inicio, onboarding y regreso → gráfico → evidencia con archivos → recap semanal (**fin del MVP**) → timeline, logros, reflexiones y recap mensual (V2). La interfaz nueva se construye en paralelo a la actual y se activa con un interruptor, para no quitar funcionalidad mientras se construye.

**Riesgos que podrían obligar a rehacer partes (§26):** (1) cambiar el modelo de progreso hace que los % actuales bajen o desaparezcan; (2) la sincronización rechaza para siempre las filas que fallan por clave foránea (error 409), un fallo que ya existe y crece con más tablas relacionadas; (3) la evidencia en archivo introduce cuotas, CSP, blobs offline y borrado físico; (4) el render por `innerHTML` completo frente a los paneles y animaciones que pide la UX.

---

## 2. Sources of Truth

| Nivel | Documento | Uso en este plan |
|---|---|---|
| Research | `docs/investigación realizada.md` | Justificación de mecanismos: [A] evidencia, [B] patrón, [C] hipótesis, [D] riesgo |
| Product | `docs/IMPACABLE PRODUCT BLUEPRINT v1.0.md` | Entidades, modelo de progreso, reglas de evidencia, gamificación, MVP |
| UX/UI | `docs/IMPACABLE UX:UI SPECIFICATION v1.0.md` | Navegación, pantallas, componentes, tokens, responsive, microinteracciones |
| Código real | `app/`, `supabase/migrations/`, `sw.js`, `vercel.json`, `index.html` | Estado actual; manda sobre cualquier documentación que lo describa |
| Histórico | `docs/01–04`, `docs/metricas.sql`, `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md` | Solo contexto: decisiones previas, restricciones técnicas y problemas conocidos |

**Restricciones heredadas que se mantienen** (de `CLAUDE.md`; no contradicen los tres documentos actuales):
- Sin frameworks, sin build y sin dependencias de runtime.
- El esquema no cambia sin migración numerada, conversión en cliente y rollback.
- Los datos v1 (`bitacora_state`, `bitacora_history`, `bitacora_state_backup_v1`) no se tocan nunca.
- Todo contenido del usuario se escapa con `esc()`.
- Nada de patrones oscuros.
- En `config.js` solo va la clave publicable; jamás la `service_role`.

**Contradicciones entre documentos detectadas** (resueltas a favor de los tres actuales):

| # | Contradicción | Resolución |
|---|---|---|
| C1 | `CLAUDE.md`, `PRODUCT.md` y `docs/03` aceptan "racha sin castigo" diaria; el Blueprint §10 y la UX §14 eliminan la racha diaria | Se elimina; se usa Constancia semanal + Momentum |
| C2 | `DESIGN.md` define acento verde `#0B7A5C` y color "streak" naranja; la UX §21 define primario cobalto `#3A56D4` y acento ámbar solo para hitos | Manda la UX (ver DECISIÓN PENDIENTE P-05) |
| C3 | `PRODUCT.md` define un único usuario real (el dueño); el Blueprint diseña para el público general (personas A–E) | Afecta a plantillas, cuotas y borrado de cuenta: **DECISIÓN PENDIENTE P-02** |
| C4 | La investigación pone el journal de una línea en P0; la UX pone Reflexiones en P1 | Reflexión de una línea al registrar = P0; vista Historia › Reflexiones = P1 |
| C5 | La UX §3 menciona `docs/IMPACABLE_PRODUCT_BLUEPRINT.md` | El archivo real es `docs/IMPACABLE PRODUCT BLUEPRINT v1.0.md`; es solo una referencia |
| C6 | El Blueprint §10 deja que el usuario elija N en "constancia semanal"; la UX §14 fija N=2 por defecto; la preferencia actual es `weeklyGoal: 4` | Por defecto 2 para usuarios nuevos; se respeta el valor guardado de los existentes |

---

## 3. Current System Audit

### 3.1 Inventario técnico (verificado en código)

| Área | Estado real | Dónde |
|---|---|---|
| Framework | **Ninguno.** HTML + módulos ES nativos servidos tal cual | `index.html`, `app/` |
| Lenguajes | JavaScript (módulos ES, `?.`, `??`), CSS, SQL (PostgreSQL), Python solo para generar iconos | — |
| Frontend | Vistas que devuelven strings HTML; el router escribe `#view.innerHTML` completo en cada render | `app/main.js:render()` |
| Backend | **Supabase gestionado**: PostgREST, GoTrue (Auth) y Postgres. Sin servidor propio ni Edge Functions | `app/api.js`, `supabase/migrations/` |
| Base de datos | Postgres con 6 tablas v2 + vista `daily_stats`, más las 3 tablas v1 intactas | `002_v2.sql` |
| ORM | Ninguno. Acceso REST directo con `fetch` | `app/api.js:api()` |
| Autenticación | Email y contraseña, recuperación por correo y Google (implícito; el botón solo aparece si el proveedor está activo). Sesión en `localStorage['bitacora:session']` con refresco | `app/api.js`, `app/views/auth.js` |
| Autorización | RLS `(select auth.uid()) = user_id` en select, insert, update y delete; `anon` revocado | `002_v2.sql §10` |
| API | PostgREST: `POST ?on_conflict=id` (upsert por lotes de 200), `GET ?synced_at=gt.X` (bajada incremental), `DELETE ?user_id=eq.X` | `app/sync.js` |
| Routing | Hash router: `#/today`, `#/projects`, `#/project/:id`, `#/tasks`, `#/log`, `#/progress`, `#/settings`; query `?capture=1` | `app/main.js:parseHash()` |
| Estructura | `app/{main,db,store,sync,api,model,actions,capture,migrate,ui,lib}.js` + `app/views/*.js` + `app/styles.css` | — |
| Componentes | Funciones que devuelven HTML: `activityRow`, `taskRow`, `projectCard`, `bar`, `empty`, `icon`, `dot` | `app/ui.js` |
| Páginas | Hoy, Proyectos, Proyecto, Tareas, Registro, Progreso, Ajustes, Acceso, Onboarding (4 pasos) | `app/views/` |
| Layouts | Un solo shell: `#navside` (≥1000 px), `#view`, `.fab` y `#nav` (tabbar), más `dialog#sheet` y `#toast` | `index.html`, `styles.css` |
| Hooks | No aplica (no hay framework). El equivalente es `store.subscribe` → `scheduleRender` (rAF) | `app/main.js:wire()` |
| Stores | `db.js`: `Map` en memoria + IndexedDB `bitacora` v1 (stores projects, milestones, tasks, activities y kv). `store.js`: mutaciones, outbox, perfil y prefs | — |
| Servicios | `api.js` (auth + REST), `sync.js` (push/pull/perfil/eventos), `migrate.js` (v1→v2, import/export) | — |
| Modelos | `model.js`: colecciones memorizadas por `db.rev` más lógica derivada (progreso, racha, semana, periodos, siguiente acción, avisos, patrones, récords, logros, mapa de calor) | 371 líneas |
| Schemas | SQL con `check` de longitud y enum, triggers `bt_sync_row` y `bt_handle_new_user` | `002_v2.sql` |
| Estilos | Un solo `styles.css` (435 líneas) con tokens en `:root`, oscuro por `prefers-color-scheme` y `[data-theme]`, dos breakpoints (620 y 1000 px) | — |
| Design system | Tokens CSS + `DESIGN.md` (impeccable). Tipografía del sistema, radios 14/10/7 | — |
| Librerías UI y de animación | **Ninguna.** Keyframes CSS (`draw`, `sheet-up`, `spin`) y `prefers-reduced-motion` global | `styles.css` |
| Estado | Objetos `state` por vista (filtros, límites), sesión en `store.session` (objeto mutable exportado), `db.rev` para invalidar memos | — |
| Validación | Atributos HTML (`required`, `maxlength`) + `check` en la base de datos. Sin validación centralizada en cliente | `actions.js` |
| Formularios | `openSheet(html, { onSubmit })` + `FormData`; sin librería | `app/ui.js`, `app/actions.js` |
| Errores | `ApiError` + `humanError()`; toast; pantalla de error de arranque con "Recargar"; estados de sync (`ok/syncing/pending/offline/error/migration/guest`) | `api.js`, `main.js` |
| Testing | **No hay.** Existe `capture.js: export const _test` sin ejecutor. Sin CI. Las pruebas anteriores fueron manuales en navegador y con Postgres local | — |
| Configuración | `config.js` (URL + clave publicable), `vercel.json` (CSP y cabeceras), `manifest.json`, `sw.js` | — |
| Variables de entorno | `.env.local` (generado por Vercel CLI; excluido de git y del deploy). La app no lee variables en runtime | `.gitignore`, `.vercelignore` |
| Deployment | Manual: `vercel --prod --yes`. GitHub privado sin integración automática ni CI | — |
| Integraciones | Solo Supabase | — |
| Almacenamiento de archivos | **No existe.** Ni Storage ni subidas; la CSP solo permite `img-src 'self' data:` | `vercel.json` |
| Usuarios | Supabase Auth; perfil 1:1 (`profiles`) creado por trigger; modo invitado local que se adopta al crear cuenta | `main.js:startAfterAuth` |
| PWA | SW red-primero con timeout de 3,5 s y precaché manual de 28 archivos (`bitacora-v3`), manifest con atajos | `sw.js`, `manifest.json` |

### 3.2 Hallazgos: deuda técnica, errores y riesgos (verificados)

| # | Tipo | Hallazgo | Evidencia | Impacto |
|---|---|---|---|---|
| H1 | **Bug de sync** | Una fila rechazada con 4xx (incluido **409 por clave foránea**) se aparta a `syncRejected` y **sale de la outbox para siempre**; el usuario no lo ve | `sync.js:push()`: el `catch` por fila guarda en `syncRejected` y `clearPending(sent…)` incluye las rechazadas | Hoy es raro; con Etapas → Hitos → Criterios → Acciones → Evidencia (más profundidad de claves foráneas) será frecuente si un hijo se sube antes que su padre. **Alto** |
| H2 | Bug | `model.project(id)` devuelve proyectos **borrados** (con el nombre vaciado): la fila de una actividad muestra un chip con nombre vacío | `model.js:project`, `ui.js:activityRow/projectChip` | Bajo, visible |
| H3 | Fragilidad | Reabrir un hito borra su actividad buscando por **texto** `Hito: ${m.title}`; si se renombró, queda una actividad huérfana | `actions.js:toggleMilestone` | Medio; se resuelve con `milestone_id` en actividades |
| H4 | **Layout** | En escritorio el contenido queda **pegado a la izquierda** en una columna de 640 px: `.view{max-width:640px;margin:0 auto}` y en `@media(min-width:1000px)` `.view{margin:0}` | `styles.css` | Es la causa raíz que pregunta la UX §34.4. **Alto (UX)** |
| H5 | Arquitectura | Cada `store.emit()` (incluidas las bajadas de sync) redibuja la vista entera por `innerHTML`. Las transiciones de barras se quitaron porque se reiniciaban | `main.js:render()` | Bloquea la animación de progreso de 400 ms, el check que se dibuja y los paneles laterales persistentes. **Alto** |
| H6 | Dominio | `progress()` cuenta tareas completadas (hitos ×2 + tareas) y prioriza la métrica: es manipulable | `model.js:progress` | **Contradice el Blueprint §5**. Alto |
| H7 | Dominio | Racha diaria con icono de llama, "días seguidos" en Hoy y `--streak` naranja | `today.js:statsRow`, `progress.js` Récords | Contradice el Blueprint §10 y la UX §14 |
| H8 | Dominio | Logros por volumen (`acts10…acts500`, `days100`, `streak7`, `tasks25`) y lista de bloqueados con progreso y contador `x/15` | `model.js:achievements`, `progress.js` | Contradice el Blueprint §9 y la UX §13 ("sin bloqueados ni 12/87") |
| H9 | Dominio | Aviso "“X” lleva N días sin avances. ¿Lo retomas o lo pausas?" | `model.js:notices` | Roza el mensaje moral que prohíbe la UX §11 y §15; se reformula |
| H10 | Dominio | Mapa de calor de 18 semanas con intensidad por **conteo** (1, 2–3, 4–5, 6+) | `model.js:heatmap` | La UX pide significancia, 12 meses, marcadores y días de descanso |
| H11 | Accesibilidad | El mapa y el gráfico son `role="img"` con celdas que solo tienen `title` (no operable por teclado); `.act-dot` lleva `aria-label` en un `span` sin rol | `progress.js`, `ui.js` | Incumple la UX §24 (teclado y resumen textual) |
| H12 | Mantenibilidad | `main.js` (381 líneas) mezcla router, mapa de acciones, auth, arranque y HTML de "Cómo funciona" | — | Crecerá con cada pantalla; conviene partirlo |
| H13 | Mantenibilidad | `model.js` mezcla acceso a datos (memo sobre `db`) con lógica pura; no se puede probar en Node sin DOM ni IndexedDB | — | Bloquea las pruebas unitarias del motor de progreso |
| H14 | PWA | `PRECACHE` del SW y `modulepreload` de `index.html` son listas manuales; un módulo nuevo sin añadir no funciona offline | `sw.js`, `index.html` | Medio; cada fase añade módulos |
| H15 | Seguridad | Las claves foráneas (`milestones.project_id`, etc.) **no verifican que el padre pertenezca al mismo usuario**; RLS no se aplica a la comprobación de FK | `002_v2.sql` | Un usuario que conozca un UUID ajeno podría enlazar hijos a un padre ajeno, y el `on delete cascade` del dueño borraría filas del otro. No hay fuga de lectura. Medio |
| H16 | Configuración | `manifest.json` fuerza `orientation: portrait-primary` | — | Contradice el layout de tablet horizontal (UX §20) |
| H17 | Obsoleto | Comentario de `config.js` apunta a `supabase/schema.sql` (no existe) y habla de `localStorage` | — | Cosmético |
| H18 | Rendimiento | `progress()`/`projectInfo()` filtran todas las tareas, hitos y actividades por proyecto en cada tarjeta (O(P×N)); `period()` recorre todas las actividades | `model.js` | Irrelevante a la escala actual; se resuelve con índices por padre en el memo |
| H19 | Producto | Onboarding de 4 pasos (nombre → áreas → proyecto → actividad) | `onboarding.js` | La UX pide 3 pasos en <2 min, con plantillas y progreso dotado |
| H20 | TODO/FIXME | **No hay** `TODO`/`FIXME`/`HACK` en el código | `grep` | — |
| H21 | Código muerto | Casi nulo. `capture.js:_test` sin uso; `db.counts()` solo en el arranque | — | — |

**Lo que funciona bien y se conserva:**
- Captura con detección local (`capture.js:parse`: tipo, `#proyecto`, "ayer" y tarea parecida).
- Deshacer en todas las acciones.
- Feedback con delta real ("X 72% → 74%").
- Outbox resistente (si falla un registro, no bloquea la cola).
- Migración determinista con `stableUuid`.
- Borrado lógico que vacía el contenido.
- Pantalla de error de arranque.
- Copia de seguridad antes de un cambio de cuenta.
- Modo invitado.
- Tema claro y oscuro con AA verificado.
- CSP estricta.

---

## 4. Current Architecture

```
┌──────────────────────────── Navegador (PWA) ────────────────────────────┐
│ index.html ─ config.js (URL + publishable key)                          │
│   └─ app/main.js  router hash · ACTIONS (delegación click) · auth flow  │
│        ├─ views/*.js   render() → string HTML  → #view.innerHTML        │
│        ├─ actions.js   mutación + feedback + deshacer + formularios     │
│        ├─ capture.js   hoja de captura + parse local                    │
│        ├─ model.js     derivados memorizados por db.rev                 │
│        ├─ store.js     create/update/remove/restore · outbox · prefs    │
│        ├─ db.js        Map en memoria  ⇄  IndexedDB 'bitacora' v1       │
│        ├─ sync.js      push (lotes 200) · pull (synced_at>cursor-30s)   │
│        └─ api.js       fetch → /auth/v1/* y /rest/v1/*                  │
│ sw.js  red-primero 3,5 s · precache manual · iconos caché-primero       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS (CSP connect-src = proyecto)
┌──────────────────────────────────▼──────────────────────────────────────┐
│ Supabase  mdtnlifdctobxtrvnqwp                                          │
│  Auth (email, Google opcional) · PostgREST · Postgres                   │
│  profiles · projects · milestones · tasks · activities · events         │
│  daily_stats (view, security_invoker) · trigger bt_sync_row (LWW)       │
│  v1 intacto: bitacora_state · bitacora_history · bitacora_state_backup  │
└─────────────────────────────────────────────────────────────────────────┘
Vercel: estático, cabeceras (CSP, nosniff, X-Frame-Options DENY), deploy manual.
```

**Flujo de una escritura:** acción → `store.create/update` → `db.put` (memoria + IndexedDB) → `markDirty` (outbox en kv) → `emit` → render (rAF) + `sync.schedule(1200 ms)` → upsert por tabla en orden `projects → milestones → tasks → activities` → `bt_sync_row` descarta ediciones más antiguas y fija `synced_at` → la bajada incremental aplica filas remotas más nuevas que la local.

**Propiedades que la nueva versión debe preservar:**
- Lecturas síncronas desde memoria (render instantáneo).
- Funcionamiento offline.
- Idempotencia de la migración.
- Resolución de conflictos por fila.
- Que el servidor sea una réplica protegida por RLS y no la fuente de la lógica.

---

## 5. Gap Analysis

### 5.1 Resumen por categoría

| Categoría | Elementos |
|---|---|
| **EXISTENTE** (se reutiliza tal cual) | Auth completo y modo invitado · outbox y sync por filas · IndexedDB con memoria · borrado lógico + deshacer · `stableUuid` · exportar e importar JSON · tema claro y oscuro · CSP y cabeceras · SW red-primero · `capture.js:parse` · `openSheet`/`confirmSheet`/`feedback` · escape `esc()` · vista `daily_stats` (analítica) |
| **PARCIAL** (se modifica) | `projects` → Objetivo · `milestones` → Hito (etapa, peso, criterios) · `activities` → Acción (vínculo a hito, duración) · `tasks` → Próximos pasos (vínculo a hito) · `heatmap` → Contribution graph · `week`/`records` → Constancia · `nextActions` → siguiente acción anclada al hito · `notices` → avisos sin juicio · onboarding · Registro → Historia › Actividad · Ajustes → Tú · sync (orden y 409) · SW (precaché) · CSP (Storage) · tokens y layout |
| **FALTANTE** (nuevo) | Etapas · Criterios · Evidencia + Storage · Reflexiones · Logros persistidos (ledger) · Días de descanso · Registro de cambios de rumbo · Recaps · Motor de progreso de dos ejes · Momentum · Significancia diaria · Timeline · Panel del día · WelcomeBack · Plantillas · Capa de animación · Panel lateral · Pruebas automáticas |
| **OBSOLETO** | Racha diaria (`streak()` en UI, icono de llama, `--streak`) · logros por volumen y lista de bloqueados · fórmula de progreso por tareas · `insights()` "Sueles registrar a las HH:00" (estadística sin decisión asociada, UX §1 regla 1) · vista Tareas como destino propio · tarjeta "Cierre del día" (sustituida por la reflexión contextual) |
| **CONFLICTO** | H6, H7, H8, H9 y H10 (§3.2) · C1 y C2 (§2) |

### 5.2 Detalle de los puntos importantes

| Punto | Estado actual | Estado deseado | Diferencia | Impacto técnico | Recomendación |
|---|---|---|---|---|---|
| **Progreso** | `(hitos×2 + tareas)/total`; métrica primero; % manual | Avance = criterios → hito → etapa → objetivo, ponderado S/M/L; separado de Constancia | Fórmula y datos (criterios, peso y etapa no existen) | `model.js`, esquema, todas las vistas con barra | Módulo puro `domain/progress.js` + migración 003. La métrica pasa a "indicador de éxito" (§8) |
| **Jerarquía** | Proyecto → (hitos \| tareas \| actividades), planos | Objetivo → Etapa → Hito → Criterio; Acción → Hito; Evidencia → (Acción \| Hito \| Criterio) | Faltan dos niveles y los vínculos | Esquema y sync (orden de claves foráneas) | Tablas `stages` y `criteria`; `milestones.stage_id` **opcional** (etapa implícita para lo existente) |
| **Tareas** | Entidad central (todo/doing/waiting/done) con fecha y prioridad | El Blueprint no tiene "tarea"; la UX tiene "siguiente acción sugerida" y "repetición" | Concepto | Bajo si se renombra | Se conserva como **Próximos pasos** (acciones planificadas) vinculables a un hito; completarlas genera una Acción (como hoy). No alimentan el Avance |
| **Racha** | Diaria, con llama | Constancia semanal (8 pills, N elegido) + Momentum 28 días + mejor histórico | Cálculo y UI | `model.js`, `today.js`, `progress.js` | `domain/rhythm.js`; se retira la racha de toda la UI |
| **Gráfico** | 18 semanas, por conteo | 12 meses por defecto; semana, mes, año y todo; significancia; ◆ de hito, punto de evidencia, descanso, pausa y hoy; filtros; panel del día; teclado | Todo menos la cuadrícula | Módulo y vista nuevos | `domain/significance.js` + componente `ContributionGraph` |
| **Evidencia** | No existe (salvo `body` de texto) | 8 tipos, niveles 0–3, archivos, portafolio | Infraestructura | Storage, CSP, cola de subida, IndexedDB v2 | Fase propia (§12) |
| **Logros** | 15 reglas por volumen, recalculados | Reales, de progreso y de recuperación, más personales; persistentes y con evidencia | Modelo y reglas | Tabla `achievements` (ledger) | Reglas nuevas; los anteriores se retiran con nota en "Cómo funciona" |
| **Navegación** | Hoy · Proyectos · Registro · Progreso (+ FAB) | Inicio · Objetivos · + · Historia · Tú (mobile) / sidebar 240 o rail 72 | Estructura e IA | `main.js:NAV`, `index.html`, `styles.css` | Rutas nuevas con redirección de las antiguas |
| **Layout** | Columna de 640 px pegada a la izquierda en escritorio | Contenedor centrado de 1200/1320, grid de 12/8/4, lectura a 720 | CSS | `styles.css` | Fase de fundación visual |
| **Recaps** | Aviso de "tu semana pasada" (lunes a miércoles) + vista Progreso | Recap semanal narrativo (MVP), mensual y anual (V2) | Nuevo | `domain/recap.js` + vista | Cálculo en cliente; solo se persiste lo que escribe el usuario |
| **Onboarding** | 4 pasos; crea proyecto y actividad | 3 pasos, plantillas, progreso dotado y "¿Convertimos esto en etapas?" | Contenido y flujo | `onboarding.js` | Reescribir la vista (la parte afectada) |
| **Regreso** | No existe (hay `welcomeBack` para la migración v1) | Pantalla tras ≥7 días, un paso pequeño y logro de recuperación | Nuevo | `main.js` arranque + vista | Detección en el arranque, basada en actividad local |
| **Nombre** | "Bitácora" en título, manifest, IndexedDB, `localStorage` y caché del SW | "Bitácora" (P-01 resuelta) | Ninguna | Ninguno | **No se renombra nada** |

---

## 6. Target Architecture

### 6.1 Principio rector

**Misma arquitectura, más dominio.** El cliente sigue siendo la fuente de la lógica: el progreso, la constancia, el gráfico, la timeline y los recaps se derivan de los datos locales. El servidor es una réplica protegida (RLS) más el almacén de archivos. No se añade backend propio en el MVP.

```
┌──────────────────────────────── Cliente (PWA, sin build) ────────────────────────────────┐
│ app/main.js (arranque) → app/router.js (rutas + redirecciones) → app/shell.js (nav, panel)│
│                                                                                           │
│ views/  home · goals · goal · milestone(panel) · history/{activity,timeline,evidence,     │
│         achievements,reflections} · recaps · recap · you · onboarding · welcome · auth    │
│ components/ (funciones → HTML) progress-segmented · consistency-pills · momentum ·        │
│         contribution-graph · day-panel · evidence-card · timeline-event · celebration ·   │
│         empty/skeleton/error · quick-add                                                  │
│ actions/ goals · milestones · actions · evidence · reflections · days (registro en ACTIONS)│
│ domain/ (PURO, probado con node --test)                                                   │
│         progress · rhythm(constancia+momentum) · significance · timeline · recap ·        │
│         achievements(reglas) · next-step · templates · capture-parse                      │
│ model.js  fachada memorizada por db.rev: lee db, construye índices, llama a domain/*      │
│ store.js  mutaciones + outbox (sin cambios de contrato)                                   │
│ db.js     IndexedDB v2 (+ stores nuevos + 'files' para blobs pendientes)                  │
│ sync.js   orden de claves foráneas extendido · 409 = reintentar · files outbox → Storage │
│ files.js  compresión (canvas), miniaturas, subida, URLs firmadas con caché               │
│ motion.js transiciones post-render (Web Animations API) + reduced motion                  │
└───────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                │ REST (PostgREST) · Auth · Storage
┌───────────────────────────────────────────────▼───────────────────────────────────────────┐
│ Supabase: tablas v2 + 003 (stages, criteria, evidence, reflections, achievements,          │
│ day_marks, goal_log, recaps) · RLS por usuario + FK compuestas · bucket privado 'evidence' │
│ · RPC delete_my_account (P1) · [FUTURO] Edge Function push + pg_cron                       │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Decisiones por capa

| Capa | Decisión | Estado |
|---|---|---|
| **Frontend** | Vanilla ES modules. Separar `domain/` (puro) de `model.js` (memo y acceso a datos). Partir `main.js` en `router.js` + `shell.js` + registro de acciones | [MODIFICAR] |
| **Backend** | Ninguno propio. Supabase gestionado | [EXISTE] |
| **Database** | Migración aditiva `003_impacable.sql` + `003_impacable_down.sql` | [NUEVO] |
| **API** | PostgREST genérico por tabla (el mismo patrón de sync) + Storage REST + 1 RPC (P1) | [MODIFICAR] |
| **Autenticación** | Sin cambios | [EXISTE] |
| **Autorización** | RLS existente + **FK compuestas `(user_id, parent_id)`** en tablas nuevas y existentes + políticas de Storage por carpeta | [MODIFICAR] |
| **Almacenamiento** | IndexedDB v2 (stores nuevos + `files`) · Supabase Storage bucket `evidence` privado | [NUEVO] |
| **Servicios** | `files.js` (subidas), `sync.js` extendido | [NUEVO]/[MODIFICAR] |
| **Estado** | Sin cambios de patrón (store + emit + rAF). Se añade estado de UI "panel abierto" en el router (query `?panel=`) | [MODIFICAR] |
| **Eventos (analítica)** | Tabla `events` existente; se añaden nombres (`milestone_close`, `evidence_add`, `recap_open`…) sin contenido | [MODIFICAR] |
| **Jobs** | **Ninguno en el MVP.** Todo se calcula bajo demanda en el cliente. `pg_cron` solo para limpiar archivos huérfanos (P2) y notificaciones push (FUTURO) | — |
| **Analytics** | `events` + vista `daily_stats` extendida (P2) para las métricas de validación del Blueprint (D7/D30, % hitos cerrados en 30 días, acciones con evidencia) | [MODIFICAR] |
| **Notificaciones** | MVP: **solo dentro de la app** (tarjeta de recap los lunes, invitación al cerrar un hito). Push = FUTURO (Edge Function + VAPID + pg_cron; en iOS solo con la PWA instalada) | [MODIFICAR]/[FUTURO] |
| **Recaps** | `domain/recap.js` en cliente; tabla `recaps` solo para lo que escribe el usuario (respuesta a la pregunta, visto) | [NUEVO] |
| **Achievements** | Reglas puras + **ledger persistente** con id determinista (idempotente entre dispositivos) | [NUEVO] |
| **Progreso** | Derivado, nunca almacenado | [NUEVO] |
| **Contribution graph** | Índice diario derivado (memo por `db.rev`) | [NUEVO] |
| **Timeline** | Derivada de filas existentes + `goal_log` (lo único que no se puede reconstruir: pausas, pivotes y reanudaciones) | [NUEVO] |
| **Journal** | Tabla `reflections` con vínculos opcionales | [NUEVO] |
| **Evidence** | Tabla `evidence` + Storage | [NUEVO] |

**Por qué no hace falta backend ni jobs.** Por usuario y a 5 años, un uso intenso (unas 10 acciones al día) da unas 18.000 acciones y unos cuantos miles de evidencias y reflexiones. Todo cabe en memoria (pocos MB) y cualquier agregación es O(n) en milisegundos. Precalcular en el servidor añadiría una segunda fuente de verdad que habría que sincronizar y no aportaría velocidad. Se revisa si un usuario supera unas 50.000 filas (§20).

---

## 7. Data Model

### 7.1 Mapa conceptual → tablas

```
profiles (1:1 auth.users) ── vision (texto)
   │
   └── projects  «Objetivo»  1 ── n  stages «Etapa»  1 ── n  milestones «Hito»  1 ── n  criteria «Criterio»
          │  1                                                 │  1                     │
          │  n                                                 │  n                     │ 0..1
          ├── tasks «Próximo paso» ── milestone_id? ───────────┤                        │
          ├── activities «Acción» ── milestone_id?, criterion_id? ──────────────────────┘
          ├── evidence «Evidencia» ── (activity_id | milestone_id | criterion_id | goal)  → Storage
          ├── reflections «Reflexión» ── (activity_id | milestone_id | stage_id | goal)?
          └── goal_log «Cambio de rumbo»
   achievements «Logro» (ledger)   day_marks «Descanso»   recaps «Estado de recap»   events (analítica)
```

**Decisión clave (TDR-02):** se **conservan los nombres de tabla existentes** (`projects`, `milestones`, `activities`, `tasks`). En la UI se llaman Objetivo, Hito, Acción y Próximo paso. Renombrar tablas rompería la sync de clientes en caché, la vista `daily_stats`, `docs/metricas.sql` y el rollback, sin ningún beneficio funcional. El mapeo vive en un único lugar (`domain/terms.js`) y en este documento.

### 7.2 Entidades

Todas las tablas sincronizables comparten: `id uuid` (generado por el cliente) · `user_id uuid` (por defecto `auth.uid()`) · `created_at` · `updated_at` (edición) · `deleted_at` (borrado lógico que vacía el contenido) · `synced_at` (servidor) · trigger `bt_sync_row` · RLS de las 4 políticas.

#### User / Profile: `profiles` [MODIFICAR]
- **Propósito:** identidad, preferencias y la **Visión** del usuario.
- **Campos nuevos:** `vision text (≤ 400)`. Visión única en el MVP; varias visiones = FUTURO. En `prefs` (jsonb) se añaden: `focusGoalId`, `activeWeekDays` (N; por defecto 2, se migra desde `weeklyGoal`), `returnThresholdDays` (7), `celebrations` (`full|subtle|off`), `graphView` (`day|week`), `notify` (tipos, tope diario y semanal, silencio), `shortcuts` (on/off).
- **Relaciones:** 1:1 con `auth.users`; dueño de todo lo demás.
- **Reglas:** `prefs ≤ 8 KB` (existe).

#### Vision (atributo, no tabla)
- El Blueprint la define como "texto propio, opcional al inicio" y la UX la muestra como línea secundaria. **No merece una tabla en el MVP.**
  - Visión del usuario: `profiles.vision`.
  - "Porqué" de cada objetivo: `projects.goal` (columna existente, se reutiliza como `why`; ver TDR-03).

#### Goal (Objetivo): `projects` [MODIFICAR]
- **Propósito:** resultado concreto con fin identificable.
- **Campos existentes reutilizados:**
  - `name`
  - `goal` → **porqué**
  - `description`
  - `status` (`active|paused|done|archived`, igual al Blueprint §11)
  - `color` → categoría
  - `tags`
  - `start_date`
  - `due_date` → fecha objetivo (solo para el ritmo de referencia)
  - `metric_*` → **indicador de éxito**; ya no calcula Avance, ver §8.6
- **Campos nuevos:**
  - `template text` (plantilla de origen; informativo)
  - `completed_at timestamptz`
  - `success_indicator text (≤ 300)` (métrica ancla textual del Blueprint §5.5)
  - La reflexión de cierre **no** es una columna: va a `reflections` con `type='goal_close'`
- **Campo que se deja de usar:** `progress_manual`. Se ignora en el cálculo nuevo (el Avance manual contradice "difícil de manipular"). No se borra.
- **Cardinalidad:** 1 perfil → n objetivos. Foco = `prefs.focusGoalId` (uno solo; TDR-06).
- **Estados:** `active → paused ↔ active → done`, `* → archived`. Toda transición escribe una fila en `goal_log`.
- **Reglas:**
  - Cerrar (`done`) pide una reflexión opcional y conserva todo.
  - Borrar es excepcional (confirmación) y hace borrado lógico en cascada de los hijos (§22.5).

#### Stage (Etapa): `stages` [NUEVO]
- **Campos:**
  - `goal_id` → `projects`
  - `title (1–120)`
  - `description (≤ 1000)`
  - `sort int`
  - `status text check in ('pending','active','done','skipped')`
  - `started_at`
  - `completed_at`
- **Cardinalidad:** 1 objetivo → 0..n etapas. Un objetivo sin etapas funciona: sus hitos cuelgan de la **etapa implícita**.
- **Reglas:**
  - `skipped` ("no aplica", UX §6) excluye la etapa del cálculo.
  - Solo una etapa `active` por objetivo (lo garantiza el cliente; no es crítico en la base).
  - `completed_at` se fija cuando todos sus hitos no omitidos están cerrados. El usuario confirma y puede reabrir.

#### Milestone (Hito): `milestones` [MODIFICAR]
- **Campos existentes:** `project_id`, `title`, `due_date`, `done_at` (= cerrado), `sort`.
- **Campos nuevos:**
  - `stage_id uuid null` → `stages`
  - `weight smallint not null default 2 check in (1,2,3)` (S/M/L)
  - `description (≤ 1000)`
  - `expected_evidence text (≤ 200)` ("qué prueba esperas guardar")
  - `status text check in ('open','done','skipped') default 'open'` (`skipped` = "no aplica")
  - `self_reward text (≤ 200)` [FUTURO/P2]
- **Cardinalidad:** 1 etapa → 0..n hitos; 1 hito → 0..8 criterios.
- **Reglas:**
  - Recomendación de 2–5 criterios, máximo duro de 8.
  - Si el hito tiene criterios, se "puede cerrar" al cumplirse todos; también se puede cerrar a mano con confirmación (P-07).
  - Cerrar escribe `done_at` y crea una Acción `source='milestone'` **vinculada por `milestone_id`** (corrige H3).
  - Límite blando de hitos abiertos por etapa: aviso a partir de 7 (Blueprint §5.3).

#### Criterion (Criterio de finalización): `criteria` [NUEVO]
- **Campos:**
  - `milestone_id` → `milestones`
  - `title (1–200)`
  - `sort`
  - `met_at timestamptz null`
  - `requires_evidence boolean default false` (informativo; nunca bloquea)
- **Por qué es una tabla y no un array jsonb en el hito:** la sync es por fila con "gana la última edición". Un array se sobrescribiría entero si se marca un criterio en el móvil y otro en el ordenador. Con una fila por criterio no hay conflicto (TDR-04).
- **Reglas:**
  - Marcar o desmarcar es una actualización de `met_at`.
  - El progreso dotado del onboarding es un criterio real cumplido en la creación ("Definiste tu objetivo").

#### Action (Acción): `activities` [MODIFICAR]
- **Campos existentes:**
  - `project_id` → goal
  - `task_id`
  - `kind` (`done|progress|note|win`)
  - `title`
  - `body` → nota
  - `occurred_at` → fecha, que admite días anteriores
  - `tags`
  - `source`
- **Campos nuevos:**
  - `milestone_id uuid null`
  - `criterion_id uuid null` ("esta acción cumplió este criterio")
  - `duration_min smallint null check between 1 and 1440`
- **Tipos:**
  - `done` y `progress` = acción.
  - `win` = acción marcada como logro personal. En la UI nueva se ofrece convertirla en logro personal.
  - `note` = **reflexión heredada**. No se crean más: las reflexiones nuevas van a `reflections` (TDR-08).
- **Reglas:**
  - Una acción sin hito es válida ("suelta"). Cuenta para Constancia y nunca para Avance.
  - La reflexión de una línea al guardar crea una fila en `reflections` con `activity_id`.
  - `source` añade `'recovery'` (check ampliado) para medir el regreso.

#### Next step (Próximo paso): `tasks` [MODIFICAR]
- **Campos existentes:** los mismos (`status todo|doing|waiting|done`, `priority`, `due_date`, `waiting_on`, `notes`).
- **Campo nuevo:** `milestone_id uuid null`.
- **Reglas:**
  - Completar un próximo paso crea una Acción (comportamiento actual), heredando `milestone_id`.
  - Nunca cuenta para Avance.
  - "Repetición semanal" (UX §8) = FUTURO.

#### Evidence (Evidencia): `evidence` [NUEVO]
- **Campos:**
  - `goal_id` (obligatorio, desnormalizado para filtrar)
  - `milestone_id?`
  - `activity_id?`
  - `criterion_id?`
  - `type text check in ('photo','file','link','note','certificate','result','screenshot','commit')`
  - `title (≤ 200)`
  - `note (≤ 4000)`
  - `url (≤ 2048, check ^https?://)`
  - `storage_path text null`
  - `thumb_path text null`
  - `mime text`
  - `size_bytes int`
  - `level smallint check between 0 and 3`
  - `captured_at timestamptz`
  - `upload_state text check in ('local','uploaded','failed') default 'uploaded'` (el cliente usa `local` mientras el blob no ha subido)
- **Cardinalidad:** una evidencia pertenece a exactamente un "ancla" principal (acción, hito o criterio) y siempre a un objetivo.
- **Reglas:** §11.

#### Achievement (Logro): `achievements` [NUEVO] (ledger)
- **Campos:**
  - `kind text check in ('real','progress','recovery','consistency','personal')`
  - `rule_key text` (p. ej. `milestone_first_with_evidence`; `null` en personales)
  - `title (≤ 120)`
  - `description (≤ 400)`
  - `earned_at`
  - `goal_id?`
  - `milestone_id?`
  - `evidence_id?`
  - `announced_at timestamptz null` (para "máximo un anuncio por sesión")
- **Id determinista:** `stableUuid(user_id + ':' + rule_key + ':' + ref)`. Dos dispositivos que detectan el mismo logro generan la misma fila, sin duplicados (TDR-07).
- **Reglas:** §10.

#### Journal Entry (Reflexión): `reflections` [NUEVO]
- **Campos:**
  - `type text check in ('learning','decision','obstacle','free','milestone_close','stage_close','goal_close','recap','assessment')`
  - `body (1–4000)`
  - `goal_id?`, `stage_id?`, `milestone_id?`, `activity_id?`, `evidence_id?`
  - `prompt text (≤ 200)` (la pregunta que la originó)
  - `favorite boolean default false` ("aprendizajes destacados")
  - `rating smallint null check between 1 and 5` (solo `assessment`, P2)
  - `occurred_at`
- **Reglas:** §13.

#### Activity (actividad del gráfico)
- **No es tabla.** Es el índice diario derivado de acciones, evidencias, criterios cumplidos, hitos cerrados y días de descanso (§9).

#### Progress
- **No es tabla.** Se deriva (§8). La historia del progreso se reconstruye con `met_at`, `done_at` y `completed_at`.

#### Recap: `recaps` [NUEVO] (solo estado del usuario)
- **Campos:**
  - `period text check in ('week','month','year')`
  - `start_date date`
  - `seen_at`
  - `answer text (≤ 2000)` (respuesta a la pregunta reflexiva)
  - `pinned jsonb` (ids destacados por el usuario, ≤ 2 KB)
- **Id determinista:** `stableUuid(user:period:start)`.
- **Reglas:** el contenido del recap **no se guarda**; se calcula (§14).

#### Adicionales justificadas

| Entidad | Por qué es necesaria |
|---|---|
| `day_marks` | "Día de descanso intencional" (Blueprint §7, UX §11): `day date`, `kind check in ('rest')`, `note`. Id determinista por `user:day` y `unique(user_id, day)` |
| `goal_log` | Pausas, reanudaciones, pivotes, cierres y cambios de alcance **no se pueden reconstruir** con "gana la última edición" (solo queda el estado actual). Campos: `goal_id`, `type check in ('created','paused','resumed','closed','archived','reopened','pivoted','scope_changed','stage_started','stage_completed')`, `note`, `occurred_at`, `meta jsonb ≤ 1 KB` |

**Descartadas:**
- Tabla `visions`: FUTURO.
- `progress_snapshots`: el progreso es derivable.
- `xp`: el Blueprint lo excluye.
- `notifications`: el MVP no tiene push.
- `templates` en la base de datos: son datos estáticos en `domain/templates.js`.

### 7.3 Propiedad (ownership) e integridad

- **FK compuestas** (corrige H15): cada tabla padre añade `unique (user_id, id)`; cada hija referencia `(user_id, parent_id) → parent(user_id, id)`. Resultado: es imposible, a nivel de base de datos, colgar un hijo de un padre de otro usuario, aunque se conozca el UUID.
  - Se aplica a **todas las relaciones nuevas** y se añade a las existentes (`milestones.project_id`, `tasks.project_id`, `activities.project_id/task_id`).
  - Antes de crearlas, la migración verifica que no haya filas cruzadas (hoy solo hay un usuario real).
- **Borrado en el servidor:** `on delete cascade` solo desde `auth.users` (borrar la cuenta). Entre entidades, el borrado lo gobierna el cliente con borrado lógico (§22.5); las FK entre entidades usan `on delete set null` o `cascade` según §22.
- **Timestamps:** `occurred_at` = cuándo pasó (lo edita el usuario); `created_at` = cuándo se registró; `updated_at` = última edición (resuelve conflictos); `synced_at` = servidor.
- **Zona horaria:** el día de una acción = `dayKey(occurred_at)` en la hora local del dispositivo (como hoy). `profiles.timezone` sirve para la analítica del servidor. Riesgo menor en viajes (§26).

---

## 8. Progress Engine

> Pregunta del Blueprint: ¿cómo evitar "100 tareas pequeñas = 100%"? Respuesta técnica: **las acciones no están en la fórmula del Avance.** Solo los criterios y los hitos la mueven, y cada uno tiene un peso acotado.

### 8.1 Dos ejes, dos módulos

| Eje | Pregunta | Entrada | Módulo | Visual |
|---|---|---|---|---|
| **Avance** | ¿Qué he logrado? | criterios (`met_at`), hitos (`done_at`, `weight`, `status`), etapas (`status`) | `domain/progress.js` | Barras segmentadas, fracciones y % agregado |
| **Constancia** | ¿Con qué ritmo trabajo? | días activos (§9), `prefs.activeWeekDays`, días de descanso | `domain/rhythm.js` | 8 pills + mejor histórico |
| **Momentum** | ¿Voy en subida o en bajada? | días activos de 28 días frente a tu ritmo propio | `domain/rhythm.js` | Palabra + minigráfico |

Ninguna función de un eje lee datos del otro. Hay una prueba unitaria que lo garantiza: crear 1.000 acciones no cambia `goalProgress` (§23).

### 8.2 Fórmulas

**Criterio.** `met = met_at != null` (binario). Los criterios no tienen pesos internos (simplicidad).

**Hito.** `p(h)` ∈ [0,1]:
- Si `status='done'` (`done_at` presente): **1**.
- Si no, con criterios: `met / total` (con criterios borrados excluidos).
- Si no, sin criterios (hitos heredados de v2): **0**. Es binario hasta que se cierra.
- Si `status='skipped'`, queda **excluido** del cálculo.

**Etapa.** `p(e) = Σ w(h)·p(h) / Σ w(h)` sobre los hitos no omitidos de la etapa. `w ∈ {1,2,3}`. Una etapa sin hitos no tiene progreso (se muestra "Sin hitos todavía") y **no entra en el denominador del objetivo**.

**Objetivo.** `p(o) = Σ_h w(h)·p(h) / Σ_h w(h)` sobre **todos** los hitos no omitidos de todas sus etapas no omitidas (incluida la implícita).
- Equivale a promediar las etapas ponderando cada una por el peso total de sus hitos (TDR-05).
- Se descartó el promedio simple de etapas: una etapa con un hito pequeño pesaría lo mismo que otra con diez grandes.

**Visualización** (UX §10, nunca un % solo):
- Objetivo: `63% · 2 etapas de 4 · 9 de 14 hitos` + barra **segmentada por etapas**. Cada segmento tiene un ancho proporcional a `Σw` de la etapa y un relleno de `p(e)`.
- Etapa: `3 de 5 hitos` + segmentos = hitos.
- Hito: `2 de 5 criterios` + segmentos = criterios.
- Acción: sin porcentaje.
- **Indicador de respaldo** (en el detalle, no en el Hero): `9 de 14 hitos con evidencia` (evidencia de nivel ≥ 2 vinculada al hito o a sus criterios o acciones).
- **Delta** tras cada cambio: `+1 hito` / `+1 criterio`, en texto y con la barra interpolada 400 ms (§19).

### 8.3 Progreso dotado (goal-gradient)

- El onboarding y las plantillas crean el primer hito con un criterio ya cumplido ("Definiste tu objetivo", `met_at = now`). Es un dato real y visible, no un regalo inventado.
- Tras cerrar un hito, el siguiente se abre en el mismo flujo (UX §7, paso 6) para evitar el bajón posterior a la recompensa.

### 8.4 Anti-manipulación (sin policía)

| Vector | Mitigación técnica |
|---|---|
| Muchas acciones pequeñas | No entran en la fórmula (solo en Constancia). La intensidad del gráfico tiene tope logarítmico (§9) |
| Muchos hitos triviales | El peso está acotado a S/M/L. Hay aviso blando con más de 7 hitos abiertos por etapa. El % depende de la proporción ponderada, no del número |
| Criterios triviales | Máximo 8 por hito. El indicador de respaldo muestra qué parte está evidenciada |
| Borrar hitos pendientes para subir el % | Cada borrado u omisión de un hito escribe `goal_log.scope_changed` con el % antes y después. La timeline lo muestra como "Ajustaste el alcance" (neutro, visible). No se bloquea: es autonomía |
| Cerrar un hito a mano sin criterios | Permitido, con confirmación. El hito muestra "Cerrado con 3 de 5 criterios" (P-07) |
| Desmarcar y volver a marcar | Idempotente: `met_at` se sobrescribe y el ledger de logros usa ids deterministas, así que no hay doble logro |
| Métrica manipulable | La métrica ya no calcula Avance (§8.6) |

### 8.5 Constancia y Momentum (`domain/rhythm.js`)

- **Día activo:** día con al menos un evento de construcción: acción (`kind` distinto de `note`), evidencia, criterio cumplido o hito cerrado. Las reflexiones solas **no** activan el día (TDR-08). Los días de descanso no son activos, pero tampoco cuentan como hueco.
- **Semana activa:** semana ISO (lunes) con `activeDays ≥ N` (`prefs.activeWeekDays`, de 1 a 7; por defecto 2).
- **Pills:** las 8 semanas anteriores, incluida la actual. La actual se muestra "en curso" y nunca vacía en tono negativo.
- **Mejor histórico:** la mayor serie de semanas activas consecutivas calculada sobre todo el historial. Es derivable, así que **nunca se pierde** mientras existan los datos. Texto de la UX §14: "Tu mejor racha: 9 semanas" (siempre en semanas, nunca en días).
- **Momentum:** `r = activeDays(últimos 28 d) / media(activeDays por ventana de 28 d en los 84 d anteriores)`.
  - Menos de 28 días de historial → **"Empezando"**.
  - Regreso tras una pausa de 7 días o más con al menos 1 día activo en los últimos 7 → **"Retomando"**.
  - `r ≥ 1,15` → **"Acelerando"**.
  - `0,85 ≤ r < 1,15` → **"Constante"**.
  - `r < 0,85` → palabra neutra. La UX no la define: **DECISIÓN PENDIENTE P-13**; propuesta: "Más ligero".
  - Sin rojo, sin flecha hacia abajo en color de alerta.
  - Minigráfico: días activos por semana en las últimas 12 semanas.
- **Ritmo de referencia** (si hay `due_date` y al menos 4 semanas de datos):
  - Velocidad = `Σw cerrado en las últimas 8 semanas / 8`.
  - Semanas restantes = `Σw pendiente / velocidad`.
  - Se muestra como **rango**: ±30% (P1). Sin velocidad no se muestra nada.

### 8.6 Métrica y progreso heredado

- `metric_start/current/target` se muestra como **indicador de éxito**: "4.200 → 0 USD", con su propia barra fina y la etiqueta "Indicador". **No es el Avance.**
- Objetivo con métrica y sin hitos: se muestra solo el indicador; el Avance aparece como "Sin hitos: ¿convertimos esto en etapas?".
- Objetivo con tareas y sin hitos (caso típico heredado): el Avance aparece como "sin definir" y las tareas cerradas se muestran como actividad ("12 próximos pasos completados"), no como %.
- **Consecuencia visible para el usuario actual:** proyectos que hoy muestran "74%" pasarán a "Sin hitos". Hay que explicarlo una vez (hoja "Qué cambió en tu progreso") y ofrecer "Crear etapas a partir de este proyecto" (Riesgo R2, §26).

### 8.7 Interfaz del módulo (conceptual)

`domain/progress.js` expone funciones **puras** que reciben arrays y devuelven objetos. No leen `db` ni `store`:
- `milestoneProgress(milestone, criteria)` → `{ p, met, total, closed, skipped }`
- `stageProgress(stage, milestones, criteriaByMilestone)` → `{ p, done, total, weightDone, weightTotal }`
- `goalProgress(goal, stages, milestones, criteriaByMilestone)` → `{ p, pct, stages:{done,total}, milestones:{done,total}, segments:[…], backed:{with,total}, nextMilestone }`
- `progressDelta(before, after)` → `{ text: '+1 hito', from, to }`

`model.js` los memoriza por `db.rev` con índices por padre (`criteriaByMilestone`, `milestonesByStage`, `stagesByGoal`). Así se resuelve también H18.

---

## 9. Activity & Contribution Graph

### 9.1 Qué genera actividad y qué no

| Genera actividad (construcción) | No genera actividad |
|---|---|
| Acción registrada (`done`, `progress`, `win`) | Crear o editar objetivos, etapas, hitos y criterios (planificar) |
| Evidencia añadida (cuenta el día de `captured_at`) | Crear próximos pasos |
| Criterio cumplido (`met_at`) | Editar, reordenar o borrar cualquier cosa |
| Hito cerrado (`done_at`) → marcador ◆ | Reflexiones sin acción (se ven en el panel del día, pero no colorean la celda) |
| | Notas heredadas (`kind='note'`), ver TDR-08 |
| | Ajustes, sesiones, vistas y aperturas de la app |

### 9.2 Intensidad por significancia (`domain/significance.js`)

`score(día) = log2(1 + acciones) + 1·[hay evidencia de nivel ≥ 2] + 0,5·min(criterios cumplidos, 2) + 2·[hito cerrado]`

| Nivel | Rango de score | Nota |
|---|---|---|
| 0 | 0 | Superficie neutra; si es descanso, guion "–" |
| 1 | (0, 1] | 1 acción |
| 2 | (1, 2] | 2–3 acciones, o 1 con evidencia |
| 3 | (2, 3,5] | Día sólido |
| 4 | > 3,5 | Cierre de hito o día muy completo |

- El tope logarítmico hace que 20 acciones (log2 21 ≈ 4,4) no superen mucho a 3 acciones con evidencia y un criterio: el gráfico premia **construcción**, no volumen.
- Los umbrales viven en un único objeto de configuración y tienen pruebas unitarias. Se ajustarán con datos reales ([C] hipótesis).
- Marcadores independientes del nivel: ◆ hito cerrado (ámbar), punto = evidencia, "–" = descanso, borde = hoy, banda "Pausa" para 7 días o más sin actividad ni descanso.

### 9.3 Estructura de datos derivada

`model.dayIndex()` → `Map<'YYYY-MM-DD', DayInfo>`, memorizado por `db.rev` y el día actual:
```
DayInfo = { actions: n, evidence: n, evidenceLvl2: bool, criteriaMet: n, milestonesClosed: [id],
            goals: Set<goalId>, rest: bool, reflections: n, score: number, level: 0..4 }
```
- **Construcción:** una pasada O(n) por acciones, evidencias, criterios, hitos y `day_marks`. Con 20.000 filas son unos pocos ms.
- **Filtros** (objetivo, etapa, "solo hitos", "con evidencia"): el índice se calcula por filtro con clave `rev + filtro`; se guardan como máximo 4 entradas.
- **Agregaciones:**
  - Semanal: `weekStart(k)`, suma de scores y conteo de días activos. Alimenta la Constancia y la vista semanal (FUTURO).
  - Mensual: por `k.slice(0,7)`. Recap mensual.
  - Anual e histórico: filas por año, reutilizando el mismo índice.
- **Resumen textual** (accesible y narrativo): "87 días activos · 21 semanas activas · 4 hitos · 36 evidencias" para el periodo visible.

### 9.4 Consultas y almacenamiento

- **No se almacena** ningún agregado: todo se deriva localmente (§6.2).
- **Servidor (solo analítica, P2):** se extiende `daily_stats` con `evidence`, `criteria_met` y `milestones_closed`. No se usa para pintar el gráfico (el cliente siempre tiene los datos).
- Índices SQL nuevos: `activities (user_id, milestone_id)`, `evidence (user_id, goal_id, captured_at)`, `criteria (milestone_id)`, `reflections (user_id, occurred_at desc)`, `day_marks (user_id, day)`.

### 9.5 Componente

- `ContributionGraph({ range: 'week'|'month'|'12m'|'year'|'all', year?, filters })` → HTML: un `<table role="grid">` (o una rejilla con `role="grid"`) con `aria-label` por celda ("12 de marzo: 3 acciones, 1 evidencia, hito cerrado").
- Navegación con flechas y `roving tabindex`; Enter abre el **Panel del día**.
- Tooltip en hover o foco (escritorio); en táctil, un toque abre el panel directamente (UX §20.2).
- Panel del día = `DayPanel(day)`: acciones, evidencias, criterios, hitos y reflexiones de ese día, más "Añadir a este día" (Quick Add con `occurred_at` prefijado) y "Marcar como descanso".
- Celdas: 12–14 px en escritorio y 10–12 px en mobile, con `scroll-snap` horizontal hasta hoy (§18).

---

## 10. Timeline

### 10.1 Qué aparece (y qué no)

| Evento | Fuente | Peso | Aparece por defecto ("solo lo destacado") |
|---|---|---|---|
| Objetivo creado / completado / cerrado | `projects.created_at/completed_at` + `goal_log` | Alto | Sí (encabezado de capítulo) |
| Etapa iniciada / completada | `stages.started_at/completed_at` | Alto | Sí |
| Hito cerrado | `milestones.done_at` + evidencia vinculada | Alto | Sí |
| Logro | `achievements.earned_at` | Medio-alto | Sí |
| Evidencia añadida (nivel ≥ 2) | `evidence.captured_at` | Medio | Sí |
| Reflexión destacada (`favorite`) o de cierre | `reflections` | Medio | Sí |
| Pausa, reanudación, pivote o ajuste de alcance | `goal_log` | Medio | Sí |
| Pausa por inactividad de 7 días o más | Derivada del índice diario | Medio | Sí ("Pausa · 21 días") |
| Acciones repetitivas | `activities` agrupadas | Bajo | **Colapsadas**: "12 acciones en *Conversación* · marzo" (expandible) |
| Evidencia de nivel 0–1, reflexiones no destacadas | — | Bajo | Solo con "Todo" |
| Ediciones, reordenamientos, borrados, próximos pasos creados | — | — | **Nunca** |

### 10.2 Construcción (`domain/timeline.js`, puro)

1. Se reúnen los eventos candidatos del rango pedido (por defecto, los últimos 6 meses o el capítulo actual) a partir de los memos de `model`.
2. **Capítulos:** se agrupa por objetivo y, dentro, por etapa, usando el intervalo `[started_at, completed_at]`. Lo que no cae en ninguna etapa va al capítulo del objetivo.
3. **Colapsado:** las acciones sin evento destacado se agrupan en tramos `(objetivo, etapa, mes)` con su conteo.
4. **Encabezados narrativos por plantillas** (sin IA): "Marzo · Empezaste la etapa Conversación", "Volviste", "Pausa · 21 días".
5. Salida: `[{ chapter, events:[{type, at, weight, refs, collapsed?}] }]`.

**Rendimiento:** O(n log n) por rango. Paginación por **"Cargar más"** (bloques de 3 meses). Nunca scroll infinito (regla de `CLAUDE.md` y del Blueprint §17).

**Filtros:** objetivo, tipo de evento, rango, "solo lo destacado" (por defecto) / "todo".

---

## 11. Achievements & Gamification

### 11.1 Qué se implementa y qué no

| Mecanismo | Decisión (Blueprint §10, UX §13–14) | Implementación |
|---|---|---|
| XP / puntos | **No** | — (se elimina cualquier conteo tipo puntos) |
| Niveles | Son las **Etapas** | Barra segmentada por etapas; "Etapa 2 de 4" |
| Badges triviales / por volumen | **No** | Se retiran `acts*`, `days*`, `tasks25`, `streak7` (H8) |
| Racha diaria | **No** | Se retira de la UI (H7) |
| Constancia semanal | Sí | §8.5 |
| Momentum | Sí | §8.5 |
| Logros reales, de progreso y de recuperación | Sí (P1; el de recuperación, P0 con WelcomeBack) | Ledger (§11.2) |
| Logros de constancia | Solo descriptivos, en el recap | Sin tarjeta ni celebración |
| Logros personales | Sí (P1) | Creados por el usuario, con evidencia opcional |
| Celebraciones | Proporcionales, niveles 0–5 | `components/celebration.js` (§19) |
| Autorrecompensas | FUTURO/P2 | `milestones.self_reward` |
| Leaderboards / social | No | — |

### 11.2 Ledger de logros

**Reglas** (`domain/achievements.js`, puras): `evaluate(state) → [{ rule_key, ref, kind, title, description, earned_at, links }]`. `earned_at` es **la fecha real** del hecho (por ejemplo, `done_at` del hito), no la fecha de detección.

| rule_key | Tipo | Condición | Celebración |
|---|---|---|---|
| `milestone_first` | progress | Primer hito cerrado | Nivel 2 |
| `milestone_evidence_first` | real | Primer hito cerrado con evidencia de nivel ≥ 2 | Nivel 2–3 |
| `certificate:<evidenceId>` | real | Evidencia tipo `certificate` o `result` de nivel 3 vinculada a un hito cerrado | Nivel 3 |
| `stage_half:<stageId>` | progress | Etapa llega al 50% | Nivel 1 |
| `stage_done:<stageId>` | progress | Etapa completada | Nivel 3 |
| `goal_done:<goalId>` | real | Objetivo completado | Nivel 4 (5 si es el primero) |
| `return:<fecha>` | recovery | Primera acción tras al menos `prefs.returnThresholdDays` (7 por defecto, el mismo umbral que WelcomeBack) días sin actividad ni descanso | Nivel 1 (suave) |
| `personal:<uuid>` | personal | Creado por el usuario | Nivel 1 |

- **Idempotencia:** `id = stableUuid(user + rule_key)`; `insertIfMissing` (que ya existe) no duplica, ni aunque dos dispositivos lo detecten.
- **Cuándo se evalúa:** después de cada mutación relevante (cerrar hito o etapa, añadir evidencia, primera acción del día) y al arrancar (backfill).
- **Retirada:** si el hecho se deshace (reabrir un hito), el logro **se conserva**. El logro dice "lo conseguiste en tal fecha", no "sigue siendo verdad". Excepción: si se usa "Deshacer" en los 8 s siguientes, se borra el logro recién creado (el toast lo agrupa).
- **Anuncio:** como máximo **uno por sesión** (`announced_at`); los demás aparecen en el recap. Sin lista de bloqueados ni contadores `x/N`.
- **Backfill al migrar:** se evalúan las reglas sobre el historial y se insertan con su fecha real y `announced_at = now` (sin anuncios masivos). Los hitos migrados de v1 con `done_at` generan `milestone_first` con su fecha histórica.

### 11.3 Qué pasa con lo existente

- `model.achievements()`, `newAchievements()` y `markAchievementsSeen()`, junto con `kv.seenAch`: **obsoletos**; se eliminan en la fase de limpieza.
- "Cómo funciona" explica el cambio en una línea.

---

## 12. Evidence

### 12.1 Tipos, nivel y almacenamiento

| Tipo | Contenido | Almacenamiento | Nivel sugerido (editable) |
|---|---|---|---|
| `note` | Texto | Fila (`note`) | 1 |
| `result` | Métrica o resultado ("B2 en examen") | Fila (`title` + `note`) | 1 (3 si es oficial) |
| `link` | URL | Fila (`url`) | 2 |
| `commit` | URL de commit, PR o repositorio | Fila (`url`) | 3 (verificable externamente) |
| `photo` | Imagen | Storage + miniatura | 2 |
| `screenshot` | Imagen | Storage + miniatura | 2 |
| `file` | PDF, documento | Storage | 2 |
| `certificate` | Imagen o PDF | Storage | 3 |
| (audio) | Grabación | **DECISIÓN PENDIENTE P-10** (persona "idioma") | 2 |

- **Nivel 0 = "Registrado"**: no es una fila de evidencia. Es una acción sin evidencia (Blueprint §6).
- El nivel lo **sugiere el tipo** y el usuario puede ajustarlo. Es informativo y nunca bloquea (Blueprint §6).

### 12.2 Supabase Storage

- **Bucket:** `evidence`, **privado**, con `file_size_limit` = 10 MB y `allowed_mime_types` = `image/jpeg`, `image/png`, `image/webp`, `application/pdf` (+ audio si P-10). **Sin SVG ni HTML** (riesgo de XSS).
- **Ruta:** `{user_id}/{evidence_id}/original.{ext}` y `{user_id}/{evidence_id}/thumb.webp`.
- **Políticas RLS en `storage.objects`:** `bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text` para select, insert, update y delete. La tabla `evidence` además comprueba `storage_path like user_id || '/%'`.
- **Lectura:** URLs **firmadas** (`POST /storage/v1/object/sign/evidence/{path}`, 1 h), cacheadas en memoria hasta 5 min antes de expirar. Nunca públicas. Se piden solo al mostrar (miniaturas en la cuadrícula; el original al abrir).
- **Subida** (`files.js`, sin dependencias):
  1. `<input type="file" accept="image/*,application/pdf" capture>` (cámara o galería en móvil; arrastrar y soltar en escritorio).
  2. Las imágenes se reescalan con canvas a 1600 px en el lado largo y se exportan a WebP o JPEG al 0,8. Eso **elimina EXIF/GPS** (privacidad).
  3. Miniatura de 320 px.
  4. Los blobs se guardan en el store IndexedDB `files` (`evidence_id → {original, thumb}`) y la fila `evidence` se crea con `upload_state:'local'`.
  5. Una **cola de subida** propia (separada de la outbox de filas) sube original y miniatura; si sale bien, actualiza `storage_path`, `thumb_path` y `upload_state:'uploaded'`, y borra el blob local.
  6. Mientras tanto, la vista usa `blob:` URLs (CSP `img-src blob:`).
- **Orden de sync:** la fila `evidence` puede subir antes que el archivo (`storage_path null` + `upload_state:'local'`). Otros dispositivos muestran "Subiendo desde otro dispositivo…".
- **Límites:**
  - 10 MB por archivo tras comprimir.
  - Cuota blanda por usuario: 500 MB, calculada con `Σ size_bytes` en el cliente.
  - Aviso al 80%.
  - Cuota dura: DECISIÓN PENDIENTE P-03, según el plan de Supabase (el gratuito tiene 1 GB en total).
- **Eliminación:** borrar una evidencia hace `DELETE` de los objetos en Storage (API) y **después** el borrado lógico de la fila. Si falla el borrado del archivo, la fila queda con `deleted_at` y se reintenta en la siguiente sync. No se borran archivos por SQL: se usa la API de Storage.
- **Huérfanos:** una consulta de mantenimiento (P2, manual o `pg_cron`) lista objetos sin fila viva.

### 12.3 Visualización y asociación

- **`EvidenceCard`:** miniatura o icono de tipo, título, fecha, ancla (hito u objetivo) e indicador de nivel (1–3 marcas + tooltip). Candado de privacidad.
- **Portafolio** (Historia › Evidencia): cuadrícula filtrable por objetivo, tipo y año; paginada con "Cargar más".
- **Ancla:** se añade desde la acción, el hito o el criterio, o desde el portafolio eligiendo el objetivo. `goal_id` siempre se rellena para filtrar sin joins.
- **Seguridad de enlaces:** solo `http:`/`https:` (check en la base de datos y validación en cliente). Se muestran con `rel="noopener noreferrer" target="_blank"`. Sin vista previa remota (no hay servidor que la obtenga y se evita el SSRF).
- **PDF:** se abre con la URL firmada en otra pestaña. No se incrusta (CSP `frame-src 'none'`).
- **Compartir:** FUTURO (todo es privado por defecto).

---

## 13. Journal

**Objetivo:** reflexión conectada, no un editor en blanco (UX §16).

| Punto de entrada | Tipo | Vínculo automático | Prioridad |
|---|---|---|---|
| Campo de una línea "¿Qué aprendiste?" en Quick Add (colapsado en "Más") | `learning` | `activity_id`, `milestone_id`, `goal_id` | **P0** |
| Cierre de hito (paso 4 de la hoja) | `milestone_close` | `milestone_id`, `goal_id` (+ `evidence_id` si se adjuntó) | **P0** |
| Cierre de etapa / objetivo | `stage_close` / `goal_close` | `stage_id` / `goal_id` | P1 |
| Pregunta del recap semanal | `recap` (y `recaps.answer`) | periodo | P0 (con el recap) |
| "Añadir reflexión" en el detalle del objetivo | `learning`/`decision`/`obstacle`/`free` | `goal_id` | P1 |
| Historia › Reflexiones (entrada libre) | cualquiera | ninguno o elegido | P1 |

**Anti-aislamiento:**
- Cada reflexión se muestra con su contexto (chip del objetivo, hito o acción, y la evidencia si la hay).
- Las destacadas (`favorite`) alimentan el recap ("Aprendí"), la timeline y el recap anual.
- Las preguntas cambian según el contexto (`prompt` guardado con la reflexión, para que el recap pueda citarla con sentido).

**Vista** (P1): lista cronológica con búsqueda (reutiliza `norm()` y el patrón de búsqueda de Registro), filtro por tipo y "Aprendizajes destacados".

**Notas heredadas** (`activities.kind='note'`): se muestran en Reflexiones como "Nota" (solo lectura en esa vista y editables como antes). No se migran de tabla (TDR-08).

---

## 14. Recap Engine

### 14.1 Diseño

- **Función pura:** `domain/recap.js: buildRecap(period, start, data) → Recap`.
- **Datos:** los mismos memos de `model` (índice diario, progreso por fecha, ledger de logros, evidencias y reflexiones del rango). No hay otra fuente.
- **Salida estructurada** (responde "¿qué construí?"):
```
Recap = { period, start, end, headline,
  did:      { actions, activeDays, topActions:[≤3], byGoal:[{goal, actions}] },
  advanced: { criteriaMet:[…], milestonesClosed:[…], stagesChanged:[…], progressByGoal:[{goal, from, to}] },
  got:      { achievements:[…] },
  evidence: { highlighted:[≤4], count },
  learned:  { reflection | null },
  next:     { milestone | null, suggestion, question },
  compare:  { previous: {activeDays, milestones, criteria} }   // solo mensual, contra el mes anterior propio
  tone: 'normal' | 'light' }
```
- **Progreso "desde → hasta"** en el periodo: se reconstruye aplicando la fórmula de §8 con los criterios e hitos cumplidos hasta `start` y hasta `end`. Es posible porque `met_at` y `done_at` tienen fecha.
- **Narrativa por plantillas en español** (sin IA ni coste):
  - Normal: "Esta semana avanzaste en *Inglés*: cerraste el hito *Conversación básica*".
  - Semana baja (`tone:'light'`, menos de 1 día activo): "Esta semana fue más ligera. Tu siguiente paso sigue listo: *…*". Sin comparaciones.
  - Las frases están en `domain/recap-copy.js` para revisarlas y probarlas.
- **Selección de destacados:**
  - Evidencias de nivel ≥ 2 primero, y dentro de ellas las más recientes.
  - Acciones vinculadas a criterios cumplidos antes que las sueltas.
  - Reflexión: la favorita del periodo; si no hay, la más reciente de tipo `learning` o `milestone_close`.
- **Mensual:** añade `compare` contra el mes anterior **propio** (días activos, hitos y criterios), el cambio de momentum y una propuesta de foco (el objetivo con más avance reciente o el foco fijado).
- **Anual** (P2): capítulos por objetivo (reutiliza `domain/timeline.js`), galería de evidencia, gráfico anual, regresos tras pausas y antes/después (primera y última evidencia de cada objetivo).

### 14.2 Almacenamiento, regeneración y entrega

- **No se guarda el recap:** siempre se recalcula. Si el usuario completa días pasados, el recap lo refleja (honesto).
- **Se guarda** solo `recaps` (`seen_at`, `answer`, `pinned`) con un id determinista por periodo.
- **Rendimiento:** O(n) sobre el rango, memorizado por `rev + periodo`. Un recap anual con 5.000 acciones tarda del orden de 10 ms.
- **Entrega** en el MVP, dentro de la app:
  - Lunes a miércoles: tarjeta "Tu semana" en Inicio (sustituye el aviso actual `week:` de `notices`), descartable.
  - Día 1–3 del mes: tarjeta mensual (P1).
  - Siempre accesible en Tú › Recaps.
- Push = FUTURO.
- **Opt-out:** `prefs.notify.recap = false` oculta las tarjetas; la sección sigue accesible.
- **Exportar como imagen o PDF:** FUTURO (requeriría una librería o dibujar a mano en canvas).

---

## 15. API Architecture

### 15.1 Forma general

**No hay endpoints propios.** Los recursos se exponen con PostgREST, protegidos por RLS, y el cliente usa el **mismo protocolo de sync genérico** para todas las tablas:

| Operación | Llamada | Uso |
|---|---|---|
| Crear, actualizar, archivar, borrar (lógico) | `POST /rest/v1/{tabla}?on_conflict=id` + `Prefer: resolution=merge-duplicates,return=minimal` (lotes de 200) | Push de la outbox |
| Leer incremental | `GET /rest/v1/{tabla}?select=*&synced_at=gt.{cursor-30s}&order=synced_at.asc&limit=1000` | Pull |
| Borrar todo lo propio | `DELETE /rest/v1/{tabla}?user_id=eq.{uid}` | "Borrar mis datos" (existe) |
| Archivos | `POST /storage/v1/object/evidence/{path}` · `POST /storage/v1/object/sign/evidence/{path}` · `DELETE /storage/v1/object/evidence` (prefixes) | Evidencia |
| Borrar cuenta (P1) | `POST /rest/v1/rpc/delete_my_account` | Ver TDR-12 |

**Orden de subida** (`sync.ORDER`, respeta las FK): `projects → stages → milestones → criteria → tasks → activities → evidence → reflections → achievements → day_marks → goal_log → recaps`. La bajada usa el mismo orden.

**Cambio obligatorio en la sync (corrige H1):**
- Un **409** (violación de FK, código `23503`) **no se rechaza**: la fila queda en la outbox y se reintenta en la siguiente pasada. Normalmente el padre llega en la misma pasada o en la siguiente.
- Solo `400/422` (datos inválidos) van a `syncRejected`, y **eso se muestra en Tú › Sincronización** con la opción "Reintentar" o "Descartar".

"Obtener progreso", "obtener recap" y "obtener gráfico" **no son endpoints**: son funciones del cliente sobre datos locales (§6.2, TDR-01).

### 15.2 Recursos

| Recurso (tabla) | Operaciones | Propósito | Relaciones | Validaciones (base de datos + cliente) | Autorización |
|---|---|---|---|---|---|
| **Goals** (`projects`) | crear · leer · actualizar · pausar/reanudar/cerrar/archivar (`status` + `goal_log`) · borrar lógico (con cascada lógica en el cliente) · progreso (cliente) | Objetivo | 1–n stages, milestones, tasks, activities, evidence, reflections, goal_log | `name 1–120`, `goal ≤ 500`, `status ∈ 4`, `success_indicator ≤ 300`, fechas válidas | RLS `user_id = auth.uid()` |
| **Stages** | crear · leer · actualizar · reordenar (`sort`) · omitir (`skipped`) · completar · borrar lógico | Etapa | n–1 goal; 1–n milestones | `title 1–120`, `status ∈ 4`, FK compuesta al goal | RLS + FK compuesta |
| **Milestones** | crear · leer · actualizar · asignar etapa · cerrar/reabrir (`done_at`) · omitir · borrar lógico | Hito | n–1 goal, n–1 stage (opcional), 1–n criteria/activities/evidence | `title 1–200`, `weight ∈ {1,2,3}`, `status ∈ 3`, `stage.goal_id = milestone.project_id` (trigger) | RLS + FK compuesta |
| **Criteria** | crear · leer · editar · reordenar · marcar/desmarcar (`met_at`) · borrar lógico | Criterio | n–1 milestone | `title 1–200`; **máximo 8 vivos por hito** (trigger `before insert`) | RLS + FK compuesta |
| **Actions** (`activities`) | crear (Quick Add) · leer (rango, búsqueda local) · editar · borrar lógico + deshacer | Acción | n–1 goal/milestone/criterion/task | `title 1–500`, `body ≤ 20000`, `duration 1–1440`, `kind ∈ 4`, `source ∈ 6`, `criterion.milestone_id = milestone_id` (trigger) | RLS + FK compuesta |
| **Next steps** (`tasks`) | crear · leer · actualizar estado · completar (→ acción) · borrar lógico | Próximo paso | n–1 goal/milestone | Existentes + `milestone_id` | RLS + FK compuesta |
| **Evidence** | crear (fila + subida) · leer (URL firmada) · editar metadatos · borrar (Storage + lógico) | Evidencia | n–1 goal (obligatorio), 0..1 milestone/activity/criterion | `type ∈ 8`, `level 0–3`, `url ^https?://`, `size ≤ 10 MB`, `storage_path` con prefijo `user_id/`, al menos uno de (`url`, `note`, `storage_path`, `title`) | RLS + FK compuesta + políticas de Storage |
| **Reflections** | crear · leer · editar · destacar · borrar lógico | Reflexión | opcional a goal/stage/milestone/activity/evidence | `type ∈ 9`, `body 1–4000`, `rating 1–5` | RLS + FK compuesta |
| **Achievements** | crear (idempotente) · leer · marcar anunciado · crear/editar/borrar personales | Logro | opcional a goal/milestone/evidence | `kind ∈ 5`, `title ≤ 120`; sin updates de `rule_key` | RLS |
| **Day marks** | marcar/desmarcar descanso | Descanso | — | `unique(user_id, day)`, `kind ∈ {rest}` | RLS |
| **Goal log** | crear (solo insertar) · leer | Cambios de rumbo | n–1 goal | `type ∈ 10`, `meta ≤ 1 KB` | RLS (sin `update`) |
| **Recaps** | upsert (visto, respuesta, fijados) · leer | Estado de recap | — | `period ∈ 3`, `answer ≤ 2000` | RLS |
| **Profile** | leer · actualizar (`vision`, `prefs`) | Perfil | 1–1 auth user | `vision ≤ 400`, `prefs ≤ 8 KB` | RLS por `id` |
| **Events** | insertar (solo) | Analítica | — | Nombre `^[a-z_]{2,40}$`, `props ≤ 1 KB` | RLS |

**Triggers de integridad nuevos** (baratos y definidos en 003):
- `bt_sync_row` en todas las tablas nuevas.
- Coherencia de ancestros: la etapa de un hito pertenece al mismo objetivo, y el criterio de una acción pertenece a su hito.
- Tope de 8 criterios por hito.
- `goal_log` sin `update`.

---

## 16. Frontend Architecture

### 16.1 Rutas y pantallas (UX §2, §31)

| Ruta | Vista | Reemplaza (redirección) | Fase |
|---|---|---|---|
| `#/home` | Inicio (`FocusHero`, Ritmo, gráfico compacto, Reciente, Evidencia y logros) | `#/today` | F4 |
| `#/goals` | Objetivos (lista con filtros por estado) | `#/projects` | F3 |
| `#/goal/:id` | Detalle del objetivo, con pestañas `?tab=path\|activity\|evidence\|history\|stats` | `#/project/:id` | F3 |
| `#/goal/:id?panel=milestone:<mid>` | Panel de hito (lateral en ≥1024; pantalla u hoja en mobile) | — | F3 |
| `#/history/activity` | Gráfico + panel del día + lista con búsqueda (conserva Registro) | `#/log`, `#/progress` | F5 |
| `#/history/timeline` · `/evidence` · `/achievements` · `/reflections` | Historia | — | F8 / F6 / F8 / F8 |
| `#/recaps` · `#/recap/:period/:start` | Recaps | — | F7 |
| `#/you` (+ `#/you/sync`, `#/you/notifications`, `#/you/export`) | Tú (perfil, visión, ajustes, exportar) | `#/settings` | F4 |
| `#/next` | Próximos pasos (lista completa) | `#/tasks` | F3 |
| Overlays | Onboarding, Welcome back, Acceso | — | F4 |

- **Redirecciones permanentes** en `router.js`. Así los atajos de la PWA y los enlaces antiguos siguen funcionando: `manifest.shortcuts` pasa a `#/home?capture=1` y `#/history/activity`.
- **Interruptor de UI (TDR-09):** `kv.ui = 'v2' | 'v3'`. Mientras se construye (F2–F4), las vistas nuevas conviven y se activan desde Tú › Labs. En F4 v3 pasa a ser la predeterminada; las vistas v2 se eliminan en F9.

### 16.2 Organización de archivos

```
app/
  main.js            arranque (auth → migración → shell)            [MODIFICAR: adelgaza]
  router.js          parse/redirect/params/panel                     [NUEVO, sale de main.js]
  shell.js           nav (sidebar/rail/bottom), contenedor, panel    [NUEVO]
  registry.js        ACTIONS: registro por módulo (register('milestone.close', fn))  [NUEVO]
  motion.js          transiciones post-render                        [NUEVO]
  files.js           imágenes, miniaturas, cola de subida, URLs firmadas  [NUEVO]
  domain/            PURO: progress, rhythm, significance, timeline, recap, recap-copy,
                     achievements, next-step, templates, terms, capture-parse   [NUEVO]
  model.js           memo + índices + fachada a domain/             [MODIFICAR]
  store.js · db.js · sync.js · api.js · migrate.js · lib.js          [MODIFICAR puntual]
  actions/           goals, stages, milestones, criteria, actions, evidence, reflections, days  [NUEVO; actions.js se reparte]
  components/        progress-segmented, consistency-pills, momentum, contribution-graph,
                     day-panel, evidence-card, evidence-picker, timeline-event, achievement-card,
                     celebration, quick-add, empty, skeleton, error, template-picker  [NUEVO; ui.js conserva primitivas]
  views/             home, goals, goal, milestone, history-*, recaps, recap, you, onboarding, welcome, auth  [NUEVO/MODIFICAR]
  styles/            tokens.css, base.css, layout.css, components.css, views.css  [MODIFICAR: se parte styles.css]
```

Sin build: cada archivo es un módulo o una hoja servida tal cual. `styles.css` puede quedar como índice con `@import` o enlazarse por separado; por rendimiento conviene **varios `<link>`** en lugar de `@import`. Cada archivo nuevo se añade a `sw.js:PRECACHE` y a `modulepreload` (H14). Para no olvidarlo: un script de verificación en `scripts/` compara `app/**` con la lista (P1).

### 16.3 Patrones

| Tema | Patrón |
|---|---|
| **Render** | Igual que hoy (`view.render(params) → string`), con dos añadidos: (1) **regiones con clave** (`data-region`) para que el panel lateral y el shell no se redibujen al cambiar datos; (2) `motion.js` anima después del render (§19). No se introduce virtual DOM |
| **Estado de UI** | `state` por vista (como hoy) + estado en la URL para lo compartible o restaurable (`?tab`, `?panel`, `?range`) |
| **Data fetching** | No hay fetching por vista: todo sale de memoria. Sync en segundo plano (como hoy). Solo las URLs firmadas se piden bajo demanda (`files.signedUrl(path)`, con promesa cacheada) |
| **Formularios** | `openSheet` + `FormData` (existe). Se añade `validate(schema, data)` en `lib.js` con reglas mínimas (requerido, longitud, URL http(s), enteros acotados) que reflejan los `check` de la base de datos. Errores en línea (`aria-describedby`) |
| **Quick Add** | Evoluciona `capture.js`: se mantiene `parse()` (`#objetivo`, "ayer", próximo paso parecido) y el chip de **hito** preseleccionado (el hito activo del foco). Enter guarda; "Más" revela duración, evidencia, reflexión y fecha. Si `parse` detecta `task` → crea un próximo paso; si detecta `note` → crea una reflexión |
| **Loading** | Casi no hay esperas (datos locales). Skeletons solo en: primer arranque sin caché, miniaturas y recap anual. Spinner solo por debajo de 1 s |
| **Error** | Por bloque (`ErrorState` + Reintentar) y en línea en formularios; se mantiene la pantalla de error de arranque. Errores de subida: badge en la evidencia ("No se pudo subir · Reintentar") |
| **Empty states** | `EmptyState({icon, title, text, action})`: se extiende `ui.empty()` con **acción obligatoria** según la tabla de la UX §19 |
| **Accesibilidad** | Foco gestionado al abrir o cerrar panel y hoja (dialog nativo), `aria-live` en el toast y en el texto de delta de progreso, roving tabindex en el gráfico |

### 16.4 Componentes (inventario UX §30 → implementación)

| Componente UX | Implementación | Estado |
|---|---|---|
| AppShell, PageHeader, SectionHeader | `shell.js` + CSS | [MODIFICAR] |
| QuickAdd, QuickAddTrigger | `components/quick-add.js` (desde `capture.js`) + FAB/sidebar | [MODIFICAR] |
| GoalCard, GoalHeader, GoalProgress | nuevos (sustituyen `projectCard`) | [NUEVO] |
| StageCard, StageProgress, MilestoneCard, CriteriaList, MilestoneCloseSheet | nuevos | [NUEVO] |
| ActionItem, ActionList | desde `activityRow` (+ chip de hito, indicador de evidencia) | [MODIFICAR] |
| EvidenceCard, EvidencePicker, EvidenceGallery, EvidenceLevel | nuevos | [NUEVO] |
| FocusHero | nuevo | [NUEVO] |
| ContributionGraph, GraphLegend, DayPanel, PeriodSelector, GraphFilters | nuevos (sustituyen `heat()`) | [NUEVO] |
| Timeline, TimelineEvent, TimelineChapter, CollapsedRun | nuevos | [NUEVO] |
| ConsistencyPills, MomentumIndicator | nuevos (sustituyen `statsRow`) | [NUEVO] |
| AchievementCard, AchievementDetail | nuevos | [NUEVO] |
| ReflectionEntry, ReflectionPrompt, ReflectionList | nuevos | [NUEVO] |
| RecapCard, RecapStory | nuevos | [NUEVO] |
| WelcomeBack | nuevo (el `welcomeBack` actual es de la migración v1) | [NUEVO] |
| Celebration (0–5), Toast, UndoSnackbar | `feedback()` existe (toast + deshacer 5 s → **8 s**, UX §8) + `celebration.js` | [MODIFICAR] |
| EmptyState, Skeleton, ErrorState | `empty()` existe | [MODIFICAR]/[NUEVO] |
| OnboardingStep, TemplatePicker | `onboarding.js` | [MODIFICAR] |
| Primitivas (Button, Chip, Tabs, Sheet/Drawer, Dialog, Switch, DatePicker…) | CSS + HTML nativo (`<dialog>`, `<input type=date>`, `<details>`) | [EXISTE]/[MODIFICAR] |

---

## 17. Design System Implementation

### 17.1 Qué se conserva y qué cambia

| Aspecto | Hoy (`styles.css` / `DESIGN.md`) | Nueva especificación (UX §21–22) + paleta viva (P-05) | Acción |
|---|---|---|---|
| Mecanismo | Custom properties en `:root`, oscuro con `prefers-color-scheme` + `[data-theme]` | Tokens en claro y oscuro | **Conservar** el mecanismo |
| Fondo | `#F6F7F5` (gris verdoso) | `#FAF8F4` papel / `#12141A` | Cambiar |
| Primario | Verde `#0B7A5C` / `#3CD3A0` | Cobalto **vivo** (candidato `#2F4BF5` / `#8FA2FF`, §17.3) | Cambiar (P-05) |
| Acento | `--streak` naranja (racha) | Ámbar **vivo** solo para hitos y logros reales (§17.3) | Sustituir; se elimina `--streak` |
| Gráfico | 5 niveles con el acento | `color.viz.activity.0–4` cobalto (`#EEF0FA → #3A56D4`), rest, pause, today | Nuevo |
| Estados | warn, danger | success, warning, error, info, paused | Ampliar |
| Tipografía UI | Stack del sistema (0 KB) | "Sans humanista (p. ej. Inter/Manrope)" + números tabulares | **Mantener el stack del sistema** (`system-ui…`), que cumple la intención sin fuentes de terceros; `font-variant-numeric: tabular-nums` ya existe |
| Tipografía narrativa | — | Serif (Source Serif/Fraunces) en recaps, capítulos y cierres | `ui-serif, "New York", "Iowan Old Style", Georgia, serif` (P-04: o autoalojar un woff2) |
| Escala tipográfica | Ad hoc (25, 15, 13, 12…) | 12 · 14 · 16 · 18 · 20 · 24 · 32 · 44 | Tokens `--fs-*`; **cuerpo 16 px** (hoy 15) |
| Espaciado | `--sp: 16px` + valores sueltos | Base 4: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 | Tokens `--space-1..9` |
| Radios | 14 / 10 / 7 | 6 · 10 · 16 · 999 | Tokens `--radius-sm/md/lg/pill` |
| Sombras | 2 | sm · md · lg, tinte cálido | 3 tokens |
| Motion | Duraciones sueltas (.18 s, .34 s) | instant 80 · fast 120 · base 200 · slow 400 · celebrate 800–1200 + easings | Tokens `--dur-*`, `--ease-*` |
| Breakpoints | 620 · 1000 | 640 · 1024 · 1440 · 1728 | Cambiar (CSS no admite variables en `@media`: se documentan como constantes) |
| Layout | `.view` 640 px | container 1200 / 1320 / lectura 720; sidebar 240; rail 72 | Nuevo (§18) |
| Táctil | `--tap: 44px` | `touch.min 44` | Conservar |
| z-index | Sueltos (30, 60) | base · sticky · sidebar · overlay · modal · toast | Tokens |
| Colores de proyecto | 8 (`--c-*`) | "Categorías y colores personalizables" | Conservar los 8, ajustando la luminancia para convivir con cobalto y ámbar; **verificar el contraste** |

### 17.2 Implementación

- `styles/tokens.css`: tokens semánticos (`--color-bg-app`, `--color-text-primary`, `--color-brand-500`, `--color-accent-milestone`, `--viz-activity-0..4`…) definidos 3 veces: claro, oscuro por media query con `:root:not([data-theme="light"])`, y `[data-theme="dark"]`. Se mantiene el patrón actual.
- **Alias temporales:** `--accent: var(--color-brand-500)`, etc. Así las vistas v2 se ven coherentes mientras conviven (F2–F4) y se eliminan en F9.
- **Contraste:** hay que verificar la AA de cada par texto/superficie y la escala del gráfico (3:1 entre niveles adyacentes contra la superficie, UX §24) en ambos temas. El ámbar `#E39A2D` sobre `#FFFFFF` **no** llega a 3:1 como texto (≈2,3:1). Se usa solo como relleno de icono ◆ con borde oscuro, o con una variante más oscura para texto (hay que derivarla y verificarla).
- **Componentes base:**
  - Cards: borde de 1 px preferido a la sombra, radio de 16.
  - Botones: primario (uno por pantalla), secundario y ghost.
  - Inputs con etiqueta visible.
  - Progress: `bar()` pasa a `progressSegmented(segments)`.
  - Badges: nivel de evidencia de 1–3 marcas.
  - Modales: `<dialog>` centrado de 560 px como máximo.
  - Drawers: el mismo `<dialog>` con la clase `panel`, anclado a la derecha (420 px) en ≥1024 y hoja inferior en mobile.
  - Notificaciones: toast + snackbar de deshacer.
- `DESIGN.md` (impeccable) quedará desactualizado: se regenera al final de la fundación visual (P1) o se marca como histórico.

---

### 17.3 Paleta viva (P-05)

El dueño eligió cobalto + ámbar **con colores vivos**. La UX §1 pide "calma sobre estímulo", así que las dos cosas se concilian así: **más saturación, no más colores**. Se mantienen las reglas de la UX §21:
- un tono principal + neutros + acento por pantalla;
- el ámbar solo para hitos y logros reales;
- el rojo nunca para inactividad.

**Valores candidatos**, con contraste ya calculado (WCAG). Se fijan en F2 con el script de contraste y capturas en claro y oscuro:

| Rol | Claro | Contraste | Oscuro | Contraste |
|---|---|---|---|---|
| Primario (acción, progreso) | `#2F4BF5` | 6,1:1 sobre blanco, 5,8:1 sobre papel `#FAF8F4`, texto blanco encima 6,1:1 | `#8FA2FF` | 7,7:1 sobre `#12141A` |
| Ámbar de hito (relleno de ◆, fondos) | `#FFA826` | 1,9:1: **solo relleno** con borde o icono oscuro, nunca texto | `#FFB547` | 10,5:1 (sirve también como texto) |
| Ámbar como texto (claro) | `#A35A00` | 5,2:1 sobre blanco, 4,9:1 sobre papel | — | — |
| Éxito | `#008A66` | 4,35:1: vale para iconos y texto grande; para texto pequeño, oscurecer un paso | derivar | — |
| Error (solo errores reales) | `#D93036` | 4,7:1 | derivar | — |
| Escala del gráfico (claro, niveles 1–4) | `#B5C2FF → #7D93FF → #4A66FF → #2F4BF5` | El nivel 4 da 6,1:1 y el 3 da 4,5:1; los niveles 1–2 no llegan a 3:1 contra blanco, así que las celdas llevan borde de 1 px y el resumen textual (UX §24) | Escala inversa desde `#8FA2FF` | Verificar en F2 |

**Colores de objetivo (categorías):** los 8 actuales (`--c-*`) se sustituyen por versiones más saturadas, con dos condiciones:
- ninguno se confunde con el ámbar reservado a hitos;
- todos llegan a 3:1 contra la superficie, porque se usan como punto o barra, no como texto.

**Qué no cambia por ser "vivo":** nada de degradados de neón, brillos animados ni fondos de color a pantalla completa. La viveza está en el primario, el ámbar y el gráfico, que es justo donde el color significa algo.

---

## 18. Responsive Strategy

### 18.1 Shell y contenedor (corrige H4)

| Breakpoint | Navegación | Contenedor |
|---|---|---|
| `<640` | Bottom nav: Inicio · Objetivos · **+** · Historia · Tú (el + es el FAB integrado; se elimina el hack `nth-child` de margen) | Padding de 16, 4 columnas, gutter de 12 |
| `640–1023` | Vertical: bottom nav. Horizontal: rail de 72 | Padding de 20, 8 columnas, gutter de 16 |
| `1024–1439` | Rail de 72 (se expande a 240 al fijarlo); ≥1200: sidebar de 240 | `max-width 1200`, `margin-inline:auto`, padding de 24, 12 columnas, gutter de 20–24 |
| `≥1440` | Sidebar de 240 | 1200 (1320 si ≥1728), centrado; panel contextual opcional de 420 |

- El contenido **siempre** se centra dentro de la región principal. Las pantallas de lectura (recap, reflexiones, detalle de hito en pantalla completa) usan `max-width: 720px`.
- `manifest.json`: se quita `orientation: portrait-primary` (H16).

### 18.2 Por pantalla

| Pantalla | Desktop | Tablet | Mobile |
|---|---|---|---|
| **Inicio** | Hero 8 + Ritmo 4; gráfico de 12 meses a 12 columnas; Reciente 6 + Evidencia 6 | Hero 12; Ritmo debajo; gráfico de 6–12 meses con scroll; secundarios en 2 columnas | 1 columna: Hero con CTA visible sin scroll, Ritmo en fila compacta, gráfico de 26 semanas con scroll hasta hoy, Reciente, Evidencia |
| **Gráfico** | Celdas de 13 px, leyenda lateral, tooltip en hover | Celdas de 12 px, leyenda inferior | Celdas de 11 px, `overflow-x:auto` + `scroll-snap` anclado a hoy, **un toque = panel del día** (sin tooltip), selector de periodo en una hoja |
| **Objetivos** | Grid de 3 columnas | 2 | 1 |
| **Detalle de objetivo** | Pestañas + panel lateral de hito (420) sin salir de la vista | Pestañas; panel a pantalla parcial | Pestañas desplazables; hito en pantalla completa o hoja |
| **Timeline** | Línea central con eventos a la derecha y encabezados de capítulo | Línea lateral | Línea izquierda, tarjetas a ancho completo |
| **Quick Add** | Paleta o modal ligero (`N`, `⌘K`) | Hoja | **Hoja inferior** con la acción principal en la mitad baja; el teclado no tapa "Guardar" (`scrollIntoView` + `env(keyboard-inset-height)` donde exista) |
| **Evidencia** | Arrastrar y soltar + grid de 4 columnas | Grid de 3 | Cámara o galería (`capture`), grid de 2 |
| **Logros** | Grid de 3 | 2 | 1 |
| **Reflexiones / Recaps** | Columna de lectura de 720 | 720 | Ancho completo, serif, tarjetas verticales |

**Verificación obligatoria por fase** (UX §20): capturas a **390, 768, 1280 y 1728**, además de 1920 y 2560 para comprobar que no se estira ni se pega a la izquierda.

---

## 19. Animation & Microinteraction Architecture

### 19.1 Problema y solución

El render por `innerHTML` destruye y recrea los nodos, así que una transición CSS no tiene un "valor anterior" desde el que interpolar (causa de H5). **Solución sin dependencias:** `motion.js`.

1. Antes de mutar, la acción registra una intención: `motion.expect({ key: 'goal:<id>:bar', from: 0.61 })`. `actions.js` ya calcula `snapshot()` antes y después, así que se reutiliza.
2. Después del render, `motion.flush()` busca `[data-motion-key]` y aplica `element.animate()` (Web Animations API) desde `from` hasta el valor final: ancho del segmento, trazo del check, brillo de la celda del día.
3. Con `prefers-reduced-motion`, `flush()` aplica el estado final sin animación (o un fundido de 80 ms como máximo).
4. Las regiones que no deben reiniciarse (panel lateral abierto, shell) no se redibujan (`data-region`, §16.3).

### 19.2 Catálogo

| Interacción | Disparador | Feedback | Duración | Prioridad | Rendimiento | Mobile | Reduced motion |
|---|---|---|---|---|---|---|---|
| Hover | Puntero sobre un interactivo | Borde o elevación sutil | 120 ms (fast) | P1 | CSS `transition` (el hover no pasa por re-render) | No aplica | Instantáneo |
| Focus | Teclado | Anillo de 2 px de alto contraste | Instantáneo | P0 | — | — | Igual |
| Press | Clic o toque | `scale(.98)` | 80 ms | P1 | CSS `:active` | Sí | Sin escala |
| Completar acción | Guardar en Quick Add | Check que se dibuja (existe `draw`) + celda de hoy que se ilumina + texto de delta | 250–400 ms | **P0** | 1 elemento; WAAPI sobre opacidad y transform | Háptica de 10 ms (existe, opcional) | Check estático + cambio de color |
| Criterio cumplido | Marcar el checkbox del criterio | Tachado suave + segmento del hito que se llena | 300 ms | **P0** | WAAPI | Háptica | Instantáneo |
| Barra de progreso | Cambio de `p` | Interpolación desde el valor previo + "+1 hito" (`aria-live`) | 400 ms (slow) | **P0** | `transform: scaleX` (no `width`) | Igual | Salto directo + texto |
| Cerrar hito | Último criterio o "Cerrar hito" | ◆ que se asienta + hoja de resumen | 800–1200 ms | **P0** | 1 SVG; sin partículas | Hoja inferior | ◆ estático + hoja |
| Celebración nivel 4–5 | Objetivo completado | Pantalla "Lo que construiste" con capas que se revelan (metáfora de sedimentación) | ≤1200 ms | P1 | Solo opacidad y transform | Pantalla completa | Estática |
| Transición de vista | Cambio de ruta | Fundido y traslación corta | 200 ms | P2 | View Transitions API donde exista; si no, nada | Sí | Ninguna |
| Loading | Carga de más de 300 ms | Skeleton con la forma del contenido | — | P1 | CSS | — | Sin shimmer |
| Deshacer | Tras una mutación | Snackbar | **8 s** (hoy 5 s) | P0 | — | Por encima de la bottom nav | Igual |
| Drag & drop | Reordenar etapas, hitos o criterios | Elevación + hueco | — | P2 (en mobile: menú "Mover") | Pointer events nativos | Menú en lugar de arrastre | Sin elevación animada |
| Error | Fallo | Mensaje en línea + reintentar, **sin sacudidas** | — | P0 | — | — | — |

**Prohibido** (UX §23): animaciones continuas, confeti, rebotes largos, parpadeos y sonido por defecto (`prefs.sound=false` ya existe).

**Niveles de celebración:**

| Nivel | Cuándo | Efecto |
|---|---|---|
| 0 | Acción registrada | Toast |
| 1 | Criterio cumplido o logro suave | Toast con delta |
| 2 | Hito cerrado | Hoja de cierre |
| 3 | Etapa completada | Hoja + resumen de etapa |
| 4 | Objetivo completado | Pantalla |
| 5 | Primer objetivo completado | Pantalla + carta al yo futuro opcional |

`prefs.celebrations` (`full`, `subtle` u `off`) los modula (Blueprint §13).

---

## 20. Performance

| Área | Riesgo | Solución | Cálculo |
|---|---|---|---|
| **Initial load** | unos 30 módulos nuevos (hoy son 20), sin bundler; `IndexedDB.getAll` de todas las tablas | `modulepreload` de lo crítico (shell, home, domain, model); las vistas secundarias se cargan con `import()` dinámico al navegar (recaps, timeline, evidencia, onboarding). SW red-primero con caché (existe). Objetivo: <1,5 s hasta la interacción en un móvil medio con caché caliente | — |
| **Carga de datos** | 20.000 filas → `getAll` de ~100–300 ms en móvil | Aceptable. Si se superan 50.000: cargar `activities` de los últimos 18 meses primero y el resto después (P3) | Arranque |
| **Dashboard** | Memos recalculados en cada `db.rev` (cada tecla guardada) | Índices por padre en `model` (una pasada); `cached()` ya existe. El render de Inicio debe quedar por debajo de 16 ms con 20.000 filas (prueba sintética en F9) | En tiempo real (memo) |
| **Contribution graph** | 371 celdas × re-render en cada emit; "Todo" = N años × 371 | Se construye una sola vez por `rev + filtro`; cadena HTML simple. "Todo" en densidad reducida (1 fila por mes o semanal). Diferir con `requestIdleCallback` si no está visible | Memo por `rev` |
| **Timeline** | Miles de eventos | Rango por defecto de 6 meses + "Cargar más" (3 meses); colapsado de acciones | Bajo demanda |
| **Actividades grandes** | Búsqueda en Registro sobre todo el historial (`norm()` en cada tecla) | Debounce de 160 ms (existe) + normalizado cacheado por `rev` | Bajo demanda + memo |
| **Imágenes / evidence** | Originales pesados, muchas URLs firmadas | Compresión en cliente (1600 px, 0,8); miniaturas de 320 px; `loading="lazy"` y `decoding="async"`; firmas en caché; solo se firma lo visible | Bajo demanda + caché |
| **Recaps** | Anual = recorrido completo | O(n) memorizado por periodo; semanal <5 ms | Bajo demanda |
| **Consultas de progreso** | `goalProgress` por tarjeta | Índices + memo; O(hitos + criterios) del objetivo | Tiempo real (memo) |
| **Animations** | Layout thrash | Solo `transform` y `opacity`; WAAPI; nada continuo | — |
| **Sync** | Más tablas = más peticiones por pasada (12 GET de bajada cada minuto) | Bajada condicionada: la pasada de 60 s solo baja si la app está visible (existe). P2: una RPC `changes_since(cursor)` que devuelva todas las tablas en una sola llamada si la latencia molesta | — |
| **Background jobs** | — | **Ninguno en el MVP.** P2: `pg_cron` para limpiar archivos huérfanos | — |
| **Precomputado en el servidor** | — | **Nada** en el MVP (TDR-01). `daily_stats` solo para analítica | — |

**Presupuesto de CSS y JS:** hoy unos 185 KB sin comprimir (JS + CSS + HTML). Objetivo: por debajo de 350 KB sin comprimir tras la nueva versión, sin fuentes de terceros.

---

## 21. Security

| Tema | Estado actual | Medida |
|---|---|---|
| **Autenticación** | Supabase Auth; tokens en `localStorage`; refresco automático; recuperación | Se mantiene. La CSP `script-src 'self'` + `esc()` en todo el contenido reducen el riesgo de XSS, que es la amenaza principal para tokens en `localStorage`. Revisar que ningún componente nuevo use `innerHTML` con datos sin `esc()` (checklist de revisión por PR) |
| **Autorización / ownership** | RLS por `user_id` en todas las tablas | RLS idéntica en las tablas nuevas + **FK compuestas** (H15) + triggers de coherencia de ancestros + políticas de Storage por carpeta `auth.uid()`. Principio: **un usuario nunca puede leer, crear, enlazar ni borrar filas o archivos de otro**, ni siquiera conociendo el UUID |
| **Validación** | `check` en la base de datos + atributos HTML | `check` en todas las tablas nuevas (enums, longitudes, rangos, URL) + `validate()` en el cliente que las refleja. La base de datos es la autoridad |
| **Uploads** | No existen | Bucket privado; lista blanca de MIME (sin SVG ni HTML); 10 MB; re-codificación de imágenes en el cliente (elimina EXIF/GPS y cargas ocultas); el nombre de archivo lo decide el sistema (`original.ext`), nunca el usuario; `Content-Disposition` de descarga para PDF |
| **Archivos / URLs** | — | Solo URLs firmadas de 1 h; nunca públicas. Enlaces de evidencia: solo `http(s)`, `rel="noopener noreferrer"`. Sin unfurl remoto (no hay servidor: no hay SSRF) |
| **CSP** | `img-src 'self' data:` · `connect-src 'self' <supabase>` | Añadir `img-src … https://<proyecto>.supabase.co blob:` y `media-src` igual si hay audio. `frame-src 'none'` (implícito por `default-src 'self'`; se hace explícito) |
| **Permissions-Policy** | `camera=(), microphone=()` | `<input type=file capture>` **no** necesita `getUserMedia`, así que se puede mantener `camera=()`. **Verificar en iOS y Android en F6.** Grabar audio dentro de la app sí requeriría `microphone=(self)` (P-10) |
| **Datos personales** | `events` sin contenido; analítica desactivable; exportar y borrar datos existen | Evidencia y reflexiones son las piezas más sensibles: privadas por defecto, sin compartir en el MVP. `exportBackup` v3 debe incluir las tablas nuevas y un **manifiesto** de archivos con URLs firmadas o una descarga (P1) |
| **Rate limiting / abuso** | Límites por defecto de Supabase Auth | PostgREST no limita por usuario, pero el abuso solo afecta a las propias filas. Límites de tamaño por fila (checks), 8 criterios por hito, `prefs ≤ 8 KB`, `props ≤ 1 KB`, 10 MB por archivo y cuota blanda. Si el producto se abre a terceros (P-02): cuota dura de Storage por usuario (trigger sobre `evidence.size_bytes`) y CAPTCHA en el registro (configuración de Supabase) |
| **Sesiones** | Refresco; evento `bitacora:signedout` → pantalla de acceso | Sin cambios. Al cerrar sesión, borrar también el store `files` (blobs locales) |
| **Secretos** | `config.js` solo con la clave publicable; `.env*` excluidos | Sin cambios. La RPC de borrado de cuenta es `security definer` en SQL (no necesita secretos en el cliente). Si se usa Edge Function (push), su `service_role` vive solo en los secretos de Supabase |
| **API security** | RLS + `anon` revocado | Revocar `anon` en todas las tablas nuevas y en `storage.objects` del bucket; `grant` explícito a `authenticated`. **Prueba automática:** consultas como `anon` y como usuario B sobre filas de A → 0 filas o 401/403 (§23) |
| **Borrado** | Borrado lógico que vacía el contenido; "Borrar mis datos" | + Borrar objetos de Storage del usuario. + RPC `delete_my_account` (P1): borra filas y el usuario de `auth.users` (`cascade`); los archivos se borran antes desde el cliente con la API de Storage |

---

## 22. Migration Strategy

### 22.1 Principios

1. **Solo aditiva.** 003 no renombra, no borra y no cambia el tipo de nada que exista. Cualquier cliente v2 en caché sigue funcionando: sus upserts con `merge-duplicates` solo tocan las columnas que envía, así que no pisan las nuevas.
2. **v1 intocable** (`bitacora_state`, `bitacora_history`, `bitacora_state_backup_v1`).
3. **Antes del SQL, en el cliente:** en el siguiente despliegue la app exporta automáticamente una copia local (`localStorage['bitacora:backup:pre-v3:<uid>']`), reutilizando el patrón de `startAfterAuth`. El usuario la puede descargar desde Tú.
4. **Orden:** SQL 003 aplicado y verificado → despliegue del cliente que escribe en las tablas nuevas. El cliente tolera que 003 no exista (estado `migration`, que ya existe, ante `PGRST205`/404) y en ese caso no escribe en las tablas nuevas.

### 22.2 Cambios de esquema (003_impacable.sql, conceptual)

| Orden | Cambio | Riesgo |
|---|---|---|
| 1 | `unique (user_id, id)` en `projects`, `milestones`, `tasks`, `activities` (+ nuevas) | Bajo (los id ya son únicos) |
| 2 | Tablas nuevas: `stages`, `criteria`, `evidence`, `reflections`, `achievements`, `day_marks`, `goal_log`, `recaps`, con columnas de sync, checks, índices, triggers `bt_sync_row`, RLS (4 políticas), `revoke anon` y `grant authenticated` | Bajo |
| 3 | Columnas nuevas nullable o con default: `projects.template/completed_at/success_indicator`; `milestones.stage_id/weight(2)/description/expected_evidence/status('open'→ se rellena 'done' donde `done_at` no es nulo)`; `activities.milestone_id/criterion_id/duration_min`; `tasks.milestone_id`; `profiles.vision` | Bajo; el *backfill* de `milestones.status` es un `update` acotado |
| 4 | Ampliar el check de `activities.source` (+ `'recovery'`) | Bajo |
| 5 | FK compuestas en las relaciones existentes, precedidas de una consulta de verificación (sin filas cruzadas; si las hubiera, se aborta con un mensaje) | Medio |
| 6 | Triggers de coherencia de ancestros y tope de criterios | Bajo |
| 7 | Bucket `evidence` + políticas de `storage.objects` | Medio (primera vez que se usa Storage) |
| 8 | RPC `delete_my_account` (P1, puede ir en 004) | Medio |

**Cómo se prueba:** igual que 002, en Postgres local con los roles de Supabase simulados. Se comprueban idempotencia (correr dos veces), RLS cruzada (usuario A frente a B), FK compuestas, "gana la última edición" en las tablas nuevas y el rollback.

**Rollback (`003_impacable_down.sql`):**
- Borra las tablas nuevas, las columnas nuevas, los triggers nuevos, las FK compuestas, los `unique` añadidos y las políticas del bucket.
- **No borra el bucket con archivos** automáticamente: requiere un paso manual consciente.
- Restaura el check original de `source` (solo si no hay filas con `'recovery'`; si las hay, las convierte a `'capture'`).
- Pérdida de datos en un rollback: todo lo creado en las tablas nuevas. Por eso el paso 3 de §22.1 y un **export previo desde la app**.

### 22.3 Migración local (cliente)

- IndexedDB `bitacora`: **`DB_VERSION` 1 → 2**. `onupgradeneeded` crea los stores nuevos (8 tablas + `files`) sin tocar los existentes. `db.TABLES` se amplía.
- `migrate.js` añade `migrateV2toV3()`, **idempotente** y marcada en `kv.migratedV3`:
  1. `prefs.activeWeekDays = prefs.weeklyGoal ?? 2` (respeta el 4 actual).
  2. `milestones.status = done_at ? 'done' : 'open'`, `weight = 2`, si faltan.
  3. **No** crea etapas (etapa implícita) ni criterios (hitos binarios hasta que el usuario los defina).
  4. Backfill del ledger de logros (§11.2) con fechas reales y `announced_at = now`.
  5. Actividades de hito creadas por `toggleMilestone` (`source='milestone'`, título `Hito: …`): se enlaza `milestone_id` buscando por título y proyecto (heurística única; corrige H3 hacia delante).
  6. Muestra **una vez** la hoja "Qué cambió", que explica: el Avance ahora se basa en hitos, la racha diaria pasa a Constancia semanal, los logros por cantidad se retiraron y nada se borró. Ofrece "Crear etapas desde mis proyectos".
- **Datos existentes y cómo se ven en la nueva versión:**

| Dato actual | En la nueva versión |
|---|---|
| Proyecto "Inglés" (una actividad por día) | Objetivo sin hitos; sus días alimentan Constancia y el gráfico |
| "Plan 12 meses" (hitos de la hoja de ruta) | Objetivo con hitos en la etapa implícita; su Avance sale de esos hitos |
| "Capital" (métrica) | Objetivo con indicador de éxito, sin Avance hasta que tenga hitos |
| Notas del historial semanal v1 (`kind='note'`) | Reflexiones heredadas; ya no colorean el gráfico (TDR-08) |

### 22.4 Riesgo de pérdida de información

| Riesgo | Mitigación |
|---|---|
| Que el rollback de 003 borre datos nuevos | Export previo + advertencia en el propio SQL |
| Blobs de evidencia no subidos (iOS puede expulsar IndexedDB de sitios no instalados tras 7 días sin uso) | Subida inmediata al recuperar la conexión; indicador "N archivos sin subir" en Tú; advertencia al cerrar sesión con blobs pendientes (el mismo patrón que los cambios pendientes) |
| Filas rechazadas por FK (H1) | Corregir **antes** de crear tablas con FK profundas (F0) |
| Cambio de cuenta en el dispositivo | Ya existe la copia `bitacora:backup:<uid>`; extenderla con las tablas nuevas (sin blobs) |

### 22.5 Borrado lógico en cascada (cliente)

- **Borrar objetivo:** confirmación → borrado lógico de etapas, hitos, criterios, próximos pasos, evidencias (+ archivos) y reflexiones vinculadas. Las acciones **se conservan** con `project_id` y la UI muestra "Objetivo eliminado" (corrige H2 filtrando `deleted_at` en `model.project()`).
- Deshacer restaura todo el grupo (el toast guarda la lista).
- La UI privilegia **Archivar** (nada se pierde; Blueprint §11).
- Borrar hito: criterios en cascada; acciones y evidencias quedan con `milestone_id` a `null` (vuelven a ser "sueltas") tras confirmar.

---

## 23. Testing Strategy

**Sin dependencias** (respeta "sin dependencias"): **`node --test`** (incluido en Node ≥ 18) para todo lo puro, y SQL plano contra Postgres local. Lo que requiere navegador se verifica con la vista previa del navegador de Claude Code siguiendo checklists escritas. Playwright como dependencia **solo de desarrollo** = DECISIÓN PENDIENTE P-12.

| Nivel | Qué | Cómo | Cuándo |
|---|---|---|---|
| **Unit** | `domain/*` (progress, rhythm, significance, timeline, recap, achievements, next-step, capture-parse, migrate convert) | `node --test tests/domain/*.test.js` con fixtures JSON | Cada PR; obligatorio desde F0 |
| **Integration (cliente)** | `store` + `db` + outbox + `model` con un IndexedDB en memoria | `fake-indexeddb` sería una dependencia → se usa el **modo sin IndexedDB que ya existe** (`db` funciona solo en memoria si falla `openDb`) | F0+ |
| **API / Database** | Esquema 003, RLS, FK compuestas, triggers, "gana la última edición", Storage policies | `supabase/tests/003_*.sql` en Postgres local con roles `anon`/`authenticated` y `request.jwt.claims` simulados (como se hizo con 002). Las políticas de Storage se verifican en el proyecto real con dos cuentas de prueba, porque el Postgres local no tiene el esquema `storage` | F1 y cada migración |
| **Sync** | Orden de FK, 409 que se reintenta, rechazo 400 visible, conflictos entre dos "dispositivos" | Pruebas unitarias de `sync` con `api()` inyectable (hoy se importa directo: hay que parametrizarlo en F0) | F0–F1 |
| **Frontend** | Render de vistas con datos fijos → snapshots de HTML (las vistas devuelven strings: se pueden probar en Node si `domain` es puro y `model` es inyectable) | `node --test` | F3+ |
| **E2E** | Los 7 flujos de la UX §25 | Checklist ejecutada en el navegador de Claude Code (preview) sobre local y producción; P-12 para automatizar | Fin de cada fase |
| **Responsive** | 390 · 768 · 1280 · 1728 · 1920 · 2560 | Capturas con `resize_window` | Fin de cada fase visual |
| **Accessibility** | Teclado completo, foco, contraste AA en ambos temas, lector de pantalla (VoiceOver), reduced motion, zoom al 200% | Manual + cálculo de contraste de los tokens (script sin dependencias en `scripts/contrast.mjs`) | F2, F5, F9 |
| **Performance** | Render de Inicio y del gráfico con 20.000 acciones sintéticas; arranque en frío | Generador de datos sintéticos (`scripts/`) + `performance.now()` en la preview | F5, F9 |
| **Security** | Usuario B intenta leer, crear hijos o borrar filas y archivos de A; `anon` sin acceso; URL `javascript:` rechazada; SVG rechazado; XSS en títulos (`<img onerror>`) escapado | SQL + pruebas unitarias de `validate()`/`esc()` + intento manual de subida | F1, F6, F9 |

**Casos críticos (deben existir como pruebas automáticas):**
1. **Progreso:** 1.000 acciones en un hito sin criterios cumplidos → `goalProgress.p` no cambia.
2. Hito con 2 de 4 criterios, peso 3, junto a otro cerrado de peso 1 → objetivo = (3·0,5 + 1·1)/4 = 62,5%.
3. Etapa `skipped` y hito `skipped` → excluidos del denominador.
4. Hito cerrado a mano con 3 de 5 → `p=1` y `closedWithUnmet=2`.
5. Borrar un hito pendiente → el % sube **y** se genera `goal_log.scope_changed` con antes y después.
6. **Actividad:** día con 20 acciones y sin evidencia → nivel ≤ 3; día con 1 acción + evidencia de nivel 2 + criterio → nivel ≥ 2; descanso → nivel 0 con marca; nota sola → no activo.
7. **Constancia:** N=2; semana con 1 día activo → no activa; mejor serie calculada a través de años; semana actual incompleta nunca "vacía".
8. **Momentum:** menos de 28 días de historial → "Empezando"; regreso tras 10 días → "Retomando".
9. **Contribution graph:** los cambios de horario (DST) no duplican ni pierden días (`dayKey` local); límites de año y semana ISO.
10. **Achievements:** evaluar dos veces → mismo id, sin duplicados; reabrir un hito conserva el logro; deshacer en 8 s lo elimina; como máximo 1 anunciado por sesión.
11. **Permisos y ownership:** B no puede insertar un `criteria` con `milestone_id` de A (FK compuesta → error); B no puede leer `storage.objects` de la carpeta de A; `anon` recibe 401 en todas las tablas.
12. **Recaps:** semana sin actividad → `tone:'light'` sin comparación; progreso desde→hasta reconstruido; completar un día pasado cambia el recap de esa semana.
13. **Migración:** `migrateV2toV3` dos veces → mismo estado; `weeklyGoal:4` → `activeWeekDays:4`.
14. **Sync:** hijo antes que el padre → 409 → sigue en la outbox → la siguiente pasada lo sube.

---

## 24. Implementation Phases

> Cada fase termina con: pruebas en verde, verificación en la preview (capturas en los 4 anchos cuando hay UI), commit, push y deploy (`vercel --prod --yes`), y actualización de `CLAUDE.md` si cambia una regla. **La UI v2 sigue disponible hasta F4.**

### F0: Preparación y deuda técnica (sin cambios visibles)
- **Objetivo:** que el código admita el dominio nuevo sin riesgo.
- **Funcionalidades:**
  - Harness `node --test`.
  - Extraer lógica pura de `model.js` a `domain/` (sin cambiar el comportamiento, cubierto por pruebas).
  - Hacer `api()` inyectable en `sync.js`.
  - **Corregir H1** (409 a reintento; rechazos visibles).
  - Corregir H2 (`project()` sin borrados).
  - Script que compara la precaché del SW con `app/**` (H14).
  - Etiqueta git `v2-final`.
- **Áreas:** `model.js`, `sync.js`, `lib.js`, `tests/`, `scripts/`.
- **Dependencias:** ninguna.
- **Riesgos:** regresiones al extraer; las mitigan las pruebas escritas antes de mover el código.
- **Criterio de finalización:**
  - Pruebas unitarias de los derivados actuales en verde.
  - La app en producción idéntica a antes.
  - Una prueba demuestra que un 409 no saca la fila de la outbox.

### F1: Esquema 003 + sync + almacenamiento local v2 (invisible)
- **Funcionalidades:**
  - `003_impacable.sql` + down + `supabase/tests/003_*.sql`.
  - IndexedDB v2.
  - `sync.ORDER` extendido.
  - `migrateV2toV3`.
  - Copia pre-v3.
  - `exportBackup`/`importBackup` con las tablas nuevas.
- **Áreas:** `supabase/`, `db.js`, `store.js` (DEFAULTS/BLANK de las tablas nuevas), `sync.js`, `migrate.js`.
- **Dependencias:** F0. El dueño aplica el SQL en Supabase (paso manual, como con 002).
- **Riesgos:** FK compuestas sobre datos existentes; Storage por primera vez.
- **Criterio de finalización:**
  - SQL idempotente y con rollback probados en local.
  - En producción, `anon` recibe 401 en las 8 tablas nuevas.
  - Crear una etapa, un hito con criterios y una evidencia de enlace desde la consola de la app sincroniza entre dos navegadores.

### F2: Fundación visual
- **Funcionalidades:**
  - Tokens nuevos con la paleta viva (claro y oscuro), con alias.
  - Contenedor centrado y grid (corrige H4).
  - Breakpoints nuevos.
  - `shell.js` (bottom nav 4+1, rail y sidebar).
  - `router.js` con rutas nuevas y redirecciones.
  - `motion.js`.
  - Panel lateral y hoja.
  - `EmptyState`/`Skeleton`/`ErrorState`.
  - Deshacer a 8 s.
  - Manifest sin `orientation`.
- **Áreas:** `styles/`, `index.html`, `main.js`, `ui.js`, `manifest.json`.
- **Dependencias:** F0.
- **Riesgos:** las vistas v2 se ven raras con los tokens nuevos (lo mitigan los alias).
- **Criterio de finalización:**
  - A 1280, 1728, 1920 y 2560 el contenido queda centrado con un máximo de 1200/1320.
  - Contraste AA verificado por script.
  - Todas las rutas antiguas redirigen.

### F3: Estructura y motor de progreso
- **Funcionalidades:**
  - Objetivos (lista + detalle con pestaña Camino).
  - Etapas: crear, reordenar con menú, omitir.
  - Hitos con criterios, peso y evidencia esperada.
  - Panel de hito.
  - Cerrar hito (hoja de cierre con evidencia de nota o enlace y reflexión de una línea).
  - Próximos pasos vinculados a hito.
  - `domain/progress.js` en la UI (barras segmentadas, fracciones, delta animado, indicador de respaldo).
  - `goal_log`.
  - Quick Add con chip de hito y reflexión de una línea.
  - Plantillas (`domain/templates.js`).
- **Dependencias:** F1, F2.
- **Riesgos:** fricción al crear criterios; cambio de % en los proyectos existentes (hoja "Qué cambió").
- **Criterio de finalización:** los flujos 2 y 3 de la UX §25 completos, con pruebas del motor de progreso (§23, casos 1–5) en verde.

### F4: Inicio, Ritmo, Onboarding y Regreso. **Se activa la UI v3**
- **Funcionalidades:**
  - `FocusHero` (foco = `prefs.focusGoalId`).
  - `ConsistencyPills` + `MomentumIndicator`.
  - Reciente.
  - Bloque Evidencia y logros.
  - Otros objetivos.
  - Siguiente acción anclada al hito (`domain/next-step.js`: primero el próximo paso del hito activo, luego un criterio pendiente del hito activo, luego abrir el siguiente hito).
  - Onboarding de 3 pasos con plantillas y progreso dotado.
  - WelcomeBack (≥7 días).
  - Logro de recuperación.
  - Tú (perfil, visión, N días, celebraciones, Labs).
  - Se retiran de la UI la racha diaria y los avisos con juicio.
- **Dependencias:** F3.
- **Riesgos:** perder funciones de v2 (Tareas, Registro, filtros): hay que verificarlo con la checklist "no se pierde nada" (§25.10).
- **Criterio de finalización:** flujos 1, 4 y 7; Inicio con 5 bloques como máximo y una sola acción primaria; v3 como predeterminada; v2 accesible desde Labs.

### F5: Actividad y Contribution Graph
- **Funcionalidades:**
  - `domain/significance.js` + `dayIndex`.
  - `ContributionGraph` (semana, mes, 12 meses, año, todo) con marcadores, pausas y descansos.
  - Filtros.
  - Panel del día ("Añadir a este día", "Marcar descanso").
  - Teclado.
  - Resumen textual.
  - Historia › Actividad conserva la lista y la búsqueda de Registro.
- **Dependencias:** F3 (criterios e hitos), F1 (`day_marks`).
- **Riesgos:** rendimiento en mobile; comprensión del gráfico (validación P-16).
- **Criterio de finalización:** flujo 6 (§25) completo; prueba sintética de 20.000 acciones con render por debajo de 16 ms; navegación completa con teclado.

### F6: Evidencia con archivos
- **Funcionalidades:**
  - Bucket y políticas.
  - `files.js` (compresión, miniatura, cola de subida, URLs firmadas).
  - EvidencePicker con 8 tipos.
  - Niveles.
  - Portafolio (Historia › Evidencia).
  - Borrado físico.
  - CSP y Permissions-Policy verificadas en iOS y Android.
  - Indicador de archivos pendientes.
- **Dependencias:** F1, F3.
- **Riesgos:** R3 (§26): cuotas, HEIC y expulsión de datos en iOS.
- **Criterio de finalización:** una foto tomada sin conexión se ve al instante, se sube al volver la conexión, se ve en otro dispositivo, no contiene EXIF, y B no puede leerla.

### F7: Recap semanal (**fin del MVP**)
- **Funcionalidades:**
  - `domain/recap.js` + `recap-copy.js`.
  - Vista del recap (serif, tarjetas).
  - Tarjeta de lunes en Inicio (sustituye el aviso `week:`).
  - Pregunta reflexiva → `recaps.answer` + reflexión.
  - Tú › Recaps.
- **Dependencias:** F3, F5.
- **Criterio de finalización:** los 10 puntos del MVP del Blueprint §19 verificados (§25.1).

### F8: V2 (P1): Timeline, Logros, Reflexiones, Recap mensual, Cierre de objetivo
- **Funcionalidades:**
  - `domain/timeline.js` + Historia › Timeline.
  - Ledger de logros completo + Historia › Logros + logros personales.
  - Historia › Reflexiones con búsqueda y destacados.
  - Recap mensual.
  - Cierre de objetivo (celebración de nivel 4–5).
  - Ritmo de referencia por fecha.
  - Personalización de categorías y colores.
- **Dependencias:** F7.

### F9: Endurecimiento y limpieza
- **Funcionalidades:**
  - Auditoría de accesibilidad y rendimiento.
  - Revisión de seguridad (§21).
  - `delete_my_account`.
  - Export v3 con manifiesto de archivos.
  - Eliminar vistas v2, `achievements()` antiguo, `streak()` de UI, `insights()`, `--streak`, alias de tokens y `seenAch`.
  - Actualizar `CLAUDE.md`, "Cómo funciona" y `DESIGN.md`.
- **Criterio de finalización:** §25 completo; ningún módulo sin uso; SW y precaché verificados por script.

### F9b: Gate de comercialización (antes de abrir a terceros; P-02)
- **Objetivo:** que otra persona pueda registrarse, usar y salir de Bitácora con seguridad y sin costes descontrolados.
- **Funcionalidades:**
  - `delete_my_account` pasa a **obligatorio** (borra filas, archivos y usuario).
  - Cuota **dura** de Storage por usuario (trigger sobre `evidence.size_bytes`) y límites por plan.
  - CAPTCHA en el registro y confirmación de correo activada (configuración de Supabase).
  - **SMTP propio** para correos de Auth: el SMTP por defecto de Supabase tiene un límite de envíos muy bajo y no sirve para producción.
  - Textos legales: política de privacidad y términos; consentimiento de la analítica (`prefs.analytics` ya existe).
  - Plantillas de objetivos pensadas para las personas A–E del Blueprint.
  - Consultas de las métricas de validación del Blueprint (D7/D30, % con hito cerrado en 30 días, evidencias por usuario).
  - Plan de pago de Supabase y dominio propio.
  - Cobro/suscripciones = FUTURO (fuera de este plan; requiere backend o Edge Functions y proveedor de pagos).
- **Dependencias:** F9.
- **Criterio de finalización:** una cuenta nueva de prueba se registra con CAPTCHA, recibe el correo desde el SMTP propio, sube evidencia hasta la cuota y ve el aviso, exporta todo y elimina su cuenta; tras borrarla no queda ninguna fila ni archivo suyo.

### F10 (P2/FUTURO)
- Recap anual.
- Notificaciones push (Edge Function + VAPID + `pg_cron`, con tope y *sunset*).
- Vista semanal del gráfico.
- Autorrecompensas.
- Retrato de identidad.
- Proyección con rangos.
- Autoevaluaciones.
- Exportar recap como imagen.
- Compartir capítulo.
- Accountability.
- Integraciones.

```
F0 ─► F1 ─► F3 ─► F4 ─► F5 ─► F7 (MVP) ─► F8 ─► F9 ─► F9b (comercial) ─► F10
      └─► F2 ─┘          └─► F6 ┘
```

---

## 25. Acceptance Criteria

### 25.1 MVP (Blueprint §19): todos verificables

1. **Estructura:** se puede crear Objetivo → Etapa → Hito (con 2–5 criterios y peso S/M/L) → Acción. Un objetivo sin etapas funciona (etapa implícita) y un hito sin criterios también (binario).
2. **Registro rápido:** desde Inicio, con el foco fijado, registrar una acción vinculada al hito activo requiere **1 toque + escribir + Enter**. En la prueba cronometrada del flujo con texto de 20 caracteres, el tiempo desde abrir Quick Add hasta la confirmación es menor de **15 s**.
3. **Evidencia:** en una acción o en un hito se puede adjuntar una nota, un enlace, una foto o un PDF. Con la foto sin conexión, la miniatura aparece en menos de 1 s y se sube sola al volver la red.
4. **Progreso de dos ejes:**
   - Al completar una Acción, el sistema registra la actividad del día y actualiza la Constancia **sin alterar el Avance** de ningún objetivo.
   - Al cumplir un criterio, el Avance del hito, la etapa y el objetivo cambia **exactamente** según §8.2, y los demás objetivos no cambian.
5. **Contribution graph:**
   - 12 meses por defecto.
   - El nivel de cada día sigue §9.2.
   - ◆ en los días de cierre de hito.
   - El descanso marcado muestra "–" y no rompe la constancia.
   - Ningún día sin actividad usa rojo ni "X".
   - No aparece ningún contador de racha.
6. **Feedback inmediato:**
   - Al guardar una acción: check + celda de hoy + texto de delta en menos de 400 ms.
   - Al cerrar un hito: hoja de cierre + ◆ + "+1 hito" y la barra interpola desde el valor anterior.
   - Con reduced motion: los mismos cambios sin movimiento.
7. **Dashboard:**
   - Máximo 5 bloques.
   - Exactamente 1 botón primario visible (la siguiente acción).
   - Un usuario con 3 meses de datos identifica en menos de 10 s qué construye, en qué punto está y qué evidencia tiene (prueba con 5 personas, P-16).
8. **Recuperación:**
   - Tras 7 días o más sin actividad, al abrir aparece WelcomeBack (una vez por regreso, descartable).
   - Sin mención de racha ni de tiempo perdido.
   - La primera acción genera el logro de recuperación.
   - Pausar o archivar conserva el 100% del historial.
9. **Onboarding:** de "sin datos" a "primer objetivo con primera acción registrada y primer criterio cumplido" en **3 pantallas**; todos los pasos se pueden saltar.
10. **Recap semanal:** existe para cualquier semana con datos; contesta qué hice, qué avancé, qué conseguí, qué aprendí y qué sigue. Una semana sin actividad produce un texto neutro sin comparaciones.

### 25.2 Transversales

- **Ownership:** con dos cuentas de prueba, B no obtiene ninguna fila ni archivo de A por REST, Storage ni FK (pruebas SQL en verde).
- **Offline:** sin conexión se puede crear un objetivo, un hito, una acción y una evidencia; al reconectar todo sincroniza y no queda nada en `syncRejected`.
- **Responsive:** a 390, 768, 1280 y 1728 no hay scroll horizontal de página. El contenido queda centrado en escritorio. Todos los objetivos táctiles miden ≥ 44 px en mobile.
- **Accesibilidad:** contraste AA de todos los pares de tokens en ambos temas; gráfico navegable con flechas y resumen textual presente; foco visible en todo interactivo; toasts y deltas anunciados (`aria-live`).
- **Rendimiento:** con 20.000 acciones sintéticas, el render de Inicio y del gráfico en 12 meses tarda menos de 16 ms cada uno en un portátil de referencia y menos de 50 ms en un móvil medio.
- **Anti-dark-pattern:**
  - Ningún texto de la app contiene "perderás", "no olvides", "días seguidos" ni urgencia; "racha" solo aparece como "mejor racha: N semanas" (grep sobre `app/`).
  - Ningún logro tiene contador `x/N` ni se muestra bloqueado.
  - Pausar, archivar, exportar y eliminar están a 2 toques o menos desde Tú o desde el objetivo.
- **Explicabilidad:** cada número visible (%, pills, momentum, nivel de celda, nivel de evidencia) tiene una explicación en "Cómo funciona" o en un tooltip (regla de `CLAUDE.md`).
- **No se pierde nada de v2** (checklist F4): captura con detección, deshacer, búsqueda del historial, filtros por tipo y objetivo, próximos pasos con estados (incluido "en espera"), métrica de objetivo, exportar e importar, modo invitado, temas, atajos `N`/`⌘K`/`/`, avisos desactivables.

---

## 26. Technical Risks

Ordenados por capacidad de obligar a rehacer partes importantes.

| # | Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|---|
| **R1** | El render por `innerHTML` completo no soporta bien paneles persistentes, animaciones de delta y gráficos grandes | Alto (podría forzar reescribir la capa de vistas) | Media | `motion.js` + regiones con clave (§19.1) **validado en F2 con un prototipo** de la barra que interpola y un panel abierto durante una sync. Si falla, plan B acotado: parcheo por región (`region.innerHTML`), sin framework |
| **R2** | El modelo de progreso nuevo hace que los % actuales bajen o desaparezcan; el usuario percibe que "perdió progreso" | Alto (confianza) | Alta | Hoja "Qué cambió" + "Crear etapas desde mis proyectos" + la métrica visible como indicador + nada se borra |
| **R3** | Evidencia en archivo: cuota del plan de Supabase, HEIC y tamaños, expulsión de IndexedDB en iOS, CSP y permisos | Alto | Media | Fase propia (F6) después del núcleo; compresión en cliente; indicador de pendientes; P-03 resuelta antes |
| **R4** | Sync con FK profundas: filas rechazadas en silencio (H1) u orden incorrecto | Alto (pérdida silenciosa de datos) | Alta si no se corrige | F0 corrige H1; orden por dependencias; pruebas de sync con dos dispositivos |
| **R5** | Complejidad: seis entidades para un producto que hoy usa una persona | Medio | Media | Revelado progresivo (etapa implícita, criterios opcionales, visión opcional); plantillas; P-02 |
| **R6** | Olvidar módulos nuevos en la precaché del SW → la app no abre offline | Medio | Alta | Script de verificación (F0) |
| **R7** | Umbrales de significancia, momentum y constancia mal calibrados ([C] hipótesis) | Medio | Media | Constantes centralizadas + pruebas + `events` para medir; ajustar sin migración |
| **R8** | "Gana la última edición" por fila pisa ediciones concurrentes del mismo objetivo en dos dispositivos | Bajo-medio | Baja (un usuario) | Criterios en filas separadas; los campos de alta concurrencia no comparten fila |
| **R9** | Comercializar sin preparar lo básico para terceros (borrado de cuenta, cuotas, correo transaccional propio, textos legales) | Alto (bloquea el lanzamiento) | Media | Gate de comercialización F9b con criterios verificables; la arquitectura multiusuario ya se construye desde F1 |
| **R10** | Límites del plan gratuito de Supabase (1 GB de Storage, pausa tras inactividad) | Medio | Media | P-03; export periódico |
| **R11** | Zona horaria (viajes) mueve acciones de día | Bajo | Baja | `dayKey` local (como hoy); documentado |
| **R12** | Sin CI: una regresión llega a producción | Medio | Media | `node --test` antes de cada deploy (checklist); GitHub Action = OPCIONAL (P1) |

---

## 27. Technical Decision Records

| TDR | Decisión | Alternativas consideradas | Razón | Consecuencias |
|---|---|---|---|---|
| **TDR-01** | Toda la lógica derivada (progreso, gráfico, timeline, recaps) se calcula **en el cliente** sobre datos locales | Vistas SQL o RPC; precalcular con jobs | Offline-first ya existe; la escala por usuario es pequeña; una sola fuente de verdad; coste 0 | El servidor no "sabe" el progreso (la analítica usa vistas aparte); los derivados tienen que ser rápidos (memo + índices) |
| **TDR-02** | Se **conservan los nombres de tabla** (`projects`, `milestones`, `activities`, `tasks`); en la UI se llaman Objetivo, Hito, Acción y Próximo paso | Renombrar tablas; crear tablas nuevas y migrar | Compatibilidad con clientes en caché, vistas, rollback y métricas; cero migración de datos | Doble vocabulario: se documenta en `domain/terms.js` y en `CLAUDE.md` |
| **TDR-03** | La Visión es un **texto** (`profiles.vision`) y el porqué por objetivo reutiliza `projects.goal` | Tabla `visions` con relación a objetivos | Blueprint: "opcional al inicio" y "esconder Visión hasta que se necesite"; YAGNI | Varias visiones = migración futura aditiva |
| **TDR-04** | Criterios en **tabla propia**, no jsonb | Array jsonb en `milestones` | "Gana la última edición" por fila; marcar criterios en dos dispositivos no debe pisarse | Una tabla más en la sync |
| **TDR-05** | Avance del objetivo = media de hitos ponderada por peso sobre todas las etapas (equivale a ponderar cada etapa por su `Σw`) | Media simple de etapas; pesos por etapa definidos por el usuario | Evita que una etapa trivial pese igual que una grande; una sola regla explicable | El % puede bajar al añadir hitos (honesto; el delta lo explica) |
| **TDR-06** | Foco = `prefs.focusGoalId` (valor único en el perfil) | Columna `priority`/`focus` por objetivo | Garantiza un solo foco sin coordinar varias filas en la sync | Si se borra el objetivo foco, se elige el de mayor actividad reciente |
| **TDR-07** | Logros como **ledger** persistente con id determinista | Recalcular siempre (como hoy) | Deben tener fecha, sobrevivir a ediciones, aparecer en la timeline y no duplicarse entre dispositivos | Hay que evaluar reglas tras las mutaciones y hacer backfill al migrar |
| **TDR-08** | Reflexiones en **tabla propia**; las notas heredadas (`kind='note'`) no colorean el gráfico ni activan días | Seguir usando `activities.kind='note'` | El Blueprint separa reflexión de construcción; evita inflar el gráfico con notas | Cambia el conteo histórico de días activos (resúmenes semanales de v1); se explica en "Qué cambió" |
| **TDR-09** | Construir la UI v3 **en paralelo** con un interruptor (`kv.ui`) y activarla en F4 | Big-bang; ramas largas sin desplegar | Regla "no eliminar funcionalidades"; permite probar en producción con datos reales | Convivencia temporal de CSS con alias; limpieza obligatoria en F9 |
| **TDR-10** | **No renombrar nada**: el producto se sigue llamando Bitácora (P-01) | Renombrar a otra marca | Decisión del dueño; evita cerrar sesiones y dejar datos huérfanos | Ninguna. Si en el futuro cambia la marca para comercializar, solo se cambia lo visible y las claves internas se mantienen |
| **TDR-11** | Evidencia en **Supabase Storage** privado con URLs firmadas; compresión en cliente sin librerías | Guardar base64 en Postgres; servicio externo (S3/R2) | Mismo proveedor, RLS por carpeta, sin credenciales nuevas; base64 infla la sync y la base de datos | Configurar bucket y políticas; cola de subida separada |
| **TDR-12** | Borrado de cuenta por **RPC `security definer`** en SQL | Edge Function con `service_role` | No añade infraestructura ni secretos; patrón conocido en Supabase. **Verificar** que el proyecto permite `delete from auth.users` desde la función | Los archivos se borran antes desde el cliente (API de Storage) |
| **TDR-13** | Pruebas con `node --test` y SQL plano, sin dependencias | Vitest/Jest/Playwright | Respeta "sin dependencias"; suficiente para la lógica pura, que es donde está el riesgo | Hay que separar dominio puro (F0); E2E semimanual hasta P-12 |
| **TDR-14** | Animaciones con Web Animations API tras el render, no con transiciones CSS | Framework reactivo; diff de DOM | Mínimo cambio; resuelve la causa (H5) | Hay que declarar `expect()` en las acciones que animan |
| **TDR-15** | Tipografía del sistema para la UI y serif del sistema para la narrativa | Inter + Source Serif autoalojadas | 0 KB, sin terceros, CSP intacta; la UX dice "p. ej." | La serif varía por plataforma (P-04 por si se quiere uniformidad) |
| **TDR-16** | Las acciones sin hito son válidas y solo alimentan la Constancia | Obligar a elegir hito | Fricción mínima (<15 s); Blueprint: "suelta con aviso" | El Avance puede quedarse quieto con mucha actividad: la señal de alerta del Blueprint se mide con `events` |

---

## 28. Prioritized Technical Backlog

### P0: imprescindible (MVP)

| # | Tarea | Módulo | Depende de | Compl. | Motivo |
|---|---|---|---|---|---|
| 1 | Harness `node --test` + extracción de `domain/` | model, tests | — | M | Probar el motor de progreso |
| 2 | Sync: 409 a reintento; rechazos visibles en Tú | sync | 1 | S | H1: pérdida silenciosa |
| 3 | `model.project()` sin borrados | model | — | S | H2 |
| 4 | Script de verificación de la precaché del SW | scripts | — | S | H14 / R6 |
| 5 | `003_impacable.sql` + down + pruebas SQL (RLS, FK compuestas, triggers) | supabase | — | L | Base de todo |
| 6 | IndexedDB v2 + `TABLES` + DEFAULTS/BLANK nuevas + ORDER de sync | db, store, sync | 5 | M | Persistencia local |
| 7 | `migrateV2toV3` + copia pre-v3 + hoja "Qué cambió" | migrate | 6 | M | Datos existentes / R2 |
| 8 | Tokens nuevos (paleta viva) + contenedor centrado + breakpoints | styles | — | M | H4, UX §20–22 |
| 9 | `shell.js` + `router.js` con redirecciones + interruptor v3 | shell, router, main | 8 | M | Navegación UX §3 |
| 10 | `motion.js` + regiones con clave (prototipo de validación de R1) | motion, main | 9 | M | H5 / R1 |
| 11 | `domain/progress.js` + UI de barras segmentadas, fracciones, respaldo y delta | domain, components | 1, 6 | L | Blueprint §5 |
| 12 | Objetivos: lista y detalle (Camino), estados y `goal_log` | views, actions | 6, 9 | L | Estructura |
| 13 | Etapas (crear, omitir, reordenar con menú) | views, actions | 12 | M | Estructura |
| 14 | Hitos con criterios, peso y evidencia esperada + panel + cierre | views, components, actions | 11, 12 | L | Núcleo |
| 15 | Quick Add v3 (chip de hito, "Más", reflexión de una línea, `parse` reutilizado) | capture, components | 14 | M | <15 s |
| 16 | Evidencia de nota, enlace y resultado (sin archivos) + niveles | evidence, components | 6, 14 | M | Nivel 1–2 temprano |
| 17 | `domain/rhythm.js` (Constancia + Momentum) + pills + indicador | domain, components | 1 | M | Blueprint §10 |
| 18 | Inicio v3 (FocusHero, Ritmo, Reciente, Evidencia y logros) + `next-step` | views, domain | 11, 17 | L | Dashboard |
| 19 | Onboarding de 3 pasos + plantillas + progreso dotado | views, domain | 14 | M | Activación |
| 20 | WelcomeBack + logro de recuperación | views, achievements | 17 | M | Recuperación |
| 21 | `domain/significance.js` + `dayIndex` + ContributionGraph + panel del día + descansos | domain, components | 6, 14 | L | Diferenciador |
| 22 | Storage + `files.js` + EvidencePicker + portafolio + borrado físico + CSP | files, supabase, vercel.json | 5, 16 | XL | Evidencia en archivo |
| 23 | Recap semanal (`recap.js`, copy, vista, tarjeta de lunes) | domain, views | 11, 21 | M | MVP |
| 24 | Quitar de la UI la racha diaria, los logros por volumen y los avisos con juicio | views, model | 18 | S | Conflictos H7–H9 |
| 25 | Accesibilidad base (teclado del gráfico, foco, `aria-live`, contraste) | components, styles | 21 | M | UX §24 |

### P1: importante (V2)

| # | Tarea | Módulo | Depende de | Compl. | Motivo |
|---|---|---|---|---|---|
| 26 | Timeline con capítulos y colapsado | domain, views | 12, 21 | L | Blueprint §8 |
| 27 | Ledger de logros completo + pantalla + personales + anuncio 1 por sesión | domain, views | 7, 14 | M | Blueprint §9 |
| 28 | Reflexiones: vista, búsqueda, destacados, puntos de entrada | views, actions | 6 | M | UX §16 |
| 29 | Recap mensual (comparación con el mes anterior propio) | domain | 23 | M | Blueprint §12 |
| 30 | Cierre de objetivo (celebración de nivel 4–5, carta al yo futuro) | views | 14 | M | Momento emocional |
| 31 | Ritmo de referencia por fecha (rango) | domain | 11 | S | Blueprint §5.7 |
| 32 | RPC `delete_my_account` + borrado de archivos | supabase, you | 22 | M | Libertad / RGPD; **obligatorio antes de comercializar** (F9b) |
| 33 | Export v3 (tablas nuevas + manifiesto de archivos) | migrate | 22 | M | UX §27 |
| 34 | Categorías y colores personalizables (con contraste) | styles, views | 8 | S | Personalización |
| 35 | Separar `main.js`/`actions.js` en registro por módulo | main, actions | 9 | M | H12 |
| 36 | CI opcional (GitHub Action que corre `node --test`) | .github | 1 | S | R12 |
| 37 | Regenerar `DESIGN.md` y actualizar `CLAUDE.md` y "Cómo funciona" | docs | 24 | S | Coherencia |

| 37b | Gate de comercialización: cuota dura, CAPTCHA, SMTP propio, textos legales, métricas de validación | supabase, you, docs | 32, 33 | L | P-02: comercializar después |

### P2: mejora

| # | Tarea | Módulo | Compl. | Motivo |
|---|---|---|---|---|
| 38 | Recap anual | domain, views | L | Blueprint V2 |
| 39 | Vista semanal del gráfico (una celda por semana) | components | S | Personas sensibles a lo diario |
| 40 | Autorrecompensas (`self_reward`) | milestones | S | Blueprint §10 |
| 41 | Autoevaluación cualitativa (`reflections.rating`) | reflections | S | Blueprint §5.6 |
| 42 | Retrato de progreso ("En 4 meses hiciste…") | domain | M | Blueprint §14 |
| 43 | `daily_stats` extendida + consultas de las métricas de validación | supabase | S | Blueprint "Métricas" |
| 44 | Limpieza de archivos huérfanos (`pg_cron` o SQL manual) | supabase | S | Higiene |
| 45 | RPC `changes_since` (bajada en una sola llamada) | supabase, sync | M | Solo si la latencia molesta |
| 46 | Reordenar con arrastre en escritorio | components | M | UX §6 |
| 47 | Transiciones de vista (View Transitions API) | motion | S | Pulido |

### P3: futuro

| # | Tarea | Motivo |
|---|---|---|
| 48 | Notificaciones push (Edge Function + VAPID + `pg_cron`, topes y *sunset*) | Blueprint §16 |
| 49 | Proyección de yo futuro con rangos | Blueprint §14 [C] |
| 50 | Accountability opt-in, reacciones, compartir capítulos | Blueprint §15 |
| 51 | Integraciones (GitHub commits como evidencia de nivel 3, calendario) | Blueprint "Futuro" |
| 52 | Asistente para descomponer la visión (IA) | Blueprint "Futuro"; hoy "sin coste de IA" |
| 53 | Carga diferida del historial con más de 50.000 filas | Escala |
| 54 | Varias visiones | TDR-03 |

---

## 29. Open Questions

| ID | DECISIÓN PENDIENTE | Por qué importa | Propuesta por defecto |
|---|---|---|---|
| **P-01** | ~~Nombre visible~~ **RESUELTA:** Bitácora | — | — |
| **P-02** | ~~¿Personal o abierto?~~ **RESUELTA:** personal ahora, comercial después | Multiusuario seguro desde F1; F9b antes de abrir | — |
| **P-03** | Plan de Supabase y cuota de Storage por usuario (con la comercialización será un plan de pago) | Límites de evidencia en archivo; coste por usuario | 10 MB por archivo, 500 MB blandos por usuario |
| **P-04** | ¿Serif del sistema o fuente autoalojada (woff2 en `/fonts`, sin terceros)? | Uniformidad de los recaps entre plataformas | Serif del sistema |
| **P-05** | ~~¿Paleta cobalto + ámbar?~~ **RESUELTA:** sí, con colores vivos | §17.3 | — |
| **P-06** | Umbral de "semana activa" (N) y de "regreso" (7 o 14 días) | Constancia, WelcomeBack, logro de recuperación | N=2 para nuevos (se respeta 4 del usuario actual); regreso a los 7 días |
| **P-07** | ~~¿Cerrar un hito con criterios pendientes?~~ **RESUELTA:** sí, con confirmación y etiqueta | §8.4 | — |
| **P-08** | ¿Las notas heredadas deben colorear el gráfico? | Historia v1 | No (TDR-08) |
| **P-09** | ¿Vista del gráfico por defecto diaria o semanal? | Ansiedad frente a detalle | Diaria (UX), semanal como opción P2 |
| **P-10** | ¿Evidencia de audio en el MVP (grabar o subir)? | Persona "idioma"; permisos de micrófono y CSP | Solo subir archivo de audio en P1; grabar en P3 |
| **P-11** | ¿Cuándo hacer notificaciones push? | Infraestructura nueva (Edge Function, VAPID, cron) | P3 |
| **P-12** | ¿Se acepta Playwright como dependencia **solo de desarrollo** para E2E? | Regla "sin dependencias" | No por ahora; checklists con la preview |
| **P-13** | Palabra de Momentum cuando baja (la UX solo define "Retomando", "Constante" y "Acelerando") | Tono sin juicio | "Más ligero" |
| **P-14** | Plantillas del MVP y su contenido (etapas, hitos y criterios por plantilla) | Onboarding y progreso dotado | 7 de la UX §5; contenido redactado en F3 y revisado por el dueño |
| **P-15** | ¿Próximos pasos conserva "en espera" y prioridad? | Funcionalidad v2 que el Blueprint no menciona | Sí (no eliminar funcionalidades) |
| **P-16** | Validación con 5–8 usuarios (UX §34.16–18) | Hipótesis [C] del gráfico, dos ejes y celebraciones | Después de F7, con el dueño y 4+ personas |
| **P-17** | ¿Idiomas? (hoy todo en español, `LOCALE='es'`) | i18n de los textos de recap | Solo español; textos centralizados para no bloquear i18n |

---

## 30. Final Technical Recommendation

1. **No rehacer; extender.** La arquitectura actual (vanilla ES modules, IndexedDB + outbox, sync por filas, RLS y dominio derivado en el cliente) es adecuada para la nueva Bitácora. Cambiarla por un framework no resolvería ningún requisito del Blueprint ni de la UX y rompería la restricción "sin build".
2. **Lo primero es proteger los datos, no la interfaz.** Antes de añadir tablas relacionadas: corregir el rechazo silencioso de filas en la sync (H1), añadir FK compuestas de propiedad (H15) y crear las pruebas del motor de dominio. Es la F0 y no se ve, pero evita los dos fallos más caros: perder datos y un progreso incorrecto.
3. **El corazón técnico de la nueva Bitácora es `domain/progress.js`.** Debe ser puro, estar probado con los casos del §23 y ser la única fuente de cualquier número de Avance. Si algo en la UI muestra un porcentaje que no sale de ahí, es un bug.
4. **Separar ejes en el código igual que en el producto.** Avance (criterios y hitos) y Constancia (días y semanas) viven en módulos distintos que no se leen entre sí. Así, "100 acciones = 100%" es imposible por construcción, no por disciplina.
5. **La evidencia en archivo es la pieza de mayor riesgo técnico.** Hay que llegar a ella con el núcleo ya estable (F6). Hasta entonces, las evidencias de nota y enlace (niveles 1–2) ya dan valor desde F3.
6. **Construir en paralelo y activar con interruptor.** El usuario conserva todo lo que usa hoy hasta que la versión nueva lo supere (F4), y la limpieza es explícita (F9).
7. **Las cuatro decisiones bloqueantes ya están resueltas** (P-01, P-02, P-05 y P-07). Las demás se deciden en su fase: P-03 antes de F6, P-06 y P-14 en F3–F4, y P-12 cuando haga falta automatizar E2E.
8. **Pensar en comercializar sin construirlo todavía.** Cada tabla, política y límite ya se diseña para muchos usuarios (no cuesta más hacerlo ahora). Lo específico de abrir a terceros (legal, correo, cuotas duras, borrado de cuenta y cobro) se agrupa en F9b y no retrasa el MVP personal.

**Siguiente paso sugerido:** arrancar **F0** con Claude Code. Cada fase del §24 está pensada para ejecutarse como una sesión o PR independiente, con su criterio de finalización como prueba de "listo".
