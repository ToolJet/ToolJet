import React from 'react';
import List from './List';
import ListGroup from 'react-bootstrap/ListGroup';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'List',
  component: List,
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
export const WithIcon = {
  render: (args) => (
    <List>
      <List.Item>Client side</List.Item>
      <List.Item active>Server side</List.Item>
      <List.Item>Client side</List.Item>
      <List.Item disabled>Server side</List.Item>
      <List.Item>Client side</List.Item>
      <List.Item>Server side</List.Item>
      <List.Item>Client side</List.Item>
      <List.Item>Server side</List.Item>
    </List>
  ),
};

export const WithIconAndEdit = {
  render: (args) => (
    <ListGroup>
      <ListGroup.Item>Cras justo odio</ListGroup.Item>
      <ListGroup.Item>Dapibus ac facilisis in</ListGroup.Item>
      <ListGroup.Item>Morbi leo risus</ListGroup.Item>
      <ListGroup.Item>Porta ac consectetur ac</ListGroup.Item>
      <ListGroup.Item>Vestibulum at eros</ListGroup.Item>
    </ListGroup>
  ),
};
