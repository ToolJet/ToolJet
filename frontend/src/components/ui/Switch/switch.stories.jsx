import * as React from 'react';
import { Switch } from './switch';

// Storybook configuration
export default {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    helper: {
      control: 'text',
    },
    size: {
      options: ['default', 'large'],
      control: 'radio',
    },
    align: {
      options: ['left', 'right'],
      control: 'radio',
    },
    required: {
      control: 'boolean',
    },
  },
};

const Template = (args) => <Switch {...args} />;

export const RocketSwitch = Template.bind({});
RocketSwitch.args = {};

export const RocketSwitchWithLabel = (args) => {
  return <Switch {...args} label="Remember me" />;
};
RocketSwitchWithLabel.args = {
  ...RocketSwitch.args,
};

export const RocketSwitchWithLeadingLabel = (args) => {
  return <Switch {...args} label="Remember me" align="right" />;
};
RocketSwitchWithLeadingLabel.args = {
  ...RocketSwitch.args,
};

export const RocketSwitchWithLabelAndHelper = (args) => {
  return <Switch {...args} label="Remember me" helper="Save my login details for next time." />;
};
RocketSwitchWithLabelAndHelper.args = {
  ...RocketSwitch.args,
};

export const RocketSwitchWithLeadingLabelAndHelper = (args) => {
  return <Switch {...args} label="Remember me" helper="Save my login details for next time." align="right" />;
};
RocketSwitchWithLeadingLabelAndHelper.args = {
  ...RocketSwitch.args,
};
