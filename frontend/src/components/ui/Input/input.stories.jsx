// eslint-disable-next-line no-unused-vars
import * as React from 'react';
import Input from './Index';

// Storybook configuration
export default {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      options: ['text', 'number', 'editable title', 'password', 'email'],
      control: {
        type: 'select',
      },
    },
    value: {
      control: 'text',
    },
    onChange: {
      control: 'function',
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
    readOnly: {
      if: { arg: 'disabled' },
      control: 'text',
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
      control: 'text',
    },
    trailingAction: {
      options: ['clear', 'loading'],
      control: 'radio',
    },
    trailingActionDisabled: {
      if: { arg: 'trailingAction', eq: 'clear' },
      control: 'boolean',
    },
    helperText: {
      control: 'text',
    },
  },
};

const Template = (args) => <Input {...args} />;

export const RocketInput = Template.bind({});
RocketInput.args = {
  type: 'text',
  placeholder: 'Placeholder',
  name: 'name',
  id: '#id',
  size: 'medium',
  label: 'Label text',
  'aria-label': 'aria-label',
};

export const RocketInputWithLeadingVisual = (args) => {
  return <Input {...args} leadingIcon="search" />;
};
RocketInputWithLeadingVisual.args = {
  ...RocketInput.args,
};

export const RocketInputWithTrailingAction = (args) => {
  return <Input {...args} trailingAction="clear" />;
};
RocketInputWithTrailingAction.args = {
  ...RocketInput.args,
};

export const RocketInputWithHelperText = (args) => {
  return <Input {...args} helperText="Helper text" />;
};
RocketInputWithHelperText.args = {
  ...RocketInput.args,
};

export const RocketNumberInput = (args) => {
  return <Input {...args} type="number" placeholder={'00.00'} />;
};
RocketNumberInput.args = {
  ...RocketInput.args,
};

export const RocketEditableTitleInput = (args) => {
  return <Input {...args} type="editable title" placeholder="Editable title" />;
};
RocketEditableTitleInput.args = {
  ...RocketInput.args,
};