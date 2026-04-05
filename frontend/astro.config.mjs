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
