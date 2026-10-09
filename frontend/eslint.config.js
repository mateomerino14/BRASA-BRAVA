import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import {styleConfig} from '../eslint.style.js';

export default [
  {ignores: ['dist/**', 'coverage/**', 'storybook-static/**', '!.storybook']},
  js.configs.recommended,
  styleConfig,
  jsxA11y.flatConfigs.recommended,
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {...globals.browser, ...globals.node},
      parserOptions: {ecmaFeatures: {jsx: true}},
    },
    plugins: {react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh},
    settings: {react: {version: 'detect'}},
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/no-unknown-property': 'error',
      'react-refresh/only-export-components': ['warn', {allowConstantExport: true}],
      'no-unused-vars': ['error', {varsIgnorePattern: '^_', argsIgnorePattern: '^_'}],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', '**/*.stories.jsx', 'src/test/**'],
    rules: {'react-refresh/only-export-components': 'off'},
  },
];
