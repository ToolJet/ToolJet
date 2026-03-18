import customWebpackConfig from "../webpack.config";
import path from "node:path";

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  staticDirs: ["../assets"],

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
    // Extract SCSS rule from custom config first (needed for .scss files)
    const scssRule = customWebpackConfig.module.rules.find((rule) =>
      rule.test?.toString().includes("scss")
    );

    // Filter out the babel-loader rule and CSS rules from custom config
    // SCSS rule is handled separately above
    const customRules = customWebpackConfig.module.rules.filter((rule) => {
      // Skip babel-loader rule
      if (rule.test?.toString().includes("js|jsx")) {
        return false; // Skip the babel-loader rule that includes react-refresh
      }
      // Skip CSS rules (not SCSS) - Storybook handles CSS, SCSS handled separately
      if (
        rule.test?.toString().includes("css") &&
        !rule.test?.toString().includes("scss")
      ) {
        return false;
      }
      // Skip SCSS rule as it's handled separately
      if (rule.test?.toString().includes("scss")) {
        return false;
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

    // Keep Storybook's default rules (including CSS handling)
    const storybookRules = storybookConfig.module.rules;

    // Build final rules: SCSS rule first (if exists), then Storybook rules, then custom rules, then babel
    const finalRules = [
      ...(scssRule ? [scssRule] : []),
      ...storybookRules,
      ...customRules,
      babelRule,
    ];

    return {
      ...storybookConfig,
      module: {
        ...storybookConfig.module,
        rules: finalRules,
      },
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          "@": path.resolve(__dirname, "../src/"),
          "@ee": path.resolve(__dirname, "../ee/"),
          "@cloud": path.resolve(__dirname, "../cloud/"),
          "@cloud/modules": path.resolve(
            __dirname,
            "../src/modules/emptyModule"
          ),
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
      externals: {
        ...storybookConfig.externals,
        // Add config as external to match main webpack config
        config: JSON.stringify({
          apiUrl: "http://localhost:3000/api",
          ENVIRONMENT: "development",
          SERVER_IP: process.env.SERVER_IP,
          COMMENT_FEATURE_ENABLE: true,
          TOOLJET_SERVER_URL: process.env.TOOLJET_SERVER_URL,
          ENABLE_MULTIPLAYER_EDITING: true,
          ENABLE_MARKETPLACE_DEV_MODE: process.env.ENABLE_MARKETPLACE_DEV_MODE,
          TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB:
            process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB || 5,
          TOOLJET_MARKETPLACE_URL:
            process.env.TOOLJET_MARKETPLACE_URL ||
            "https://tooljet-plugins-production.s3.us-east-2.amazonaws.com",
          TOOLJET_EDITION: process.env.TOOLJET_EDITION || "ce",
          ENABLE_WORKFLOW_SCHEDULING: process.env.ENABLE_WORKFLOW_SCHEDULING,
          WEBSITE_SIGNUP_URL:
            process.env.WEBSITE_SIGNUP_URL || "https://www.tooljet.ai/signup",
          TJ_SELFHOST_CREDITS_APP:
            process.env.TJ_SELFHOST_CREDITS_APP ||
            "https://app.tooljet.ai/applications/c1ec8a6c-ee9a-4a7d-ba9b-3590bbeaf6b9",
        }),
      },
    };
  },
};

export default config;
