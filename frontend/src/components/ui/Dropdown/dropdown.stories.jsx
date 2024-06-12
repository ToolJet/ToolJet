import React from 'react';
import Dropdown from './index';

// Storybook configuration
export default {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    options: {
      control: 'object',
    },
    width: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: {
        type: 'select',
      },
    },
    disabled: {
      control: 'boolean',
    },
    onChange: {
      control: 'function',
    },
    validation: {
      control: 'function',
    },
    label: {
      control: 'text',
    },
    'aria-label': {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    leadingIcon: {
      control: 'boolean',
    },
    trailingAction: {
      options: ['icon', 'counter'],
      control: 'radio',
    },
    helperText: {
      control: 'text',
    },
  },
};

const Template = (args) => <Dropdown {...args} />;

export const RocketDropdown = Template.bind({});
RocketDropdown.args = {
  options: {
    'Option 1': 'Option 1',
    'Option 2': 'Option 2',
    'Option 3': 'Option 3',
  },
  width: '170px',
  placeholder: 'Select an option',
  name: 'dropdown',
  id: 'dropdown',
  size: 'medium',
  disabled: false,
  onChange: () => {},
  label: 'Dropdown',
  'aria-label': 'Dropdown',
  required: false,
  leadingIcon: false,
  trailingAction: '',
  helperText: '',
};

export const RocketDropdownWithLeadingIcon = (args) => <Dropdown {...args} leadingIcon={true} />;
RocketDropdownWithLeadingIcon.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithTrailingIcon = (args) => <Dropdown {...args} trailingAction="icon" />;
RocketDropdownWithTrailingIcon.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithTrailingCounter = (args) => <Dropdown {...args} trailingAction="counter" />;
RocketDropdownWithTrailingCounter.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithHelperText = (args) => <Dropdown {...args} helperText="This is a helper text" />;
RocketDropdownWithHelperText.args = {
  ...RocketDropdown.args,
};
