import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'maplibre-gl']
  },
  server: {
    port: 3001,
    open: true
  }
})
