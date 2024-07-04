import React from 'react';
import FileUploaderComponent from './Index';

export default {
  title: 'Components/FileUploader',
  component: FileUploaderComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      options: ['single', 'multiple'],
      control: {
        type: 'select',
      },
    },
    width: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
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
    helperText: {
      control: 'text',
    },
    acceptedFormats: {
      control: 'text',
    },
    maxSize: {
      control: 'number',
    },
  },
};

const Template = (args) => <FileUploaderComponent {...args} />;

export const RocketFileUploader = Template.bind({});
RocketFileUploader.args = {
  type: 'single',
  width: '300px',
  name: '',
  id: '',
  disabled: false,
  label: 'Label text',
  'aria-label': '',
  required: false,
  helperText: 'This is a description',
  acceptedFormats: 'PNG, JPG, PDF',
  maxSize: 10,
};

export const RocketMultipleFileUploader = (args) => {
  return <FileUploaderComponent {...args} type="multiple" />;
};
RocketMultipleFileUploader.args = {
  ...RocketFileUploader.args,
};
