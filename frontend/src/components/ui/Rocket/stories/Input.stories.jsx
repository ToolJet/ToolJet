import React from 'react';
import { Input } from '../input';

export default {
  title: 'UI/Rocket/Input',
  component: Input,
  tags: ['autodocs'],
};

const Template = (args) => <Input {...args} />;

export const Default = Template.bind({});
Default.args = {
  placeholder: 'Enter text...',
  type: 'text',
};

export const WithValue = Template.bind({});
WithValue.args = {
  defaultValue: 'Hello World',
  type: 'text',
};





