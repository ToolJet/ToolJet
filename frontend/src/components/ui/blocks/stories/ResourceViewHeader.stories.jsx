import React, { useState } from 'react';
import { ResourceViewHeader } from '../ResourceViewHeader';

const mockFolders = [
  { id: 1, name: 'Marketing', count: 5 },
  { id: 2, name: 'Sales', count: 3 },
  { id: 3, name: 'Engineering', count: 8 },
];

export default {
  title: 'UI/Blocks/ResourceViewHeader',
  component: ResourceViewHeader,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => {
  const [activeTab, setActiveTab] = useState('apps');
  const [viewMode, setViewMode] = useState('list');

  return (
    <ResourceViewHeader
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabsConfig={[
        { id: 'apps', label: 'Apps', count: 25, loading: false },
        { id: 'modules', label: 'Modules', count: 10, loading: false },
      ]}
      breadcrumbItems={[
        { label: 'Folders', href: '/folders' },
        { label: 'All apps', href: null },
      ]}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );
};

export const WithoutTabs = () => {
  const [viewMode, setViewMode] = useState('list');

  return (
    <ResourceViewHeader
      activeTab="apps"
      onTabChange={() => {}}
      tabsConfig={[]}
      breadcrumbItems={[
        { label: 'Folders', href: '/folders' },
        { label: 'All apps', href: null },
      ]}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );
};

export const WithFolders = () => {
  const [activeTab, setActiveTab] = useState('apps');
  const [viewMode, setViewMode] = useState('list');
  const [currentFolder, setCurrentFolder] = useState(mockFolders[0]);

  return (
    <ResourceViewHeader
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabsConfig={[
        { id: 'apps', label: 'Apps', count: 25, loading: false },
        { id: 'modules', label: 'Modules', count: 10, loading: false },
      ]}
      breadcrumbItems={[
        { label: 'Folders', href: '/folders' },
        { label: currentFolder.name, href: null },
      ]}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      folders={mockFolders}
      currentFolder={currentFolder}
      onFolderChange={(folder) => {
        setCurrentFolder(folder);
        console.log('Folder changed:', folder);
      }}
    />
  );
};

export const Loading = () => {
  const [activeTab, setActiveTab] = useState('apps');
  const [viewMode, setViewMode] = useState('list');

  return (
    <ResourceViewHeader
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabsConfig={[
        { id: 'apps', label: 'Apps', count: 0, loading: true },
        { id: 'modules', label: 'Modules', count: 0, loading: true },
      ]}
      breadcrumbItems={[
        { label: 'Folders', href: '/folders' },
        { label: 'All apps', href: null },
      ]}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      foldersLoading={true}
    />
  );
};

