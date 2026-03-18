import React from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/Rocket/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Rocket/breadcrumb';
import { Separator } from '@/components/ui/Rocket/separator';
import {
  Home,
  Blocks,
  Workflow,
  Table2,
  Puzzle,
  KeyRound,
  Moon,
  Bell,
  Zap,
  GalleryVerticalEnd,
  FileText,
  LogOut,
  Monitor,
  UserRound,
} from 'lucide-react';

// Mock sidebar data
const mockSidebarData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'AB',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  navMain: [
    {
      title: 'Home',
      url: '#',
      icon: Home,
      isActive: false,
      items: [],
    },
    {
      title: 'Apps',
      url: '#',
      icon: Blocks,
      isActive: true,
      items: [],
    },
    {
      title: 'Workflows',
      url: '#',
      icon: Workflow,
      isActive: false,
      items: [],
    },
    {
      title: 'Database',
      url: '#',
      icon: Table2,
      isActive: false,
      items: [],
    },
    {
      title: 'Plugins',
      url: '#',
      icon: Puzzle,
      isActive: false,
      items: [],
    },
    {
      title: 'Resources',
      url: '#',
      icon: KeyRound,
      isActive: false,
      items: [],
    },
  ],
  projects: [
    {
      name: 'Theme',
      url: '#',
      icon: Moon,
    },
    {
      name: 'Notifications',
      url: '#',
      icon: Bell,
    },
    {
      name: 'Quick Actions',
      url: '#',
      icon: Zap,
    },
  ],
  userMenuItems: [
    {
      id: 'audit-logs',
      label: 'Audit logs',
      icon: FileText,
      href: '#audit-logs',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Zap,
      href: '#settings',
    },
    {
      id: 'workspace-settings',
      label: 'Workspace settings',
      icon: Monitor,
      href: '#workspace',
    },
    {
      id: 'profile-settings',
      label: 'Profile settings',
      icon: UserRound,
      href: '#profile',
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: LogOut,
      onClick: () => console.log('Logout clicked'),
      destructive: true,
    },
  ],
  platformVersion: '3.20.46-cloud-lts',
};

export default {
  title: 'UI/Blocks/AppSidebar',
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
    <AppSidebar {...args} />
    <SidebarInset>
      <header className="tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-gap-2 tw-transition-[width,height] tw-ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:tw-h-12">
        <div className="tw-flex tw-items-center tw-gap-2 tw-px-4">
          <SidebarTrigger className="-tw-ml-1" />
          <Separator orientation="vertical" className="tw-mr-2 data-[orientation=vertical]:tw-h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="tw-hidden md:tw-block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="tw-hidden md:tw-block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-p-4 tw-pt-0">
        <div className="tw-grid tw-auto-rows-min tw-gap-4 md:tw-grid-cols-3">
          <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
          <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
          <div className="tw-bg-muted/50 tw-aspect-video tw-rounded-xl" />
        </div>
        <div className="tw-bg-muted/50 tw-min-h-[100vh] tw-flex-1 tw-rounded-xl md:tw-min-h-min" />
      </div>
    </SidebarInset>
  </>
);

export const Default = Template.bind({});
Default.args = mockSidebarData;
