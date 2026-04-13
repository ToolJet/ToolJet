import React from 'react';
import { Textarea } from './Textarea';
import { Field, FieldLabel, FieldDescription, FieldError } from '../Field/Field';

export default {
  title: 'Rocket/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'default', 'small'],
    },
    disabled: { control: 'boolean' },
  },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  args: { placeholder: 'Enter text...' },
};

// ── Sizes ─────────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Textarea size="large" placeholder="Large" />
      <Textarea size="default" placeholder="Default" />
      <Textarea size="small" placeholder="Small" />
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── States ────────────────────────────────────────────────────────────────
export const States = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Textarea placeholder="Default" />
      <Textarea defaultValue="With content - this textarea has some longer text to show how it wraps across multiple lines." />
      <Textarea placeholder="With error" aria-invalid="true" />
      <Textarea placeholder="Disabled" disabled />
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Field ────────────────────────────────────────────────────────────
export const WithField = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Textarea placeholder="Enter a description..." />
        <FieldDescription>Brief summary of the item.</FieldDescription>
      </Field>

      <Field data-invalid="true">
        <FieldLabel>Notes</FieldLabel>
        <Textarea placeholder="Add notes..." aria-invalid="true" />
        <FieldError>This field is required.</FieldError>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Resizable ─────────────────────────────────────────────────────────────
export const Resizable = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-72 tw-p-4">
      <Textarea placeholder="Vertical resize (default)" />
      <Textarea placeholder="No resize" className="tw-resize-none" />
      <Textarea placeholder="Both directions" className="tw-resize" />
    </div>
  ),
  parameters: { layout: 'padded' },
};
