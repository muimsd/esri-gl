import { defineConfig } from 'vite'

export default defineConfig({
  root: 'docs',
  build: {
    outDir: '../dist-docs'
  },
  server: {
    open: true
  }
})
