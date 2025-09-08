import { defineConfig } from 'vite'

export default defineConfig({
  root: 'docs',
  build: {
    outDir: '../dist-demo'
  },
  server: {
    open: true
  }
})
