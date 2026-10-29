import React from 'react';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

export default {
  title: 'Rocket/RadioGroup',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <RadioGroupItem value="option-1" />
      <RadioGroupItem value="option-2" />
      <RadioGroupItem value="option-3" />
    </RadioGroup>
  ),
};

// ── With Labels ─────────────────────────────────────────────────────────────

export const WithLabels = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-font-body-default tw-text-text-default">
        <RadioGroupItem value="default" />
        <span>Default density</span>
      </label>
      <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-font-body-default tw-text-text-default">
        <RadioGroupItem value="comfortable" />
        <span>Comfortable density</span>
      </label>
      <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-font-body-default tw-text-text-default">
        <RadioGroupItem value="compact" />
        <span>Compact density</span>
      </label>
    </RadioGroup>
  ),
};

// ── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-4">
      <RadioGroup defaultValue="a">
        <RadioGroupItem value="a" size="default" />
      </RadioGroup>
      <RadioGroup defaultValue="b">
        <RadioGroupItem value="b" size="large" />
      </RadioGroup>
    </div>
  ),
};

// ── Disabled ────────────────────────────────────────────────────────────────

export const Disabled = {
  render: () => (
    <RadioGroup defaultValue="option-2" disabled>
      <label className="tw-flex tw-items-center tw-gap-2 tw-font-body-default tw-text-text-default">
        <RadioGroupItem value="option-1" />
        <span>Option 1</span>
      </label>
      <label className="tw-flex tw-items-center tw-gap-2 tw-font-body-default tw-text-text-default">
        <RadioGroupItem value="option-2" />
        <span>Option 2 (selected)</span>
      </label>
    </RadioGroup>
  ),
};

// ── All States ──────────────────────────────────────────────────────────────

export const AllStates = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Unchecked</span>
        <RadioGroup>
          <div className="tw-flex tw-items-center tw-gap-3">
            <RadioGroupItem value="a" />
            <RadioGroupItem value="a" size="large" />
          </div>
        </RadioGroup>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Checked</span>
        <RadioGroup defaultValue="a">
          <div className="tw-flex tw-items-center tw-gap-3">
            <RadioGroupItem value="a" />
            <RadioGroupItem value="a" size="large" />
          </div>
        </RadioGroup>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Disabled</span>
        <RadioGroup disabled>
          <div className="tw-flex tw-items-center tw-gap-3">
            <RadioGroupItem value="a" />
            <RadioGroupItem value="a" size="large" />
          </div>
        </RadioGroup>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-32 tw-font-body-default tw-text-text-default">Disabled checked</span>
        <RadioGroup defaultValue="a" disabled>
          <div className="tw-flex tw-items-center tw-gap-3">
            <RadioGroupItem value="a" />
            <RadioGroupItem value="a" size="large" />
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};
