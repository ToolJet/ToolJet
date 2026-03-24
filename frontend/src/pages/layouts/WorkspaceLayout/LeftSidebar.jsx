import React from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Home,
  Blocks,
  Workflow,
  Table2,
  Puzzle,
  KeyRound,
  Moon,
  Sun,
  Bell,
  Bolt,
  Zap,
  FileText,
  LogOut,
  Monitor,
  UserRound,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/Rocket/sidebar';
import useStore from '@/AppBuilder/_stores/store';
import { getPrivateRoute } from '@/_helpers/routes';
import { useLicenseStore } from '@/_stores/licenseStore';
import { SettingsMenu } from '@/modules/dashboard/components';
import { NotificationCenter } from '@/_components/NotificationCenter';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';

const items = [
  { title: 'Home', url: 'home', icon: Home },
  { title: 'Apps', url: 'dashboard', icon: Blocks },
  { title: 'Workflows', url: 'workflows', icon: Workflow },
  { title: 'Tooljet Database', url: 'database', icon: Table2 },
  { title: 'Data sources', url: 'data_sources', icon: Puzzle },
  { title: 'Workspace constants', url: 'workspace_constants', icon: KeyRound },
];

function NavItem({ item }) {
  const match = useMatch(item.url);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} tooltip={item.title}>
        <NavLink to={getPrivateRoute(item.url)}>
          <item.icon />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function LeftSidebar() {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const { checkForUnsavedChanges } = useGlobalDatasourceUnsavedChanges();

  const featureAccess = useLicenseStore((state) => state.featureAccess);
  const updateIsTJDarkMode = useStore((state) => state.updateIsTJDarkMode);

  const handleSwitchTheme = () => {
    updateIsTJDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="tw-z-auto tw-top-[var(--header-height)] tw-h-[calc(100svh-var(--header-height))]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="tw-mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Mode" dataCy="mode-switch-button" onClick={handleSwitchTheme}>
                {darkMode ? <Sun /> : <Moon />}
                <span>{`${darkMode ? 'Dark' : 'Light'} mode`}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <NotificationCenter
              darkMode={darkMode}
              renderMenuItem={(notificationsLength) => (
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Comment notifications" dataCy="notifications-icon">
                    <Bell />

                    {Boolean(notificationsLength) && (
                      <span className="tw-absolute tw-top-0 tw-right-0 tw-translate-x-1/2 -tw-translate-y-1/2 tw-size-2 tw-rounded-full tw-bg-[#d63939]" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            />

            <SettingsMenu
              darkMode={darkMode}
              featureAccess={featureAccess}
              checkForUnsavedChanges={checkForUnsavedChanges}
              renderMenuItem={() => (
                <SidebarMenuItem>
                  <SidebarMenuButton dataCy="settings-icon">
                    <Bolt />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
