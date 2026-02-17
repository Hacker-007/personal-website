import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional().default(false),
    publishedAt: z.coerce.date(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    github: z.string(),
    draft: z.boolean().optional().default(false),
    tags: z.string().array().optional().default([]),
  }),
})

export const collections = { blog, projects }
