import React from 'react';
import AppsPageAdapter from '../adapters/AppsPageAdapter';
import { generateMockApps, generateMockFolders } from './utils';
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

// Mock action handlers for Storybook
const mockPageChanged = (page) => console.log('Page changed:', page);
const mockFolderChanged = (folder) => console.log('Folder changed:', folder);
const mockOnSearch = (key) => console.log('Search:', key);
const mockDeleteApp = (app) => console.log('Delete:', app);
const mockCloneApp = (app) => console.log('Clone:', app);
const mockExportApp = (app) => console.log('Export:', app);
const mockNavigate = (path) => console.log('Navigate:', path);
const mockWorkspaceChange = (workspace) => console.log('Workspace changed:', workspace);
const mockOnUpgrade = () => console.log('Upgrade clicked');
const mockOnCreateBlankApp = () => console.log('Create blank app');
const mockOnBuildWithAI = () => console.log('Build with AI');
const mockOnCreateModule = () => console.log('Create module');

// Dummy workspace data for Storybook
const DUMMY_WORKSPACES = [
  { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
  { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
  { name: 'Evil Corp.', logo: Command, plan: 'Free' },
];

// Mock sidebar data for Storybook
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

const meta = {
  component: AppsPageAdapter,
  title: 'Features/Apps/AppsPageAdapter',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Adapter for the main apps page, connecting legacy state to the new component architecture.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Data for apps and loading states',
    },
    filters: {
      control: 'object',
      description: 'Filters for search and folders',
    },
    actions: { control: 'object', description: 'Action handlers' },
    permissions: { control: 'object', description: 'Permission checks' },
    navigation: { control: 'object', description: 'Navigation-related props' },
    layout: { control: 'object', description: 'Layout-related props' },
    ui: { control: 'object', description: 'UI-related props' },
  },
};

export default meta;

const StoryWithWorkspace = (args) => {
  const [currentFolder, setCurrentFolder] = React.useState(args.filters?.currentFolder || {});

  // Update currentFolder when prop changes
  React.useEffect(() => {
    if (args.filters?.currentFolder) {
      setCurrentFolder(args.filters.currentFolder);
    }
  }, [args.filters?.currentFolder]);

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder || {});
    mockFolderChanged(folder);
  };

  return (
    <AppsPageAdapter
      {...args}
      filters={{
        ...args.filters,
        currentFolder,
      }}
      actions={{
        pageChanged: mockPageChanged,
        folderChanged: handleFolderChange,
        onSearch: mockOnSearch,
        deleteApp: mockDeleteApp,
        cloneApp: mockCloneApp,
        exportApp: mockExportApp,
        onUpgrade: args.actions?.onUpgrade || mockOnUpgrade,
        onCreateBlankApp: args.actions?.onCreateBlankApp || mockOnCreateBlankApp,
        onBuildWithAI: args.actions?.onBuildWithAI || mockOnBuildWithAI,
        onCreateModule: args.actions?.onCreateModule || mockOnCreateModule,
      }}
      subscriptionLimits={args.subscriptionLimits || {}}
      permissions={{
        canCreateApp: () => true,
        canDeleteApp: () => true,
        canUpdateApp: () => true,
      }}
      navigation={{
        navigate: mockNavigate,
        workspaceId: '123',
      }}
      layout={{
        workspaceName: DUMMY_WORKSPACES[0].name,
        workspaces: DUMMY_WORKSPACES,
        onWorkspaceChange: mockWorkspaceChange,
        sidebarUser: MOCK_SIDEBAR_DATA.user,
        sidebarTeams: MOCK_SIDEBAR_DATA.teams,
        sidebarNavMain: MOCK_SIDEBAR_DATA.navMain,
        sidebarProjects: MOCK_SIDEBAR_DATA.projects,
        sidebarUserMenuItems: MOCK_SIDEBAR_DATA.userMenuItems,
        sidebarPlatformVersion: MOCK_SIDEBAR_DATA.platformVersion,
      }}
      ui={{
        darkMode: false,
      }}
    />
  );
};

export const Default = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      apps: generateMockApps(50),
      meta: { current_page: 1, total_pages: 5, total_count: 50 },
    },
    filters: {
      folders: generateMockFolders(5),
    },
  },
};

export const Empty = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      apps: [],
      meta: { total_count: 0 },
    },
  },
};

export const Loading = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      apps: [],
      isLoading: true,
    },
    filters: {
      ...Default.args.filters,
      foldersLoading: true,
    },
  },
};

export const WithError = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      apps: [],
      error: new Error('Failed to fetch applications'),
    },
  },
};

export const ReachedLimit = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      apps: generateMockApps(2),
      meta: { current_page: 1, total_pages: 1, total_count: 2 },
    },
    filters: {
      folders: generateMockFolders(5),
    },
    subscriptionLimits: {
      appsLimit: {
        current: 2,
        total: 2,
        percentage: 100,
        canAddUnlimited: false,
      },
      modulesLimit: {
        current: 0,
        total: 0,
        percentage: 0,
        canAddUnlimited: false,
      },
    },
  },
};
