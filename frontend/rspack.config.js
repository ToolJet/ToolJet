/**
 * Ported from webpack.config.js; webpack remains the fallback (npm start / npm run build).
 * Use via: npm run start:rspack / npm run build:rspack
 *
 * Differences vs webpack config, by design:
 * - builtin:swc-loader (Rust, in-process) replaces babel-loader/swc-loader.
 * - lodash modularization via rspackExperiments.import in PROD only (parity with
 *   babel-plugin-import); dev ships full lodash — irrelevant size, sidesteps the
 *   raw-`_` import-stripping bug.
 * - SVGR svgoConfig uses svgo's default prefixIds (filename-based) instead of the
 *   per-resource string-hash prefix — Rspack rules don't take the function `use` form.
 * - Persistent cache via experiments.cache (Rspack-native).
 * - No SMP/ProgressPlugin profiling (use RSDOCTOR=true with @rsdoctor if needed).
 */
const rspack = require('@rspack/core');
const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config({ path: '../.env' });
// v2 exports a named class (v1 exported the class as module.exports)
const { ReactRefreshRspackPlugin: ReactRefreshPlugin } = require('@rspack/plugin-react-refresh');
const CompressionPlugin = require('compression-webpack-plugin');
// Rspack implements the webpack plugin API; Sentry's webpack plugin is the
// documented way to use Sentry with Rspack (there is no @sentry/rspack-plugin).
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

// --- Env / mode flags used throughout the config below ---
const versionPath = path.resolve(__dirname, '.version');
const version = fs.readFileSync(versionPath, 'utf-8').trim();

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const edition = process.env.TOOLJET_EDITION;
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.23.2/full/';
const PYODIDE_LOCAL_URL = '/assets/libs/pyodide-0.23.2/';
const pyodideBaseUrl = edition === 'cloud' ? PYODIDE_CDN_URL : PYODIDE_LOCAL_URL;
const isDevEnv = process.env.NODE_ENV === 'development';
const isProductionMode = environment === 'production';
const isServe = process.argv.includes('serve') || process.env.WEBPACK_SERVE === 'true';

const emptyModulePath = path.resolve(__dirname, 'src/modules/emptyModule');

const API_URL = {
  production: process.env.TOOLJET_SERVER_URL || (process.env.SERVE_CLIENT !== 'false' ? '__REPLACE_SUB_PATH__' : ''),
  development: `http://localhost:${process.env.TOOLJET_SERVER_PORT || 3000}`,
};

const ASSET_PATH = process.env.ASSET_PATH || '';

function stripTrailingSlash(str) {
  return str.replace(/[/]+$/, '');
}

// --- swc loader factory: used for both the JS/JSX rule and the TS/TSX rule below,
// parameterized only by parser syntax. Keep JS/TS-specific options (transform,
// targets, lodash import rewriting) here so both rules stay in sync automatically.
const swcLoader = (parserSyntax) => ({
  loader: 'builtin:swc-loader',
  options: {
    jsc: {
      parser: parserSyntax === 'typescript' ? { syntax: 'typescript', tsx: true } : { syntax: 'ecmascript', jsx: true },
      transform: {
        react: {
          runtime: 'classic',
          development: isDevEnv,
          refresh: isDevEnv && isServe,
        },
      },
    },
    env: {
      // PROD ships legacy-compatible output (older-browser support, decided
      // 2026-07-10) — keep in sync with the browserslist field in package.json
      // (used by the webpack/babel path and autoprefixer).
      // DEV stays on modern targets deliberately: native let/const surface
      // TDZ bugs as loud crashes during development that ES5 output would
      // silently mask as `undefined` (see eslint-rules/no-tdz-crash.cjs).
      // Override either via BROWSER_TARGETS for experiments.
      targets:
        process.env.BROWSER_TARGETS || (isProductionMode ? 'defaults, ie 11' : 'defaults, not ie 11, not op_mini all'),
    },
    ...(isProductionMode && {
      rspackExperiments: {
        import: [{ libraryName: 'lodash', libraryDirectory: '', camelToDashComponentName: false }],
      },
    }),
  },
});

