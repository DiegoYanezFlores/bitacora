# Fases 3–20 — Diseño de producto de Bitácora v2

Regla de diseño: *¿esto ayuda al usuario a comprender, registrar o avanzar?* Si no, fuera.

## Fase 3 · Core loop

La hipótesis inicial (abrir → orientación → registrar → feedback → progreso → siguiente acción → cerrar) coincide con el modelo por etapas de la informática personal (recolección → integración → reflexión → acción) [investigación 20]. Se valida con dos ajustes:

1. **Registrar primero, orientar después cuando el usuario llega con algo que contar.** El botón `+` está siempre visible y abre la captura en 1 toque; la orientación (Hoy) aparece al guardar.
2. **Añadir un bucle semanal de reflexión** (efecto nuevo comienzo + reflexión [8, 9]): el lunes, Hoy muestra el resumen de la semana anterior y propone el foco de la nueva.

```
Bucle diario (segundos)                     Bucle semanal (1 minuto, lunes)
abrir ─► Hoy: siguiente acción + estado      resumen real de la semana
  │         │                                (días activos, actividades,
  │         ▼                                 tareas cerradas, por proyecto)
  └─► [+] registrar ─► feedback breve              │
          (✓ guardado · proyecto 72→74% ·           ▼
           día activo · deshacer)            elegir foco / meta semanal
              │
              ▼
        progreso visible ─► siguiente acción ─► cerrar
```

## Fase 4 · Producto

Navegación (móvil: barra inferior con `+` central; escritorio: barra lateral):

| Pantalla | Responde a | Contenido (máx. 4 bloques visibles) |
|---|---|---|
| **Hoy** | ¿Dónde estoy? ¿Qué hago ahora? ¿Qué hice hoy? | Siguiente acción (con el porqué) · estado del día y semana (actividades hoy, días activos x/meta, racha) · línea de hoy · pendientes · proyectos activos |
| **Proyectos** | ¿En qué trabajo? | Lista con progreso, última actividad y siguiente tarea. Detalle: objetivo, estado, fechas, etiquetas, progreso, métrica opcional, tareas, hitos, actividad |
| **Registro** | ¿Qué he hecho? | Línea temporal por día (tipo *feed* de GitHub + diario), búsqueda, filtros por tipo y proyecto, "Cargar más" (no scroll infinito) |
| **Progreso** | ¿Cómo evoluciona mi trabajo? | Semana / Mes / Año, comparado con el periodo anterior · barras por día · mapa de actividad · distribución por proyecto · patrones · récords y logros |
| **Captura rápida** | Registrar en segundos | Hoja con un campo de texto: tipo (Hecho, Avance, Tarea, Nota, Logro), proyecto detectado por `#etiqueta` o nombre, "ayer" para fechar, sugiere completar una tarea parecida. Atajos `N` y `⌘K` |
| **Ajustes** | Control | Perfil, tema, meta semanal, sonido, vibración, avisos, exportar/importar, borrar datos, cerrar sesión, "Cómo funciona" |

**Siguiente acción** (local, sin IA): puntúa tareas abiertas (en curso +3, prioridad alta +3, vence hoy o vencida +4, vence pronto +2, proyecto sin actividad ≥2 días +1), hitos que vencen en ≤7 días (+3) y proyectos activos sin tareas ni actividad ≥3 días ("define el siguiente paso"). Muestra la mejor opción, **el motivo** y permite pasar a la siguiente.

## Fase 5 · Gamificación seleccionada

| Mecánica | ¿Se usa? | Por qué |
|---|---|---|
| Barras de progreso (proyecto, semana) | Sí | Monitorización del progreso [1] y gradiente de meta [15] |
| Feedback de completado | Sí | Retroalimentación informativa → competencia [10, 11] |
| Días activos por semana con meta propia | Sí (indicador principal) | Metas específicas elegidas por el usuario [6]; tolera días libres [3] |
| Racha | Sí, secundaria y sin castigo | Motiva cuando está intacta; nunca se muestra como pérdida [5] |
| Hitos | Sí | Metas intermedias, gradiente de meta |
| Récords personales | Sí | Competencia y valor acumulado sin comparar con otros |
| Logros | Sí, pocos e informativos | Marcan hitos reales (primera actividad, 100 actividades, primer proyecto terminado) [14] |
| XP y niveles | **No** | Puntos arbitrarios: no informan de nada real; riesgo de sobrejustificación [10]; estética de juego |
| Clasificaciones | **No** | Producto personal; comparación social no pedida |
| Recompensas variables / cofres | **No** | Mecanismo de juego de azar |
| Confeti | **No** | Sustituido por microanimación de check y transición de progreso |

