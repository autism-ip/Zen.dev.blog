import { fixupPluginRules } from '@eslint/compat'
import eslint from '@eslint/js'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import nextConfigs from 'eslint-config-next'

const patchedConfig = [
  eslint.configs.recommended,
  ...nextConfigs,
  {
    files: ['**/*.js?(x)'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      prettier: fixupPluginRules(prettier)
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node
      },
      ecmaVersion: 6,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
          paths: ['src']
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx']
        }
      }
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
      'react/no-unescaped-entities': 0,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 0,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      '@next/next/no-img-element': 0,
      '@next/next/no-page-custom-font': 0,
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'import/no-named-as-default': 0,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['*.mjs'],
    rules: {
      'import/no-anonymous-default-export': 'off'
    }
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.vitest, globalThis: true }
    }
  }
]

const config = [...patchedConfig, { ignores: ['.next/*', 'test-*.js'] }]

export default config
