module.exports = (on, config) => {
    if (config.testingType === 'component') {
      require('@cypress/react/plugins/react-scripts')(on, config)
    }
  
    return config
}
