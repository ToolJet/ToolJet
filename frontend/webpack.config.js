const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
require('dotenv').config({ path: '../.env' });
const hash = require('string-hash');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const fs = require('fs');
const versionPath = path.resolve(__dirname, '.version');
const version = fs.readFileSync(versionPath, 'utf-8').trim();
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const edition = process.env.TOOLJET_EDITION;
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.23.2/full/';
const PYODIDE_LOCAL_URL = '/assets/libs/pyodide-0.23.2/';
const pyodideBaseUrl = edition === 'cloud' ? PYODIDE_CDN_URL : PYODIDE_LOCAL_URL;
const isDevEnv = process.env.NODE_ENV === 'development';
const isProductionMode = environment === 'production';

// Create path to empty module
const emptyModulePath = path.resolve(__dirname, 'src/modules/emptyModule');

const API_URL = {
  production: process.env.TOOLJET_SERVER_URL || (process.env.SERVE_CLIENT !== 'false' ? '__REPLACE_SUB_PATH__' : ''),
  development: `http://localhost:${process.env.TOOLJET_SERVER_PORT || 3000}`,
};

const ASSET_PATH = process.env.ASSET_PATH || '';

function stripTrailingSlash(str) {
  return str.replace(/[/]+$/, '');
}

const plugins = [
  new webpack.ProvidePlugin({
    process: 'process/browser.js',
    Buffer: ['buffer', 'Buffer'],
  }),
  new HtmlWebpackPlugin({
    template: './src/index.ejs',
    favicon: './assets/images/logo.svg',
  }),
  new CompressionPlugin({
    test: /\.(js|css)(\?.*)?$/i,
    algorithm: 'gzip',
  }),
  new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /(en)$/),
  new webpack.DefinePlugin({
    'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH),
    'process.env.SERVE_CLIENT': JSON.stringify(process.env.SERVE_CLIENT),
    'process.env.TOOLJET_EDITION': JSON.stringify(edition || 'ce'),
    'process.env.PYODIDE_BASE_URL': JSON.stringify(pyodideBaseUrl),
  }),
  // Module replacement for restricted imports
  new webpack.NormalModuleReplacementPlugin(/^(@ee\/|@cloud\/)/, (resource) => {
    const edition = process.env.TOOLJET_EDITION || 'ce';

    // Only replace if the current edition shouldn't have access
    if (edition === 'ce' && resource.request.startsWith('@ee/')) {
      resource.request = emptyModulePath;
    } else if (['ce', 'ee'].includes(edition) && resource.request.startsWith('@cloud/')) {
      resource.request = emptyModulePath;
    }
    // Otherwise, leave the original import intact
  }),
];

if (process.env.APM_VENDOR === 'sentry') {
  plugins.push(
    // Add Sentry plugin for error and performance monitoring
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        // The version should be same as what its when we are sending error events
        name: `tooljet-${version}`,
      },
      sourcemaps: {
        // Upload source maps to Sentry then delete them from the build output.
        // This keeps stack traces readable in Sentry while preventing oversized
        // .map files from being deployed (Cloudflare Pages has a 25 MiB limit).
        filesToDeleteAfterUpload: ['**/*.js.map'],
      },
    })
  );
}

if (isDevEnv) {
  plugins.push(new ReactRefreshWebpackPlugin({ overlay: false }));
}

if (isProductionMode) {
  plugins.push(
    new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].chunk.css',
    })
  );
}

