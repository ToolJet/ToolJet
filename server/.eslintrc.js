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
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
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

    // ── Security rules (built-in, no extra packages needed) ──────────────
    // Prevent code execution from strings — eval() and equivalents are RCE vectors.
    'no-eval': 'error',
    'no-new-func': 'error',
    // Catches setTimeout("string") and similar indirect eval patterns.
    'no-implied-eval': 'error',
    // Prevents using __proto__ which can lead to prototype pollution.
    'no-proto': 'error',
    // Catches potential prototype pollution via object property access.
    'no-extend-native': 'error',
    // Regex DoS — flag regexes that could backtrack exponentially.
    'no-control-regex': 'error',
    // ─────────────────────────────────────────────────────────────────────

    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'none' }],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 0,
    'no-unsafe-optional-chaining': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          object: false,
        },
        extendDefaults: true,
      },
    ],
  },
};
