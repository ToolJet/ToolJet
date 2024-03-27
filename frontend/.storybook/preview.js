/** @type { import('@storybook/react').Preview } */

import '../src/_styles/theme.scss';
import './preview.scss';
import { withColorScheme } from './decorators'; // Import the decorator

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
  decorators: [withColorScheme], // Adding the decorator to the decorators array
};

export default preview;
