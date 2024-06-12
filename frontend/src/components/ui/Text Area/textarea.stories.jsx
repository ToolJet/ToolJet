import React from 'react';
import TextArea from './index';

export default {
  title: 'Components/Textarea',
  component: TextArea,
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

const Template = (args) => <TextArea {...args} />;

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
  onChange: () => {},
  validation: () => {},
};

export const RocketTextAreaWithLabel = (args) => <TextArea {...args} label="Label text" />;
RocketTextAreaWithLabel.args = {
  ...RocketTextArea.args,
};

export const RocketTextAreaWithLabelAndHelperText = (args) => (
  <TextArea {...args} label="Label text" helperText="Helper text" />
);
RocketTextAreaWithLabelAndHelperText.args = {
  ...RocketTextArea.args,
};