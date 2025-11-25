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
  const [activeTab, setActiveTab] = React.useState(props.activeTab || 'apps');
  const [appSearchKey, setAppSearchKey] = React.useState(props.appSearchKey || '');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    console.log('Tab changed to:', tab);
  };

  // Update currentFolder when prop changes
  React.useEffect(() => {
    if (props.currentFolder) {
      setCurrentFolder(props.currentFolder);
    }
  }, [props.currentFolder]);

  // Update appSearchKey when prop changes
  React.useEffect(() => {
    if (props.appSearchKey !== undefined) {
      setAppSearchKey(props.appSearchKey);
    }
  }, [props.appSearchKey]);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder || {});
    console.log('Folder changed to:', folder);
    props.folderChanged?.(folder);
  };

  // Handle search with state management
  const handleSearch = React.useCallback(
    (searchKey) => {
      setAppSearchKey(searchKey);
      props.onSearch?.(searchKey);
    },
    [props]
  );

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

  // Extract currentFolder, folderChanged, appSearchKey, and onSearch from props to avoid conflicts
  const {
    currentFolder: _propCurrentFolder,
    folderChanged: _propFolderChanged,
    appSearchKey: _propAppSearchKey,
    onSearch: _propOnSearch,
    initialPath: _initialPath,
    ...restProps
  } = props;

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
      navigate={enhancedNavigate}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      appSearchKey={appSearchKey}
      onSearch={handleSearch}
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

export const ResourceLoading = () => (
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
    folders={MOCK_FOLDERS}
    foldersLoading={false}
    folderChanged={(folder) => console.log('Folder changed:', folder)}
    initialPath="/my-workspace-1706521439709/modules"
  />
);

export const TabSwitching = () => {
  const [activePath, setActivePath] = React.useState('/my-workspace-1706521439709');

  React.useEffect(() => {
    // Set initial URL
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', activePath);
    }
  }, [activePath]);

  const handleNavigate = (path) => {
    console.log('Navigate to:', path);
    setActivePath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  return (
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
      navigate={handleNavigate}
      folders={MOCK_FOLDERS}
      foldersLoading={false}
      folderChanged={(folder) => console.log('Folder changed:', folder)}
      initialPath={activePath}
    />
  );
};
TabSwitching.parameters = {
  docs: {
    description: {
      story:
        'Demonstrates tab switching behavior. Click the Apps/Modules tabs in the header to see URL changes. The URL will update to reflect the active tab.',
    },
  },
};

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

export const GridView = () => (
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
GridView.parameters = {
  docs: {
    description: {
      story:
        'Switch to grid view using the view toggle in the header. Hover over cards to see the icon fade out and action buttons appear with smooth animations.',
    },
  },
};
