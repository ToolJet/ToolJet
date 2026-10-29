import React, { useState } from 'react';
import { TruncatingText } from './TruncatingText';

export default {
  title: 'Rocket/TruncatingText',
  component: TruncatingText,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const LONG = 'getProductsThatIsReallyLongToFitInaDropdownAndWillDefinitelyOverflow';
const SHORT = 'getProducts';

// Hover behavior across stories: when text is truncated, the browser shows
// a native OS tooltip after ~500ms. Short text shows no tooltip on hover.

// ── Short text — no title attribute set ─────────────────────────────────
export const ShortText = {
  render: () => (
    <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
      <TruncatingText text={SHORT} />
    </div>
  ),
};

// ── Long text — title set, native tooltip on hover ──────────────────────
export const LongText = {
  render: () => (
    <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
      <TruncatingText text={LONG} />
    </div>
  ),
};

// ── Side-by-side comparison ─────────────────────────────────────────────
export const Comparison = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
        <div className="tw-mb-1 tw-text-xs tw-text-text-placeholder">Short (no title)</div>
        <TruncatingText text={SHORT} />
      </div>
      <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
        <div className="tw-mb-1 tw-text-xs tw-text-text-placeholder">Long (hover for native tooltip)</div>
        <TruncatingText text={LONG} />
      </div>
    </div>
  ),
};

// ── Resizable — drag edge to toggle title attribute live ────────────────
export const Resizable = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-text-xs tw-text-text-placeholder">
        Drag the right edge to resize. Inspect the span — `title` should appear/disappear as truncation toggles.
      </div>
      <div
        className="tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3"
        style={{ width: 320, resize: 'horizontal', overflow: 'auto', minWidth: 80, maxWidth: 600 }}
      >
        <TruncatingText text={LONG} />
      </div>
    </div>
  ),
};

// ── In a flex row (min-w-0 required on flex child) ──────────────────────
export const InFlexRow = {
  render: () => (
    <div className="tw-w-[280px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-h-4 tw-w-4 tw-rounded-full tw-bg-interactive-hover tw-shrink-0" />
        <TruncatingText text={LONG} className="tw-min-w-0 tw-flex-1" />
        <button
          type="button"
          className="tw-shrink-0 tw-rounded tw-bg-button-primary tw-px-2 tw-py-1 tw-text-xs tw-text-text-on-solid"
        >
          Run
        </button>
      </div>
    </div>
  ),
};

// ── Content change triggers re-measure ──────────────────────────────────
export const ToggleContent = {
  render: () => {
    const [isLong, setIsLong] = useState(true);
    return (
      <div className="tw-flex tw-flex-col tw-gap-3">
        <button
          type="button"
          onClick={() => setIsLong((v) => !v)}
          className="tw-self-start tw-rounded tw-bg-button-primary tw-px-3 tw-py-1 tw-text-xs tw-text-text-on-solid"
        >
          Toggle text
        </button>
        <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
          <TruncatingText text={isLong ? LONG : SHORT} />
        </div>
      </div>
    );
  },
};

// ── Manual title override (for non-string children) ─────────────────────
export const ManualTitleOverride = {
  render: () => (
    <div className="tw-w-[240px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
      <TruncatingText title={LONG}>
        <strong>{LONG}</strong>
      </TruncatingText>
    </div>
  ),
};
