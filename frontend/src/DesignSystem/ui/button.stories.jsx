import { Button } from './button';
import * as React from 'react';

export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    handleClick: { action: 'handleClick' },
    variant: {
      control: {
        type: 'select',
        options: [
          'primary',
          'secondary',
          'outline',
          'ghost',
          'ghostBrand',
          'dangerPrimary',
          'dangerSecondary',
          'dangerGhost',
        ],
      },
    },
    fill: { control: 'color' },
  },
};

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
    case 'dangerGhost':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};

const Template = (args) => <Button {...args} />;

export const RocketButton = Template.bind({});
RocketButton.args = {
  variant: 'primary',
  children: 'Button',
  size: 'default',
};

export const RocketButtonWithIcon = (args) => {
  const variant = args.variant || 'primary';
  const fill = ''; //if fill is provided by user it will use that else will fallback to defaults
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} leadingIcon="smilerectangle" />;
};
RocketButtonWithIcon.args = {
  ...RocketButton.args,
};

export const RocketButtonWithTrailingIcon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} trailingIcon="smilerectangle" />;
};
RocketButtonWithTrailingIcon.args = {
  ...RocketButton.args,
};

export const Icon = (args) => {
  const variant = args.variant || 'primary';
  const fill = '';
  const color = getDefaultIconFillColor(variant, fill);

  return <Button {...args} fill={color} trailingIcon="smilerectangle" />;
};
Icon.args = {
  ...RocketButton.args,
  children: null,
};
