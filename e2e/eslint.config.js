import js from '@eslint/js';
import globals from 'globals';
import {styleConfig} from '../eslint.style.js';

export default [
  {ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**']},
  js.configs.recommended,
  styleConfig,
  {
    files: ['**/*.js'],
    languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: {...globals.node, ...globals.browser}},
    rules: {'no-unused-vars': ['error', {argsIgnorePattern: '^_'}]},
  },
];
