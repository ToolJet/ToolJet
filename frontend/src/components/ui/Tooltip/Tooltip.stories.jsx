import Tooltip from './Tooltip';

// Storybook configuration
export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    tooltipLabel: {
      control: 'text',
    },
    supportingText: {
      control: 'text',
    },
    theme: {
      options: ['light', 'dark'],
      control: {
        type: 'select',
      },
    },
    arrow: {
      options: ['Bottom Center', 'Bottom Left', 'Bottom Right', 'Top Center', 'Left', 'Right'],
      control: {
        type: 'select',
      },
    },
    children: {
      control: 'text',
    },
    width: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
};

export const RocketTooltip = {};
