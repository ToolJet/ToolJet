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
    type: {
      options: ['text', 'icon'],
      control: 'select',
    },
    tabs: {
      control: 'object',
    },
    defaultValue: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    onChange: {
      control: 'function',
    },
    className: {
      control: 'text',
    },
  },
};

const Template = (args) => <TabsComponent {...args} />;

export const RocketTabs = Template.bind({});
RocketTabs.args = {
  type: 'text',
  tabs: {
    option1: 'value 1',
    option2: 'value 2',
    option3: 'value 3',
  },
  defaultValue: '',
  onChange: (value) => {},
  className: '',
};

export const RocketTabsWithIcons = (args) => {
  return (
    <TabsComponent
      {...args}
      type="icon"
      tabs={{
        smilerectangle: 'value 1',
        search01: 'value 2',
      }}
    />
  );
};
