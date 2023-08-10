/** @type { import('@storybook/react').Preview } */
// import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/_styles/theme.scss';
import './preview.scss'

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
};

export default preview;
