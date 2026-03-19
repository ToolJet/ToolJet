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

---

## Compound / multi-part component stories (Shape E)

For components with sub-components (Combobox, Select, etc.), stories use render functions
and show the full composition. For filterable/selectable components, use the `items` collection API.

```jsx
import React from 'react';
import {
  [Name],
  [Name]Input,
  [Name]Content,
  [Name]List,
  [Name]Item,
  [Name]Empty,
} from './[Name]';

const items = ['Option A', 'Option B', 'Option C', 'Option D'];

export default {
  title: 'Rocket/[Name]',
  component: [Name],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default (with items collection API) ──────────────────────────────────
export const Default = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <[Name] items={items}>
        <[Name]Input placeholder="Search..." />
        <[Name]Content>
          <[Name]List>
            {(item) => (
              <[Name]Item key={item} value={item}>
                {item}
              </[Name]Item>
            )}
          </[Name]List>
          <[Name]Empty>No results found.</[Name]Empty>
        </[Name]Content>
      </[Name]>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── States ───────────────────────────────────────────────────────────────
export const States = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      {[
        { label: 'Default', props: {} },
        { label: 'Disabled', props: { disabled: true } },
        { label: 'Loading', props: { loading: true } },
        { label: 'Error', props: { 'aria-invalid': 'true' } },
      ].map(({ label, props }) => (
        <div key={label}>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">{label}</span>
          <[Name] items={items}>
            <[Name]Input placeholder="Placeholder" {...props} />
            <[Name]Content>
              <[Name]List>
                {(item) => (
                  <[Name]Item key={item} value={item}>{item}</[Name]Item>
                )}
              </[Name]List>
            </[Name]Content>
          </[Name]>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
```

### Key rules for compound component stories

- **Use `items` prop on root** for filterable/selectable components — enables filtering + selection
- **Render function on List** `{(item) => <Item>}` — Base UI maps/filters items automatically
- **Plain string items** are simplest — `['React', 'Vue', 'Angular']`. Value and label are the same.
- **Wrap in a width container** — `<div className="tw-w-72 tw-p-4">` prevents stories from collapsing
- **Empty state story** — pass `items={[]}` with `open` to show the empty state

---

## Notes

- Dark mode: no setup needed — Storybook decorator applies `.dark-theme` when dark bg selected
- `parameters: { layout: 'padded' }` on composite stories so they have room to breathe
- `parameters: { layout: 'centered' }` on single-instance stories
- For icon slots, use `leadingIcon="plus"` etc. (lucide icon names, kebab-case)
- Story names are the export name, auto-formatted by Storybook (camelCase → Title Case)
