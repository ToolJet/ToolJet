import React from 'react';
import { ButtonSolid } from '../../src/_ui/AppButton/AppButton';

export default {
  title: 'Button',
  component: ButtonSolid,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export const Primary = () => <ButtonSolid variant="primary">Button</ButtonSolid>;
export const Secondary = () => <ButtonSolid variant="secondary">Button</ButtonSolid>;
export const Tirtiary = () => <ButtonSolid variant="tertiary">Button</ButtonSolid>;
export const GhostBlue = () => <ButtonSolid variant="ghostBlue">Button</ButtonSolid>;
export const GhostBlack = () => <ButtonSolid variant="ghostBlack">Button</ButtonSolid>;
export const Danger = () => <ButtonSolid variant="danger">Button</ButtonSolid>;
