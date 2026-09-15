# Bitácora

Tracker personal de objetivos. HTML estático + vanilla JS, sin build step ni dependencias.
Funciona offline (localStorage + service worker) y, si se configura, sincroniza con Supabase.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (UI + lógica, datos en `localStorage["bitacora:v1"]`) |
| `sync.js` | Sincronización con Supabase vía REST (login email/contraseña) |
| `config.js` | URL y anon/publishable key de Supabase (vacío = solo local) |
| `sw.js`, `manifest.json`, `icons/` | PWA |
| `supabase/schema.sql` | Tablas + RLS para ejecutar en Supabase |
| `scripts/make_icons.py` | Regenera los iconos (`python3 scripts/make_icons.py`) |

## Activar Supabase

1. Crea un proyecto en supabase.com.
2. SQL Editor → pega `supabase/schema.sql` → Run.
3. Authentication → URL Configuration: pon la URL de Vercel en **Site URL** y en **Redirect URLs**.
4. Copia Project URL y la anon/publishable key en `config.js`.
5. Sube el cambio: `git commit -am "Configura Supabase" && vercel --prod`.
6. En la app, toca "Conectar nube" → Crear cuenta → confirma el correo → Entrar.

## Desplegar

```bash
vercel --prod
```

Si cambias la lista de archivos precargados en `sw.js`, sube la versión de `CACHE`.
