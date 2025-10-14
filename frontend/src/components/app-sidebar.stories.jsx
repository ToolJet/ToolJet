import React from 'react';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Separator } from './ui/separator';

export default {
  title: 'Components/AppSidebar',
  component: AppSidebar,
  decorators: [
    (Story) => (
      <SidebarProvider defaultOpen={false}>
        <Story />
      </SidebarProvider>
    ),
  ],
};

const Template = (args) => (
  <>
    <SidebarProvider
      defaultOpen={false}
      style={{
        '--sidebar-width': '350px',
      }}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="tw-bg-background tw-sticky tw-top-0 tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-p-4">
          <SidebarTrigger className="-tw-ml-1" />
          <Separator orientation="vertical" className="tw-mr-2 data-[orientation=vertical]:tw-h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="tw-hidden md:tw-block">
                <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="tw-hidden md:tw-block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Inbox</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-p-4">
          {Array.from({ length: 24 }).map((_, index) => (
            <div key={index} className="tw-bg-muted/50 tw-aspect-video tw-h-12 tw-w-full tw-rounded-lg" />
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  </>
);

export const Default = Template.bind({});
Default.args = {};

export const Collapsed = Template.bind({});
Collapsed.decorators = [
  (Story) => (
    <SidebarProvider defaultOpen={false}>
      <Story />
    </SidebarProvider>
  ),
];

export const Expanded = Template.bind({});
Expanded.decorators = [
  (Story) => (
    <SidebarProvider defaultOpen={true}>
      <Story />
    </SidebarProvider>
  ),
];
