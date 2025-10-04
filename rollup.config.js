import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import dts from 'rollup-plugin-dts'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const basePlugins = [
  alias({
    entries: [
      { find: '@/types', replacement: path.resolve(__dirname, 'src/types.ts') },
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ]
  }),
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false,
    outDir: 'dist',
    rootDir: 'src',
    jsx: 'react-jsx',
    noEmitOnError: false,
    compilerOptions: {
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: false
    }
  }),
  babel({
    babelHelpers: 'bundled',
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    exclude: 'node_modules/**'
  })
]

const commonExternal = ['mapbox-gl', 'maplibre-gl', 'react', 'react-dom', 'react-map-gl/mapbox', 'react-map-gl/maplibre']

// ES modules build configuration with multiple entry points
const esConfig = {
  input: {
    index: 'src/index.ts',
    react: 'src/react.ts',
    'react-map-gl': 'src/react-map-gl.ts'
  },
  external: commonExternal,
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    exports: 'named',
    entryFileNames: '[name].js'
  },
  plugins: basePlugins,
  onwarn(warning, warn) {
    // Suppress certain warnings
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'EMPTY_BUNDLE') return;
    warn(warning);
  }
};

// UMD build for main entry only (for CDN usage)
const umdConfig = {
  input: 'src/index.ts',
  external: commonExternal,
  output: {
    file: 'dist/index.umd.js',
    format: 'umd',
    name: 'esrigl',
    sourcemap: true,
    exports: 'named',
    globals: {
      'mapbox-gl': 'mapboxgl',
      'maplibre-gl': 'maplibregl',
      'react': 'React',
      'react-dom': 'ReactDOM',
  'react-map-gl/mapbox': 'ReactMapGL',
      'react-map-gl/maplibre': 'ReactMapGL'
    }
  },
  plugins: basePlugins,
  onwarn(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'EMPTY_BUNDLE') return;
    warn(warning);
  }
};

// Legacy builds for backward compatibility
const legacyConfig = {
  input: 'src/main.ts',
  external: ['mapbox-gl', 'maplibre-gl'],
  output: [
    {
      file: 'dist/esri-gl.js',
      format: 'umd',
      name: 'esrigl',
      sourcemap: true
    },
    {
      file: 'dist/esri-gl.min.js',
      format: 'umd',
      name: 'esrigl',
      sourcemap: true,
      plugins: [terser()]
    },
    {
      file: 'dist/esri-gl.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: basePlugins
};

// Type definitions build
const dtsConfig = {
  input: {
    index: 'src/index.ts',
    react: 'src/react.ts',
    'react-map-gl': 'src/react-map-gl.ts'
  },
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: '[name].d.ts'
  },
  plugins: [
    alias({
      entries: [
        { find: '@/types', replacement: path.resolve(__dirname, 'src/types.ts') },
        { find: '@', replacement: path.resolve(__dirname, 'src') }
      ]
    }),
    dts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  external: commonExternal
};

export default [esConfig, umdConfig, legacyConfig, dtsConfig]
