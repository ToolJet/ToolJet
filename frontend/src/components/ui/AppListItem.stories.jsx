import React from 'react';
import AppListItem from './AppListItem';
import { Button } from '@/components/ui/Button/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Rocket/avatar';
import { ItemContent, ItemTitle, ItemDescription } from '@/components/ui/Rocket/item';

export default {
  title: 'UI/AppListItem',
  component: AppListItem,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
};

const Template = (args) => <AppListItem {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  icon: (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  title: 'ToolJet',
  description: 'Open-source low-code platform',
};

export const WithActions = Template.bind({});
WithActions.args = {
  ...Basic.args,
  actions: (
    <Button variant="outline" size="sm">
      View
    </Button>
  ),
};

export const AsLink = Template.bind({});
AsLink.args = {
  ...Basic.args,
  asChild: true,
  children: (
    <a href="https://tooljet.com" target="_blank" rel="noopener noreferrer">
      <ItemContent>
        <ItemTitle>ToolJet</ItemTitle>
        <ItemDescription>Open-source low-code platform</ItemDescription>
      </ItemContent>
    </a>
  ),
};
