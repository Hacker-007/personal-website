// @ts-check

import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'

import react from '@astrojs/react'
import { removeItalicsTransformer } from './src/utils/shiki'

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  env: {
    schema: {
      API_URL: envField.string({ context: 'server', access: 'secret' }),
      CF_ACCESS_CLIENT_ID: envField.string({
        context: 'server',
        access: 'secret',
      }),
      CF_ACCESS_CLIENT_SECRET: envField.string({
        context: 'server',
        access: 'secret',
      }),
      UPSTASH_REDIS_REST_URL: envField.string({
        context: 'server',
        access: 'secret',
      }),
      UPSTASH_REDIS_REST_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
      }),
      GLOBAL_MINUTE_RATE_LIMIT: envField.number({
        context: 'server',
        access: 'public',
      }),
      SESSION_MINUTE_RATE_LIMIT: envField.number({
        context: 'server',
        access: 'public',
      }),
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
      transformers: [removeItalicsTransformer],
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es',
    },
  },
})
