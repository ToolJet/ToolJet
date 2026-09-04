const fs = require('fs');
const path = require('path');

// ee/ is a git submodule — absent on CE checkouts. The bundlers (webpack and
// rspack alike) swap @ee/@cloud imports for src/modules/emptyModule based on
// TOOLJET_EDITION (NormalModuleReplacementPlugin + resolve.fallback); mirror
// that here. Default: ee when the submodule is present, ce otherwise. Run
// `TOOLJET_EDITION=ce npx jest` to test CE resolution on an ee checkout.
const eeExists = fs.existsSync(path.resolve(__dirname, 'ee/modules'));
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
  // --- App Builder widget rendering (RTL seam) ---------------------------
  // These are genuinely needed at runtime by the widget tree, so they must be
  // transformed rather than stubbed. Each one is small (single-digit files
  // reached per suite), unlike the react-markdown tree — see the
  // moduleNameMapper note below.
  'react-bootstrap', // OverlayTrigger, via src/_components/ToolTip.jsx
  'dom-helpers', // react-bootstrap's own ESM dep (`import contains from 'dom-helpers/contains'`)
  'react-dnd', // src/AppBuilder/AppBuilder.jsx
  'dnd-core', // react-dnd's ESM dep
  '@react-dnd', // scoped helpers: @react-dnd/invariant, @react-dnd/shallowequal, @react-dnd/asap
  'react-dnd-html5-backend',
];

module.exports = {
  transform: {
    // Keep the application presets, but omit production-only Babel plugins when
    // transforming ESM dependencies such as MSW.
    '^.+\\.(mjs|[jt]sx?)$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
      },
    ],
    '^.+\\.svg$': '<rootDir>/__mocks__/svg.js',
  },
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')})/)`],
  moduleNameMapper: {
    '^config$': '<rootDir>/src/test/mocks/config.js',
    '^@tooljet/plugins/client$': '<rootDir>/src/test/mocks/tooljetPluginsClient.js',
    // Real module uses top-level await (bundler-only); analytics stay dead in tests.
    'modules/common/helpers/posthogHelper(\\.js)?$': '<rootDir>/src/test/mocks/posthogHelper.js',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/style.js',
    // STUB, not transform, and deliberately so: react-markdown pulls a tree of
    // ~30 ESM-only micromark/mdast/unified packages. Transforming that tree
    // takes the cold suite from ~4s to ~50s. Nothing under test asserts on
    // markdown *parsing* — only that the widget renders its text — so a
    // renderable pass-through component is the cheap equivalent.
    '^react-markdown$': '<rootDir>/__mocks__/reactMarkdown.jsx',
    // Same reason as react-markdown: @mdxeditor/editor is ESM-only and imports CSS-in-JS at its
    // entry. It is reached transitively (CodeHinter -> FixWithAi -> ee AiBuilder) by specs that
    // never touch the doc editor, so stubbing the package is cheaper than transforming it.
    '^@mdxeditor/editor$': '<rootDir>/__mocks__/fileMock.js',
    // The remark/rehype plugins are only ever passed as opaque values into the
    // (now stubbed) markdown renderer, so a plain string stub suffices.
    '^(remark|rehype)-.*$': '<rootDir>/__mocks__/fileMock.js',
    // The bundlers load these through asset/source or html-loader (e.g.
    // Widgets/CustomComponent/iframe.html); jest would parse `<html>` as JS.
    '\\.html$': '<rootDir>/__mocks__/fileMock.js',
    // react-syntax-highlighter (Chat/MarkdownMessage) resolves to its ESM build,
    // whose style tree is ~200 `export {} from` files. The package already ships
    // an equivalent CJS build, so redirecting is free — cheaper than either
    // transforming the tree or stubbing the highlighter out.
    '^react-syntax-highlighter/dist/esm/(.*)$': 'react-syntax-highlighter/dist/cjs/$1',
    // Same trick, and here it is the single biggest win in this file: lucide-react
    // is ESM-only at its default entry, but ships a CJS build that jest can load
    // with NO transform at all. Adding lucide-react to esmPackages instead costs
    // ~38s on a cold cache (dist/esm is 7.5MB across ~1500 icon modules).
    '^lucide-react$': 'lucide-react/dist/cjs/lucide-react.js',
    // dynamic.mjs has no CJS twin, so it gets a hand-written stub that reads the
    // same CJS barrel. See the file for why it resolves icons synchronously.
    '^lucide-react/dynamic(\\.mjs)?$': '<rootDir>/__mocks__/lucideDynamicIcon.jsx',
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
  // setupFiles runs BEFORE the test framework and before any module in the
  // suite is evaluated. Globals that widget modules touch at MODULE SCOPE
  // (e.g. `new Worker(...)` in react-media-recorder) must be defined here —
  // a stub in setupFilesAfterEach or in the spec body is hoisted too late.
  setupFiles: ['<rootDir>/src/test/setupGlobals.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],
  clearMocks: true,
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx'],
  // One naming convention for the whole repository: `*.spec.*` inside a
  // `__tests__/` directory. A file named `*.test.*` will NOT run.
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  // assets/libs and build/assets/libs both ship a pyodide package.json, which
  // collides in jest-haste-map. Neither is ever imported by a test.
  modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/assets/libs/'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageDirectory: `<rootDir>/coverage/app-builder/${edition}/jest`,
  collectCoverageFrom: [
    'src/AppBuilder/**/*.{js,jsx,ts,tsx}',
    '!src/AppBuilder/**/*.stories.{js,jsx,ts,tsx}',
    '!src/AppBuilder/**/*.spec.md',
    '!src/AppBuilder/**/__tests__/**',
    '!src/AppBuilder/**/*.(test|spec).{js,jsx,ts,tsx}',
    '!src/AppBuilder/**/__mocks__/**',
    '!src/test/**',
  ],
};
