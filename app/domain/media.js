// Reglas de las imágenes del usuario: qué se acepta, cómo se nombra y dónde vive.
// Funciones puras; la subida y el guardado están en app/media.js.
//
// Dónde vive cada cosa:
//   - el archivo original → almacén local del navegador (IndexedDB) y, si hay cuenta, el bucket
//     privado `evidence` creado en la migración 003, en la carpeta del propio usuario;
//   - la referencia (id, ruta, nombre) → profiles.prefs.media, que ya se sincroniza.
// No se guarda el binario en la base de datos ni se crea un segundo mecanismo de subida.

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_ATTR = ACCEPTED.join(',');
export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por imagen
export const MAX_FILES = 12;

export const extOf = type => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type] || 'bin');
export const prettySize = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Comprueba un archivo antes de aceptarlo. Devuelve el motivo en claro si no sirve.
export function checkFile(file, { count = 0 } = {}) {
  if (!file) return { ok: false, reason: 'No se pudo leer el archivo' };
  if (!ACCEPTED.includes(file.type)) return { ok: false, reason: 'Formato no admitido: usa JPG, PNG o WebP' };
  if (!file.size) return { ok: false, reason: 'El archivo está vacío' };
  if (file.size > MAX_BYTES) return { ok: false, reason: `La imagen pesa ${prettySize(file.size)}; el máximo es ${prettySize(MAX_BYTES)}` };
  if (count >= MAX_FILES) return { ok: false, reason: `Ya tienes ${MAX_FILES} fotos; borra alguna para añadir otra` };
  return { ok: true, reason: '' };
}

// Ruta dentro del bucket: siempre bajo la carpeta del usuario (es lo que exige la política de 003).
export const storagePath = (userId, id, type) => `${userId}/wallpaper/${id}.${extOf(type)}`;

// Nombre corto y legible para la lista de fotos.
export function shortName(name = '', max = 28) {
  const base = String(name).replace(/\.[a-z0-9]+$/i, '').trim() || 'Foto';
  return base.length > max ? base.slice(0, max - 1) + '…' : base;
}

// Entrada que se guarda en las preferencias (nunca el binario).
export const mediaEntry = (id, { name = '', path = '', at = new Date().toISOString() } = {}) =>
  ({ id, name: shortName(name), path, at });
