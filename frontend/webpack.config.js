var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const API_URL = {
  production: process.env.TOOLJET_SERVER_URL,
  development: 'http://localhost:3000'
};

const ASSET_PATH = {
  production: 'https://app.tooljet.io/',
  development: '/public/'
};

module.exports = {
  mode: 'development',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.ttf$/,
        use: ['file-loader']
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.scss$/,
        use: [{
          loader: 'style-loader'
        }, {
          loader: 'css-loader'
        }, {
          loader: 'sass-loader'
        }]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.png'],
    alias: {
      '@': path.resolve(__dirname, 'src/')
    }
  },
  plugins: [new HtmlWebpackPlugin({
    template: './src/index.html'
  })],
  devServer: {
    historyApiFallback: true
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'build')
  },
  externals: {
    // global app config object
    config: JSON.stringify({
      apiUrl: API_URL[environment],
      assetPath: ASSET_PATH[environment],
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      SERVER_IP: process.env.SERVER_IP
    })
  }
};
