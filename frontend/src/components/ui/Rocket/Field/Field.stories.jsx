import React from 'react';
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from './Field';
import { Input } from '../Input/Input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupButton,
} from '../InputGroup/InputGroup';
import { Mail, Eye, Search } from 'lucide-react';

export default {
  title: 'Rocket/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
};

// ── Default ───────────────────────────────────────────────────────────────
export const Default = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" placeholder="you@example.com" />
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Description ──────────────────────────────────────────────────────
export const WithDescription = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <Field>
        <FieldLabel>Password</FieldLabel>
        <Input type="password" placeholder="Enter password" />
        <FieldDescription>Must be at least 8 characters.</FieldDescription>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── With Error ────────────────────────────────────────────────────────────
export const WithError = {
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <Field data-invalid="true">
        <FieldLabel>Email</FieldLabel>
        <Input type="email" defaultValue="bad-email@" aria-invalid="true" />
        <FieldError>Please enter a valid email address.</FieldError>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Horizontal Layout ─────────────────────────────────────────────────────
export const Horizontal = {
  render: () => (
    <div className="tw-w-96 tw-p-4">
      <Field orientation="horizontal">
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="John Doe" />
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Field Group ───────────────────────────────────────────────────────────
export const FieldGroupStory = {
  name: 'FieldGroup',
  render: () => (
    <div className="tw-w-80 tw-p-4">
      <FieldGroup>
        <Field>
          <FieldLabel>First name</FieldLabel>
          <Input placeholder="John" />
        </Field>
        <Field>
          <FieldLabel>Last name</FieldLabel>
          <Input placeholder="Doe" />
        </Field>
      </FieldGroup>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composed with InputGroup ──────────────────────────────────────────────
export const ComposedWithInputGroup = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Field>
        <FieldLabel>Website</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Email</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Mail size={14} />
          </InputGroupAddon>
          <InputGroupInput type="email" placeholder="you@example.com" />
        </InputGroup>
      </Field>

      <Field data-invalid="true">
        <FieldLabel>Search</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search size={14} />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." aria-invalid="true" />
        </InputGroup>
        <FieldError>No results found.</FieldError>
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── All States ────────────────────────────────────────────────────────────
export const AllStates = {
  render: () => (
    <div className="tw-w-80 tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Field>
        <FieldLabel>Default</FieldLabel>
        <Input placeholder="Enter text..." />
        <FieldDescription>This is helper text.</FieldDescription>
      </Field>

      <Field data-invalid="true">
        <FieldLabel>Error state</FieldLabel>
        <Input defaultValue="invalid" aria-invalid="true" />
        <FieldError>This field is required.</FieldError>
      </Field>

      <Field data-disabled="true">
        <FieldLabel>Disabled</FieldLabel>
        <Input placeholder="Cannot edit" disabled />
      </Field>
    </div>
  ),
  parameters: { layout: 'padded' },
};
