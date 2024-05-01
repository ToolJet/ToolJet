module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:cypress/recommended',
    'plugin:sonarjs/recommended',
  ],
  ignorePatterns: ['.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    "warnOnUnsupportedTypeScriptVersion": false
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
  plugins: ['@typescript-eslint', 'jest', 'prettier', 'sonarjs'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: true,
        trailingComma: 'es5',
        printWidth: 120,
        singleQuote: true,
      },
    ],
    '@typescript-eslint/interface-name-prefix': 'off',
    "@typescript-eslint/explicit-function-return-type": "error",
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none' }],
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    'no-unsafe-optional-chaining': 'warn',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          object: false,
        },
        extendDefaults: true,
      },
    ],
    'max-lines-per-function': ['error', 50], // Enforces function length
    'complexity': ['error', { 'max': 10 }], // Limits cyclomatic complexity (number of linearly independent paths)
    '@typescript-eslint/no-floating-promises': 'error', // Requires handling of promises appropriately
    '@typescript-eslint/consistent-type-imports': 'warn' // Enforce consistent type-only imports
  },
};
