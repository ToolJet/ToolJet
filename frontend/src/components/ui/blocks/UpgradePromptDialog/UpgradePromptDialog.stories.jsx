import * as React from 'react';
import { UpgradePromptDialog } from './UpgradePromptDialog';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogTrigger } from '@/components/ui/Rocket/dialog';

export default {
  title: 'UI/Blocks/UpgradePromptDialog',
  component: UpgradePromptDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    currentCount: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current count for the progress indicator',
    },
    maxCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum count for the progress indicator',
    },
    onUpgrade: { action: 'Upgrade clicked' },
  },
};

// Template with controlled state
const Template = (args) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Upgrade Dialog
      </Button>
      <UpgradePromptDialog {...args} open={open} onOpenChange={setOpen} />
    </>
  );
};

// Story with trigger button following shadcn/ui pattern
export const WithTrigger = (args) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Upgrade Dialog</Button>
      </DialogTrigger>
      <UpgradePromptDialog
        {...args}
        onUpgrade={() => {
          args.onUpgrade();
          console.log('Upgrade clicked');
        }}
      />
    </Dialog>
  );
};
WithTrigger.args = {
  currentCount: 2,
  maxCount: 2,
};
WithTrigger.parameters = {
  docs: {
    description: {
      story: 'Dialog with trigger button following shadcn/ui pattern using DialogTrigger with asChild prop.',
    },
  },
};

// Default story
export const Default = Template.bind({});
Default.args = {
  currentCount: 2,
  maxCount: 2,
};

// Story with different counts
export const DifferentCounts = Template.bind({});
DifferentCounts.args = {
  currentCount: 5,
  maxCount: 10,
};

// Story showing completion (at max)
export const AtMaxCount = Template.bind({});
AtMaxCount.args = {
  currentCount: 2,
  maxCount: 2,
};

// Story showing start (at zero)
export const AtStart = Template.bind({});
AtStart.args = {
  currentCount: 0,
  maxCount: 2,
};

