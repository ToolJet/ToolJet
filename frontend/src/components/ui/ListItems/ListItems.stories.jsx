import * as React from 'react';
import ListItemsComponent from './Index';

// Storybook configuration
export default {
  title: 'Components/ListItems',
  component: ListItemsComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: 'text',
    },
    background: {
      control: 'boolean',
    },
    indexed: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    addon: {
      control: 'text',
    },
    error: {
      control: 'boolean',
    },
    supportingVisuals: {
      control: 'boolean',
    },
    supportingText: {
      control: 'text',
    },
    leadingIcon: {
      control: 'text',
    },
    trailingActionEdit: {
      control: 'boolean',
    },
    trailingActionDelete: {
      control: 'boolean',
    },
    trailingActionMenu: {
      control: 'boolean',
    },
    trailingActionDuplicate: {
      control: 'boolean',
    },
    onSaveEdit: {
      control: 'function',
    },
    onDelete: {
      control: 'function',
    },
    onMenu: {
      control: 'function',
    },
    onDuplicate: {
      control: 'function',
    },
    className: {
      control: 'text',
    },
  },
};

const Template = (args) => <ListItemsComponent {...args} />;

export const RocketListItems = Template.bind({});
RocketListItems.args = {
  width: '260px',
  background: false,
  indexed: false,
  disabled: false,
  label: 'List Item',
  addon: '',
  error: false,
  supportingVisuals: false,
  supportingText: '',
  leadingIcon: '',
  trailingActionEdit: false,
  trailingActionDelete: false,
  trailingActionMenu: false,
  trailingActionDuplicate: false,
  onSaveEdit: () => {},
  onDelete: () => {},
  onMenu: () => {},
  onDuplicate: () => {},
  className: '',
};

export const RocketListItemsIndexed = (args) => {
  return <ListItemsComponent {...args} indexed />;
};
RocketListItemsIndexed.args = {
  ...RocketListItems.args,
};

export const RocketListItemsWithBackground = (args) => {
  return <ListItemsComponent {...args} background />;
};
RocketListItemsWithBackground.args = {
  ...RocketListItems.args,
};

export const RocketListItemsWithBackgroundIndexed = (args) => {
  return <ListItemsComponent {...args} background indexed />;
};
RocketListItemsWithBackgroundIndexed.args = {
  ...RocketListItems.args,
};

export const RocketListItemsWithAddon = (args) => {
  return <ListItemsComponent {...args} addon="Addon" />;
};
RocketListItemsWithAddon.args = {
  ...RocketListItems.args,
};

export const RocketListItemsWithTrailingAction = (args) => {
  return <ListItemsComponent {...args} trailingActionEdit trailingActionMenu trailingActionDelete />;
};
RocketListItemsWithTrailingAction.args = {
  ...RocketListItems.args,
};
