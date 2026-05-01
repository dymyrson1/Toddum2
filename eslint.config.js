import js from '@eslint/js'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'package-lock.json',
      '**/*.bak',
      '**/*.sh'
    ]
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
        structuredClone: 'readonly',
        localStorage: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly'
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
      ],
      'no-console': 'off'
    }
  },

  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fs: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
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
    files: ['scripts/**/*.sh'],
    rules: {}
  },

  {
    files: ['vitest.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
]
