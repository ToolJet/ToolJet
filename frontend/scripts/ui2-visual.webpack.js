// Builds the UI 2.0 visual gallery (src/AppBuilder/Widgets/Ui2/__tests__/visual/gallery.jsx) with the app's own webpack
// config: the same loaders, aliases and edition replacement, a different entry and page, no compression.
process.env.NODE_ENV = 'test'; // development mode without React Refresh (webpack.config.js reads NODE_ENV)
process.env.TOOLJET_EDITION = process.env.TOOLJET_EDITION || 'ce';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const base = require('../webpack.config');

module.exports = {
  ...base,
  mode: 'development',
  devtool: false,
  entry: path.resolve(__dirname, '../src/AppBuilder/Widgets/Ui2/__tests__/visual/gallery.jsx'),
  // The data source plugins are a sibling package CI does not build for the frontend; no widget needs them, so the
  // gallery takes the stand-in the jest config uses.
  resolve: {
    ...base.resolve,
    alias: {
      ...base.resolve.alias,
      '@tooljet/plugins/client$': path.resolve(__dirname, '../src/test/mocks/tooljetPluginsClient.js'),
    },
  },
  output: { ...base.output, path: path.resolve(__dirname, '../build/ui2-visual'), publicPath: '/' },
  optimization: { ...base.optimization, minimize: false, realContentHash: false },
  // Next to the output, not in node_modules/.cache (about 1 GB; node_modules may be shared between checkouts).
  cache: { type: 'filesystem', cacheDirectory: path.resolve(__dirname, '../build/.ui2-visual-cache') },
  plugins: [
    ...base.plugins.filter((p) => !(p instanceof HtmlWebpackPlugin) && !(p instanceof CompressionPlugin)),
    new HtmlWebpackPlugin({
      templateContent: `<!doctype html><html><head><meta charset="utf-8"><title>UI 2.0 gallery</title>
<style>
  /* the app's stylesheet sets the body's background too; the widgets' surfaces show this one */
  body { margin: 0; padding: 16px; background: var(--cc-surface1-surface, #fff) !important; }
  /* rows keep their own width, so a row's screenshot does not depend on which other rows are on the page */
  .ui2-gallery { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; width: max-content; }
  .ui2-gallery-row { display: flex; gap: 12px; padding: 8px; }
  .ui2-gallery-slot { position: relative; overflow: hidden; flex: none; }
</style></head><body><div id="root"></div></body></html>`,
    }),
  ],
  devServer: undefined,
};
