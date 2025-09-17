import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import alias from '@rollup/plugin-alias'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const output = (file, format, plugins = []) => ({
  input: './src/main.ts',
  output: {
    name: 'esriMapGl',
    file,
    format,
    sourcemap: true
  },
  plugins: [
    alias({
      entries: [
        { find: '@/types/types', replacement: path.resolve(__dirname, 'types/types') },
        { find: '@', replacement: path.resolve(__dirname, 'src') }
      ]
    }),
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.build.json'
    }),
    ...plugins
  ],
  external: ['mapbox-gl', 'maplibre-gl']
})

export default [
  output('./dist/esri-gl.js', 'umd'),
  output('./dist/esri-gl.min.js', 'umd', [terser()]),
  output('./dist/esri-gl.esm.js', 'esm')
]
