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
      // chunks: 'all',
      // maxInitialRequests: 10, // Reduced from 25 - limits initial load chunks
      // maxAsyncRequests: 10,   // Limits async chunks (lazy loaded)
      // minSize: 50000,         // Increased from 20KB - only split if >50KB
      // maxSize: 1244000,        // Max chunk size ~244KB (helps with parallel downloads)
      cacheGroups: {
        // CRITICAL: React core - always loaded (enforce: true means always split)
        // react: {
        //   test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
        //   name: 'vendor-react',
        //   priority: 50,
        //   reuseExistingChunk: true,
        //   enforce: true, // Always split React, even if small
        // },

        // // HEAVY EDITORS GROUP - Split these out as they're HUGE and editor-only
        // // ~2MB+ combined, almost never needed on viewer pages
        // editors: {
        //   test: /[\\/]node_modules[\\/](@codemirror|@uiw\/react-codemirror|@uiw\/codemirror-theme-github|@uiw\/codemirror-theme-okaidia|draft-js|draft-js-export-html|draft-js-import-html|@mdxeditor)[\\/]/,
        //   name: 'vendor-editors',
        //   priority: 40,
        //   reuseExistingChunk: true,
        //   enforce: true, // Always split - too large
        // },

        // // CHARTS - Plotly is MASSIVE (~3MB), split separately
        // plotly: {
        //   test: /[\\/]node_modules[\\/](plotly\.js|plotly\.js-dist-min|react-plotly\.js)[\\/]/,
        //   name: 'vendor-plotly',
        //   priority: 40,
        //   reuseExistingChunk: true,
        //   enforce: true, // Always split - very large
        // },

        // // PDF - Large libraries, only for PDF features
        // pdf: {
        //   test: /[\\/]node_modules[\\/](pdfjs-dist|react-pdf|jspdf|jspdf-autotable)[\\/]/,
        //   name: 'vendor-pdf',
        //   priority: 40,
        //   reuseExistingChunk: true,
        //   enforce: true, // Always split - large
        // },

        // // EXCEL - XLSX is huge (~1MB), only for spreadsheet features
        // excel: {
        //   test: /[\\/]node_modules[\\/](xlsx|read-excel-file|papaparse|zipcelx)[\\/]/,
        //   name: 'vendor-excel',
        //   priority: 40,
        //   reuseExistingChunk: true,
        //   enforce: true, // Always split - large
        // },

        // // UI FRAMEWORK - Combine related UI libraries to reduce requests
        // // Radix + Bootstrap + DnD + Forms together
        // uiFramework: {
        //   test: /[\\/]node_modules[\\/](@radix-ui|bootstrap|react-bootstrap|@dnd-kit|react-dnd|react-dnd-html5-backend|react-beautiful-dnd|react-select|react-select-search|react-multi-select-component|react-color|rc-slider)[\\/]/,
        //   name: 'vendor-ui',
        //   priority: 35,
        //   reuseExistingChunk: true,
        // },

        // // DATA VISUALIZATION - Tables + ReactFlow + Maps (used together often)
        // dataViz: {
        //   test: /[\\/]node_modules[\\/](react-table|react-table-plugins|@tanstack\/react-table|@tanstack\/react-virtual|react-virtuoso|reactflow|react-zoom-pan-pinch|@react-google-maps)[\\/]/,
        //   name: 'vendor-dataviz',
        //   priority: 35,
        //   reuseExistingChunk: true,
        // },

        // // UTILITIES & COMMON - Lodash, Axios, Moment, etc. (frequently used together)
        // // Combine small utility libraries to reduce HTTP requests
        // common: {
        //   test: /[\\/]node_modules[\\/](lodash|axios|classnames|clsx|moment|moment-timezone|humps|uuid|semver|fuse\.js|dompurify|superstruct|rfdc|flatted|zustand|immer|rxjs|i18next|react-i18next|i18next-http-backend)[\\/]/,
        //   name: 'vendor-common',
        //   priority: 30,
        //   reuseExistingChunk: true,
        // },

        // // FEATURES - Combine feature-specific libraries
        // // Date pickers, phone inputs, markdown, icons, monitoring
        // features: {
        //   test: /[\\/]node_modules[\\/](react-datepicker|react-datetime|react-dates|@wojtekmaj|react-big-calendar|react-currency-input-field|react-phone-input-2|react-phone-number-input|react-mentions|react-markdown|rehype-raw|remark-gfm|react-syntax-highlighter|@tabler\/icons-react|lucide-react|emoji-mart|@emoji-mart|@sentry|posthog-js|yjs|y-websocket|@y-presence|react-moveable|react-rnd|react-selecto)[\\/]/,
        //   name: 'vendor-features',
        //   priority: 25,
        //   reuseExistingChunk: true,
        // },

        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: -10,
          reuseExistingChunk: true,
          chunks: 'initial',
        },
        lucideReact: {
          test: /[\\/]node_modules[\\/]lucide-react/,
          name: 'lucide-react',
          priority: 20, // Higher priority than vendors
          reuseExistingChunk: true,
        },
      },
    },
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.jsx', '.png', '.wasm', '.tar', '.data', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.json'],
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
      '@ee/modules': emptyModulePath,
      '@cloud/modules': emptyModulePath,
    },
  },
  devtool: environment === 'development' ? 'eval-source-map' : 'hidden-source-map',
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
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.js', '.jsx'],
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
