import React from 'react';
import Toggle from '../_ui/Toggle';

export default {
  title: 'Components/Toggle',
  component: Toggle,
  argTypes: {
    disabled: { control: { type: 'boolean' } },
    checked: { control: { type: 'boolean' } },
    onChange: {
      control: 'none',
    },
    className: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
  },
};

const Template = (args) => <Toggle {...args} />;

// 👇 Each story then reuses that template
export const Default = Template.bind({});
Default.args = {};
