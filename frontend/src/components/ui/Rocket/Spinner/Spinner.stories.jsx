import React from 'react';
import { Spinner } from './Spinner';
import { Button } from '../Button/Button';

export default {
  title: 'Rocket/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
    },
  },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  args: {},
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-4 tw-p-4">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
        <Spinner size="large" />
        <span className="tw-text-xs tw-text-text-placeholder">Large</span>
      </div>
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
        <Spinner size="default" />
        <span className="tw-text-xs tw-text-text-placeholder">Default</span>
      </div>
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
        <Spinner size="small" />
        <span className="tw-text-xs tw-text-text-placeholder">Small</span>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Custom Color ─────────────────────────────────────────────────────────
export const CustomColor = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-4 tw-p-4">
      <Spinner className="tw-text-icon-default" />
      <Spinner className="tw-text-text-brand" />
      <Spinner className="tw-text-icon-danger" />
      <Spinner className="tw-text-white" />
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Inline with Text ─────────────────────────────────────────────────────
export const InlineWithText = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-text-default tw-text-sm">
        <Spinner size="small" />
        <span>Loading data...</span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-text-placeholder tw-text-sm">
        <Spinner size="small" className="tw-text-text-placeholder" />
        <span>Saving changes...</span>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── In Button ────────────────────────────────────────────────────────────
export const InButton = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3 tw-p-4">
      <Button disabled>
        <Spinner size="small" className="tw-text-current" />
        Saving...
      </Button>
      <Button variant="outline" disabled>
        <Spinner size="small" className="tw-text-current" />
        Loading...
      </Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};
