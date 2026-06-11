const {
  defineConfig,
  globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const jest = require("eslint-plugin-jest");
const prettier = require("eslint-plugin-prettier");
const js = require("@eslint/js");

const {
  FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([{
  files: ["**/*.ts"],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },

    parser: tsParser,
    ecmaVersion: 12,
    sourceType: "module",

    parserOptions: {
      project: ["./tsconfig.json"],
      tsconfigRootDir: __dirname,
      warnOnUnsupportedTypeScriptVersion: false,
    },
  },

  extends: compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ),

  plugins: {
    "@typescript-eslint": typescriptEslint,
    jest,
    prettier,
  },

  rules: {
    "prettier/prettier": ["error", {
      semi: true,
      trailingComma: "es5",
      printWidth: 120,
      singleQuote: true,
    }],

    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",

    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "none",
    }],

    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-empty-function": 0,
    "no-unsafe-optional-chaining": "off",

    "@typescript-eslint/no-unsafe-function-type": "error",
    "@typescript-eslint/no-wrapper-object-types": "error", 
    "@typescript-eslint/no-empty-object-type": "error",
  },
}, globalIgnores(["**/dist", "**/migrations"])]);
