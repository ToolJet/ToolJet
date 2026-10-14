import React from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogMedia,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './AlertDialog';
import { Button } from '@/components/ui/Rocket/Button/Button';

export default {
  title: 'Rocket/AlertDialog',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary">Open Alert</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-brand" />
          </AlertDialogMedia>
          <AlertDialogTitle>Lorem ipsum dolor sit amet.</AlertDialogTitle>
          <AlertDialogDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer elementum mattis arcu, non vulputate est
            ornare vitae.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <div className="tw-flex tw-gap-2">
            <Button variant="secondary">Secondary action</Button>
            <AlertDialogAction asChild>
              <Button variant="primary">Primary action</Button>
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ── Danger ──────────────────────────────────────────────────────────────────

export const Danger = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary" danger>
          Delete Item
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-danger" />
          </AlertDialogMedia>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <div className="tw-flex tw-gap-2">
            <Button variant="secondary" danger>
              Secondary action
            </Button>
            <AlertDialogAction asChild>
              <Button variant="primary" danger>
                Delete
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ── Simple (Cancel + Action only) ───────────────────────────────────────────

export const Simple = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Discard Changes</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-brand" />
          </AlertDialogMedia>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="primary">Discard</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ── Small ───────────────────────────────────────────────────────────────────

export const Small = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Small Alert</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-brand" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="primary" danger>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// ── Without Media ───────────────────────────────────────────────────────────

export const WithoutMedia = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Confirm Action</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm this action?</AlertDialogTitle>
          <AlertDialogDescription>Please confirm you want to proceed with this operation.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="primary">Confirm</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
