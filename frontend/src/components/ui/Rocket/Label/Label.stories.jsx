import React from 'react';
import { Label } from './Label';

export default {
  title: 'Rocket/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
    },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export const Default = {
  args: { children: 'Label text', size: 'default' },
};

export const Required = {
  args: { children: 'Label text', required: true },
};

export const Disabled = {
  args: { children: 'Label text', disabled: true },
};

export const DisabledRequired = {
  args: { children: 'Label text', disabled: true, required: true },
};

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {['large', 'default', 'small'].map((size) => (
        <div key={size} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-20 tw-text-xs tw-text-text-medium">{size}</span>
          <Label size={size}>Label text</Label>
          <Label size={size} required>
            Label text
          </Label>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

export const AllStates = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {[
        { label: 'Default', props: {} },
        { label: 'Required', props: { required: true } },
        { label: 'Disabled', props: { disabled: true } },
        { label: 'Disabled + Required', props: { disabled: true, required: true } },
      ].map(({ label, props }) => (
        <div key={label} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-40 tw-text-xs tw-text-text-medium">{label}</span>
          <Label {...props}>Label text</Label>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
