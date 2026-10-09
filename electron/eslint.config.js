import js from '@eslint/js';
import globals from 'globals';
import {styleConfig} from '../eslint.style.js';

export default [
  {ignores: ['release/**', 'node_modules/**']},
  js.configs.recommended,
  styleConfig,
  {
    files: ['**/*.js'],
    languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: globals.node},
    rules: {'no-unused-vars': ['error', {argsIgnorePattern: '^_'}]},
  },
];
