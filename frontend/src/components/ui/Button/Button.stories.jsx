import { Button } from './Button';
import * as React from 'react';

// Function to determine default icon fill color
const getDefaultIconFillColor = (variant, customFill = '', iconOnly = false) => {
  if (customFill) {
    return customFill;
  }
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'var(--icon-on-solid)';
    case 'secondary':
    case 'ghostBrand':
      return 'var(--icon-brand)';
    case 'outline':
    case 'ghost':
      return iconOnly ? 'var(--icon-strong)' : 'var(--icon-default)';
    case 'dangerSecondary':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};

// Function to determine Lucide icon className
const getLucideIconClassName = (variant, iconOnly = false) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'tw-text-icon-on-solid';
    case 'secondary':
    case 'ghostBrand':
      return 'tw-text-icon-brand';
    case 'outline':
    case 'ghost':
      return iconOnly ? 'tw-text-icon-strong' : 'tw-text-icon-default';
    case 'dangerSecondary':
      return 'tw-text-icon-danger';
    default:
      return '';
  }
};

// Storybook configuration
export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'Clicked' },
    variant: {
      control: {
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary'],
      },
    },
    fill: { control: 'color' },
  },
};

// Button template
const Template = (args) => <Button {...args} />;

// Primary button story
export const RocketButton = Template.bind({});
RocketButton.args = {
  variant: 'primary',
  children: 'Button',
  size: 'default',
  iconOnly: false,
};

// Button with leading icon story
export const RocketButtonWithIcon = (args) => {
  const variant = args.variant || 'primary';
  const fill = ''; // If fill is provided by user, it will be used; otherwise, it falls back to defaults
  const color = getDefaultIconFillColor(variant, fill, false);

  return <Button {...args} fill={color} iconOnly={false} leadingIcon="smilerectangle" />;
};
RocketButtonWithIcon.args = {
  ...RocketButton.args,
};

// Button with trailing icon story
export const RocketButtonWithTrailingIcon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill, false);

  return <Button {...args} fill={color} iconOnly={false} trailingIcon="smilerectangle" />;
};
RocketButtonWithTrailingIcon.args = {
  ...RocketButton.args,
};

// Button with icon only story
export const Icon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill, true);

  return <Button {...args} fill={color} trailingIcon="smilerectangle" />;
};
Icon.args = {
  ...RocketButton.args,
  children: null,
  iconOnly: true,
};

// Lucide icon button story (async dynamic import)
export const LucideButton = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill, false);

  return <Button {...args} fill={color} isLucid={true} leadingIcon="rocket" />;
};
LucideButton.args = {
  ...RocketButton.args,
};
LucideButton.parameters = {
  docs: {
    description: {
      story: 'Button with Lucide icon using the official DynamicIcon component. Icons are loaded dynamically by name.',
    },
  },
};

// Lucide icon only button story (async dynamic import)
export const LucideIconOnly = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill, true);

  return <Button {...args} fill={color} isLucid={true} leadingIcon="rocket" iconOnly={true} />;
};
LucideIconOnly.args = {
  ...RocketButton.args,
  children: null,
  iconOnly: true,
};
LucideIconOnly.parameters = {
  docs: {
    description: {
      story: 'Icon-only button with Lucide icon using the official DynamicIcon component.',
    },
  },
};

