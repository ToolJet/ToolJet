import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Grid, List, Columns } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup';

export default {
  title: 'Rocket/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
    },
    size: {
      control: 'select',
      options: ['large', 'default', 'medium', 'small'],
    },
    disabled: { control: 'boolean' },
  },
};

// ── Text options ──────────────────────────────────────────────────────────
export const TextOptions = {
  args: { type: 'single', defaultValue: 'option1' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
      <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
      <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
      <ToggleGroupItem value="option4">Option 4</ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ── Icon options ──────────────────────────────────────────────────────────
export const IconOptions = {
  args: { type: 'single', defaultValue: 'left' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft size={18} /></ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter size={18} /></ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right"><AlignRight size={18} /></ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Align justify"><AlignJustify size={18} /></ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ── Multiple selection ────────────────────────────────────────────────────
export const Multiple = {
  args: { type: 'multiple', defaultValue: ['grid'] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="grid" aria-label="Grid view"><Grid size={18} /></ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view"><List size={18} /></ToggleGroupItem>
      <ToggleGroupItem value="columns" aria-label="Column view"><Columns size={18} /></ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ── Disabled ──────────────────────────────────────────────────────────────
export const Disabled = {
  args: { type: 'single', disabled: true, defaultValue: 'option1' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
      <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
      <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
    </ToggleGroup>
  ),
};

// ── Composite: text vs icon ───────────────────────────────────────────────
export const TextVsIcon = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-16 tw-text-sm tw-text-text-medium">text</span>
        <ToggleGroup type="single" defaultValue="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
          <ToggleGroupItem value="option4">Option 4</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-w-16 tw-text-sm tw-text-text-medium">icon</span>
        <ToggleGroup type="single" defaultValue="left">
          <ToggleGroupItem value="left" aria-label="Align left"><AlignLeft size={18} /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center"><AlignCenter size={18} /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right"><AlignRight size={18} /></ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Align justify"><AlignJustify size={18} /></ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: sizes ──────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      {['large', 'default', 'medium', 'small'].map((size) => (
        <div key={size} className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-w-20 tw-text-sm tw-text-text-medium">{size}</span>
          <ToggleGroup type="single" size={size} defaultValue="option1">
            <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
            <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
            <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
