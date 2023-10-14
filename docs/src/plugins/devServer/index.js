module.exports = function (context, options) {
  return {
    name: 'dev-server-plugin',
    configureWebpack(config, isServer, utils) {
      // Check if it's the development server (isServer) or the production build
      if (isServer) {
        // Configuration for the development server
        return {
          devServer: {
            // Open a specific page when the server starts (e.g., '/docs')
            open: '/docs',
          },
        };
      }
      // For the production build, you can configure other options here if needed
    },
  };
};
