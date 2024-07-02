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
    className: {
      control: 'text',
    },
  },
};

export const RocketListItems = {};
