import js from '@eslint/js'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'package-lock.json']
  },

  js.configs.recommended,

  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        CustomEvent: 'readonly',
        CSS: 'readonly',
        structuredClone: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off'
    }
  },

  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        global: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },

  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  },

  {
    files: ['vitest.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module'
    }
  }
]
