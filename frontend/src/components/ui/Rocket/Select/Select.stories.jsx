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
        <FieldDescription>Choose the user's permission level.</FieldDescription>
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
