import React from 'react';
import FolderList from '@/_ui/FolderList/FolderList';

export default {
  title: 'Components/FolderList',
  component: FolderList,
  args: {
    children: 'Section name',
  },
  argTypes: {
    backgroundColor: { control: 'color' },
    leftIcon: {
      control: { type: 'select' },
    },
    rightIcon: {
      control: { type: 'select' },
    },
    onClick: {
      control: 'none',
    },
    className: {
      control: 'text',
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

const Template = (args) => <FolderList {...args} />;

// 👇 Each story then reuses that template
export const Basic = Template.bind({});