if (process.env.ANALYZE === 'true') {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
  mode: environment,
  // Ratcheting size budget: limits sit just above the current bundle size so
  // the build is quiet today but warns on regressions. Lower these as the
  // bundle shrinks — never raise them without a review.
  // Current (2026-06): initial JS ≈ 24 MiB (CE), largest single chunk ≈ 11 MiB.
  performance: {
    hints: 'warning',
    maxEntrypointSize: 26 * 1024 * 1024,
    maxAssetSize: 12 * 1024 * 1024,
  },
  optimization: {
    minimize: environment === 'production',
    usedExports: true,
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    realContentHash: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
          compress: {
            drop_debugger: true,
            drop_console: true,
          },
        },
        parallel: environment === 'production',
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      cacheGroups: {
        // React core: small, stable, long-cacheable — always its own chunk.
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
          name: 'vendor-react',
          priority: 50,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Heavy library groups. No `enforce` — if nothing in the graph
        // references them statically they simply don't emit. After the lazy
        // boundaries (editor, widgets, exports) these are async-only chunks
        // shared between editor and viewer widget loads.
        editors: {
          test: /[\\/]node_modules[\\/](@codemirror|@uiw[\\/]|draft-js|draft-js-export-html|draft-js-import-html|@mdxeditor)[\\/]/,
          name: 'vendor-editors',
          priority: 40,
          reuseExistingChunk: true,
        },
        plotly: {
          test: /[\\/]node_modules[\\/](plotly\.js|plotly\.js-dist-min|react-plotly\.js)[\\/]/,
          name: 'vendor-plotly',
          priority: 40,
          reuseExistingChunk: true,
        },
        pdf: {
          test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf|jspdf|jspdf-autotable)[\\/]/,
          name: 'vendor-pdf',
          priority: 40,
          reuseExistingChunk: true,
        },
        // papaparse deliberately NOT in this group — it's small and eagerly
        // used, and including it would promote the whole chunk to initial.
        excel: {
          test: /[\\/]node_modules[\\/](xlsx|read-excel-file|zipcelx)[\\/]/,
          name: 'vendor-excel',
          priority: 40,
          reuseExistingChunk: true,
        },
        // lucide's DynamicIcon references all ~1,800 icons via per-icon
        // dynamic import(). chunks:'async' merges those into ONE lazy chunk
        // fetched on first DynamicIcon render. Icons imported statically
        // (import { X } from 'lucide-react') don't match an async-only group
        // and tree-shake into normal vendor chunks instead. Do NOT widen this
        // to the whole package or make it initial — that's how 4.7MB of icons
        // ended up in the entry bundle.
        lucideIcons: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]dist[\\/]esm[\\/]icons[\\/]/,
          name: 'lucide-icons',
          chunks: 'async',
          priority: 30,
          reuseExistingChunk: true,
        },
        lucideReact: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/](?!dist[\\/]esm[\\/]icons[\\/])/,
          name: 'lucide-react',
          priority: 20,
          reuseExistingChunk: true,
        },
        // No fixed `name` here: a named catch-all with chunks:'all' would
        // merge the vendors of every async chunk into ONE chunk that the
        // entrypoint depends on (initial JS balloons to the union of all
        // vendors). Unnamed, webpack emits per-chunk-group vendor chunks —
        // shared/deduped between chunk groups but loaded only when needed.
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
      },
    },
  },
  target: 'web',
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.png',
      '.wasm',
      '.tar',
      '.data',
      '.svg',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.json',
    ],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@ee': path.resolve(__dirname, 'ee/'),
      '@cloud': path.resolve(__dirname, 'cloud/'),
      '@assets': path.resolve(__dirname, 'assets/'),
      '@white-label': path.resolve(__dirname, 'src/_helpers/white-label'),
    },
    fallback: {
      process: require.resolve('process/browser.js'),
      path: require.resolve('path-browserify'),
      util: require.resolve('util/'),
    },
  },
  // In development: fast inline maps.
  // In production with Sentry: hidden-source-map so Sentry can symbolicate errors
  //   (sentryWebpackPlugin uploads then deletes the .map files from the build dir).
  // In production without Sentry: skip map generation entirely — nothing consumes
  //   them and they push individual chunks past Cloudflare Pages' 25 MiB limit.
  devtool:
    environment === 'development'
      ? 'eval-source-map'
      : process.env.APM_VENDOR === 'sentry'
      ? 'hidden-source-map'
      : false,
  module: {
    rules: [
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
      {
        test: /\.wasm$/,
        use: ['file-loader'],
      },
      {
        test: /\.tar$/,
        use: ['file-loader'],
      },
      {
        test: /\.data$/,
        use: ['file-loader'],
      },
      {
        test: /\.svg$/,
        use: ({ resource }) => ({
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'prefixIds',
                  cleanupIDs: {
                    prefix: `svg-${hash(resource)}`,
                  },
                },
              ],
            },
          },
        }),
      },
      {
        test: /\.css$/,
        use: [
          environment === 'production' ? MiniCssExtractPlugin.loader : { loader: 'style-loader' },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          environment === 'production' ? MiniCssExtractPlugin.loader : { loader: 'style-loader' },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: ['global-builtin', 'import', 'color-functions'],
              },
            },
          },
        ],
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              isDevEnv && require.resolve('react-refresh/babel'),
              [
                'import',
                {
                  libraryName: 'lodash',
                  libraryDirectory: '',
                  camel2DashComponentName: false,
                },
                'lodash',
              ],
            ].filter(Boolean),
          },
        },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
    ],
  },
  plugins,
  devServer: {
    historyApiFallback: { index: ASSET_PATH },
    static: {
      directory: path.resolve(__dirname, 'assets'),
      publicPath: '/assets/',
    },
    client: {
      overlay: false,
    },
  },
  output: {
    filename: environment === 'production' ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: environment === 'production' ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    assetModuleFilename: 'assets/[contenthash:8][ext][query]',
    publicPath: ASSET_PATH,
    path: path.resolve(__dirname, 'build'),
    // chunkFilename: '[name].[contenthash].js',
    clean: true,
  },
  externals: {
    // global app config object
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
