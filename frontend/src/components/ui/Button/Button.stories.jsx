import { Button } from './Button';
import * as React from 'react';

// Function to determine default icon fill color
const getDefaultIconFillColor = (variant, customFill = '') => {
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
      return 'var(--icon-strong)';
    case 'dangerSecondary':
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
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} iconOnly={false} leadingIcon="smilerectangle" />;
};
RocketButtonWithIcon.args = {
  ...RocketButton.args,
};

// Button with trailing icon story
export const RocketButtonWithTrailingIcon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} iconOnly={false} trailingIcon="smilerectangle" />;
};
RocketButtonWithTrailingIcon.args = {
  ...RocketButton.args,
};

// Button with icon only story
export const Icon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} trailingIcon="smilerectangle" />;
};
Icon.args = {
  ...RocketButton.args,
  children: null,
  iconOnly: true,
};
