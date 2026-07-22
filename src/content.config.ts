import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    description: z.string(),
    draft: z.boolean().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    tags: z.array(z.string()),
    friction: z.string(),
    fix: z.string(),
    payoff: z.string(),
    order: z.number(),
  }),
});

export const collections = {
  blog,
  projects,
};
