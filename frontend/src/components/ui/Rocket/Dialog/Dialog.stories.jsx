import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from './Dialog';
import { Button } from '../Button/Button';

export default {
  title: 'Rocket/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ──────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="tw-text-sm tw-text-text-default">
            This is the dialog body content. You can put any content here.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="primary">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-wrap tw-gap-3">
      {['small', 'default', 'large', 'extraLarge'].map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button variant="outline">{size}</Button>
          </DialogTrigger>
          <DialogContent size={size}>
            <DialogHeader>
              <DialogTitle>Size: {size}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="tw-text-sm tw-text-text-default">
                This dialog uses the <code>{size}</code> size variant.
              </p>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  ),
};

// ── Fullscreen ───────────────────────────────────────────────────────────────

export const Fullscreen = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Fullscreen</Button>
      </DialogTrigger>
      <DialogContent size="fullscreen">
        <DialogHeader>
          <DialogTitle>Fullscreen Dialog</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="tw-text-sm tw-text-text-default">This dialog takes up the entire viewport.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── With Description ─────────────────────────────────────────────────────────

export const WithDescription = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Delete Item</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the item and remove all associated data.
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="primary" danger>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── No Close Button ──────────────────────────────────────────────────────────

export const NoCloseButton = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">No X Button</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="tw-text-sm tw-text-text-default">
            The close (X) button is hidden. Use the footer button to close.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── Prevent Close ────────────────────────────────────────────────────────────

export const PreventClose = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Prevent Close</Button>
      </DialogTrigger>
      <DialogContent preventClose>
        <DialogHeader>
          <DialogTitle>Cannot Dismiss</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="tw-text-sm tw-text-text-default">
            Clicking the overlay or pressing Escape won&apos;t close this dialog. Only the button below will.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Accept</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── Scrollable Content ───────────────────────────────────────────────────────

export const Scrollable = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Scrollable</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>
        <DialogBody scrollable>
          <div className="tw-flex tw-flex-col tw-gap-4 tw-text-sm tw-text-text-default">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <Button variant="primary">Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// ── No Padding ───────────────────────────────────────────────────────────────

export const NoPadding = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">No Padding</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
        </DialogHeader>
        <DialogBody noPadding>
          <div className="tw-h-64 tw-bg-background-surface-layer-02 tw-flex tw-items-center tw-justify-center">
            <span className="tw-text-sm tw-text-text-placeholder">Full-bleed content area</span>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
