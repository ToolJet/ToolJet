import React from 'react';
import AppInput from '@/_ui/AppInput/AppInput';

export default {
  title: 'Components/AppInput',
  component: AppInput,
  args: {},
  argTypes: {
    value: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    currentState: {
      type: 'select',
      options: ['none', 'valid'],
    },
    errorMessage: {
      control: 'text',
    },
    type: {
      type: 'select',
      options: ['input', 'textarea'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

const Template = (args) => <AppInput {...args} />;
export const Basic = Template.bind({});
Basic.args = {
  value: 'Edited 14 days ago by kiran ashok',
  label: 'Label',
  className: '',
  placeholder: 'Text input',
  errorMessage: 'Launch',
  currentState: 'valid',
  type: 'input',
  disabled: false,
};
