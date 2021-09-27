var HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const API_URL = {
  production: process.env.TOOLJET_SERVER_URL || '',
  development: 'http://localhost:3000',
};

const ASSET_PATH = {
  production: 'https://app.tooljet.io/',
  development: '/public/',
};

module.exports = {
  mode: 'development',
  resolve: {
    extensions: ['.js', '.jsx', '.png'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@ee': path.resolve(__dirname, 'ee/'),
    },
  },
  ...(environment === 'development' && { devtool: 'inline-source-map' }),
  module: {
    rules: [
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              limit: 10000,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
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
              ['import', { libraryName: 'lodash', libraryDirectory: '', camel2DashComponentName: false }, 'lodash'],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /(en)$/),
  ],
  devServer: {
    historyApiFallback: true,
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'build'),
  },
  externals: {
    // global app config object
    config: JSON.stringify({
      apiUrl: `${API_URL[environment] || ''}/api`,
      assetPath: ASSET_PATH[environment],
      SERVER_IP: process.env.SERVER_IP,
      ssoGoogleOauth2ClientId: process.env.SSO_GOOGLE_OAUTH2_CLIENT_ID ?? '',
    }),
  },
};
