import React from 'react';
import TextAreaComponent from './Index';

export default {
  title: 'Components/Textarea',
  component: TextAreaComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    'aria-label': {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    onChange: {
      control: 'function',
    },
    validation: {
      control: 'function',
    },
  },
};

const Template = (args) => <TextAreaComponent {...args} />;

export const RocketTextArea = Template.bind({});
RocketTextArea.args = {
  width: '',
  placeholder: 'Placeholder',
  label: '',
  helperText: '',
  name: 'name',
  id: 'id',
  'aria-label': 'aria-label',
  disabled: false,
  required: false,
  onChange: (e, validateObj) => {},
  validation: () => {},
};

export const RocketTextAreaWithLabel = (args) => <TextAreaComponent {...args} label="Label text" />;
RocketTextAreaWithLabel.args = {
  ...RocketTextArea.args,
};

export const RocketTextAreaWithLabelAndHelperText = (args) => (
  <TextAreaComponent {...args} label="Label text" helperText="Helper text" />
);
RocketTextAreaWithLabelAndHelperText.args = {
  ...RocketTextArea.args,
};
