import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',
      'no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      'prefer-const': 'error',
      'array-callback-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
