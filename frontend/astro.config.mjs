// @ts-check

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import { removeItalicsTransformer } from './src/utils/shiki'

// https://astro.build/config
export default defineConfig({
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
