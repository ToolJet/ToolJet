import React from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '../sidebar';
import { Home, Settings, User } from 'lucide-react';

export default {
  title: 'UI/Rocket/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>Header</SidebarHeader>
      <SidebarContent>Content</SidebarContent>
      <SidebarFooter>Footer</SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold">Main Content</h1>
        <p className="tw-text-muted-foreground">This is the main content area.</p>
      </div>
    </SidebarInset>
  </SidebarProvider>
);

export const WithMenu = () => (
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>
        <div className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5">
          <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-primary-foreground">
            <span className="tw-text-sm tw-font-semibold">TJ</span>
          </div>
          <div className="tw-grid tw-flex-1">
            <span className="tw-text-sm tw-font-semibold">ToolJet</span>
            <span className="tw-text-xs tw-text-muted-foreground">Workspace</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#">
                  <Home className="tw-size-4" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#">
                  <Settings className="tw-size-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#">
                  <User className="tw-size-4" />
                  <span>Profile</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-muted">
                  <User className="tw-size-4" />
                </div>
                <div className="tw-grid tw-flex-1 tw-text-left tw-text-sm tw-leading-tight">
                  <span className="tw-truncate tw-font-semibold">User Name</span>
                  <span className="tw-truncate tw-text-xs tw-text-muted-foreground">user@example.com</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <header className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-px-4">
        <SidebarTrigger />
        <SidebarSeparator orientation="vertical" className="tw-mr-2" />
        <h1 className="tw-text-lg tw-font-semibold">Dashboard</h1>
      </header>
      <div className="tw-p-8">
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Welcome</h2>
        <p className="tw-text-muted-foreground">This is the main content area with a sidebar menu.</p>
      </div>
    </SidebarInset>
  </SidebarProvider>
);

export const Collapsible = () => (
  <SidebarProvider defaultOpen={true}>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5">
          <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-primary-foreground">
            <span className="tw-text-sm tw-font-semibold">TJ</span>
          </div>
          <div className="tw-grid tw-flex-1">
            <span className="tw-text-sm tw-font-semibold">ToolJet</span>
            <span className="tw-text-xs tw-text-muted-foreground">Workspace</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Home">
                <a href="#">
                  <Home className="tw-size-4" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <a href="#">
                  <Settings className="tw-size-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profile">
                <a href="#">
                  <User className="tw-size-4" />
                  <span>Profile</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <SidebarInset>
      <header className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-px-4">
        <SidebarTrigger />
        <h1 className="tw-text-lg tw-font-semibold">Collapsible Sidebar</h1>
      </header>
      <div className="tw-p-8">
        <p className="tw-text-muted-foreground">Click the trigger button to collapse/expand the sidebar.</p>
      </div>
    </SidebarInset>
  </SidebarProvider>
);
