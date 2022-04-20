var path = require("path");

module.exports = {
  resolve: {
    alias: {
      Fixtures: path.resolve(__dirname, "fixtures"),
      Plugins: path.resolve(__dirname, "plugins"),
      Support: path.resolve(__dirname, "support"),
      Texts: path.resolve(__dirname, "constants/texts"),
      Selectors: path.resolve(__dirname, "constants/selectors"),
      Constants: path.resolve(__dirname, "constants")
    },
  }
};