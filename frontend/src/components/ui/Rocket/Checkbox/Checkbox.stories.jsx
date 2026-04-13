import React from 'react';
import { Checkbox } from './Checkbox';

export default {
  title: 'Rocket/Checkbox',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => <Checkbox />,
};

export const Checked = {
  render: () => <Checkbox defaultChecked />,
};

export const Indeterminate = {
  render: () => <Checkbox checked="indeterminate" />,
};

export const Disabled = {
  render: () => (
    <div className="tw-flex tw-gap-3">
      <Checkbox disabled />
      <Checkbox disabled defaultChecked />
      <Checkbox disabled checked="indeterminate" />
    </div>
  ),
};

// ── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-4">
      <Checkbox size="default" defaultChecked />
      <Checkbox size="large" defaultChecked />
    </div>
  ),
};

// ── With Label ──────────────────────────────────────────────────────────────

export const WithLabel = {
  render: () => (
    <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-font-body-default tw-text-text-default">
      <Checkbox />
      <span>Accept terms and conditions</span>
    </label>
  ),
};

// ── All States ──────────────────────────────────────────────────────────────

export const AllStates = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Unchecked</span>
        <Checkbox />
        <Checkbox size="large" />
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Checked</span>
        <Checkbox defaultChecked />
        <Checkbox size="large" defaultChecked />
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Indeterminate</span>
        <Checkbox checked="indeterminate" />
        <Checkbox size="large" checked="indeterminate" />
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Disabled</span>
        <Checkbox disabled />
        <Checkbox size="large" disabled />
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Disabled checked</span>
        <Checkbox disabled defaultChecked />
        <Checkbox size="large" disabled defaultChecked />
      </div>
    </div>
  ),
};
