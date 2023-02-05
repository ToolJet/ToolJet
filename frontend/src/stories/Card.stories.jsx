import React from 'react';
// import AppCard from '../HomePage/AppCard';
import AppCard from '../_ui/AppCard/AppCard';

export default {
  title: 'Components/Card',
  component: AppCard,
  args: {},
  argTypes: {
    editTime: {
      control: 'text',
    },
    appname: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    leftButtonName: {
      control: 'text',
    },
    rightButtonName: {
      control: 'text',
    },
  },
};

const Template = (args) => <AppCard {...args} />;
export const Basic = Template.bind({});
Basic.args = {
  editTime: 'Edited 14 days ago by kiran ashok',
  appname: 'Untitled app',
  className: 'dashboard-card',
  leftButtonName: 'Edit',
  rightButtonName: 'Launch',
};
