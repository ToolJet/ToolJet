/** @type { import('@storybook/react-webpack5').Preview } */

import "../src/_styles/theme.scss";
import "./preview.scss";
import { withColorScheme, withRouter } from "./decorators"; // Import the decorators

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [withRouter, withColorScheme], // Adding the decorators to the decorators array
};

export default preview;
