import React from 'react';
import { InlineInfo } from './InlineInfo';
import { Button } from '../Button/Button';

export default {
  title: 'Rocket/InlineInfo',
  component: InlineInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'warning', 'danger'],
    },
    variant: {
      control: 'select',
      options: ['ghost', 'secondary', 'outline', 'filled'],
    },
  },
};

// ── One story per type ────────────────────────────────────────────────────
export const Info = {
  args: { type: 'info', title: 'Title', description: 'Info description' },
};

export const Warning = {
  args: { type: 'warning', title: 'Title', description: 'Warning description' },
};

export const Danger = {
  args: { type: 'danger', title: 'Title', description: 'Danger description' },
};

// ── With action ───────────────────────────────────────────────────────────
export const WithAction = {
  args: {
    type: 'info',
    variant: 'outline',
    title: 'Title',
    description: 'Info description',
    action: <Button variant="outline" size="medium">Button</Button>,
  },
};

// ── Title only (no description) ───────────────────────────────────────────
export const TitleOnly = {
  args: { type: 'warning', title: 'Title' },
};

// ── Composite: all types × all variants ───────────────────────────────────
export const AllVariants = {
  render: () => {
    const types = ['info', 'warning', 'danger'];
    const variants = ['ghost', 'secondary', 'outline', 'filled'];
    return (
      <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4">
        {types.map((type) => (
          <div key={type} className="tw-flex tw-flex-col tw-gap-3">
            <span className="tw-text-sm tw-font-medium tw-text-text-medium tw-capitalize">{type}</span>
            <div className="tw-flex tw-gap-4 tw-items-start">
              {variants.map((v) => (
                <div key={v} className="tw-flex tw-flex-col tw-gap-1 tw-w-48">
                  <span className="tw-text-xs tw-text-text-placeholder">{v}</span>
                  <InlineInfo
                    type={type}
                    variant={v}
                    title="Title"
                    description="Info description"
                    action={<Button variant="outline" size="medium">Button</Button>}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: { layout: 'padded' },
};

// ── Composite: types as ghost ─────────────────────────────────────────────
export const TypesGhost = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      {['info', 'warning', 'danger'].map((type) => (
        <InlineInfo
          key={type}
          type={type}
          title="Title"
          description="Info description"
          action={<Button variant="outline" size="medium">Button</Button>}
        />
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
