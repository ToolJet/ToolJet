import { name } from 'file-loader';
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

export const RocketTextArea = {};
