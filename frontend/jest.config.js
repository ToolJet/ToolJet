const fs = require('fs');
const path = require('path');

// ee/ is a git submodule — absent on CE checkouts. The bundlers (webpack and
// rspack alike) swap @ee/@cloud imports for src/modules/emptyModule based on
// TOOLJET_EDITION (NormalModuleReplacementPlugin + resolve.fallback); mirror
// that here. Default: ee when the submodule is present, ce otherwise. Run
// `TOOLJET_EDITION=ce npx jest` to test CE resolution on an ee checkout.
const eeExists = fs.existsSync(path.resolve(__dirname, 'ee'));
const edition = process.env.TOOLJET_EDITION || (eeExists ? 'ee' : 'ce');
const useRealEe = edition !== 'ce' && eeExists;
const emptyModule = '<rootDir>/src/modules/emptyModule';

// Packages that ship ESM-only code and must be transformed by Jest.
// Add a package here when a test fails with
// "SyntaxError: Cannot use import statement outside a module".
const esmPackages = [
  '@open-draft/deferred-promise',
  'msw',
  'until-async',
  'rettime',
  'uuid',
  'url-join',
  'mpx-error-boundary',
  'query-string',
  'decode-uri-component',
  'split-on-first',
  'filter-obj',
];

module.exports = {
  // @swc/jest instead of babel-jest: the app builds with Babel, but for tests SWC
  // transforms ~10x faster and this codebase (263k LOC + transformed node_modules)
  // makes transform speed the long pole. Fallback: swap either entry back to
  // 'babel-jest' (still installed) if an SWC edge case appears.
  transform: {
    // JSX lives in .js files here, so .js/.jsx need the ecmascript parser with jsx.
    '^.+\\.m?jsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'ecmascript', jsx: true },
          transform: { react: { runtime: 'classic' } },
        },
      },
    ],
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'classic' } },
        },
      },
    ],
    '^.+\\.svg$': '<rootDir>/__mocks__/svg.js',
  },
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')})/)`],
  moduleNameMapper: {
    '^config$': '<rootDir>/src/test/mocks/config.js',
    // Real module uses top-level await (bundler-only); analytics stay dead in tests.
    'modules/common/helpers/posthogHelper(\\.js)?$': '<rootDir>/src/test/mocks/posthogHelper.js',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/style.js',
    // `*.svg?url` and other asset/resource imports resolve to URL strings in the
    // bundlers; the query string would break jest resolution, so map them first.
    '\\.svg\\?url$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(png|jpe?g|gif|webp|avif|ico|bmp|ttf|otf|woff2?|eot|mp[34]|webm|wav|tar|wasm|data)$':
      '<rootDir>/__mocks__/fileMock.js',
    // Mirror the bundler aliases (and edition-based emptyModule replacement) so
    // tests resolve the same paths as the app. Specific entries precede generic ones.
    '^@ee/modules(.*)$': useRealEe ? '<rootDir>/ee/modules$1' : emptyModule,
    '^@cloud/modules(.*)$': emptyModule,
    '^@ee/(.*)$': useRealEe ? '<rootDir>/ee/$1' : emptyModule,
    '^@cloud/(.*)$': emptyModule, // cloud/ does not exist in this repo
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@white-label$': '<rootDir>/src/_helpers/white-label',
    '^@white-label/(.*)$': '<rootDir>/src/_helpers/white-label/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jsdom patched to keep Node's native fetch/TextEncoder/BroadcastChannel —
  // required by MSW v2. Suites can still opt into `@jest-environment node`.
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
  // Convention: colocated __tests__ dirs, .test.* suffix (see src/test/README.md).
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.spec.md',
    '!src/**/index.{js,ts}',
    '!src/**/__mocks__/**',
    '!src/test/**',
  ],
};
