import React from 'react';
import { Badge } from '../badge';

export default {
  title: 'UI/Rocket/Badge',
  component: Badge,
  tags: ['autodocs'],
};

const Template = (args) => <Badge {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Badge',
  variant: 'default',
};









