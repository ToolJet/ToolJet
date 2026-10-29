import React from 'react';
import { Toaster, toast } from './Sonner';
import { Button } from '@/components/ui/Rocket/Button/Button';

export default {
  title: 'Rocket/Sonner',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <>
        <Toaster />
        <Story />
      </>
    ),
  ],
};

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <Button variant="outline" onClick={() => toast('This is a default toast')}>
      Default Toast
    </Button>
  ),
};

// ── Success ─────────────────────────────────────────────────────────────────

export const Success = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.success('Item saved', { description: 'Your changes have been saved successfully.' })}
    >
      Success Toast
    </Button>
  ),
};

// ── Error ───────────────────────────────────────────────────────────────────

export const Error = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.error('Something went wrong', { description: 'Please try again later.' })}
    >
      Error Toast
    </Button>
  ),
};

// ── Warning ─────────────────────────────────────────────────────────────────

export const Warning = {
  render: () => (
    <Button variant="outline" onClick={() => toast.warning('Proceed with caution')}>
      Warning Toast
    </Button>
  ),
};

// ── Info ────────────────────────────────────────────────────────────────────

export const Info = {
  render: () => (
    <Button variant="outline" onClick={() => toast.info('New version available')}>
      Info Toast
    </Button>
  ),
};

// ── Loading ─────────────────────────────────────────────────────────────────

export const Loading = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.loading('Uploading...');
        setTimeout(() => toast.success('Upload complete', { id }), 2000);
      }}
    >
      Loading Toast
    </Button>
  ),
};

// ── With Action ─────────────────────────────────────────────────────────────

export const WithAction = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast('Item deleted', {
          action: {
            label: 'Undo',
            onClick: () => toast.success('Restored'),
          },
        })
      }
    >
      Toast with Action
    </Button>
  ),
};

// ── All Types ───────────────────────────────────────────────────────────────

export const AllTypes = {
  render: () => (
    <div className="tw-flex tw-flex-wrap tw-gap-2">
      <Button variant="outline" onClick={() => toast('Default notification')}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success('Success!')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Error!')}>
        Error
      </Button>
      <Button variant="outline" onClick={() => toast.warning('Warning!')}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.info('Info!')}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.loading('Loading...')}>
        Loading
      </Button>
    </div>
  ),
};
