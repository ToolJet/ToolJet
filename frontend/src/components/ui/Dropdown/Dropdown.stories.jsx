import React from 'react';
import DropdownComponent from './Index';

// Storybook configuration
export default {
  title: 'Components/Dropdown',
  component: DropdownComponent,
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

const Template = (args) => <DropdownComponent {...args} />;

export const RocketDropdown = Template.bind({});
RocketDropdown.args = {
  options: {
    'Option 1': {
      value: 'Option 1',
      avatarSrc: 'https://github.com/shadcn.png',
      avatarAlt: '@shadcn',
      avatarFall: 'fallback value',
    },
    'Option 2': {
      value: 'Option 2',
    },
    'Option 3': {
      value: 'Option 3',
    },
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

export const RocketDropdownWithLeadingIcon = (args) => <DropdownComponent {...args} leadingIcon={true} />;
RocketDropdownWithLeadingIcon.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithTrailingIcon = (args) => <DropdownComponent {...args} trailingAction="icon" />;
RocketDropdownWithTrailingIcon.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithTrailingCounter = (args) => <DropdownComponent {...args} trailingAction="counter" />;
RocketDropdownWithTrailingCounter.args = {
  ...RocketDropdown.args,
};

export const RocketDropdownWithHelperText = (args) => (
  <DropdownComponent {...args} helperText="This is a helper text" />
);
RocketDropdownWithHelperText.args = {
  ...RocketDropdown.args,
};
