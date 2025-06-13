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
        'import/resolver': {
          node: {
            extensions: ['.js', '.jsx'],
          },
          webpack: {
            config: 'webpack.config.js',
          },
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
    {
      files: ['**/*.ts', '**/*.tsx'],
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
        'plugin:@typescript-eslint/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
      },
      plugins: ['react', 'prettier', 'jest', '@typescript-eslint'],
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
        'no-unused-vars': 'off', // Disable the base no-unused-vars rule (it doesn't handle TS properly)
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
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
      settings: {
        react: {
          version: 'detect',
        },
        'import/resolver': {
          node: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
          },
          webpack: {
            config: 'webpack.config.js',
          },
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
