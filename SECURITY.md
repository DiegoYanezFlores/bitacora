# Seguridad

## Modelo de seguridad

Bitácora es una app estática (sin backend propio) que habla directamente con Supabase.

- `config.js` contiene solo la **URL del proyecto** y la **publishable key** de Supabase. Ambas son públicas por diseño: cualquiera puede verlas en el navegador de la app desplegada.
- Los datos los protege **Row Level Security** en cada tabla (`auth.uid() = user_id`) y las claves foráneas compuestas `(user_id, …)`. Ver `supabase/migrations/`.
- La **service_role / secret key nunca** debe entrar al repositorio ni al cliente. Los archivos `.env*` están excluidos de git y del despliegue.
- La app aplica una Content Security Policy estricta (`vercel.json`) y escapa todo el contenido del usuario antes de insertarlo en el DOM.

## Reportar una vulnerabilidad

Por favor **no abras un issue público**. Usa el reporte privado de GitHub:
pestaña **Security → Report a vulnerability** de este repositorio.

Incluye los pasos para reproducirlo y el impacto. Responderé lo antes posible.

## Si una clave secreta se filtra

1. Rótala de inmediato en Supabase (Project Settings → API Keys).
2. Revisa los logs de Supabase en busca de accesos no esperados.
3. Borrar el commit **no basta**: la clave ya es pública y debe considerarse comprometida.
