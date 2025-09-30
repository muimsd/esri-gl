import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  // Base configuration for all files
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: [
      'dist/**',
      'docs/**',
      '*.config.js',
      '**/__tests__/**',
      'coverage/**'
    ]
  },
  
  // JavaScript/TypeScript files configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'writable',
        require: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'always'],
      'semi-spacing': ['error', { before: false, after: true }]
    }
  },
  
  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // Disable base rules that are covered by TypeScript rules
      'no-unused-vars': 'off',
      'semi': 'off',
      'no-undef': 'off',
      
      // Enable TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  
  // Jest setup and mock files configuration
  {
    files: ['**/setup.js', '**/mapbox-setup.js', '**/*setup*.js', '**/__mocks__/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'writable',
        require: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        // Jest globals
        jest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        // Browser globals commonly used in Jest setup
        HTMLCanvasElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn', // More permissive for setup files
      'no-undef': 'error'
    }
  },

  // Test files configuration - more permissive for any types
  {
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Jest globals for test files
        jest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];