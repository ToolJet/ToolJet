const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  target: 'electron-renderer',

  resolve: {
    alias: {
      Fixtures: path.resolve(__dirname, "fixtures"),
      Plugins: path.resolve(__dirname, "plugins"),
      Support: path.resolve(__dirname, "support"),
      Texts: path.resolve(__dirname, "constants/texts"),
      Selectors: path.resolve(__dirname, "constants/selectors"),
      Constants: path.resolve(__dirname, "constants")
    },
    extensions: [".js", ".json"],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "assert": false,
      "os": false,
      "http": false,
      "https": false,
      "zlib": false,
      "buffer": false,
      "process": false,
      "querystring": false,
      "url": false,
      "string_decoder": false,
      "timers": false,
      "console": false,
      "vm": false,
      "child_process": false,
      "net": false,
      "tls": false,
      "dns": false,
      "constants": false,
      "events": false
    },
    symlinks: false,
    mainFields: ["browser", "module", "main"],
    modules: [
      path.resolve(__dirname),
      "node_modules"
    ]
  },

  externals: [
    function({ request }, callback) {
      if (/^(pdf-parse|node-xlsx|pg)$/.test(request)) {
        return callback(null, 'commonjs2 ' + request);
      }
      callback();
    }
  ],

  optimization: {
    minimize: false,
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    concatenateModules: true,
    flagIncludedChunks: true,
    moduleIds: 'deterministic',
    usedExports: true,
    sideEffects: true,
    runtimeChunk: false
  },

  cache: {
    type: "filesystem",
    cacheDirectory: path.resolve(__dirname, ".webpack_cache"),
    compression: false,
    buildDependencies: {
      config: [__filename]
    },
    maxAge: 604800000,
    store: "pack",
    hashAlgorithm: "xxhash64",
    idleTimeout: 60000,
    idleTimeoutForInitialStore: 0,
    idleTimeoutAfterLargeChanges: 1000
  },

  module: {
    noParse: /node_modules\/(moment|lodash|jquery|rxjs)/,
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            cacheCompression: false,
            compact: false,
            presets: [
              ['@babel/preset-env', {
                targets: {
                  electron: '27',
                  chrome: '103'
                },
                modules: false,
                loose: true,
                useBuiltIns: false,
                exclude: [
                  'transform-async-to-generator',
                  'transform-regenerator'
                ]
              }]
            ]
          }
        }
      }
    ]
  },

  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    })
  ],

  devtool: "eval-cheap-module-source-map",

  stats: {
    all: false,
    errors: true,
    warnings: true,
    timings: true,
    builtAt: true
  },

  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },

  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: false
  },

  snapshot: {
    managedPaths: [path.resolve(__dirname, "../node_modules")],
    immutablePaths: [],
    buildDependencies: {
      timestamp: true,
      hash: true
    }
  },

  infrastructureLogging: {
    level: "error"
  }
};