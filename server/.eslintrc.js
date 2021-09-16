module.exports = {
  env: {
    node: true,
    jest: true,
  },
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:cypress/recommended',
  ],
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: true,
        trailingComma: 'es5',
        printWidth: 120,
        singleQuote: true,
        arrowParens: 'always',
        proseWrap: 'preserve',
      },
    ],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none' }],
    '@typescript-eslint/no-var-requires': 'off',
    'no-case-declarations': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          String: false,
          Boolean: false,
          Number: false,
          Symbol: false,
          '{}': false,
          Object: false,
          object: false,
          Function: false,
        },
        extendDefaults: true,
      },
    ],
  },
};
