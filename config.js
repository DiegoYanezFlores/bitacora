// Conexión a Supabase (Project Settings → API / API Keys).
// La anon/publishable key es pública por diseño: los datos los protege Row Level Security
// (ver supabase/schema.sql). NUNCA pongas aquí la service_role / secret key.
// Si se deja vacío, la app funciona solo en este dispositivo (localStorage).
window.BITACORA_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
