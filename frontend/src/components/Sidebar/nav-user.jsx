"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./sidebar";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
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
                <span className="tw-truncate tw-font-semibold">
                  {user.name}
                </span>
                <span className="tw-truncate tw-text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="tw-ml-auto tw-size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="tw-w-[--radix-dropdown-menu-trigger-width] tw-min-w-56 tw-rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="tw-p-0 tw-font-normal">
              <div className="tw-flex tw-items-center tw-gap-2 tw-px-1 tw-py-1.5 tw-text-left tw-text-sm">
                <Avatar className="tw-h-8 tw-w-8 tw-rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="tw-rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="tw-grid tw-flex-1 tw-text-left tw-text-sm tw-leading-tight">
                  <span className="tw-truncate tw-font-semibold">
                    {user.name}
                  </span>
                  <span className="tw-truncate tw-text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
