import customWebpackConfig from "../webpack.config";
import path from "path";

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-onboarding",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  webpackFinal: async (storybookConfig) => {
    // Filter out the babel-loader rule from custom config to avoid conflicts
    const customRules = customWebpackConfig.module.rules.filter((rule) => {
      if (rule.test && rule.test.toString().includes("js|jsx")) {
        return false; // Skip the babel-loader rule that includes react-refresh
      }
      return true;
    });

    // Add a custom babel-loader rule for JSX files without react-refresh
    const babelRule = {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
          plugins: [
            [
              "import",
              {
                libraryName: "lodash",
                libraryDirectory: "",
                camel2DashComponentName: false,
              },
              "lodash",
            ],
          ],
        },
      },
    };

    return {
      ...storybookConfig,
      module: {
        ...storybookConfig.module,
        rules: [...storybookConfig.module.rules, ...customRules, babelRule],
      },
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          "@": path.resolve(__dirname, "../src/"),
          "@ee": path.resolve(__dirname, "../ee/"),
          "@cloud": path.resolve(__dirname, "../cloud/"),
          "@assets": path.resolve(__dirname, "../assets/"),
          "@white-label": path.resolve(
            __dirname,
            "../src/_helpers/white-label"
          ),
        },
        fallback: {
          ...storybookConfig.resolve.fallback,
          process: require.resolve("process/browser.js"),
          path: require.resolve("path-browserify"),
        },
      },
    };
  },
};

export default config;
