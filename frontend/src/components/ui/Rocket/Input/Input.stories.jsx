import React from 'react';
import { Input } from './Input';

export default {
  title: 'Rocket/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
    },
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search'],
    },
  },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  args: { placeholder: 'Enter text...' },
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Input size="large" placeholder="Large" />
      <Input size="default" placeholder="Default" />
      <Input size="small" placeholder="Small" />
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── States ────────────────────────────────────────────────────────────────
export const States = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Input type="text" placeholder="Default" />
      <Input placeholder="Hover me" />
      <Input defaultValue="Focused" autoFocus />
      <Input placeholder="With error" aria-invalid="true" />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Error ────────────────────────────────────────────────────────────
export const WithError = {
  args: {
    placeholder: 'Invalid input',
    'aria-invalid': 'true',
    defaultValue: 'bad-email@',
  },
};

// ── Disabled ──────────────────────────────────────────────────────────────
export const Disabled = {
  args: {
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

// ── Types ─────────────────────────────────────────────────────────────────
export const Types = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="search" placeholder="Search" />
    </div>
  ),
  parameters: { layout: 'padded' },
};
