'use client';

import * as React from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Rocket/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Rocket/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/Rocket/sidebar';

export function NavUser({ user, menuItems = [], platformVersion }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu className="tw-p-2">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:tw-bg-sidebar-accent data-[state=open]:tw-text-sidebar-accent-foreground"
            >
              <Avatar className="tw-h-8 tw-w-8 tw-rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="tw-rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="tw-grid tw-flex-1 tw-text-left tw-text-sm tw-leading-tight">
                <span className="tw-truncate tw-font-semibold">{user.name}</span>
                <span className="tw-truncate tw-text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="tw-ml-auto tw-size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="tw-w-[--radix-dropdown-menu-trigger-width] tw-min-w-56 tw-rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="tw-p-0 tw-font-normal">
              <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-3 tw-text-left tw-text-sm">
                <Avatar className="tw-h-8 tw-w-8 tw-rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="tw-rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="tw-grid tw-flex-1 tw-text-left tw-text-sm tw-leading-tight">
                  <span className="tw-truncate tw-font-semibold">{user.name}</span>
                  <span className="tw-truncate tw-text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {menuItems.map((item) => {
                const ItemContent = (
                  <>
                    {item.icon && <item.icon />}
                    {item.label}
                  </>
                );

                if (item.href) {
                  return (
                    <DropdownMenuItem
                      key={item.id || item.label}
                      asChild
                      className={item.destructive ? 'tw-text-destructive' : ''}
                      disabled={item.disabled}
                    >
                      <a href={item.href}>{ItemContent}</a>
                    </DropdownMenuItem>
                  );
                }

                return (
                  <DropdownMenuItem
                    key={item.id || item.label}
                    onClick={item.onClick}
                    className={item.destructive ? 'tw-text-destructive' : ''}
                    disabled={item.disabled}
                  >
                    {ItemContent}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            {platformVersion && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>{platformVersion}</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
