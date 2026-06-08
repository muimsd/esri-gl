export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/tests/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/',
    '/__mocks__/',
    '/setup\\.js$',
    '/mapbox-setup\\.js$',
    '/integration-examples/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    // `pbf` ships as ESM (`type: module`) and is pulled in transitively by
    // @esri/arcgis-rest-feature-service; jest can't transform it from
    // node_modules. esri-gl never uses that decode path, so stub it.
    '^pbf$': '<rootDir>/src/tests/__mocks__/pbf.js',
    '^@/types$': '<rootDir>/src/types.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/react-map-gl/setup.js', '<rootDir>/src/tests/react-map-gl/mapbox-setup.js'],
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/demo/**',
    '!src/examples/**',
    '!src/tests/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
