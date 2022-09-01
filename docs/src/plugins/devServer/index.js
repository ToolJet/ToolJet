module.exports = function (context, options) {
    return {
      name: 'dev-server-plugin',
      configureWebpack(config, isServer, utils) {
        return {
          devServer: {
            open: '/docs',
          },
        };
      },
    };
  };
