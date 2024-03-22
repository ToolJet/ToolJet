import { Button } from './button';
import * as React from 'react';
export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: { handleClick: { action: 'handleClick' } },
};

const Template = (args) => <Button {...args} />;

export const RocketButton = Template.bind({});
RocketButton.args = {
  variant: 'primary',
  children: 'Button',
  size: 'large',
};

export const RocketButtonWithIcon = Template.bind({});
RocketButton.args = {
  variant: 'primary',
  children: 'Button',
  size: 'large',
  leadingIcon: 'smilerectangle',
};

export const Icon = Template.bind({});
Icon.args = {
  variant: 'dangerPrimary',
  children: 'Rocket',
  size: 'large',
};
