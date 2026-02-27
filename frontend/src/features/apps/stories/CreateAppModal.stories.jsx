import React, { useState } from 'react';
import { CreateAppModal } from '../components/CreateAppModal';
import { Button } from '@/components/ui/Button/Button';

export default {
  title: 'Features/Apps/Components/CreateAppModal',
  component: CreateAppModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls the open state of the dialog',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading state on the create button',
    },
    onCreate: { action: 'Create app clicked' },
    onOpenChange: { action: 'Open state changed' },
  },
};

// Template with controlled state
const Template = (args) => {
  const [open, setOpen] = useState(args.open || false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Create App Modal
      </Button>
      <CreateAppModal
        {...args}
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          args.onOpenChange?.(newOpen);
        }}
        onCreate={(appName) => {
          args.onCreate?.(appName);
          console.log('Creating app:', appName);
        }}
      />
    </>
  );
};

// Story with trigger button
export const WithTrigger = (args) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Create App Modal
      </Button>
      <CreateAppModal
        {...args}
        open={open}
        onOpenChange={setOpen}
        onCreate={(appName) => {
          args.onCreate?.(appName);
          console.log('Creating app:', appName);
          setOpen(false);
        }}
      />
    </>
  );
};
WithTrigger.parameters = {
  docs: {
    description: {
      story: 'Modal with a trigger button to open it.',
    },
  },
};

// Default story
export const Default = Template.bind({});
Default.args = {
  open: false,
  isLoading: false,
};

// Story showing loading state
export const Loading = Template.bind({});
Loading.args = {
  open: true,
  isLoading: true,
};
Loading.parameters = {
  docs: {
    description: {
      story: 'Modal with loading state on the create button.',
    },
  },
};

// Story showing validation states
export const ValidationStates = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Create App Modal
      </Button>
      <CreateAppModal
        open={open}
        onOpenChange={setOpen}
        onCreate={(appName) => {
          console.log('Creating app:', appName);
          setOpen(false);
        }}
      />
    </>
  );
};
ValidationStates.parameters = {
  docs: {
    description: {
      story: 'Try entering different values to see validation in action. Empty input and names over 50 characters will show validation errors.',
    },
  },
};

// Story with pre-filled value
export const WithPreFilledValue = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open Create App Modal
      </Button>
      <CreateAppModal
        open={open}
        onOpenChange={setOpen}
        onCreate={(appName) => {
          console.log('Creating app:', appName);
          setOpen(false);
        }}
      />
    </>
  );
};
WithPreFilledValue.parameters = {
  docs: {
    description: {
      story: 'Modal opens with empty input. Enter a value to see the create button become enabled.',
    },
  },
};

