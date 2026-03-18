import React from 'react';
import WorkflowsPageAdapter from '../adapters/WorkflowsPageAdapter';
import { generateMockWorkflows, generateMockFolders } from './utils';
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
const mockFolderChanged = (folder) => console.log('Folder changed:', folder);
const mockOnSearch = (key) => console.log('Search:', key);
const mockDeleteWorkflow = (wf) => console.log('Delete workflow:', wf);
const mockRunWorkflow = (wf) => console.log('Run workflow:', wf);
const mockReloadWorkflows = () => console.log('Reload workflows');
const mockDuplicateWorkflow = (wf) => console.log('Duplicate workflow:', wf);
const mockCreateWorkflow = (config) => console.log('Create workflow:', config);
const mockUpdateWorkflow = (wf) => console.log('Update workflow:', wf);
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
      isActive: true,
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
  component: WorkflowsPageAdapter,
  title: 'Features/Workflows/WorkflowsPageAdapter',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Adapter for the workflows page, managing workflow automation and orchestration.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Data for workflows and loading states',
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
    subscriptionLimits: { control: 'object', description: 'Subscription limits' },
  },
};

export default meta;

const StoryWithWorkspace = (args) => {
  const [currentFolder, setCurrentFolder] = React.useState(args.filters?.currentFolder || null);

  // Update currentFolder when prop changes
  React.useEffect(() => {
    if (args.filters?.currentFolder !== undefined) {
      setCurrentFolder(args.filters.currentFolder);
    }
  }, [args.filters?.currentFolder]);

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder || null);
    mockFolderChanged(folder);
  };

  return (
    <WorkflowsPageAdapter
      {...args}
      filters={{
        ...args.filters,
        currentFolder,
      }}
      actions={{
        pageChanged: mockPageChanged,
        folderChanged: handleFolderChange,
        onSearch: mockOnSearch,
        deleteWorkflow: mockDeleteWorkflow,
        runWorkflow: mockRunWorkflow,
        reloadWorkflows: mockReloadWorkflows,
        duplicateWorkflow: mockDuplicateWorkflow,
        createWorkflow: args.actions?.createWorkflow || mockCreateWorkflow,
        updateWorkflow: mockUpdateWorkflow,
      }}
      subscriptionLimits={args.subscriptionLimits || {}}
      permissions={{
        canCreateWorkflow: () => true,
        canDeleteWorkflow: () => true,
        canUpdateWorkflow: () => true,
        canRunWorkflow: () => true,
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
      workflows: generateMockWorkflows(50),
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
      workflows: [],
      meta: { total_count: 0 },
    },
  },
};

export const Loading = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    data: {
      workflows: [],
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
      workflows: [],
      error: new Error('Failed to fetch workflows'),
    },
  },
};

export const ReachedLimit = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      workflows: generateMockWorkflows(2),
      meta: { current_page: 1, total_pages: 1, total_count: 2 },
    },
    filters: {
      folders: generateMockFolders(5),
    },
    subscriptionLimits: {
      workflowsLimit: {
        current: 2,
        total: 2,
        percentage: 100,
        canAddUnlimited: false,
      },
    },
  },
};

export const FewWorkflows = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      workflows: generateMockWorkflows(5),
      meta: { current_page: 1, total_pages: 1, total_count: 5 },
    },
    filters: {
      folders: generateMockFolders(3),
    },
  },
};

export const WithSearch = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      workflows: generateMockWorkflows(50),
      meta: { current_page: 1, total_pages: 5, total_count: 50 },
    },
    filters: {
      folders: generateMockFolders(5),
      workflowSearchKey: 'sync',
    },
  },
};

export const ActiveWorkflowsOnly = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      workflows: generateMockWorkflows(20).map((wf) => ({ ...wf, status: 'active' })),
      meta: { current_page: 1, total_pages: 2, total_count: 20 },
    },
    filters: {
      folders: generateMockFolders(3),
    },
  },
};

export const DraftWorkflows = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    data: {
      workflows: generateMockWorkflows(10).map((wf) => ({ ...wf, status: 'draft', last_run: null })),
      meta: { current_page: 1, total_pages: 1, total_count: 10 },
    },
    filters: {
      folders: generateMockFolders(3),
    },
  },
};

export const NoPermissions = {
  render: (args) => {
    return (
      <WorkflowsPageAdapter
        {...args}
        filters={{
          ...args.filters,
          currentFolder: null,
        }}
        actions={{
          pageChanged: mockPageChanged,
          folderChanged: mockFolderChanged,
          onSearch: mockOnSearch,
          deleteWorkflow: mockDeleteWorkflow,
          runWorkflow: mockRunWorkflow,
          reloadWorkflows: mockReloadWorkflows,
          duplicateWorkflow: mockDuplicateWorkflow,
          createWorkflow: mockCreateWorkflow,
          updateWorkflow: mockUpdateWorkflow,
        }}
        subscriptionLimits={{}}
        permissions={{
          canCreateWorkflow: () => false,
          canDeleteWorkflow: () => false,
          canUpdateWorkflow: () => false,
          canRunWorkflow: () => false,
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
      workflows: generateMockWorkflows(10),
      meta: { current_page: 1, total_pages: 1, total_count: 10 },
    },
    filters: {
      folders: generateMockFolders(3),
    },
  },
};

export const DarkMode = {
  render: (args) => <StoryWithWorkspace {...args} />,
  args: {
    ...Default.args,
    ui: {
      darkMode: true,
    },
  },
};
