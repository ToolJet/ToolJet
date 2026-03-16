import React from 'react';
import { User } from 'lucide-react';
import { Avatar } from './Avatar';

export default {
  title: 'Rocket/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl'],
    },
  },
};

// ── Default with image ────────────────────────────────────────────────────
export const Default = {
  args: {
    src: 'https://i.pravatar.cc/128?u=rocket',
    alt: 'User avatar',
    fallback: 'RK',
  },
};

// ── Fallback with initials ────────────────────────────────────────────────
export const WithInitials = {
  args: {
    fallback: 'NR',
  },
};

// ── Fallback with icon ────────────────────────────────────────────────────
export const WithIcon = {
  args: {
    fallback: <User size={16} />,
  },
};

// ── Composite: all sizes with image ───────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      {['xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl'].map((size) => (
        <div key={size} className="tw-flex tw-flex-col tw-items-center tw-gap-1">
          <Avatar
            size={size}
            src={`https://i.pravatar.cc/128?u=${size}`}
            alt={size}
            fallback="RK"
          />
          <span className="tw-text-xs tw-text-text-medium">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: all sizes with initials fallback ───────────────────────────
export const FallbackSizes = {
  render: () => (
    <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
      {['xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl'].map((size) => (
        <div key={size} className="tw-flex tw-flex-col tw-items-center tw-gap-1">
          <Avatar size={size} fallback="NR" />
          <span className="tw-text-xs tw-text-text-medium">{size}</span>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── Composite: all sizes with icon fallback ───────────────────────────────
export const IconFallbackSizes = {
  render: () => {
    const iconSizes = { xs: 10, sm: 12, default: 14, md: 16, lg: 20, xl: 24, '2xl': 28 };
    return (
      <div className="tw-flex tw-items-end tw-gap-3 tw-p-4">
        {['xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl'].map((size) => (
          <div key={size} className="tw-flex tw-flex-col tw-items-center tw-gap-1">
            <Avatar size={size} fallback={<User size={iconSizes[size]} />} />
            <span className="tw-text-xs tw-text-text-medium">{size}</span>
          </div>
        ))}
      </div>
    );
  },
  parameters: { layout: 'padded' },
};
