/** @type { import('@storybook/react-webpack5').StorybookConfig } */
import custom from '../webpack.config'
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
  webpackFinal: async (config) => {
    return {
      ...config,
      module: { ...config.module, rules: [...config.module.rules, ...custom.module.rules] },
    };
  },
};
export default config;
