import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'esri-gl/react': path.resolve(__dirname, '../../dist/react.js'),
      'esri-gl/react-map-gl': path.resolve(__dirname, '../../dist/react-map-gl.js'),
      'esri-gl': path.resolve(__dirname, '../../dist/index.js'),
    },
    preserveSymlinks: true
  },
  optimizeDeps: {
    include: ['maplibre-gl', 'mapbox-gl', 'react-map-gl/mapbox', 'react-map-gl/maplibre']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})