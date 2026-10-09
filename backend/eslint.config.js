import js from '@eslint/js';
import globals from 'globals';
import {styleConfig} from '../eslint.style.js';

export default [
  {ignores: ['coverage/**', 'node_modules/**']},
  js.configs.recommended,
  styleConfig,
  {
    files: ['**/*.js'],
    languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: globals.node},
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', {allow: ['info', 'warn', 'error']}],
    },
  },
];
