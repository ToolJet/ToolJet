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
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

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
    ignores: ['build/**', 'assets/**', 'cypress-tests/**'],
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
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        webpack: {
          config: new URL('./webpack.config.js', import.meta.url).pathname,
        },
      },
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
          ignore: ['^@/', 'react-hot-toast', 'react-i18next', 'react-loading-skeleton', 'react-spring', 'class-variance-authority', '@radix-ui/'],
        },
      ],
      'react/no-unknown-property': 'off',
    },
  },

  // TypeScript config for TS/TSX files
  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: __dirname + '/tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.amd,
        ...globals.node,
        ...globals.es2021,
        path: true,
        fetch: true,
        process: true,
        module: true,
        __dirname: true,
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      prettier: pluginPrettier,
      import: pluginImportX,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // eslint:recommended
      ...js.configs.recommended.rules,

      // @typescript-eslint/recommended rules (from v7 plugin)
      // Disable base ESLint rules that conflict with TS equivalents
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': 'off',
      'no-dupe-class-members': 'off',

      // @typescript-eslint recommended
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      // '@typescript-eslint/ban-types' was removed in @typescript-eslint v8 —
      // referencing it makes ESLint throw whenever a TS file is linted.
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-loss-of-precision': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/triple-slash-reference': 'error',

      // react recommended
      ...pluginReact.configs.recommended.rules,

      // react-hooks recommended
      ...pluginReactHooks.configs.recommended.rules,

      // prettier recommended (plugin + config)
      ...pluginPrettier.configs.recommended.rules,

      // prettier config (disables conflicting rules)
      ...configPrettier.rules,

      // Re-enable prettier/prettier as error
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

      // Project rules
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // Override @typescript-eslint defaults with project preferences
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@/', 'react-hot-toast', 'react-i18next', 'react-loading-skeleton', 'react-spring', 'class-variance-authority', '@radix-ui/'],
        },
      ],

      'react/no-unknown-property': 'off',
    },
  },

  // Storybook config
  ...pluginStorybook.configs['flat/recommended'],

  // Bundle-size guards. NOTE: flat config does not merge rule options — a later
  // 'no-restricted-imports' entry replaces the earlier one for matching files,
  // hence the base-config + widget-override structure below.
  //
  // 1) Everywhere: no barrel imports (defeat tree-shaking), no static heavy libs.
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'ee/**/*.{js,jsx,ts,tsx}', 'cloud/**/*.{js,jsx,ts,tsx}'],
    ignores: [
      // Pre-existing dead import of a deleted service (orgEnvironmentVariableService)
      // kept on the barrel until the EE Copilot page is removed or fixed.
      'ee/modules/WorkspaceSettings/pages/Copilot/CopilotSetting.jsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/_services', message: 'Import the service file directly: @/_services/<name>.service' },
            { name: '@/_components', message: 'Import the component directly: @/_components/<Name>' },
          ],
          patterns: [
            {
              group: ['xlsx', 'zipcelx', 'jspdf', 'jspdf-autotable', 'react-pdf', 'pdfjs-dist', 'plotly.js*', 'read-excel-file*'],
              message:
                'Heavy library — only widget code may use it, via dynamic import() at the point of use (see src/AppBuilder/Widgets/NewTable/_utils/exportData.js).',
            },
          ],
        },
      ],
    },
  },
  // 2) Widget code: keep the barrel restriction, allow heavy-lib references
  //    (they must still be dynamic import() — static imports show up in the
  //    bundle analyzer and review).
  {
    files: ['src/AppBuilder/Widgets/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/_services', message: 'Import the service file directly: @/_services/<name>.service' },
            { name: '@/_components', message: 'Import the component directly: @/_components/<Name>' },
          ],
        },
      ],
    },
  },
];
