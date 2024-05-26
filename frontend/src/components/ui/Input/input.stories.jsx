// eslint-disable-next-line no-unused-vars
import * as React from 'react';
import { Input } from './input';

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
      action: 'changed',
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
    validationText: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    'aira-label': {
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

export const RocketInput = {};
