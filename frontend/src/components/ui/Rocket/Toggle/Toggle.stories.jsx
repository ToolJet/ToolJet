import React from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Toggle } from './Toggle';

export default {
  title: 'Rocket/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'outline'],
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'medium', 'small'],
    },
    disabled: { control: 'boolean' },
  },
};

// ── Default (icon only) ───────────────────────────────────────────────────
export const Default = {
  args: { children: <Bold size={14} />, 'aria-label': 'Toggle bold' },
};

// ── With text ─────────────────────────────────────────────────────────────
export const WithText = {
  args: { children: 'Bold', 'aria-label': 'Toggle bold' },
};

// ── Outline variant ───────────────────────────────────────────────────────
export const Outline = {
  args: { variant: 'outline', children: <Italic size={14} />, 'aria-label': 'Toggle italic' },
};

// ── Disabled ──────────────────────────────────────────────────────────────
export const Disabled = {
  args: { disabled: true, children: <Bold size={14} />, 'aria-label': 'Toggle bold' },
};

// ── Pressed ───────────────────────────────────────────────────────────────
export const Pressed = {
  args: { defaultPressed: true, children: <Bold size={14} />, 'aria-label': 'Toggle bold' },
};

// ── Composite: variants ───────────────────────────────────────────────────
export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      {['ghost', 'outline'].map((variant) => (
        <div key={variant} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-20 tw-text-sm tw-text-text-medium">{variant}</span>
          <Toggle variant={variant} aria-label="Bold"><Bold size={14} /></Toggle>
          <Toggle variant={variant} defaultPressed aria-label="Italic"><Italic size={14} /></Toggle>
          <Toggle variant={variant} disabled aria-label="Underline"><Underline size={14} /></Toggle>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: sizes ──────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      {['large', 'default', 'medium', 'small'].map((size) => (
        <div key={size} className="tw-flex tw-flex-col tw-items-center tw-gap-1">
          <Toggle size={size} aria-label="Bold">
            <Bold size={size === 'small' || size === 'medium' ? 12 : 14} />
          </Toggle>
          <span className="tw-text-xs tw-text-text-medium">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
