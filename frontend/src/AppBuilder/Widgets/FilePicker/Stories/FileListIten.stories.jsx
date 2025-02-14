import { FileListItem } from '../Components/FileListItem';
import * as React from 'react';

// Storybook configuration
export default {
  title: 'Widgets/FilePicker/FileListItem',
  component: FileListItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'Clicked' },
    variant: {
      control: {
        type: 'select',
        options: ['primary', 'secondary', 'outline', 'ghost', 'ghostBrand', 'dangerPrimary', 'dangerSecondary'],
      },
    },
    fill: { control: 'color' },
  },
};

// Button template
const Template = (args) => <FileListItem {...args} />;

// Primary button story
export const RocketButton = Template.bind({});
RocketButton.args = {};
