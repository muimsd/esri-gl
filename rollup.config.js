import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const output = (file, format, plugins = []) => ({
  input: './src/main.ts',
  output: {
    name: 'esriMapGl',
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
  output('./dist/esri-map-gl.js', 'umd'),
  output('./dist/esri-map-gl.min.js', 'umd', [terser()]),
  output('./dist/esri-map-gl.esm.js', 'esm')
]
