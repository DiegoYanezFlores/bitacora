// Plantillas de objetivos (UX §5): estructura sugerida y editable, nunca obligatoria.
// Cada hito trae 2–4 criterios de "hecho" y un peso (1 = S, 2 = M, 3 = L). Contenido revisable por el dueño (P-14).

export const TEMPLATES = [
  {
    key: 'idioma', label: 'Aprender un idioma', why: 'Poder comunicarme con soltura',
    stages: [
      { title: 'Fundamentos', milestones: [
        { title: 'Conocer mi nivel actual', weight: 1, criteria: ['Hice una prueba de nivel', 'Anoté mis puntos débiles'] },
        { title: 'Base de vocabulario y gramática', weight: 2, criteria: ['Estudié 4 semanas seguidas', 'Completé las unidades básicas', 'Repasé con tarjetas'] }
      ] },
      { title: 'Conversación', milestones: [
        { title: 'Primera conversación de 10 minutos', weight: 2, criteria: ['Hablé 10 minutos sin cambiar de idioma', 'Grabé la conversación'] },
        { title: 'Conversación fluida de 30 minutos', weight: 3, criteria: ['Mantuve 30 minutos de charla', 'Entendí la mayor parte sin pedir repetir'] }
      ] },
      { title: 'Certificación', milestones: [
        { title: 'Examen de práctica aprobado', weight: 2, criteria: ['Hice un simulacro completo', 'Superé el puntaje objetivo'] },
        { title: 'Certificado oficial', weight: 3, criteria: ['Me inscribí al examen', 'Aprobé el examen', 'Guardé el certificado'] }
      ] }
    ]
  },
  {
    key: 'empleo', label: 'Conseguir empleo', why: 'Trabajar en algo que me haga crecer',
    stages: [
      { title: 'Preparación', milestones: [
        { title: 'CV y perfil listos', weight: 2, criteria: ['CV actualizado y revisado por alguien', 'Perfil profesional completo'] },
        { title: 'Portafolio con 2 proyectos', weight: 3, criteria: ['Proyecto 1 publicado', 'Proyecto 2 publicado', 'Enlaces en el CV'] }
      ] },
      { title: 'Búsqueda', milestones: [
        { title: '20 postulaciones enviadas', weight: 2, criteria: ['Lista de empresas objetivo', '20 postulaciones con seguimiento'] },
        { title: 'Primeras entrevistas', weight: 2, criteria: ['Preparé respuestas clave', 'Hice 3 entrevistas'] }
      ] },
      { title: 'Cierre', milestones: [
        { title: 'Oferta aceptada', weight: 3, criteria: ['Recibí una oferta', 'Negocié condiciones', 'Firmé'] }
      ] }
    ]
  },
  {
    key: 'carrera', label: 'Terminar una carrera', why: 'Obtener mi título',
    stages: [
      { title: 'Semestre actual', milestones: [
        { title: 'Materias del semestre aprobadas', weight: 3, criteria: ['Entregué todos los trabajos', 'Aprobé los exámenes finales'] }
      ] },
      { title: 'Titulación', milestones: [
        { title: 'Tema de tesis aprobado', weight: 2, criteria: ['Propuesta escrita', 'Aprobada por el tutor'] },
        { title: 'Tesis entregada', weight: 3, criteria: ['Borrador completo', 'Correcciones aplicadas', 'Entrega oficial'] },
        { title: 'Defensa aprobada', weight: 3, criteria: ['Presentación lista', 'Defensa aprobada'] }
      ] }
    ]
  },
  {
    key: 'libro', label: 'Escribir un libro', why: 'Terminar y compartir mi libro',
    stages: [
      { title: 'Plan', milestones: [
        { title: 'Esquema completo', weight: 2, criteria: ['Idea central en un párrafo', 'Índice de capítulos'] }
      ] },
      { title: 'Borrador', milestones: [
        { title: 'Primera mitad escrita', weight: 3, criteria: ['50 % de capítulos en borrador', 'Ritmo de escritura semanal sostenido'] },
        { title: 'Borrador completo', weight: 3, criteria: ['Todos los capítulos escritos', 'Releí el borrador entero'] }
      ] },
      { title: 'Publicación', milestones: [
        { title: 'Revisión y edición', weight: 2, criteria: ['Recibí comentarios de 2 lectores', 'Apliqué la edición final'] },
        { title: 'Libro publicado', weight: 3, criteria: ['Portada y maquetación', 'Publicado'] }
      ] }
    ]
  },
  {
    key: 'maraton', label: 'Correr un maratón', why: 'Cruzar la meta de un maratón',
    stages: [
      { title: 'Base', milestones: [
        { title: 'Correr 5 km sin parar', weight: 1, criteria: ['Completé 5 km seguidos', 'Tres semanas corriendo 3 veces'] },
        { title: 'Correr 10 km', weight: 2, criteria: ['Completé 10 km', 'Registré tiempo y ritmo'] }
      ] },
      { title: 'Distancia', milestones: [
        { title: 'Media maratón', weight: 3, criteria: ['Completé 21 km', 'Sin lesiones'] },
        { title: 'Tirada larga de 32 km', weight: 3, criteria: ['Completé 32 km', 'Probé hidratación y alimentación'] }
      ] },
      { title: 'Carrera', milestones: [
        { title: 'Maratón terminado', weight: 3, criteria: ['Me inscribí', 'Crucé la meta'] }
      ] }
    ]
  },
  {
    key: 'empresa', label: 'Crear una empresa', why: 'Construir un negocio propio',
    stages: [
      { title: 'Validación', milestones: [
        { title: 'Problema validado', weight: 2, criteria: ['Hablé con 10 posibles clientes', 'Resumí lo que aprendí'] },
        { title: 'Primera versión', weight: 3, criteria: ['Producto mínimo funcionando', 'Lo probó al menos una persona'] }
      ] },
      { title: 'Primeros clientes', milestones: [
        { title: 'Primer cliente que paga', weight: 3, criteria: ['Precio definido', 'Primer pago recibido'] },
        { title: '10 clientes', weight: 3, criteria: ['10 clientes activos', 'Proceso de venta documentado'] }
      ] }
    ]
  },
  {
    key: 'otro', label: 'Otro', why: '',
    stages: [
      { title: 'Primera etapa', milestones: [
        { title: 'Primer hito', weight: 2, criteria: ['Definí qué significa terminarlo', 'Di el primer paso'] }
      ] }
    ]
  }
];

export const template = key => TEMPLATES.find(t => t.key === key) || null;
