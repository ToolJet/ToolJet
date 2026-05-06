import React from 'react';
import { Plus, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from './Button';

export default {
  title: 'Rocket/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'ghostBrand', 'outline'],
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'medium', 'small'],
    },
    danger: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

// ── One story per variant ──────────────────────────────────────────────────
export const Primary = { args: { children: 'Button', variant: 'primary' } };
export const Secondary = { args: { children: 'Button', variant: 'secondary' } };
export const Ghost = { args: { children: 'Button', variant: 'ghost' } };
export const GhostBrand = { args: { children: 'Button', variant: 'ghostBrand' } };
export const Outline = { args: { children: 'Button', variant: 'outline' } };

// ── Danger modifier ────────────────────────────────────────────────────────
export const DangerPrimary = { args: { children: 'Delete', variant: 'primary', danger: true } };
export const DangerSecondary = { args: { children: 'Delete', variant: 'secondary', danger: true } };

// ── States ─────────────────────────────────────────────────────────────────
export const Disabled = { args: { children: 'Button', variant: 'primary', disabled: true } };
export const Loading = { args: { children: 'Button', variant: 'primary', loading: true } };

// ── Icon slots ─────────────────────────────────────────────────────────────
export const WithLeadingIcon = {
  args: {
    children: 'Add item',
    variant: 'primary',
    leadingVisual: <Plus size={14} />,
  },
};
export const WithTrailingIcon = {
  args: {
    children: 'Continue',
    variant: 'secondary',
    trailingVisual: <ArrowRight size={14} />,
  },
};

// ── Composite: all variants ────────────────────────────────────────────────
export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      {['primary', 'secondary', 'ghost', 'ghostBrand', 'outline'].map((variant) => (
        <div key={variant} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-28 tw-text-sm tw-text-text-medium">{variant}</span>
          <Button variant={variant}>Default</Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Loading
          </Button>
        </div>
      ))}
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-28 tw-text-sm tw-text-text-medium">danger</span>
        <Button variant="primary" danger>
          Delete
        </Button>
        <Button variant="secondary" danger>
          Delete
        </Button>
        <Button variant="primary" danger disabled>
          Disabled
        </Button>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: sizes ───────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      <Button size="large">Large</Button>
      <Button size="default">Default</Button>
      <Button size="medium">Medium</Button>
      <Button size="small">Small</Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: icon sizes ──────────────────────────────────────────────────
export const IconSizes = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      <Button size="large" leadingVisual={<Plus size={16} />}>
        Large
      </Button>
      <Button size="default" leadingVisual={<Plus size={14} />}>
        Default
      </Button>
      <Button size="medium" leadingVisual={<Plus size={12} />}>
        Medium
      </Button>
      <Button size="small" leadingVisual={<Plus size={12} />}>
        Small
      </Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: icon-only buttons ──────────────────────────────────────────
export const IconOnly = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      {['large', 'default', 'medium', 'small'].map((size) => (
        <Button key={size} size={size} iconOnly aria-label="Add">
          <Plus size={size === 'small' ? 12 : size === 'medium' ? 12 : 14} />
        </Button>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

export const IconOnlyVariants = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3 tw-p-4">
      {['primary', 'secondary', 'ghost', 'ghostBrand', 'outline'].map((variant) => (
        <Button key={variant} variant={variant} iconOnly aria-label="Add">
          <Plus size={14} />
        </Button>
      ))}
      <Button variant="primary" danger iconOnly aria-label="Delete">
        <Trash2 size={14} />
      </Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Disabled icons — proves the grayscale filter ─────────────────────────
//
// Lucide icons follow currentColor and are already monochrome, so the
// disabled-state grayscale is invisible on them. The visible cases are:
//   - colored inline SVG (custom branded glyph, status icon, etc.)
//   - <img> visuals (logos, profile pics, third-party brand marks)
//
// Compare each enabled column to its disabled twin: the colored content
// should desaturate when disabled.

const ColoredSvg = (props) => (
  <svg width="14" height="14" viewBox="0 0 14 14" {...props}>
    <circle cx="7" cy="7" r="6" fill="#22c55e" />
    <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ColoredImage = (props) => (
  // Tiny inline SVG-as-data-URL so the story works offline
  <img
    {...props}
    width={14}
    height={14}
    alt=""
    src={
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><rect width="14" height="14" rx="3" fill="%23f97316"/><text x="7" y="10" font-size="9" font-family="sans-serif" fill="white" text-anchor="middle">A</text></svg>'
      )
    }
  />
);

export const DisabledWithColoredIcons = {
  render: () => (
    <div className="tw-grid tw-grid-cols-[auto_auto_auto] tw-gap-3 tw-p-4 tw-items-center">
      <span className="tw-text-xs tw-text-text-placeholder">Lucide (currentColor)</span>
      <Button variant="primary" leadingVisual={<Plus size={14} />}>
        Enabled
      </Button>
      <Button variant="primary" disabled leadingVisual={<Plus size={14} />}>
        Disabled
      </Button>

      <span className="tw-text-xs tw-text-text-placeholder">Colored SVG</span>
      <Button variant="secondary" leadingVisual={<ColoredSvg />}>
        Enabled
      </Button>
      <Button variant="secondary" disabled leadingVisual={<ColoredSvg />}>
        Disabled
      </Button>

      <span className="tw-text-xs tw-text-text-placeholder">Image (data URL)</span>
      <Button variant="outline" leadingVisual={<ColoredImage />}>
        Enabled
      </Button>
      <Button variant="outline" disabled leadingVisual={<ColoredImage />}>
        Disabled
      </Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};
