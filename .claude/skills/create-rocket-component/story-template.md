# Story Template

CSF3 format. Co-located with the component file.

```jsx
import React from 'react';
import { [Name] } from './[Name]';

export default {
  title: 'Rocket/[Name]',
  component: [Name],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: [/* list variants */],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
};

// ── One story per variant ─────────────────────────────────────────────────
export const Primary   = { args: { children: '[Name]', variant: 'primary' } };
export const Secondary = { args: { children: '[Name]', variant: 'secondary' } };
// ... one per variant

// ── States ────────────────────────────────────────────────────────────────
export const Disabled = { args: { children: '[Name]', variant: 'primary', disabled: true } };
// Add Loading, Error, Success if the component has those states

// ── Composite: all variants ───────────────────────────────────────────────
export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {['primary', 'secondary' /* ...variants */].map((variant) => (
        <div key={variant} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-28 tw-text-sm tw-text-text-medium">{variant}</span>
          <[Name] variant={variant}>Default</ [Name]>
          <[Name] variant={variant} disabled>Disabled</ [Name]>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: sizes (only if component has size variants) ────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3">
      <[Name] size="sm">Small</ [Name]>
      <[Name] size="default">Default</ [Name]>
      <[Name] size="lg">Large</ [Name]>
    </div>
  ),
};
```

## Notes

- Dark mode: no setup needed — Storybook decorator applies `.dark-theme` when dark bg selected
- `parameters: { layout: 'padded' }` on composite stories so they have room to breathe
- `parameters: { layout: 'centered' }` on single-instance stories
- For icon slots, use `leadingIcon="plus"` etc. (lucide icon names, kebab-case)
- Story names are the export name, auto-formatted by Storybook (camelCase → Title Case)
