import customWebpackConfig from '../webpack.config';
import path from 'path';

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
    "@storybook/addon-webpack5-compiler-swc",
    "@chromatic-com/storybook",
    "@storybook/addon-mdx-gfm"
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  docs: {},

  webpackFinal: async (storybookConfig) => {
    return {
      ...storybookConfig,
      module: { ...storybookConfig.module, rules: [...storybookConfig.module.rules, ...customWebpackConfig.module.rules] },
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          '@': path.resolve(__dirname, '../src/') 
        }
      }
    };
  },

  typescript: {
    reactDocgen: "react-docgen-typescript"
  }
};

export default config;
