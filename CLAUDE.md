# Bitácora — tracker personal

## Qué es

Tracker personal de objetivos. `index.html` único, vanilla JS, sin frameworks, sin build step. Persistencia en `localStorage` bajo la clave `bitacora-v1`. Desplegado en Vercel como sitio estático (https://bitacora-three-omega.vercel.app) y usado como PWA desde el celular.

El dueño es ingeniero de datos (ELK Stack, NestJS, Angular, PostgreSQL, Docker, AWS) en Quito. El tracker existe para sostener la ejecución de un plan de 12 meses con un presupuesto real de 1–3 horas semanales.

Archivos de apoyo (no son lógica de la app):
- `sync.js` + `config.js`: sincronización con Supabase (REST vía `fetch`, sin SDK). La fusión de datos vive en `index.html` (`merge`), junto al esquema.
- `sw.js`, `manifest.json`, `icons/`: PWA. Sube `CACHE` en `sw.js` si cambias los archivos precargados.
- `supabase/schema.sql`: tablas con RLS. `scripts/make_icons.py`: regenera iconos.

## Reglas de trabajo

- No reescribas `index.html` completo. Usa edits parciales siempre. El archivo pasa de 500 líneas y una reescritura pierde estado y estilos.
- No agregues frameworks, build tools ni dependencias. Single-file es una decisión, no una limitación pendiente de resolver.
- No cambies el esquema de `localStorage` sin plan de migración: hay datos reales acumulados (rachas, historial semanal) que no se pueden perder. Aplica también al documento en Supabase (es el mismo JSON).
- No "limpies" código alrededor del cambio. Cambia solo lo pedido.
- Verifica antes de decir que está listo: comprueba que renderiza y que los datos persisten. En este Mac el servidor local de Python se bloquea por el permiso de macOS a Documentos; verifica en la URL de Vercel (`vercel --prod --yes`).
- Respuestas cortas. Sin preámbulo ni resumen final.

## Sistema de diseño

No es un dashboard SaaS genérico. Respeta los tokens existentes:

```
--paper #E9EBE6   fondo
--card  #F3F4F0   superficies
--ink   #1B2321   texto principal
--soft  #5C6663   texto secundario
--line  #C9CDC5   bordes
--done  #2F5D50   completado
--flag  #B4491F   vencido / bloqueado
```

Tipografía: IBM Plex Sans, una sola familia, `tabular-nums` para cifras. Border-radius 3px. Mobile-first: el uso principal es en celular. Sin animaciones decorativas. Respeta `prefers-reduced-motion`.

## Estructura de datos

```js
{
  started, week,                 // 'YYYY-MM-DD'; week = lunes de la semana en curso
  tasks: [{id, t, w, p, d}],     // t=texto, w=por qué, p=prioridad 1-3, d=hecho
  english: {'YYYY-MM-DD': 1},    // racha diaria
  apps, interviews,              // contadores
  capital, capital0,             // saldo de deuda y saldo inicial
  waiting: [{id, t, since}],     // pendientes de terceros
  hist: [{week, done, total}],   // cumplimiento semanal archivado
  notes,
  roadmap: [{id, m, t, d}],      // hoja de ruta editable: m=periodo, t=texto, d=cumplida
  updatedAt, deleted: {id: iso}  // metadatos de sincronización (marcas de borrado; 'en:YYYY-MM-DD' para días de inglés)
  // legacy: documento del tracker genérico anterior, conservado sin mostrar
}
```

## Jerarquía de la interfaz

El orden vertical es deliberado y no debe alterarse sin razón:

1. Racha de inglés — es el indicador que decide si el plan avanza
2. Tareas de la semana
3. Contadores (aplicaciones, entrevistas, capital)
4. Pendientes de terceros
5. Cumplimiento semanal histórico
6. Hoja de ruta

"Cerrar semana" archiva el porcentaje real y arrastra lo no hecho. Ese mecanismo es intencionalmente imposible de maquillar: no lo suavices. Las semanas que pasan sin cerrarse se archivan como 0 hechas. En inglés solo se pueden marcar hoy y ayer.

## Privacidad

No escribas cifras personales en el código ni en este archivo: montos de deuda, ingresos, resultados de evaluaciones. Esos datos viven en `localStorage` y, por decisión del dueño, se sincronizan a su fila en Supabase protegida por RLS (solo su cuenta la lee). `config.js` solo contiene la URL y la publishable key (públicas por diseño); nunca la service_role / secret key.

## Backlog (no ejecutar sin que se pida)

- Scroll horizontal en el historial semanal (hoy corta en 16)
- Botón sticky en móvil para marcar el día de inglés sin hacer scroll
