import React from 'react';
import { EmptyNoApps } from '../EmptyNoApps';

export default {
  title: 'AppsPage/EmptyNoApps',
  component: EmptyNoApps,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {},
};

export const InContainer = {
  args: {},
  decorators: [
    (Story) => (
      <div className="tw-flex tw-h-[400px] tw-w-[600px] tw-items-center tw-justify-center tw-bg-background-surface-layer-01">
        <Story />
      </div>
    ),
  ],
};
