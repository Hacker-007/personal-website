import { getCollection } from 'astro:content'

/**
 * Returns all blog posts, sorted by their published date,
 * while excluding all posts in a draft state in production.
 */
export async function getBlogPosts() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })

  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  )
}
