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
          <Button variant={variant} disabled>Disabled</Button>
          <Button variant={variant} loading>Loading</Button>
        </div>
      ))}
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-28 tw-text-sm tw-text-text-medium">danger</span>
        <Button variant="primary" danger>Delete</Button>
        <Button variant="secondary" danger>Delete</Button>
        <Button variant="primary" danger disabled>Disabled</Button>
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
      <Button size="large" leadingVisual={<Plus size={16} />}>Large</Button>
      <Button size="default" leadingVisual={<Plus size={14} />}>Default</Button>
      <Button size="medium" leadingVisual={<Plus size={12} />}>Medium</Button>
      <Button size="small" leadingVisual={<Plus size={12} />}>Small</Button>
    </div>
  ),
  parameters: { layout: 'padded' },
};
