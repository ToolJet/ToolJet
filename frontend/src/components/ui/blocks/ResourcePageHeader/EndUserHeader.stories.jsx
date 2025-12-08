import React from 'react';
import { EndUserHeader } from './EndUserHeader';

export default {
  title: 'UI/Blocks/EndUserHeader',
  component: EndUserHeader,
  parameters: {
    layout: 'padded',
  },
};

// Simple test story
export const Simple = () => {
  return (
    <EndUserHeader
      title="Applications"
      breadcrumbItems={[]}
      viewAs="list"
      onViewChange={(value) => console.log('View changed:', value)}
    />
  );
};

// Story with breadcrumbs
export const WithBreadcrumbs = () => {
  const breadcrumbItems = [{ label: 'Home' }, { label: 'Applications' }];

  return (
    <EndUserHeader
      title="Applications"
      breadcrumbItems={breadcrumbItems}
      viewAs="list"
      onViewChange={(value) => console.log('View changed:', value)}
    />
  );
};

// Story with folders
export const WithFolders = () => {
  const breadcrumbItems = [{ label: 'Home' }, { label: 'Marketing' }];

  const folders = [
    { id: 1, name: 'Marketing', count: 5 },
    { id: 2, name: 'Sales', count: 3 },
    { id: 3, name: 'Engineering', count: 8 },
    { id: 4, name: 'Design', count: 2 },
  ];

  return (
    <EndUserHeader
      title="Applications"
      breadcrumbItems={breadcrumbItems}
      folders={folders}
      currentFolder={folders[0]}
      onFolderChange={(folder) => console.log('Folder changed:', folder)}
      viewAs="list"
      onViewChange={(value) => console.log('View changed:', value)}
    />
  );
};

// Story with grid view
export const GridView = () => {
  const breadcrumbItems = [{ label: 'Home' }, { label: 'Applications' }];

  return (
    <EndUserHeader
      title="Applications"
      breadcrumbItems={breadcrumbItems}
      viewAs="grid"
      onViewChange={(value) => console.log('View changed:', value)}
    />
  );
};

// Story with loading state
export const Loading = () => {
  return (
    <EndUserHeader
      title="Applications"
      isLoading={true}
      breadcrumbItems={[]}
      viewAs="list"
      onViewChange={(value) => console.log('View changed:', value)}
    />
  );
};
