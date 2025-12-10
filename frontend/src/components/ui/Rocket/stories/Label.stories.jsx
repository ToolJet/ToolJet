import React from 'react';
import { Label } from '../label';

export default {
  title: 'UI/Rocket/Label',
  component: Label,
  tags: ['autodocs'],
};

const Template = (args) => <Label {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Label',
  htmlFor: 'input-id',
};









