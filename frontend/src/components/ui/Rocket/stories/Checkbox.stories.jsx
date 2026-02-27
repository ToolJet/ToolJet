import React from 'react';
import { Checkbox } from '../checkbox';

export default {
  title: 'UI/Rocket/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

const Template = (args) => <Checkbox {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Checked = Template.bind({});
Checked.args = {
  checked: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};









