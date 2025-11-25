import React from 'react';
import AppCard from './AppCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Rocket/avatar';
import { Smile } from 'lucide-react';

export default {
  title: 'UI/Blocks/AppCard',
  component: AppCard,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    canPlay: { control: 'boolean' },
    canEdit: { control: 'boolean' },
  },
};

const Template = (args) => <AppCard {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  icon: (
    <div className="tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-blue-500">
      <Smile className="tw-w-3 tw-h-3 tw-text-white" />
    </div>
  ),
  title: 'ToolJet',
  description: 'Edited 2h ago by John Doe',
  variant: 'outline',
  className: 'tw-p-4 tw-flex-col tw-items-start',
  app: { id: '1', name: 'ToolJet' },
  onPlay: (app) => console.log('Play:', app),
  onEdit: (app) => console.log('Edit:', app),
  onClone: (app) => console.log('Clone:', app),
  onDelete: (app) => console.log('Delete:', app),
  onExport: (app) => console.log('Export:', app),
  canPlay: true,
  canEdit: true,
};

export const WithAvatar = Template.bind({});
WithAvatar.args = {
  ...Basic.args,
  icon: (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const DisabledActions = Template.bind({});
DisabledActions.args = {
  ...Basic.args,
  canPlay: false,
  canEdit: false,
};

export const HoverDemo = () => (
  <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6 tw-p-6">
    <AppCard
      icon={
        <div className="tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-blue-500">
          <Smile className="tw-w-3 tw-h-3 tw-text-white" />
        </div>
      }
      title="App 1"
      description="Edited 1h ago by Alice"
      variant="outline"
      className="tw-p-4 tw-flex-col tw-items-start"
      app={{ id: '1', name: 'App 1' }}
      onPlay={(app) => console.log('Play:', app)}
      onEdit={(app) => console.log('Edit:', app)}
      canPlay={true}
      canEdit={true}
    />
    <AppCard
      icon={
        <div className="tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-green-500">
          <Smile className="tw-w-3 tw-h-3 tw-text-white" />
        </div>
      }
      title="App 2"
      description="Edited 3d ago by Bob"
      variant="outline"
      className="tw-p-4 tw-flex-col tw-items-start"
      app={{ id: '2', name: 'App 2' }}
      onPlay={(app) => console.log('Play:', app)}
      onEdit={(app) => console.log('Edit:', app)}
      canPlay={true}
      canEdit={true}
    />
    <AppCard
      icon={
        <div className="tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-purple-500">
          <Smile className="tw-w-3 tw-h-3 tw-text-white" />
        </div>
      }
      title="App 3"
      description="Edited 1w ago by Charlie"
      variant="outline"
      className="tw-p-4 tw-flex-col tw-items-start"
      app={{ id: '3', name: 'App 3' }}
      onPlay={(app) => console.log('Play:', app)}
      onEdit={(app) => console.log('Edit:', app)}
      canPlay={false}
      canEdit={true}
    />
  </div>
);
HoverDemo.parameters = {
  docs: {
    description: {
      story: 'Hover over the cards to see the icon fade out and action buttons appear with smooth animations.',
    },
  },
};

