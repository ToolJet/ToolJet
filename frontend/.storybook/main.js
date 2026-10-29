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
    // Filter out the babel-loader rule from custom config to avoid conflicts.
    // Also replace MiniCssExtractPlugin.loader with style-loader: Storybook
    // doesn't include the MiniCssExtractPlugin in its webpack plugins, so the
    // loader throws when NODE_ENV=production (e.g. during build-storybook).
    const customRules = customWebpackConfig.module.rules
      .filter((rule) => {
        if (rule.test && rule.test.toString().includes("js|jsx")) {
          return false; // Skip babel-loader rule that includes react-refresh
        }
        return true;
      })
      .map((rule) => {
        if (!rule.use) return rule;
        const use = Array.isArray(rule.use) ? rule.use : [rule.use];
        const isMiniCssEntry = (u) => {
          if (typeof u === "string") return u.includes("mini-css-extract-plugin");
          if (typeof u === "object" && u !== null) {
            return (u.loader ?? "").includes("mini-css-extract-plugin");
          }
          return false;
        };
        if (!use.some(isMiniCssEntry)) return rule;
        return {
          ...rule,
          use: use.map((u) => (isMiniCssEntry(u) ? { loader: "style-loader" } : u)),
        };
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
