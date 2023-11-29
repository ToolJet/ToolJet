import React from 'react';
import ToggleGroup from './ToggleGroup';
import Button from 'react-bootstrap/Button';
import ToggleGroupItem from './ToggleGroupItem';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'ToggleGroup',
  component: ToggleGroup,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  //   tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const ClientServerToggle = {
  render: (args) => (
    <ToggleGroup>
      <ToggleGroupItem value="left">Client side</ToggleGroupItem>
      <ToggleGroupItem value="center">Server side</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Default = {
  render: (args) => (
    <ToggleGroup>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Middle</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  ),
};
