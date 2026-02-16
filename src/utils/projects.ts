import { getCollection } from 'astro:content'

/**
 * Returns all projects, while excluding all posts in a
 * draft state in production.
 */
export async function getProjects() {
  return await getCollection('projects', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })
}
