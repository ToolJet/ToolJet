module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.js', '**/*.jsx'],
      env: {
        browser: true,
        amd: true,
        es2021: true,
        node: true,
        'jest/globals': true,
      },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:prettier/recommended',
      ],
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          configFile: __dirname + '/babel.config.js',
        },
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
      },
      plugins: ['react', 'prettier', 'jest'],
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
        'react/prop-types': 0,
        'react/display-name': 'off',
        'no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        'react/no-deprecated': 0,
        'no-prototype-builtins': 0,
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        'import/no-unresolved': [
          'error',
          {
            ignore: ['^@/', 'react-hot-toast', 'react-i18next', 'react-loading-skeleton', 'react-spring'],
          },
        ],
        'react/no-unknown-property': 'off',
      },
      settings: {
        react: {
          version: 'detect',
        },
        'import/resolver': 'webpack',
      },
      globals: {
        path: true,
        fetch: true,
        process: true,
        module: true,
        __dirname: true,
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true }, // allow JSX inside .tsx files
        ecmaVersion: 'latest', // allow modern JS syntax (optional chaining, etc.)
        sourceType: 'module', // files use import/export (not require)
        project: __dirname + '/tsconfig.json', // enables type-aware lint rules
      },
      plugins: ['@typescript-eslint', 'react', 'prettier', 'jest'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
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
        'react/prop-types': 'off',
        'react/display-name': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'import/no-unresolved': [
          'error',
          {
            ignore: ['^@/', 'react-hot-toast', 'react-i18next', 'react-loading-skeleton', 'react-spring'],
          },
        ],
        // 'jest/no-disabled-tests': 'warn',
        // 'jest/no-focused-tests': 'error',
        // 'jest/no-identical-title': 'error',
        // 'jest/prefer-to-have-length': 'warn',
        // 'jest/valid-expect': 'error',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      globals: {
        path: true,
        fetch: true,
        process: true,
        module: true,
        __dirname: true,
      },
    },
  ],
  extends: ['plugin:storybook/recommended'],
};
