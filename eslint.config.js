const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const nextPlugin = require('@next/eslint-plugin-next');

module.exports = [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', '.git/**', 'pipeline/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      react: reactPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': 'off',
      '@next/next/no-html-link-for-pages': 'error',
      'react/jsx-key': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  { files: ['eslint.config.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
];
