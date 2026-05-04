import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './Select';
import { Field, FieldLabel, FieldDescription, FieldError } from '../Field/Field';
import { TruncatingText } from '../TruncatingText/TruncatingText';
import { User, Globe, Mail, Pencil, Trash2 } from 'lucide-react';

export default {
  title: 'Rocket/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
          <SelectItem value="option4">Option 4</SelectItem>
          <SelectItem value="option5">Option 5</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Select>
        <SelectTrigger size="large">
          <SelectValue placeholder="Large" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger size="default">
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger size="small">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── States ────────────────────────────────────────────────────────────────
export const States = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Rest (default)</span>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Rest — filled</span>
        <Select defaultValue="filled">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="filled">Input value</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Hover (simulated)</span>
        <Select>
          <SelectTrigger className="tw-border-border-strong">
            <SelectValue placeholder="Placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Focused (simulated)</span>
        <Select>
          <SelectTrigger className="tw-ring-2 tw-ring-interactive-focus-outline">
            <SelectValue placeholder="Placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Error</span>
        <Select>
          <SelectTrigger aria-invalid="true">
            <SelectValue placeholder="With error" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">Disabled</span>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Groups ───────────────────────────────────────────────────────────
export const WithGroups = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Field ────────────────────────────────────────────────────────────
export const WithField = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Field>
        <FieldLabel>Country</FieldLabel>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
            <SelectItem value="in">India</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>Choose the user&apos;s permission level.</FieldDescription>
      </Field>

      <Field data-invalid="true">
        <FieldLabel>Status</FieldLabel>
        <Select>
          <SelectTrigger aria-invalid="true">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <FieldError>Status is required.</FieldError>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Leading Visual (trigger) ─────────────────────────────────────────
export const WithLeadingVisual = {
  render: () => (
    <div className="tw-w-72 tw-p-4">
      <Select>
        <SelectTrigger className="tw-gap-2">
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">
            <User size={14} className="tw-text-icon-strong tw-shrink-0" />
            <SelectValue placeholder="Select user" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="john">John Doe</SelectItem>
          <SelectItem value="jane">Jane Smith</SelectItem>
          <SelectItem value="bob">Bob Wilson</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Open Dropdown (for reviewing dropdown & items) ───────────────────────
export const OpenDropdown = {
  render: () => (
    <div className="tw-w-72 tw-p-4 tw-pb-64">
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Open Dropdown with Selection ─────────────────────────────────────────
export const OpenDropdownWithSelection = {
  render: () => (
    <div className="tw-w-72 tw-p-4 tw-pb-64">
      <Select open defaultValue="banana">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
          <SelectItem value="mango">Mango</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Long Selected Value — opt-in TruncatingText pattern ──────────────────
//
// Documents the "Truncating long values" pattern from Select.spec.md.
//
// Two pieces of overflow handling are demonstrated together:
//
//   Trigger (selected value):
//   - `<TruncatingText title={QUERIES[value]}><SelectValue /></TruncatingText>`
//     wrapped inside a div that escapes shadcn's `[&>span]:tw-line-clamp-1`.
//     Hover the clipped trigger to see the OS tooltip with the full string.
//
//   Dropdown (option rows):
//   - `<TruncatingText>{label}</TruncatingText>` per SelectItem.
//   - PLUS the dropdown is bounded: `align="end"` is irrelevant here (trigger
//     fills the host) but the popover needs `!tw-w-max !tw-max-w-[<inner>px]`
//     and a `data-tj-fit-host` marker so the global `:has()` rule overrides
//     Radix's popper-wrapper `min-width: max-content`. Without these, the
//     dropdown grows to fit the longest row and TruncatingText never clips —
//     because the rows always have enough room.
//
// The `<style>` tag is inline so the story is self-contained. In an app, the
// rule lives once in a global stylesheet (e.g. EventManager.scss).
//
// Host: 240px outer, 16px padding (tw-p-4) → 208px inner. Cap is 208px.

const QUERIES = {
  short: 'getProducts',
  medium: 'getProductsByCategory',
  long: 'getProductsThatIsReallyLongToFitInaDropdownAndWillDefinitelyOverflow',
};

export const LongSelectedValue = {
  render: () => {
    const [value, setValue] = React.useState('long');
    return (
      <>
        <style>{`
          [data-radix-popper-content-wrapper]:has([data-tj-fit-host]) {
            min-width: 0;
          }
        `}</style>
        <div className="tw-w-[240px] tw-p-4">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <div className="tw-min-w-0 tw-flex-1">
                <TruncatingText title={QUERIES[value]}>
                  <SelectValue placeholder="Select query" />
                </TruncatingText>
              </div>
            </SelectTrigger>
            <SelectContent data-tj-fit-host="" className="!tw-w-max !tw-max-w-[208px]">
              {Object.entries(QUERIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <TruncatingText>{label}</TruncatingText>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </>
    );
  },
  parameters: { layout: 'padded' },
};

// ── All Variants ──────────────────────────────────────────────────────────
export const AllVariants = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-4 tw-p-4">
      {[
        { label: 'Default', props: {} },
        { label: 'Filled', props: { defaultValue: 'filled' } },
        { label: 'Error', props: { triggerProps: { 'aria-invalid': 'true' } } },
        { label: 'Disabled', props: { disabled: true } },
      ].map(({ label, props }) => (
        <div key={label} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-20 tw-text-sm tw-text-text-medium">{label}</span>
          <Select {...props} defaultValue={props.defaultValue}>
            <SelectTrigger {...(props.triggerProps || {})}>
              <SelectValue placeholder="Placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="filled">Input value</SelectItem>
              <SelectItem value="opt2">Option 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Bounded inside a host (consumer-side pattern) ────────────────────────
//
// Pattern for narrow hosts (e.g. an inspector panel) where:
//   - the trigger is smaller than the host
//   - the trigger is right-aligned within the host
//   - the dropdown should grow to fit long option labels but stay inside the
//     host
//
// Select needs four pieces at the consumer site (no Rocket changes):
//   1. `align="end"` on SelectContent — anchors the popover's right edge to
//      the trigger's right edge, so it grows leftward as it expands.
//   2. `!tw-w-max` — sizes the popover to its longest option (Tailwind
//      utility for `width: max-content`).
//   3. `!tw-max-w-[<inner-width>px]` — caps the popover at the host's INNER
//      content width (outer width minus padding) so the popover's left edge
//      stops at the same boundary as the trigger area.
//   4. A global `:has()` CSS rule that overrides Radix's popper-wrapper
//      `min-width: max-content`, gated by a `data-tj-fit-host` marker on the
//      Content. Without this override, Radix's wrapper expands to fit the
//      longest option's intrinsic width and our `max-width` on Content has no
//      effect — the dropdown overflows the host.
//
// The `<style>` tag here is inline to make the story self-contained. In an
// app, place the rule once in a global stylesheet (e.g. EventManager.scss)
// — it only fires when an element with `data-tj-fit-host` is present.
//
// Mirrors the Inspector panel layout: 300px outer host with 12px padding, so
// inner usable width is 276px. The 160px trigger is right-aligned within the
// 276px inner area. Cap is 276px.

const BOUNDED_QUERIES = [
  { value: 'short', label: 'getProducts' },
  { value: 'med', label: 'getProductsByCategory' },
  { value: 'long', label: 'getProductsThatIsReallyLongToFitInaDropdownAndWillDefinitelyOverflow' },
  { value: 'orders', label: 'getOrders' },
  { value: 'update', label: 'updateUserShippingAddressForCheckoutFlowWithLongName' },
];

export const BoundedInHost = {
  render: () => (
    <>
      <style>{`
        [data-radix-popper-content-wrapper]:has([data-tj-fit-host]) {
          min-width: 0;
        }
      `}</style>
      <div className="tw-w-[300px] tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-p-3">
        <div className="tw-mb-2 tw-text-xs tw-text-text-placeholder">
          300px outer • 12px padding • 276px inner • 160px right-aligned trigger
        </div>
        <div className="tw-flex tw-h-8 tw-items-center tw-justify-between">
          <span className="tw-text-sm tw-text-text-default">Query</span>
          <div className="tw-w-[160px]">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Pick query" />
              </SelectTrigger>
              <SelectContent align="end" data-tj-fit-host="" className="!tw-w-max !tw-max-w-[276px]">
                {BOUNDED_QUERIES.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  ),
  parameters: { layout: 'padded' },
};
