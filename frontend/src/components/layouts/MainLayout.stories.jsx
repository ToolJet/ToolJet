import React, { useState } from 'react';
import { MainLayout } from './MainLayout';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { AudioWaveform, Command, GalleryVerticalEnd, Home, Blocks, Workflow, Table2, Puzzle, KeyRound, Moon, Bell, Zap } from 'lucide-react';

// Dummy workspace data for Storybook only
const DUMMY_WORKSPACES = [
  {
    name: 'Acme Inc',
    logo: GalleryVerticalEnd,
    plan: 'Enterprise',
  },
  {
    name: 'Acme Corp.',
    logo: AudioWaveform,
    plan: 'Startup',
  },
  {
    name: 'Evil Corp.',
    logo: Command,
    plan: 'Free',
  },
];

// Mock sidebar data for Storybook
const MOCK_SIDEBAR_DATA = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: DUMMY_WORKSPACES.map(ws => ({
    name: ws.name,
    logo: ws.logo,
    plan: ws.plan,
  })),
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

export default {
  title: 'Layouts/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState(DUMMY_WORKSPACES[0].name);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  return (
    <MainLayout
      workspaceName={currentWorkspace}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={handleWorkspaceChange}
      topbarLeftSlot={<TopBarSearch placeholder="Search" value={searchValue} onChange={setSearchValue} />}
      sidebarUser={MOCK_SIDEBAR_DATA.user}
      sidebarTeams={MOCK_SIDEBAR_DATA.teams}
      sidebarNavMain={MOCK_SIDEBAR_DATA.navMain}
      sidebarProjects={MOCK_SIDEBAR_DATA.projects}
    >
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold">Main Content</h1>
        <p className="tw-text-muted-foreground">This is the main content area.</p>
      </div>
    </MainLayout>
  );
};

export const WithoutWorkspaces = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <MainLayout 
      topbarLeftSlot={<TopBarSearch placeholder="Search" value={searchValue} onChange={setSearchValue} />}
      sidebarUser={MOCK_SIDEBAR_DATA.user}
      sidebarTeams={MOCK_SIDEBAR_DATA.teams}
      sidebarNavMain={MOCK_SIDEBAR_DATA.navMain}
      sidebarProjects={MOCK_SIDEBAR_DATA.projects}
    >
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold">No Workspaces</h1>
        <p className="tw-text-muted-foreground">Workspace switcher is hidden when workspaces array is empty.</p>
      </div>
    </MainLayout>
  );
};

export const WithRightSlot = () => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState(DUMMY_WORKSPACES[0].name);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  return (
    <MainLayout
      workspaceName={currentWorkspace}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={handleWorkspaceChange}
      topbarLeftSlot={<TopBarSearch placeholder="Search" value={searchValue} onChange={setSearchValue} />}
      sidebarUser={MOCK_SIDEBAR_DATA.user}
      sidebarTeams={MOCK_SIDEBAR_DATA.teams}
      sidebarNavMain={MOCK_SIDEBAR_DATA.navMain}
      sidebarProjects={MOCK_SIDEBAR_DATA.projects}
      topbarRightSlot={
        <div className="tw-flex tw-items-center tw-gap-2">
          <button className="tw-px-4 tw-py-2 tw-text-sm tw-bg-primary tw-text-primary-foreground tw-rounded-md">
            Action
          </button>
        </div>
      }
    >
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold">With Right Slot</h1>
        <p className="tw-text-muted-foreground">TopBar has a right-side action button.</p>
      </div>
    </MainLayout>
  );
};

