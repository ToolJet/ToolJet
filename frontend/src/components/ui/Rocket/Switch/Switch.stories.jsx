import React from 'react';
import { Switch } from './Switch';

export default {
  title: 'Rocket/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default (unchecked) ──────────────────────────────────────────────────
export const Default = {
  render: () => <Switch />,
};

// ── Checked ──────────────────────────────────────────────────────────────
export const Checked = {
  render: () => <Switch defaultChecked />,
};

// ── Disabled (unchecked) ─────────────────────────────────────────────────
export const DisabledUnchecked = {
  render: () => <Switch disabled />,
};

// ── Disabled (checked) ──────────────────────────────────────────────────
export const DisabledChecked = {
  render: () => <Switch defaultChecked disabled />,
};

// ── All States ──────────────────────────────────────────────────────────
export const AllStates = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <Switch />
        <span className="tw-text-sm tw-text-text-placeholder">Unchecked</span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <Switch defaultChecked />
        <span className="tw-text-sm tw-text-text-placeholder">Checked</span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <Switch disabled />
        <span className="tw-text-sm tw-text-text-placeholder">Disabled (unchecked)</span>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <Switch defaultChecked disabled />
        <span className="tw-text-sm tw-text-text-placeholder">Disabled (checked)</span>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};
