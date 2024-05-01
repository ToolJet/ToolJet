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
        'plugin:react-perf/all',
        'plugin:sonarjs/recommended',
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
      plugins: ['react', 'prettier', 'jest', 'complexity', 'react-perf', 'sonarjs'],
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
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        // 'max-lines-per-function': ['warn', 50], // Limits the number of lines per function
        'react/jsx-key': ['error', { checkFragmentShorthand: true }], // Ensures key prop is present in JSX arrays
        'max-lines': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
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
  ],
  extends: ['plugin:storybook/recommended'],
};
