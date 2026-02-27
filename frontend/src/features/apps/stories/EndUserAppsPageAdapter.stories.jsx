import React from 'react';
import EndUserAppsPageAdapter from '../adapters/EndUserAppsPageAdapter';
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
import { generateMockApps, generateMockFolders } from './utils';

// Mock HomePage methods
const mockCanCreateApp = () => true;
const mockCanUpdateApp = (_app) => true;
const mockCanDeleteApp = (_app) => true;
const mockPageChanged = (page) => console.log('Page changed:', page);
const mockOnSearch = (key) => console.log('Search:', key);
const mockDeleteApp = (app) => console.log('Delete:', app);
const mockCloneApp = (app) => console.log('Clone:', app);
const mockExportApp = (app) => console.log('Export:', app);
const mockNavigate = (path) => console.log('Navigate:', path);

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

function StoryWithWorkspace(props) {
  const [currentWorkspace, setCurrentWorkspace] = React.useState(DUMMY_WORKSPACES[0].name);
  const [currentFolder, setCurrentFolder] = React.useState(props.filters?.currentFolder || {});

  // Update currentFolder when prop changes
  React.useEffect(() => {
    if (props.filters?.currentFolder) {
      setCurrentFolder(props.filters.currentFolder);
    }
  }, [props.filters?.currentFolder]);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder || {});
    console.log('Folder changed to:', folder);
    props.folderChanged?.(folder);
  };

  // Enhanced navigate that updates URL for Storybook
  const enhancedNavigate = React.useCallback((path) => {
    mockNavigate(path);
    // Update browser URL for Storybook
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      // Dispatch popstate to trigger any listeners
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  return (
    <EndUserAppsPageAdapter
      {...props}
      filters={{
        ...props.filters,
        currentFolder,
      }}
      actions={{
        pageChanged: props.actions?.pageChanged || mockPageChanged,
        folderChanged: handleFolderChange,
        onSearch: props.actions?.onSearch || mockOnSearch,
        deleteApp: props.actions?.deleteApp || mockDeleteApp,
        cloneApp: props.actions?.cloneApp || mockCloneApp,
        exportApp: props.actions?.exportApp || mockExportApp,
      }}
      permissions={{
        canCreateApp: props.permissions?.canCreateApp || mockCanCreateApp,
        canDeleteApp: props.permissions?.canDeleteApp || mockCanDeleteApp,
        canUpdateApp: props.permissions?.canUpdateApp || mockCanUpdateApp,
      }}
      navigation={{
        navigate: enhancedNavigate,
        workspaceId: props.navigation?.workspaceId,
        appType: props.navigation?.appType || 'front-end',
      }}
      layout={{
        workspaceName: currentWorkspace,
        workspaces: DUMMY_WORKSPACES,
        onWorkspaceChange: handleWorkspaceChange,
        sidebarUser: MOCK_SIDEBAR_DATA.user,
        sidebarTeams: MOCK_SIDEBAR_DATA.teams,
        sidebarNavMain: MOCK_SIDEBAR_DATA.navMain,
        sidebarProjects: MOCK_SIDEBAR_DATA.projects,
      }}
    />
  );
}

const meta = {
  component: EndUserAppsPageAdapter,
  title: 'Features/Apps/EndUserAppsPageAdapter',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Adapter for the end-user apps page, connecting legacy state to the new component architecture. This story demonstrates the component with mock modules data.',
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
  },
};

export default meta;

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
      meta: {},
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
      meta: {},
    },
  },
};