// Showcase different Lucide icons with mixed variants and sizes
export const LucideIconShowcase = () => {
  const iconConfigs = [
    // Regular buttons with text
    {
      icon: 'rocket',
      variant: 'primary',
      size: 'large',
      label: 'Launch',
      iconOnly: false,
    },
    {
      icon: 'plus',
      variant: 'secondary',
      size: 'default',
      label: 'Add',
      iconOnly: false,
    },
    {
      icon: 'search',
      variant: 'outline',
      size: 'medium',
      label: 'Search',
      iconOnly: false,
    },
    {
      icon: 'settings',
      variant: 'ghost',
      size: 'small',
      label: 'Settings',
      iconOnly: false,
    },
    {
      icon: 'user',
      variant: 'primary',
      size: 'medium',
      label: 'Profile',
      iconOnly: false,
    },
    {
      icon: 'mail',
      variant: 'secondary',
      size: 'large',
      label: 'Email',
      iconOnly: false,
    },
    {
      icon: 'lock',
      variant: 'outline',
      size: 'default',
      label: 'Secure',
      iconOnly: false,
    },
    {
      icon: 'eye',
      variant: 'ghost',
      size: 'small',
      label: 'View',
      iconOnly: false,
    },
    {
      icon: 'heart',
      variant: 'dangerPrimary',
      size: 'medium',
      label: 'Like',
      iconOnly: false,
    },
    {
      icon: 'star',
      variant: 'primary',
      size: 'small',
      label: 'Favorite',
      iconOnly: false,
    },
    {
      icon: 'arrow-big-down',
      variant: 'secondary',
      size: 'default',
      label: 'Download',
      iconOnly: false,
    },
    {
      icon: 'wifi',
      variant: 'outline',
      size: 'large',
      label: 'Connect',
      iconOnly: false,
    },
    {
      icon: 'bluetooth',
      variant: 'ghost',
      size: 'medium',
      label: 'Pair',
      iconOnly: false,
    },
    {
      icon: 'smartphone',
      variant: 'primary',
      size: 'small',
      label: 'Mobile',
      iconOnly: false,
    },

    // Icon-only buttons to demonstrate color differences
    {
      icon: 'search',
      variant: 'outline',
      size: 'medium',
      label: '',
      iconOnly: true,
    },
    {
      icon: 'settings',
      variant: 'ghost',
      size: 'small',
      label: '',
      iconOnly: true,
    },
    {
      icon: 'lock',
      variant: 'outline',
      size: 'default',
      label: '',
      iconOnly: true,
    },
    { icon: 'eye', variant: 'ghost', size: 'small', label: '', iconOnly: true },
    {
      icon: 'wifi',
      variant: 'outline',
      size: 'large',
      label: '',
      iconOnly: true,
    },
    {
      icon: 'bluetooth',
      variant: 'ghost',
      size: 'medium',
      label: '',
      iconOnly: true,
    },
    {
      icon: 'plus',
      variant: 'primary',
      size: 'default',
      label: '',
      iconOnly: true,
    },
    {
      icon: 'heart',
      variant: 'dangerPrimary',
      size: 'medium',
      label: '',
      iconOnly: true,
    },
  ];

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold">Lucide Icon Showcase</h3>
        <p className="tw-text-sm tw-text-gray-600">
          Mixed variants, sizes, and icon-only cases using Lucide's official DynamicIcon component. Notice how outline
          and ghost variants use different icon colors for icon-only vs text buttons.
        </p>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-3">
        {iconConfigs.map((config, index) => (
          <Button
            key={`${config.icon}-${index}`}
            variant={config.variant}
            isLucid={true}
            leadingIcon={config.icon}
            size={config.size}
            iconOnly={config.iconOnly}
          >
            {config.label}
          </Button>
        ))}
      </div>

      <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg">
        <h4 className="tw-font-semibold tw-text-blue-900">Variants & Sizes Demonstrated:</h4>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
          <div>
            <h5 className="tw-font-medium tw-text-blue-800">Variants:</h5>
            <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1">
              <li>• primary</li>
              <li>• secondary</li>
              <li>• outline</li>
              <li>• ghost</li>
              <li>• dangerPrimary</li>
            </ul>
          </div>
          <div>
            <h5 className="tw-font-medium tw-text-blue-800">Sizes:</h5>
            <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1">
              <li>• large (40px)</li>
              <li>• default (32px)</li>
              <li>• medium (28px)</li>
              <li>• small (20px)</li>
            </ul>
          </div>
        </div>
        <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-blue-200">
          <h5 className="tw-font-medium tw-text-blue-800">Icon Color Logic:</h5>
          <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1">
            <li>• outline/ghost + iconOnly=true: tw-text-icon-strong (darker for visibility)</li>
            <li>• outline/ghost + iconOnly=false: tw-text-icon-default (lighter for text buttons)</li>
            <li>• Other variants: standard Tailwind classes (tw-text-icon-on-solid, tw-text-icon-brand, etc.)</li>
          </ul>
          <p className="tw-text-xs tw-text-blue-600 tw-mt-2">
            Lucide icons use Tailwind CSS classes for colors. Compare the outline/ghost buttons with text vs icon-only
            to see the color difference.
          </p>
        </div>
      </div>
    </div>
  );
};
LucideIconShowcase.parameters = {
  docs: {
    description: {
      story:
        'Comprehensive showcase of Lucide icons with mixed variants and sizes. Demonstrates the flexibility of the Button component with different visual styles and dimensions.',
    },
  },
};
