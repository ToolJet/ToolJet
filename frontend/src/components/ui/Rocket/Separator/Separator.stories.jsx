import React from 'react';
import { Separator } from './Separator';

export default {
  title: 'Rocket/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
};

export const Horizontal = {
  render: (args) => (
    <div className="tw-w-64">
      <Separator {...args} />
    </div>
  ),
  args: { orientation: 'horizontal' },
};

export const Vertical = {
  render: (args) => (
    <div className="tw-flex tw-h-4 tw-items-center tw-gap-2">
      <span>Left</span>
      <Separator {...args} />
      <span>Right</span>
    </div>
  ),
  args: { orientation: 'vertical' },
};
