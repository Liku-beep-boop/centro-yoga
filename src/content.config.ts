import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Campos opcionales: el panel puede guardarlos vacíos (''), por eso se aceptan strings vacíos.
const opcional = z.string().optional().nullable();

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    resumen: opcional,
    portada: opcional,
    borrador: z.boolean().optional().default(false),
  }),
});

const eventos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eventos' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    hora: opcional,
    hora_fin: opcional,
    lugar: opcional,
    precio: opcional,
    imagen: opcional,
    inscripcion: opcional,
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: z.object({
    titulo: z.string(),
    subtitulo: opcional,
    imagen: opcional,
  }),
});

export const collections = { blog, eventos, paginas };
