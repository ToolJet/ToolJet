import * as React from 'react';

import { NavMenu } from './nav-menu';
import { NavActions } from './nav-actions';
import { NavUser } from './nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from '@/components/ui/Rocket/sidebar';

export function AppSidebar({ 
  user = {},
  teams = [],
  navMain = [],
  projects = [],
  ...props 
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMenu items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavActions actions={projects} />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

