import * as React from 'react';
import { Home, Blocks, Workflow, Table2, Puzzle, KeyRound, Moon, Bell, Zap, GalleryVerticalEnd } from 'lucide-react';

import { NavMenu } from './nav-menu';
import { NavActions } from './nav-actions';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/Rocket/sidebar';

// ToolJet sidebar data based on Figma design
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
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
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMenu items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavActions actions={data.projects} />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

