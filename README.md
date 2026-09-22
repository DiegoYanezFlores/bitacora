# Bitácora

Registro de trabajo personal: **qué hice, en qué avanzo, qué falta y qué sigue.**
Web estática (sin build, sin dependencias), instalable como PWA, con datos locales y sincronización con Supabase.

🔗 https://bitacora-three-omega.vercel.app

## Puesta en marcha

1. **Base de datos**: en Supabase → SQL Editor, ejecuta. Es idempotente y no toca los datos de la versión 1.
2. **Acceso**: Authentication → URL Configuration → *Site URL* y *Redirect URLs* con la URL de la app. Para Google: Authentication → Sign In / Providers → Google (requiere un cliente OAuth en Google Cloud). El botón aparece solo si el proveedor está activo.
3. **Configuración del cliente**: `config.js` con la URL del proyecto y la *publishable key* (públicas por diseño; nunca la secret).
4. **Desplegar**: `vercel --prod --yes`.

## Desarrollo

No hay build. Sirve la carpeta con cualquier servidor estático y abre `index.html`:

```bash
npx serve .
```

Estructura y reglas en [CLAUDE.md](CLAUDE.md). Decisiones y evidencia en [docs/](docs/).

| Documento | Contenido |
|---|---|
| `docs/01-auditoria.md` | Auditoría de la versión anterior |
| `docs/02-investigacion.md` | Evidencia sobre hábito, motivación y gamificación (con referencias) |
| `docs/03-diseno.md` | Core loop, pantallas, gamificación, color, datos, privacidad |
| `docs/04-informe-final.md` | Qué cambió, qué no y por qué |
| `docs/metricas.sql` | Consultas de activación, retención y uso |

## Atajos

`N` o `⌘/Ctrl + K` registrar · `/` buscar en el registro · `Esc` cerrar.

## Datos

Todo se guarda primero en el dispositivo (IndexedDB) y se sincroniza fila a fila cuando hay conexión. Cada usuario solo puede leer y escribir sus propias filas (RLS). Puedes exportar o borrar todo desde Ajustes.