// --- Plugins always active, regardless of mode/env ---
const plugins = [
  // Polyfills Node globals (process, Buffer) that some deps assume exist in-browser.
  new rspack.ProvidePlugin({
    process: 'process/browser.js',
    Buffer: ['buffer', 'Buffer'],
  }),
  // Generates build/index.html from the template and injects the emitted script/link tags.
  new HtmlWebpackPlugin({
    template: './src/index.ejs',
    favicon: './assets/images/logo.svg',
  }),
  // moment ships a locale file per language (~200KB+ total); without this every
  // locale gets bundled. Restrict to English only.
  new rspack.ContextReplacementPlugin(/moment[/\\]locale$/, /(en)$/),
  // Build-time constant substitution — these become literal values in the output,
  // not runtime env lookups (the browser bundle has no process.env).
  new rspack.DefinePlugin({
    'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH),
    'process.env.SERVE_CLIENT': JSON.stringify(process.env.SERVE_CLIENT),
    'process.env.TOOLJET_EDITION': JSON.stringify(edition || 'ce'),
    'process.env.PYODIDE_BASE_URL': JSON.stringify(pyodideBaseUrl),
  }),
  // Module replacement for restricted imports (edition switching): CE builds must
  // not ship EE code, and CE/EE builds must not ship Cloud-only code. Swapping the
  // import target (rather than just gating at runtime) lets tree-shaking drop the
  // real module entirely for editions that shouldn't have it.
  new rspack.NormalModuleReplacementPlugin(/^(@ee\/|@cloud\/)/, (resource) => {
    const edition = process.env.TOOLJET_EDITION || 'ce';
    if (edition === 'ce' && resource.request.startsWith('@ee/')) {
      resource.request = emptyModulePath;
    } else if (['ce', 'ee'].includes(edition) && resource.request.startsWith('@cloud/')) {
      resource.request = emptyModulePath;
    }
  }),
];

// --- Conditional plugins: each block only applies in the mode/env it names ---

// Dev server + HMR only: enables React Fast Refresh so component edits hot-swap
// state-preserving instead of a full reload.
if (isDevEnv && isServe) {
  plugins.push(new ReactRefreshPlugin({ overlay: false }));
}

// Opt-in bundle size inspection: `ANALYZE=true npm run build:rspack`.
if (process.env.ANALYZE === 'true') {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  plugins.push(
    new BundleAnalyzerPlugin({
      // 'server' opens the interactive treemap in the browser (webpack-path parity);
      // ANALYZER_MODE=static writes build/bundle-report.html instead (CI-friendly)
      analyzerMode: process.env.ANALYZER_MODE || 'server',
      reportFilename: 'bundle-report.html',
    })
  );
}

// Prod + Sentry APM only: uploads source maps for readable stack traces, then
// deletes the local .map files so they don't ship to the CDN/deploy target.
if (isProductionMode && process.env.APM_VENDOR === 'sentry') {
  plugins.push(
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: `tooljet-${version}`,
      },
      sourcemaps: {
        // Upload then delete .map files so hidden-source-map output doesn't ship
        // 75M of maps (Cloudflare Pages has a 25 MiB per-file limit anyway).
        filesToDeleteAfterUpload: ['**/*.js.map', '**/*.css.map'],
      },
    })
  );
}

// Prod only: pre-compress JS/CSS as .gz so the server/CDN can serve them directly
// instead of compressing on every request.
if (isProductionMode) {
  plugins.push(
    new CompressionPlugin({
      test: /\.(js|css)(\?.*)?$/i,
      algorithm: 'gzip',
    })
  );
}

// Prod only: extracts CSS into its own files instead of injecting via <style> tags
// at runtime (dev uses style-loader instead — see the css/scss rules below).
if (isProductionMode) {
  plugins.push(
    new rspack.CssExtractRspackPlugin({
      ignoreOrder: true,
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].chunk.css',
    })
  );
}

