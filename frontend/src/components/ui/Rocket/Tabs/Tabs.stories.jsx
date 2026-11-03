import React from 'react';
import { ArrowDownWideNarrow, Funnel, House, Lock, Settings } from 'lucide-react';

import { Button } from '@/components/ui/Rocket/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

export default {
  title: 'Rocket/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

// ── Default (underline) ─────────────────────────────────────────────────
export const Default = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">General</TabsTrigger>
        <TabsTrigger value="tab2">Settings</TabsTrigger>
        <TabsTrigger value="tab3">Permissions</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">General content</TabsContent>
      <TabsContent value="tab2">Settings content</TabsContent>
      <TabsContent value="tab3">Permissions content</TabsContent>
    </Tabs>
  ),
};

// ── Underline Inverted ──────────────────────────────────────────────────
export const UnderlineInverted = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList variant="underline-inverted">
        <TabsTrigger value="tab1">General</TabsTrigger>
        <TabsTrigger value="tab2">Settings</TabsTrigger>
        <TabsTrigger value="tab3">Permissions</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">General content</TabsContent>
      <TabsContent value="tab2">Settings content</TabsContent>
      <TabsContent value="tab3">Permissions content</TabsContent>
    </Tabs>
  ),
};

// ── With Icons ──────────────────────────────────────────────────────────
// Icon goes in `leadingVisual`: icon/weak at rest, icon/accent when selected.
export const WithIcons = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1" leadingVisual={<House />}>
          Home
        </TabsTrigger>
        <TabsTrigger value="tab2" leadingVisual={<Settings />}>
          Settings
        </TabsTrigger>
        <TabsTrigger value="tab3" leadingVisual={<Lock />} disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Home content</TabsContent>
      <TabsContent value="tab2">Settings content</TabsContent>
    </Tabs>
  ),
};

// ── With Badges ─────────────────────────────────────────────────────────
export const WithBadges = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">
          Inbox
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-background-accent-weak tw-text-text-brand tw-px-1.5 tw-min-w-[18px] tw-h-[18px] tw-text-sm">
            3
          </span>
        </TabsTrigger>
        <TabsTrigger value="tab2">
          Drafts
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-background-accent-weak tw-text-text-brand tw-px-1.5 tw-min-w-[18px] tw-h-[18px] tw-text-sm">
            12
          </span>
        </TabsTrigger>
        <TabsTrigger value="tab3">Sent</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Inbox content</TabsContent>
      <TabsContent value="tab2">Drafts content</TabsContent>
      <TabsContent value="tab3">Sent content</TabsContent>
    </Tabs>
  ),
};

// ── With Actions ────────────────────────────────────────────────────────
// Actions are siblings of TabsList: a tablist may only own tabs (ARIA). The row owns the
// full-width border, so TabsList drops its own.
export const WithActions = {
  render: () => (
    <Tabs defaultValue="tab1" className="tw-w-[480px]">
      <div className="tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        <TabsList className="tw-border-b-0">
          <TabsTrigger value="tab1">General</TabsTrigger>
          <TabsTrigger value="tab2">Settings</TabsTrigger>
        </TabsList>
        <div role="group" aria-label="Options" className="tw-flex tw-items-center tw-gap-1">
          <Button variant="ghost" size="medium" iconOnly aria-label="Filter">
            <Funnel />
          </Button>
          <Button variant="ghost" size="medium" iconOnly aria-label="Sort">
            <ArrowDownWideNarrow />
          </Button>
        </div>
      </div>
      <TabsContent value="tab1">General content</TabsContent>
      <TabsContent value="tab2">Settings content</TabsContent>
    </Tabs>
  ),
};

// ── Disabled Tab ────────────────────────────────────────────────────────
export const DisabledTab = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Active</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="tab3">Another</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Active content</TabsContent>
      <TabsContent value="tab3">Another content</TabsContent>
    </Tabs>
  ),
};

// ── Sizes ───────────────────────────────────────────────────────────────
export const Sizes = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-8">
      {[
        { variant: 'underline', label: 'Underline' },
        { variant: 'underline-inverted', label: 'Underline Inverted' },
      ].map(({ variant, label }) => (
        <div key={variant} className="tw-flex tw-flex-col tw-gap-4">
          <span className="tw-text-base tw-text-text-default tw-font-medium">{label}</span>
          {['large', 'default', 'small'].map((size) => (
            <div key={size}>
              <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">{size}</span>
              <Tabs defaultValue="tab1">
                <TabsList variant={variant}>
                  <TabsTrigger value="tab1" size={size}>
                    General
                  </TabsTrigger>
                  <TabsTrigger value="tab2" size={size}>
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="tab3" size={size}>
                    Permissions
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};

// ── All Variants ────────────────────────────────────────────────────────
export const AllVariants = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-6">
      {[
        { variant: 'underline', label: 'Underline (default)' },
        { variant: 'underline-inverted', label: 'Underline Inverted' },
      ].map(({ variant, label }) => (
        <div key={variant}>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">{label}</span>
          <Tabs defaultValue="tab1">
            <TabsList variant={variant}>
              <TabsTrigger value="tab1">General</TabsTrigger>
              <TabsTrigger value="tab2">Settings</TabsTrigger>
              <TabsTrigger value="tab3" disabled>
                Disabled
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">General content</TabsContent>
            <TabsContent value="tab2">Settings content</TabsContent>
          </Tabs>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
