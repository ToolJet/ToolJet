import React from 'react';
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

// ── Pill ─────────────────────────────────────────────────────────────────
export const Pill = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList variant="pill">
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
export const WithIcons = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Home
        </TabsTrigger>
        <TabsTrigger value="tab2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          Settings
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
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-background-accent-weak tw-text-text-brand tw-px-1.5 tw-min-w-[18px] tw-h-[18px] tw-text-sm">3</span>
        </TabsTrigger>
        <TabsTrigger value="tab2">
          Drafts
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-background-accent-weak tw-text-text-brand tw-px-1.5 tw-min-w-[18px] tw-h-[18px] tw-text-sm">12</span>
        </TabsTrigger>
        <TabsTrigger value="tab3">Sent</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Inbox content</TabsContent>
      <TabsContent value="tab2">Drafts content</TabsContent>
      <TabsContent value="tab3">Sent content</TabsContent>
    </Tabs>
  ),
};

// ── Disabled Tab ────────────────────────────────────────────────────────
export const DisabledTab = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Active</TabsTrigger>
        <TabsTrigger value="tab2" disabled>Disabled</TabsTrigger>
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
        { variant: 'pill', label: 'Pill' },
      ].map(({ variant, label }) => (
        <div key={variant} className="tw-flex tw-flex-col tw-gap-4">
          <span className="tw-text-base tw-text-text-default tw-font-medium">{label}</span>
          {['large', 'default', 'small'].map((size) => (
            <div key={size}>
              <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">{size}</span>
              <Tabs defaultValue="tab1">
                <TabsList variant={variant}>
                  <TabsTrigger value="tab1" size={size}>General</TabsTrigger>
                  <TabsTrigger value="tab2" size={size}>Settings</TabsTrigger>
                  <TabsTrigger value="tab3" size={size}>Permissions</TabsTrigger>
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
        { variant: 'pill', label: 'Pill' },
      ].map(({ variant, label }) => (
        <div key={variant}>
          <span className="tw-text-sm tw-text-text-placeholder tw-mb-1 tw-block">{label}</span>
          <Tabs defaultValue="tab1">
            <TabsList variant={variant}>
              <TabsTrigger value="tab1">General</TabsTrigger>
              <TabsTrigger value="tab2">Settings</TabsTrigger>
              <TabsTrigger value="tab3" disabled>Disabled</TabsTrigger>
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
