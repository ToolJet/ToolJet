'use client';

import * as React from 'react';
import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/Rocket/sidebar';

export function NavActions({ actions, darkMode: _darkMode, onToggleDarkMode }) {
  const handleActionClick = (item, e) => {
    // If it's the Theme item, toggle dark mode instead of navigating
    if (item.name === 'Theme' && onToggleDarkMode) {
      e.preventDefault();
      onToggleDarkMode();
      return;
    }
    // For other items, allow default navigation
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {actions.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild tooltip={item.name}>
              <a href={item.url} onClick={(e) => handleActionClick(item, e)}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
