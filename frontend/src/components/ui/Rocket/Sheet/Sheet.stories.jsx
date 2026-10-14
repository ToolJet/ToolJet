import React from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './Sheet';
import { Button } from '@/components/ui/Rocket/Button/Button';

export default {
  title: 'Rocket/Sheet',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="primary">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add new datasource</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <p className="tw-text-sm tw-text-text-default">Sheet body content goes here.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button variant="primary">Continue</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// ── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes = {
  render: () => (
    <div className="tw-flex tw-gap-3">
      {['small', 'default', 'large'].map((size) => (
        <Sheet key={size}>
          <SheetTrigger asChild>
            <Button variant="outline">{size}</Button>
          </SheetTrigger>
          <SheetContent size={size}>
            <SheetHeader>
              <SheetTitle>Size: {size}</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <p className="tw-text-sm tw-text-text-default">
                This sheet uses the <code>{size}</code> size variant.
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};

// ── With Description ────────────────────────────────────────────────────────

export const WithDescription = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="primary">Add Datasource</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="tw-flex tw-flex-col tw-gap-1">
            <SheetTitle>Connect a new datasource</SheetTitle>
            <SheetDescription>Choose a datasource type to get started.</SheetDescription>
          </div>
        </SheetHeader>
        <SheetBody>
          <p className="tw-text-sm tw-text-text-default">
            Sheet body content for selecting and configuring a datasource.
          </p>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button variant="primary">Next</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// ── Overflow Border ─────────────────────────────────────────────────────────
// Footer border only appears when body content overflows.

export const OverflowBorder = {
  render: () => (
    <div className="tw-flex tw-gap-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Short Content</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Short Content</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <p className="tw-text-sm tw-text-text-default">This content fits — no footer border.</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button variant="primary">Confirm</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Long Content</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Long Content</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="tw-flex tw-flex-col tw-gap-4 tw-text-sm tw-text-text-default">
              {Array.from({ length: 30 }, (_, i) => (
                <p key={i}>
                  Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.
                </p>
              ))}
            </div>
          </SheetBody>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button variant="primary">Confirm</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

// ── Prevent Close ───────────────────────────────────────────────────────────

export const PreventClose = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Prevent Close</Button>
      </SheetTrigger>
      <SheetContent preventClose>
        <SheetHeader>
          <SheetTitle>Multi-step form</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <p className="tw-text-sm tw-text-text-default">
            Clicking outside or pressing Escape won&apos;t close this sheet. Use the footer button.
          </p>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="primary">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
