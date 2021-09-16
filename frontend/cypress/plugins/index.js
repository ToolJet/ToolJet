// const webpackPreprocessor = require('@cypress/webpack-preprocessor')

module.exports = (on, config) => {
  if (config.testingType === 'component') {
    const { startDevServer } = require('@cypress/webpack-dev-server')

    // Your project's Webpack configuration
    const webpackConfig = require('../../webpack.config.js')

    on('dev-server:start', (options) =>
      startDevServer({ options, webpackConfig })
    )
  }

  return config
}