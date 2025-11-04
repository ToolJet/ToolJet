import React from 'react';
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter } from '../sidebar';

export default {
  title: 'UI/Rocket/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
};

export const Default = () => (
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>Header</SidebarHeader>
      <SidebarContent>Content</SidebarContent>
      <SidebarFooter>Footer</SidebarFooter>
    </Sidebar>
  </SidebarProvider>
);





