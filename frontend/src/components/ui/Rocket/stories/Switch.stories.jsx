import React from 'react';
import { Switch } from '../switch';

export default {
  title: 'UI/Rocket/Switch',
  component: Switch,
  tags: ['autodocs'],
};

const Template = (args) => <Switch {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Checked = Template.bind({});
Checked.args = {
  defaultChecked: true,
};







