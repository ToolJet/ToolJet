import React from 'react';
import { StatusDot } from './StatusDot';

const TONES = ['info', 'success', 'warning', 'danger', 'neutral'];

export default {
  title: 'Rocket/StatusDot',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    size: { control: 'select', options: ['default', 'small'] },
  },
};

export const Default = { args: { tone: 'info', size: 'default' } };

export const AllTones = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {TONES.map((tone) => (
        <div key={tone} className="tw-flex tw-items-center tw-gap-3 tw-font-body-default tw-text-text-default">
          <StatusDot tone={tone} />
          <StatusDot tone={tone} size="small" />
          {tone}
        </div>
      ))}
    </div>
  ),
};
