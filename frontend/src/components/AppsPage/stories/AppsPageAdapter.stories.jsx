import React from 'react';
import AppsPageAdapter from '../AppsPageAdapter';
import data from '../data.json';
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
} from 'lucide-react';

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

// Mock folder data
const MOCK_FOLDERS = [
  { id: 1, name: 'Marketing', count: 5 },
  { id: 2, name: 'Sales', count: 3 },
  { id: 3, name: 'Engineering', count: 8 },
  { id: 4, name: 'Design', count: 2 },
];

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
};

function StoryWithWorkspace(props) {
  const [currentWorkspace, setCurrentWorkspace] = React.useState(DUMMY_WORKSPACES[0].name);
  const [currentFolder, setCurrentFolder] = React.useState(props.currentFolder || {});

  // Update currentFolder when prop changes
  React.useEffect(() => {
    if (props.currentFolder) {
      setCurrentFolder(props.currentFolder);
    }
  }, [props.currentFolder]);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder || {});
    console.log('Folder changed to:', folder);
    props.folderChanged?.(folder);
  };

  // Extract currentFolder and folderChanged from props to avoid conflicts
  const { currentFolder: propCurrentFolder, folderChanged: propFolderChanged, ...restProps } = props;

  return (
    <AppsPageAdapter
      workspaceName={currentWorkspace}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={handleWorkspaceChange}
      currentFolder={currentFolder}
      folderChanged={handleFolderChange}
      sidebarUser={MOCK_SIDEBAR_DATA.user}
      sidebarTeams={MOCK_SIDEBAR_DATA.teams}
      sidebarNavMain={MOCK_SIDEBAR_DATA.navMain}
      sidebarProjects={MOCK_SIDEBAR_DATA.projects}
      {...restProps}
    />
  );
}

export default {
  title: 'Flows/AppsPage/Adapter',
  component: AppsPageAdapter,
  parameters: { layout: 'fullscreen' },
};

export const Default = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    deleteApp={mockDeleteApp}
    cloneApp={mockCloneApp}
    exportApp={mockExportApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const Loading = () => (
  <StoryWithWorkspace
    apps={[]}
    isLoading={true}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={true}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const EmptyState = () => (
  <StoryWithWorkspace
    apps={[]}
    isLoading={false}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const ErrorState = () => (
  <StoryWithWorkspace
    apps={[]}
    isLoading={false}
    error={new Error('Failed to fetch apps')}
    meta={{ current_page: 1, total_pages: 1, total_count: 0, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const WithPagination = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{ current_page: 2, total_pages: 3, total_count: 25, per_page: 9 }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const Modules = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="module"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const NoPermissions = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={false}
    canUpdateApp={() => false}
    canDeleteApp={() => false}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const WithFolderSelected = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    deleteApp={mockDeleteApp}
    cloneApp={mockCloneApp}
    exportApp={mockExportApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    currentFolder={MOCK_FOLDERS[0]}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const WithWorkflows = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="workflow"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    deleteApp={mockDeleteApp}
    cloneApp={mockCloneApp}
    exportApp={mockExportApp}
    navigate={mockNavigate}
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);

export const NoFolders = () => (
  <StoryWithWorkspace
    apps={data}
    isLoading={false}
    meta={{
      current_page: 1,
      total_pages: 1,
      total_count: data.length,
      per_page: 9,
    }}
    appSearchKey=""
    appType="front-end"
    pageChanged={mockPageChanged}
    onSearch={mockOnSearch}
    canCreateApp={mockCanCreateApp}
    canUpdateApp={mockCanUpdateApp}
    canDeleteApp={mockCanDeleteApp}
    deleteApp={mockDeleteApp}
    cloneApp={mockCloneApp}
    exportApp={mockExportApp}
    navigate={mockNavigate}
    folders={[]}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
  />
);
