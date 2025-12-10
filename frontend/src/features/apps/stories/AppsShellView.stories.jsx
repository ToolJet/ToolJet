import React, { useState } from 'react';
import { AppsShellView } from '../components/AppsShellView';
import { ResourcePageHeader } from '@/components/ui/blocks/ResourcePageHeader';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
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
  Bell,
  Zap,
  FileText,
  LogOut,
  Monitor,
  UserRound,
} from 'lucide-react';

const DUMMY_WORKSPACES = [
  { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
  { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
  { name: 'Evil Corp.', logo: Command, plan: 'Free' },
];

const MOCK_SIDEBAR_DATA = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: DUMMY_WORKSPACES.map((ws) => ({
    name: ws.name,
    logo: ws.logo,
    plan: ws.plan,
  })),
  navMain: [
    { title: 'Home', url: '#', icon: Home, isActive: false, items: [] },
    { title: 'Apps', url: '#', icon: Blocks, isActive: true, items: [] },
    {
      title: 'Workflows',
      url: '#',
      icon: Workflow,
      isActive: false,
      items: [],
    },
    { title: 'Database', url: '#', icon: Table2, isActive: false, items: [] },
    { title: 'Plugins', url: '#', icon: Puzzle, isActive: false, items: [] },
    {
      title: 'Resources',
      url: '#',
      icon: KeyRound,
      isActive: false,
      items: [],
    },
  ],
  projects: [
    { name: 'Theme', url: '#', icon: Moon },
    { name: 'Notifications', url: '#', icon: Bell },
    { name: 'Quick Actions', url: '#', icon: Zap },
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
  title: 'Features/Apps/Components/AppsShellView',
  component: AppsShellView,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState(DUMMY_WORKSPACES[0].name);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <AppsShellView
      searchValue={searchValue}
      onSearch={setSearchValue}
      workspaceName={currentWorkspace}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={(ws) => {
        setCurrentWorkspace(ws.name);
        console.log('Workspace changed:', ws);
      }}
      sidebarUser={MOCK_SIDEBAR_DATA.user}
      sidebarTeams={MOCK_SIDEBAR_DATA.teams}
      sidebarNavMain={MOCK_SIDEBAR_DATA.navMain}
      sidebarProjects={MOCK_SIDEBAR_DATA.projects}
      sidebarUserMenuItems={MOCK_SIDEBAR_DATA.userMenuItems}
      sidebarPlatformVersion={MOCK_SIDEBAR_DATA.platformVersion}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      header={<ResourcePageHeader title="Applications" />}
      footer={<PaginationFooter recordCount={50} currentPage={1} totalPages={5} />}
    >
      <div className="tw-p-6">Content goes here</div>
    </AppsShellView>
  );
};

export const Minimal = () => {
  return (
    <AppsShellView searchValue="" onSearch={() => {}}>
      <div className="tw-p-6">Minimal shell view</div>
    </AppsShellView>
  );
};

export const WithDarkMode = () => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <AppsShellView
      searchValue=""
      onSearch={() => {}}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
    >
      <div className="tw-p-6">Dark mode enabled</div>
    </AppsShellView>
  );
};
