import React from 'react';
import SplitButton from '../_ui/SplitButton/SplitButton';

export default {
  title: 'Components/SplitButton',
  component: SplitButton,
  args: {
    children: 'Section name',
  },
  argTypes: {
    backgroundColor: { control: 'color' },
    onClick: {
      control: 'none',
    },
    className: {
      control: 'text',
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

const Template = (args) => <SplitButton {...args} />;

// 👇 Each story then reuses that template
export const Basic = Template.bind();
Basic.args = {
  name: 'New app',
  appname: 'Untitled app',
  className: 'dashboard-card',
};
