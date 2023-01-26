// Button.stories.js|jsx

import React from 'react';
import AppCard from '../_ui/AppCard/AppCard';

export default {
  title: 'Components/Card',
  component: AppCard,
  args: {},
  argTypes: {
    editTime: {
      control: 'text',
    },
    appname: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
};

const Template = (args) => <AppCard {...args} />;
export const Primary = Template.bind({});
Primary.args = {
  editTime: 'Storybook Error: Couldnt find story matching components-button--page',
  appname: 'Storybook Error: Couldnt find story matching components-button--page',
};