## Fase 6 · Micro-recompensas

Al guardar: *toast* inferior 3,5 s con ✓ animado (200 ms), texto breve ("Actividad registrada · IoT 72% → 74% · Día activo ✓"), botón **Deshacer**. La barra del proyecto transiciona (400 ms). Vibración 10 ms opcional (Android; iOS Safari no la soporta). Sonido opcional **desactivado por defecto** (tono corto sintetizado, sin archivos). Logro nuevo: una línea extra en el mismo toast, no un modal.

## Fase 7 · Color

- Neutros cálidos derivados de la marca original (#1B2321 / #E9EBE6) + **un acento** verde azulado (progreso/acción principal) + ámbar para racha + semánticos (aviso ámbar, error rojo solo para acciones destructivas y errores reales).
- El color comunica **estado y jerarquía**, no "emociones" [23]. Nunca rojo para trabajo incompleto.
- Claro por defecto según el sistema, oscuro disponible [24]. Contraste verificado con script (WCAG AA ≥ 4,5:1 en todos los textos).
- Tipografía del sistema (San Francisco / Segoe / Roboto): 0 KB de descarga y sin enviar la IP a Google (antes: IBM Plex desde Google Fonts).

| Token | Claro | Oscuro | Contraste texto/fondo |
|---|---|---|---|
| Fondo | #F6F7F5 | #0D1210 | — |
| Superficie | #FFFFFF | #141A17 | — |
| Texto | #16201C | #E8EEEA | 15,5 / 16,1 |
| Texto secundario | #55625C | #A2AEA8 | 5,9 / 8,2 |
| Acento (texto y botón) | #0B7A5C | #3CD3A0 | 4,9 / 9,9 |
| Racha | #C2410C | #FB923C | 4,8 / 8,4 |

## Fase 8 · Personalización (solo lo que se justifica)

| Opción | Incluida | Justificación |
|---|---|---|
| Tema (sistema / claro / oscuro) | Sí | Contexto de uso (noche); preferencia real |
| Meta semanal de días activos (1–7) | Sí | Autonomía y metas propias [6, 11] |
| Sonido | Sí (off) | Algunos lo valoran, a otros molesta |
| Vibración | Sí (on) | Feedback útil en móvil [27] |
| Avisos (todos / importantes / ninguno) | Sí | Control sobre las interrupciones [16] |
| Áreas de interés (onboarding) | Sí | Adapta sugerencias iniciales |
| Colores de acento, densidad, dashboard configurable | No | Aumentan la carga de decisión sin mejorar comprender/registrar/avanzar |

## Fases 9–10 · Autenticación y datos

- Supabase Auth vía REST (sin SDK: 0 dependencias): email/contraseña, Google (flujo implícito con redirección), recuperación de contraseña, sesión persistente con renovación, cierre de sesión, perfil. El botón de Google aparece solo si el proveedor está activo en Supabase.
- **Modo prueba sin cuenta**: datos solo locales; al crear cuenta se adoptan y suben.
- Modelo relacional con RLS en todas las tablas. Ver `supabase/migrations/002_v2.sql`.

| Tabla | Para qué | Notas |
|---|---|---|
| `profiles` | Nombre, zona horaria, áreas, preferencias (`prefs` jsonb), fechas de onboarding y migración | 1:1 con `auth.users`; se crea por *trigger* al registrarse |
| `projects` | Proyectos | estado, objetivo, fechas, etiquetas, color, métrica opcional (inicio/actual/meta/unidad) |
| `milestones` | Hitos por proyecto | fecha, completado |
| `tasks` | Tareas | estado `todo/doing/waiting/done`, prioridad 1–3, vencimiento, "esperando a" |
| `activities` | Registro de actividad | tipo `done/progress/note/win`, fecha real (`occurred_at`), proyecto, tarea, etiquetas |
| `events` | Métricas internas mínimas del producto | solo inserción; el usuario puede desactivarlas |

**Tablas de la lista pedida que no se crean (y por qué):** `preferences` → columna `prefs` en `profiles` (relación 1:1, una tabla más no aporta); `achievements` y `daily_stats` → se **calculan** de las actividades (deterministas; guardarlas duplicaría datos que pueden desincronizarse). Se deja una vista `daily_stats` (`security_invoker`) para analítica e IA futura. `notifications` → los avisos se calculan en el cliente; la tabla se añadirá con las notificaciones push (requiere servidor).

**Sincronización**: cada fila tiene `id` UUID generado en el cliente, `updated_at` (momento de la edición), `deleted_at` (borrado lógico sin contenido) y `synced_at` (lo pone el servidor). El cliente sube una cola persistente de cambios y baja lo nuevo desde su último `synced_at`. Un *trigger* aplica "gana la última edición" en el servidor.

## Fase 11 · Notificaciones

MVP sin servidor: **avisos dentro de la app**, máximo uno visible, agrupados y descartables: resumen semanal (lunes), hito que vence pronto, proyecto sin actividad ≥5 días (máx. 1 vez por semana por proyecto), logro. Frecuencia configurable. Las **push** requieren un servidor (Supabase Edge Function + cron + claves VAPID) y en iOS solo funcionan con la PWA instalada: quedan diseñadas para la siguiente fase, con resumen diario/semanal agrupado [16] y nunca promocionales.

## Fase 12 · Personalización por comportamiento

Estadísticas simples sobre las actividades de los últimos 30–60 días: hora habitual de registro (mediana), día más activo, proyectos sin actualizar, tendencia semana a semana. Se muestran como "Patrones" en Progreso.

## Fase 13 · IA futura

Todo el dato es relacional y consultable (`activities`, vista `daily_stats`). Punto de extensión en el cliente (`app/insights.js` produce `{tipo, texto, datos}`); en el futuro una Edge Function podrá generar resúmenes/reflexiones con el mismo contrato, activada por el usuario. El MVP no llama a ningún modelo.

## Fase 14 · PWA y móvil

| Opción | Reutiliza código | Coste | Mantenimiento | Tiendas | Veredicto |
|---|---|---|---|---|---|
| PWA (actual) | 100% | 0 | Mínimo | No (Android puede con TWA) | **Base** |
| Capacitor | ~100% (envuelve la misma web) | Cuentas de tienda (Apple 99 USD/año, Google 25 USD una vez) | Bajo | iOS + Android | **Elegida para la fase móvil** |
| React Native / Expo | ~0% de UI (reescritura) | Alto | Dos bases de código | Sí | Descartada ahora |
| TWA (Bubblewrap) | 100% | 25 USD | Bajo | Solo Android | Alternativa rápida para Android |

Requisitos ya cumplidos para Capacitor: rutas por *hash* (no dependen del servidor), sin build, datos locales en IndexedDB, auth por REST (el flujo de Google necesitará *deep link* en nativo).

## Fases 15–16 · Mobile first y microinteracciones

Diseñado a 360/390/430 px: objetivos táctiles ≥44 px, acciones principales en la zona del pulgar (barra inferior, `+` central). Cada control tiene estados *hover* (escritorio), *pressed* (escala 0,97), *focus-visible* (anillo de acento), *disabled*, *loading* (solo en red: auth), *success* (toast + check), *error* (mensaje en línea) y *empty* (estado vacío con acción). Duraciones 120–400 ms; `prefers-reduced-motion` las elimina.

## Fase 17 · Onboarding (<60 s)

1 Crear cuenta (o Google, o probar sin cuenta) → 2 Nombre → 3 ¿Qué quieres registrar? (chips) → 4 Primer proyecto (sugerido) → 5 Primera actividad → Hoy con "Ya empezaste ✓". Usuarios migrados de v1 no pasan por el onboarding: ven una tarjeta que explica dónde quedó cada dato.

## Fase 18 · Retención ética

Valor acumulativo (historial, mapa de actividad, récords), continuidad (siguiente acción, revisión semanal), personalización (patrones propios), volver sin culpa (ningún mensaje de pérdida). La razón para volver es "quiero ver cómo va mi progreso".

## Fase 19 · Métricas internas

Tabla `events` (sin terceros, sin contenido del usuario): `app_open`, `signup`, `onboarding_complete`, `capture_open`, `activity_create`, `task_complete`, `notice_action`. Consultas listas en `docs/metricas.sql`: activación (primera actividad en 24 h), tiempo a la primera actividad, DAU/WAU, actividades y proyectos por usuario, retención D1/D7/D30, tasa de completado de tareas, interacción con avisos. La duración de sesión se aproxima por eventos (no se rastrea en segundo plano).

## Fase 20 · Privacidad

Minimización (sin analítica de terceros, sin fuentes externas), RLS obligatorio con `select/insert/update/delete` solo del propietario, borrado lógico que **vacía el contenido**, botón "Borrar mis datos", exportación completa, CSP estricta y cabeceras de seguridad, métricas desactivables, ninguna clave secreta en el cliente.
