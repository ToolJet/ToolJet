import js from '@eslint/js';
import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginImportX from 'eslint-plugin-import-x';
import pluginJest from 'eslint-plugin-jest';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import pluginStorybook from 'eslint-plugin-storybook';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Remap import-x recommended rules from 'import-x/' prefix to 'import/' prefix
// so they match the plugin namespace and existing eslint-disable directives
function remapImportRules(rules) {
  const remapped = {};
  for (const [key, value] of Object.entries(rules)) {
    remapped[key.replace(/^import-x\//, 'import/')] = value;
  }
  return remapped;
}

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: ['build/**', 'assets/**'],
  },

  // Disable reporting unused eslint-disable directives (ESLint 9 defaults to "warn",
  // ESLint 8 defaulted to "off"). This prevents --fix from stripping existing
  // eslint-disable comments that plugins no longer flag.
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // Main config for JS/JSX files
  {
    files: ['**/*.js', '**/*.jsx'],

    languageOptions: {
      parser: babelParser,
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
      globals: {
        ...globals.browser,
        ...globals.amd,
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
        path: true,
        fetch: true,
        process: true,
        module: true,
        __dirname: true,
      },
    },

    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      // Register import-x under the 'import' namespace so existing
      // `eslint-disable import/...` directives continue to work
      import: pluginImportX,
      jest: pluginJest,
      prettier: pluginPrettier,
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver': 'webpack',
    },

    rules: {
      // eslint:recommended
      ...js.configs.recommended.rules,

      // react recommended
      ...pluginReact.configs.recommended.rules,

      // react-hooks recommended
      ...pluginReactHooks.configs.recommended.rules,

      // import errors + warnings (remapped from import-x/ to import/ namespace)
      ...remapImportRules(pluginImportX.configs.recommended.rules),

      // prettier recommended (plugin + config)
      ...pluginPrettier.configs.recommended.rules,

      // prettier config (disables conflicting rules)
      ...configPrettier.rules,

      // Re-enable prettier/prettier as error (after configPrettier may disable it)
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

      // Project rules (preserved from .eslintrc.js)
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
  },

  // Storybook config
  ...pluginStorybook.configs['flat/recommended'],
];
