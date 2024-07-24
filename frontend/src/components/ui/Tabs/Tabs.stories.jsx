import * as React from 'react';
import TabsComponent from './Index';

// Storybook configuration
export default {
  title: 'Components/Tabs',
  component: TabsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    helper: {
      control: 'text',
    },
    size: {
      options: ['default', 'large'],
      control: 'radio',
    },
    align: {
      options: ['left', 'right'],
      control: 'radio',
    },
    required: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    leadingIcon: {
      control: 'text',
    },
  },
};

export const RocketTabs = {};
