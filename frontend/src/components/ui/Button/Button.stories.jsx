import * as React from 'react';
import ButtonComponent from './Index';

export default {
  title: 'Components/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary'],
      },
    },
    size: {
      control: {
        type: 'select',
        options: ['large', 'default', 'medium', 'small'],
      },
    },
    iconOnly: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    fill: { control: 'color' },
    leadingIcon: {
      control: 'text',
    },
    trailingIcon: {
      control: 'text',
    },
    onClick: { control: 'function' },
  },
};

const Template = (args) => <ButtonComponent {...args} />;

export const RocketButton = Template.bind({});
RocketButton.args = {
  variant: 'primary',
  children: 'Button',
  size: 'default',
  iconOnly: false,
  className: '',
  isLoading: false,
  disabled: false,
  fill: '',
  leadingIcon: '',
  trailingIcon: '',
  onClick: () => {},
};

export const RocketButtonWithIcon = (args) => {
  return <ButtonComponent {...args} iconOnly={false} leadingIcon="smilerectangle" />;
};
RocketButtonWithIcon.args = {
  ...RocketButton.args,
};

export const RocketButtonWithTrailingIcon = (args) => {
  return <ButtonComponent {...args} iconOnly={false} trailingIcon="smilerectangle" />;
};
RocketButtonWithTrailingIcon.args = {
  ...RocketButton.args,
};

export const RocketButtonWithIconOnly = (args) => {
  return <ButtonComponent {...args} iconOnly trailingIcon="smilerectangle" />;
};
RocketButtonWithIconOnly.args = {
  ...RocketButton.args,
  children: null,
};
