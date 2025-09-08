import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const output = (file, format, plugins = []) => ({
  input: './src/main.ts',
  output: {
    name: 'mapboxglEsriSources',
    file,
    format,
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.build.json'
    }),
    ...plugins
  ],
  external: ['mapbox-gl', 'maplibre-gl']
})

export default [
  output('./dist/mapbox-gl-esri-sources.js', 'umd'),
  output('./dist/mapbox-gl-esri-sources.min.js', 'umd', [terser()]),
  output('./dist/mapbox-gl-esri-sources.esm.js', 'esm')
]
