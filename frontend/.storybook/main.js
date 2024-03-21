import customWebpackConfig from '../webpack.config';
import path from 'path';

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  webpackFinal: async (storybookConfig) => {
    return {
      ...storybookConfig,
      module: { ...storybookConfig.module, rules: [...storybookConfig.module.rules, ...customWebpackConfig.module.rules] },
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          '@': path.resolve(__dirname, '../src/') // Adjust the path to your src folder
        }
      }
    };
  },
};

export default config;
