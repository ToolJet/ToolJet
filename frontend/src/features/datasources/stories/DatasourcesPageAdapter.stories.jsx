import React from 'react';
import DatasourcesPageAdapter from '../adapters/DatasourcesPageAdapter';
import { generateMockDatasources, generateMockEnvironments } from './utils';
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
  Database,
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
const mockEnvironmentChanged = (env) => console.log('Environment changed:', env);
const mockOnSearch = (key) => console.log('Search:', key);
const mockDeleteDatasource = (ds) => console.log('Delete datasource:', ds);
const mockTestConnection = (ds) => console.log('Test connection:', ds);
const mockReloadDatasources = () => console.log('Reload datasources');
const mockDuplicateDatasource = (ds) => console.log('Duplicate datasource:', ds);
const mockCreateDatasource = () => console.log('Create datasource');
const mockNavigate = (path) => console.log('Navigate:', path);
const mockWorkspaceChange = (workspace) => console.log('Workspace changed:', workspace);

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
      isActive: false,
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
      title: 'Data sources',
      url: '#',
      icon: Database,
      isActive: true,
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
  component: DatasourcesPageAdapter,
  title: 'Features/Datasources/DatasourcesPageAdapter',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Adapter for the datasources page, managing data source connections and configurations.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Data for datasources and loading states',
    },
    filters: {
      control: 'object',
      description: 'Filters for search and environments',
    },
    actions: { control: 'object', description: 'Action handlers' },
    permissions: { control: 'object', description: 'Permission checks' },
    navigation: { control: 'object', description: 'Navigation-related props' },
    layout: { control: 'object', description: 'Layout-related props' },
    ui: { control: 'object', description: 'UI-related props' },
    subscriptionLimits: { control: 'object', description: 'Subscription limits' },
  },
};

export default meta;

const StoryWithWorkspace = (args) => {
  const [currentEnvironment, setCurrentEnvironment] = React.useState(args.filters?.currentEnvironment || null);

  // Update currentEnvironment when prop changes
  React.useEffect(() => {
    if (args.filters?.currentEnvironment !== undefined) {
      setCurrentEnvironment(args.filters.currentEnvironment);
    }
  }, [args.filters?.currentEnvironment]);

  const handleEnvironmentChange = (env) => {
    setCurrentEnvironment(env || null);
    mockEnvironmentChanged(env);
  };

  return (
    <DatasourcesPageAdapter
      {...args}
      filters={{
        ...args.filters,
        currentEnvironment,
      }}
      actions={{
        pageChanged: mockPageChanged,
        environmentChanged: handleEnvironmentChange,
        onSearch: mockOnSearch,
        deleteDatasource: mockDeleteDatasource,
        testConnection: mockTestConnection,
        reloadDatasources: mockReloadDatasources,
        duplicateDatasource: mockDuplicateDatasource,
        createDatasource: args.actions?.createDatasource || mockCreateDatasource,
      }}
      subscriptionLimits={args.subscriptionLimits || {}}
      permissions={{
        canCreateDatasource: () => true,
        canDeleteDatasource: () => true,
        canUpdateDatasource: () => true,
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
      datasources: generateMockDatasources(50),
      meta: { current_page: 1, total_pages: 5, total_count: 50 },
    },
    filters: {
      environments: generateMockEnvironments(5),
    },
  },
};

export const Empty = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      datasources: [],
      meta: { total_count: 0 },
    },
  },
};

export const Loading = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      datasources: [],
      isLoading: true,
    },
    filters: {
      ...Default.args.filters,
      environmentsLoading: true,
    },
  },
};

export const WithError = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      datasources: [],
      error: new Error('Failed to fetch datasources'),
    },
  },
};

export const ReachedLimit = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      datasources: generateMockDatasources(2),
      meta: { current_page: 1, total_pages: 1, total_count: 2 },
    },
    filters: {
      environments: generateMockEnvironments(5),
    },
    subscriptionLimits: {
      datasourcesLimit: {
        current: 2,
        total: 2,
        percentage: 100,
        canAddUnlimited: false,
      },
    },
  },
};

export const FewDatasources = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      datasources: generateMockDatasources(5),
      meta: { current_page: 1, total_pages: 1, total_count: 5 },
    },
    filters: {
      environments: generateMockEnvironments(3),
    },
  },
};

export const WithSearch = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      datasources: generateMockDatasources(50),
      meta: { current_page: 1, total_pages: 5, total_count: 50 },
    },
    filters: {
      environments: generateMockEnvironments(5),
      datasourceSearchKey: 'postgres',
    },
  },
};

export const NoPermissions = {
  render: (args) => {
    return (
      <DatasourcesPageAdapter
        {...args}
        filters={{
          ...args.filters,
          currentEnvironment: null,
        }}
        actions={{
          pageChanged: mockPageChanged,
          environmentChanged: mockEnvironmentChanged,
          onSearch: mockOnSearch,
          deleteDatasource: mockDeleteDatasource,
          testConnection: mockTestConnection,
          reloadDatasources: mockReloadDatasources,
          duplicateDatasource: mockDuplicateDatasource,
          createDatasource: mockCreateDatasource,
        }}
        subscriptionLimits={{}}
        permissions={{
          canCreateDatasource: () => false,
          canDeleteDatasource: () => false,
          canUpdateDatasource: () => false,
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
  },
  args: {
    data: {
      datasources: generateMockDatasources(10),
      meta: { current_page: 1, total_pages: 1, total_count: 10 },
    },
    filters: {
      environments: generateMockEnvironments(3),
    },
  },
};
