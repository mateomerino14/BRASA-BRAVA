import stylistic from '@stylistic/eslint-plugin';

// Reglas de formato compartidas por los tres paquetes (ver reglas.md).
export const styleConfig = {
  plugins: {'@stylistic': stylistic},
  rules: {
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/quotes': ['error', 'single', {avoidEscape: true}],
    '@stylistic/jsx-quotes': ['error', 'prefer-double'],
    '@stylistic/object-curly-spacing': ['error', 'never'],
    '@stylistic/brace-style': ['error', 'stroustrup'],
    '@stylistic/indent': ['error', 2, {SwitchCase: 1}],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/arrow-parens': ['error', 'always'],
    '@stylistic/eol-last': ['error', 'always'],
    '@stylistic/no-trailing-spaces': 'error',
    '@stylistic/no-multiple-empty-lines': ['error', {max: 1, maxEOF: 0}],
    '@stylistic/keyword-spacing': 'error',
    '@stylistic/space-before-blocks': 'error',
    '@stylistic/space-infix-ops': 'error',
    '@stylistic/comma-spacing': 'error',
    '@stylistic/key-spacing': 'error',
    '@stylistic/array-bracket-spacing': ['error', 'never'],
    'curly': ['error', 'all'],
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'no-nested-ternary': 'error',
  },
};
