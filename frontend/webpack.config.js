const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
require('dotenv').config({ path: '../.env' });
const hash = require('string-hash');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const fs = require('fs');
const versionPath = path.resolve(__dirname, '.version');
const version = fs.readFileSync(versionPath, 'utf-8').trim();
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const edition = process.env.TOOLJET_EDITION;
const isDevEnv = process.env.NODE_ENV === 'development';

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
    hash: environment === 'production',
    // Inject memory leak detector early
    templateParameters: {
      memoryLeakDetectorScript: environment === 'development' ?
        '<script>console.log("Memory leak detection will be initialized...");</script>' : ''
    }
  }),
  new CompressionPlugin({
    test: /\.js(\?.*)?$/i,
    algorithm: 'gzip',
    threshold: 8192, // Only compress files larger than 8KB
    minRatio: 0.8, // Only compress if compression ratio is better than 80%
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

module.exports = {
  mode: environment,
  optimization: {
    minimize: environment === 'production',
    usedExports: true,
    runtimeChunk: 'single',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
          compress: {
            drop_debugger: true,
            drop_console: environment === 'production',
          },
        },
        parallel: environment === 'production' ? 2 : false, // Limit parallel workers to reduce memory
      }),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        // Core React libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 40,
        },
        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](antd|@ant-design|react-bootstrap|@mui)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 30,
        },
        // Code editors (these are huge)
        editors: {
          test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor|codemirror|@codemirror)[\\/]/,
          name: 'editors',
          chunks: 'all',
          priority: 35,
        },
        // Charts and visualization
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|d3|plotly|@nivo|recharts)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 25,
        },
        // Utility libraries
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|date-fns|rxjs)[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 20,
        },
        // Default vendor chunk for everything else
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
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
      '@ee/modules': emptyModulePath,
      '@cloud/modules': emptyModulePath,
    },
  },
  devtool: environment === 'development' ? 'eval-cheap-module-source-map' : 'hidden-source-map', // Faster, less memory-intensive source maps
  // Performance optimization for memory usage
  performance: {
    hints: environment === 'production' ? 'warning' : false,
    maxEntrypointSize: 5000000, // 5MB
    maxAssetSize: 3000000, // 3MB
  },
  // Webpack dev server optimization
  ...(environment === 'development' && {
    devServer: {
      historyApiFallback: { index: ASSET_PATH },
      static: {
        directory: path.resolve(__dirname, 'assets'),
        publicPath: '/assets/',
      },
      // Memory optimization for dev server
      hot: true,
      liveReload: false, // Disable to reduce memory usage
      // Reduce watch options to minimize memory usage
      watchFiles: {
        paths: ['src/**/*'],
        options: {
          poll: false, // Use native file watching
          ignored: /node_modules/,
          aggregateTimeout: 300,
        },
      },
      // Limit dev middleware memory usage
      devMiddleware: {
        writeToDisk: false,
        stats: 'minimal',
      },
      client: {
        overlay: false, // Disable overlay to reduce memory
      },
    },
  }),
  // Cache configuration for faster rebuilds
  cache: environment === 'development' ? {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    maxMemoryGenerations: 1, // Limit memory usage
  } : false,
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
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
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
              ['import', { libraryName: 'lodash', libraryDirectory: '', camel2DashComponentName: false }, 'lodash'],
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
  output: {
    publicPath: ASSET_PATH,
    path: path.resolve(__dirname, 'build'),
    // Memory optimization
    clean: environment === 'production', // Only clean in production
    pathinfo: false, // Reduce memory usage in development
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
    }),
  },
};