// --- optimization: prod does real minify + vendor chunk splitting; dev does neither
// (both are pure overhead for a local rebuild loop) ---
const optimization = isProductionMode
  ? {
      minimize: true,
      usedExports: true, // tree-shaking: mark unused exports so the minimizer can drop them
      runtimeChunk: 'single', // isolate rspack's own bootstrap code into its own chunk so
      // app-code changes don't bust the vendor chunks' content hash
      moduleIds: 'deterministic', // stable module ids across builds -> stable chunk hashes
      chunkIds: 'deterministic', // (both needed for long-term browser caching to actually work)
      realContentHash: true, // hash reflects final (post-minify) content, not pre-minify
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          minimizerOptions: {
            // ecma 5 in BOTH compress and format so the minifier never
            // re-introduces syntax newer than the ie11 floor (its default
            // compresses functions back into arrow syntax)
            compress: { ecma: 5, arrows: false, drop_debugger: true, drop_console: true },
            format: { ecma: 5 },
            mangle: { keep_classnames: true, keep_fnames: true },
          },
        }),
        new rspack.LightningCssMinimizerRspackPlugin(),
      ],
      // Vendor chunk splitting: ported from the (currently unmerged, still-commented-out
      // in webpack.config.js) cache-group design proven on perf/edition-build-time-resolution
      // — see commit 5266121e43 ("re-enable webpack splitChunks"), ~25% initial JS reduction
      // there. That win was paired with lazy-loading the editor/settings/workflows routes;
      // without those lazy boundaries (not yet ported to this branch) these groups mainly
      // buy long-term caching (vendor code changes far less often than app code), not a
      // smaller initial bundle, since `chunks: 'all'` still pulls referenced groups into
      // the initial chunk graph. Re-check this comment once the lazy routes land.
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Small, stable, changes almost never — always its own long-cacheable chunk.
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            name: 'vendor-react',
            priority: 50,
            reuseExistingChunk: true,
            enforce: true, // split even if below minSize — worth its own cache entry regardless
          },
          // Code editors (CodeMirror, Draft.js, MDX) — heavy, editor-only.
          editors: {
            test: /[\\/]node_modules[\\/](@codemirror|@uiw\/react-codemirror|@uiw\/codemirror-theme-github|@uiw\/codemirror-theme-okaidia|draft-js|draft-js-export-html|draft-js-import-html|@mdxeditor)[\\/]/,
            name: 'vendor-editors',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Plotly (~3MB) — charts widget only.
          plotly: {
            test: /[\\/]node_modules[\\/](plotly\.js|plotly\.js-dist-min|react-plotly\.js)[\\/]/,
            name: 'vendor-plotly',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // PDF viewing/generation — used by a handful of widgets/exports only.
          pdf: {
            test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf|jspdf|jspdf-autotable)[\\/]/,
            name: 'vendor-pdf',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Spreadsheet import/export — used by bulk-upload/export features only.
          excel: {
            test: /[\\/]node_modules[\\/](xlsx|read-excel-file|papaparse|zipcelx)[\\/]/,
            name: 'vendor-excel',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Shared UI primitives (Radix, Bootstrap, DnD, selects) — grouped since they're
          // almost always used together and change at a similar (low) cadence.
          uiFramework: {
            test: /[\\/]node_modules[\\/](@radix-ui|bootstrap|react-bootstrap|@dnd-kit|react-dnd|react-dnd-html5-backend|react-beautiful-dnd|react-select|react-select-search|react-multi-select-component|react-color|rc-slider)[\\/]/,
            name: 'vendor-ui',
            priority: 35,
            reuseExistingChunk: true,
          },
          // Tables/virtualization/flow-diagram/maps — widget-rendering libs, grouped for
          // the same reason as uiFramework above.
          dataViz: {
            test: /[\\/]node_modules[\\/](react-table|react-table-plugins|@tanstack\/react-table|@tanstack\/react-virtual|react-virtuoso|reactflow|react-zoom-pan-pinch|@react-google-maps)[\\/]/,
            name: 'vendor-dataviz',
            priority: 35,
            reuseExistingChunk: true,
          },
          // Small utility libs used everywhere across the app — bundling them together
          // avoids one HTTP request per tiny package.
          common: {
            test: /[\\/]node_modules[\\/](lodash|axios|classnames|clsx|moment|moment-timezone|humps|uuid|semver|fuse\.js|dompurify|superstruct|rfdc|flatted|zustand|immer|rxjs|i18next|react-i18next|i18next-http-backend)[\\/]/,
            name: 'vendor-common',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Feature-specific libs (date/phone inputs, markdown, syntax highlighting,
          // monitoring/analytics, collaboration) — used by specific widgets/features only.
          features: {
            test: /[\\/]node_modules[\\/](react-datepicker|react-datetime|react-dates|@wojtekmaj|react-big-calendar|react-currency-input-field|react-phone-input-2|react-phone-number-input|react-mentions|react-markdown|rehype-raw|remark-gfm|react-syntax-highlighter|@tabler\/icons-react|emoji-mart|@emoji-mart|@sentry|posthog-js|yjs|y-websocket|@y-presence|react-moveable|react-rnd|react-selecto)[\\/]/,
            name: 'vendor-features',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Catch-all for any other node_modules import not matched above.
          // `chunks: 'initial'` (unlike the other groups) keeps this out of async/lazy
          // chunks — only entry-point-referenced vendor code lands here.
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: -10,
            reuseExistingChunk: true,
            chunks: 'initial',
          },
          // lucide-react's DynamicIcon pulls in per-icon dynamic imports; isolating the
          // package keeps that icon-loading churn out of the vendor-features chunk above.
          lucideReact: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'lucide-react',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    }
  : {
      minimize: false,
      // No runtimeChunk in dev — it's a prod caching optimization and just adds
      // churn to hot updates.
      runtimeChunk: false,
    };

module.exports = {
  mode: environment,
  entry: './src/index.jsx',
  optimization, // built above — differs by prod/dev

  // --- experiments: Rspack-specific top-level features ---
  experiments: {
    // Rspack-native persistent cache (replaces webpack's filesystem cache).
    // version separates serve (HMR module graph) from one-shot builds — sharing
    // one cache across them replays HMR dependencies into non-HMR builds and
    // fails with "No module factory available for dependency type: module.hot.accept".
    cache: {
      type: 'persistent',
      version: `${environment}-${isServe ? 'serve' : 'build'}`,
      buildDependencies: [__filename],
    },
  },
  // lazyCompilation is DISABLED on Rspack (unlike the webpack config), and it MUST
  // be set here at the TOP LEVEL: `@rspack/cli serve` default-enables lazyCompilation
  // for web targets whenever this exact key is undefined (experiments.lazyCompilation
  // is ignored in Rspack 1.x). Why disabled: as of Rspack 1.7.x, when a lazily-imported
  // module finishes compiling, the emitted hot-update manifest lists only the
  // runtime/main chunk and never includes the proxy-module swap — the browser can't
  // hot-apply it, so the dev-server client falls back to a FULL PAGE RELOAD broadcast
  // to every connected tab (verified 2026-07-10 by inspecting
  // /<chunk>.<hash>.hot-update.json after triggering /lazy-compilation-using-
  // activations). Rspack full builds are fast enough that eager compilation costs
  // little and navigation has no compile pauses at all.
  // lazyCompilation DISABLED — must stay set at the TOP LEVEL: `rspack serve`
  // default-enables it for web targets when this key is undefined.
  // History: Rspack 1.7.x omitted the JS proxy swap from hot-update manifests
  // (fixed in 2.x, probe-verified), but 2.x still fails to hot-apply CSS updates
  // for lazily-compiled chunks (upstream web-infra-dev/rspack#11072, open) — and
  // every ToolJet route chunk includes SCSS, so each lazy navigation still
  // full-reloads every connected tab. Re-enable only after #11072 is fixed and
  // a two-tab navigation test passes without reloads.
  lazyCompilation: false,
  // 'es5' constrains the bundler's own generated runtime code (chunk loaders,
  // module wrappers) to ES5 — `target: 'web'` alone ignores browserslist and
  // emits arrow functions in the runtime. Dev keeps modern runtime.
  target: isProductionMode ? ['web', 'es5'] : 'web',

  // --- module resolution: extensions/aliases/fallbacks used to resolve every import ---
  resolve: {
    // Only extensions that are actually imported without one — every entry here
    // is a filesystem probe on each extensionless import, so the list stays short.
    // Assets (.svg/.png/.wasm/...) are always imported with explicit extensions.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@ee': path.resolve(__dirname, 'ee/'),
      '@cloud': path.resolve(__dirname, 'cloud/'),
      '@assets': path.resolve(__dirname, 'assets/'),
      '@white-label': path.resolve(__dirname, 'src/_helpers/white-label'),
    },
    fallback: {
      // Browser polyfills for Node built-ins some deps import (Rspack, unlike Node
      // webpack targets, doesn't auto-polyfill these).
      process: require.resolve('process/browser.js'),
      path: require.resolve('path-browserify'),
      util: require.resolve('util/'),
      // Edition-gated bulk import points — same emptyModule swap-in as the
      // NormalModuleReplacementPlugin above, but for whole-module fallback resolution.
      '@ee/modules': emptyModulePath,
      '@cloud/modules': emptyModulePath,
    },
  },
  // Source maps: cheap eval-based maps in dev (fast rebuilds); prod only generates
  // maps when Sentry is wired up to consume them (hidden-source-map = mapped stack
  // traces server-side without exposing a public .map file); otherwise none, to
  // keep prod builds smaller/faster.
  devtool:
    environment === 'development'
      ? 'eval-cheap-module-source-map'
      : process.env.APM_VENDOR === 'sentry'
      ? 'hidden-source-map'
      : false,

  // --- module.rules: one rule per file type, evaluated in order for every import ---
  module: {
    rules: [
      // Binary/opaque assets — emitted as-is, referenced by URL.
      {
        test: /\.(ttf|wasm|tar|data)$/,
        type: 'asset/resource',
      },
      // SVG imported explicitly as a URL (`import x from './x.svg?url'`) — served as a
      // static file, skipping the SVGR-to-React-component transform below.
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        resourceQuery: /url/, // SVGs imported with *.svg?url stay as files
      },
      // SVG imported as a component (`import { ReactComponent as X } from './x.svg'`) —
      // transformed into an inline React component via SVGR.
      {
        test: /\.svg$/i,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [{ name: 'prefixIds' }],
              },
            },
          },
        ],
        resourceQuery: { not: [/url/] },
      },
      {
        test: /\.css$/,
        use: [
          isProductionMode ? rspack.CssExtractRspackPlugin.loader : { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              // Root-relative urls (/assets/fonts/...) are served by the dev-server
              // static dir / deploy assets copy at runtime — never resolve them at
              // build time (Rspack 2 tries to by default; v1/webpack passed through).
              url: { filter: (url) => !url.startsWith('/') },
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.scss$/,
        use: [
          isProductionMode ? rspack.CssExtractRspackPlugin.loader : { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              // Root-relative urls (/assets/fonts/...) are served by the dev-server
              // static dir / deploy assets copy at runtime — never resolve them at
              // build time (Rspack 2 tries to by default; v1/webpack passed through).
              url: { filter: (url) => !url.startsWith('/') },
            },
          },
          { loader: 'postcss-loader' },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: ['global-builtin', 'import', 'color-functions'],
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      // App source (excludes node_modules, which ships pre-compiled) — see the
      // swcLoader factory above for the shared transform/target options.
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        use: [swcLoader('ecmascript')],
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        use: [swcLoader('typescript')],
      },
      // index.ejs is processed by HtmlWebpackPlugin, not this rule; this covers any
      // other .html asset imported directly from JS.
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
    ],
  },
  plugins, // assembled above: always-on plugins + the mode/env-gated conditional ones

  // --- devServer: only read when running `rspack serve` (npm run start:rspack) ---
  devServer: {
    historyApiFallback: { index: ASSET_PATH }, // SPA routing: unmatched paths fall back to index.html
    static: {
      directory: path.resolve(__dirname, 'assets'),
      publicPath: '/assets/',
    },
    client: {
      overlay: false, // don't cover the app with a full-screen error overlay on compile errors
    },
  },

  // --- output: where/how build artifacts are named and written ---
  output: {
    // contenthash in prod filenames enables long-term caching (unchanged files keep
    // their old URL); dev keeps stable names since cache-busting doesn't matter locally.
    filename: environment === 'production' ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: environment === 'production' ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    assetModuleFilename: 'assets/[contenthash:8][ext][query]',
    publicPath: ASSET_PATH,
    path: path.resolve(__dirname, 'build'),
    clean: true, // wipe build/ before each build so stale chunks never linger
  },

  // --- externals: values injected as a global `config` module, resolved at build
  // time from env vars rather than fetched at runtime ---
  externals: {
    // global app config object (emitted verbatim as the module value)
    config: JSON.stringify({
      apiUrl: `${stripTrailingSlash(API_URL[environment]) || ''}/api`,
      ENVIRONMENT: process.env.NODE_ENV,
      SERVER_IP: process.env.SERVER_IP,
      COMMENT_FEATURE_ENABLE: process.env.COMMENT_FEATURE_ENABLE ?? true,
      TOOLJET_SERVER_URL: process.env.TOOLJET_SERVER_URL,
      ENABLE_MULTIPLAYER_EDITING: true,
      ENABLE_MARKETPLACE_DEV_MODE: process.env.ENABLE_MARKETPLACE_DEV_MODE,
      TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB: process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB || 5,
      TOOLJET_MARKETPLACE_URL:
        process.env.TOOLJET_MARKETPLACE_URL || 'https://tooljet-plugins-production.s3.us-east-2.amazonaws.com',
      TOOLJET_EDITION: process.env.TOOLJET_EDITION,
      ENABLE_WORKFLOW_SCHEDULING: process.env.ENABLE_WORKFLOW_SCHEDULING,
      WEBSITE_SIGNUP_URL: process.env.WEBSITE_SIGNUP_URL || 'https://www.tooljet.com/signup',
      TJ_SELFHOST_CREDITS_APP:
        process.env.TJ_SELFHOST_CREDITS_APP ||
        'https://app.tooljet.com/applications/c1ec8a6c-ee9a-4a7d-ba9b-3590bbeaf6b9',
      ENABLE_PASSWORD_COMPLEXITY_RULES: process.env.ENABLE_PASSWORD_COMPLEXITY_RULES || false,
    }),
  },
};
