// Biblioteca de fondos incluidos en la app. Son composiciones propias en SVG (generadas por
// scripts/make-backgrounds.mjs): pesan pocos KB, escalan a cualquier pantalla, funcionan sin
// conexión desde el primer arranque y no dependen de ningún servicio ni licencia de terceros.
export const CATEGORIES = [
  ['naturaleza', 'Naturaleza'],
  ['ciudad', 'Arquitectura'],
  ['disciplina', 'Disciplina'],
  ['serenidad', 'Serenidad'],
  ['conocimiento', 'Conocimiento'],
  ['proyectos', 'Proyectos'],
  ['arte', 'Arte abstracto']
];

export const LIBRARY = [
  { id: 'montanas', name: 'Montañas al amanecer', category: 'naturaleza' },
  { id: 'bosque', name: 'Bosque con niebla', category: 'naturaleza' },
  { id: 'oceano', name: 'Océano en calma', category: 'naturaleza' },
  { id: 'ciudad', name: 'Ciudad de noche', category: 'ciudad' },
  { id: 'escalera', name: 'Constancia que sube', category: 'disciplina' },
  { id: 'serenidad', name: 'Respiración', category: 'serenidad' },
  { id: 'libros', name: 'Pila de libros', category: 'conocimiento' },
  { id: 'red', name: 'Red de ideas', category: 'proyectos' },
  { id: 'abstracto-calido', name: 'Abstracto cálido', category: 'arte' },
  { id: 'abstracto-frio', name: 'Abstracto frío', category: 'arte' }
];

export const srcOf = id => `/img/bg/${id}.svg`;
export const byId = id => LIBRARY.find(b => b.id === id) || null;
export const byCategory = cat => LIBRARY.filter(b => b.category === cat);
