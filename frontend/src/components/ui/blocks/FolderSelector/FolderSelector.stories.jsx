import React, { useState } from 'react';
import { FolderSelector } from './FolderSelector';

export default {
  title: 'UI/Blocks/FolderSelector',
  component: FolderSelector,
  parameters: {
    layout: 'centered',
  },
};

const folders = [
  { id: 1, name: 'Folder 1' },
  { id: 2, name: 'Folder 2' },
  { id: 3, name: 'Folder 3' },
  { id: 4, name: 'Folder 4' },
  { id: 5, name: 'Folder 5' },
  { id: 6, name: 'Folder 6' },
];

export const Default = () => {
  const [currentFolder, setCurrentFolder] = useState(null);
  return (
    <FolderSelector
      folders={folders}
      currentFolder={currentFolder}
      onFolderChange={setCurrentFolder}
      onNewFolder={() => console.log('New folder clicked')}
    />
  );
};

export const WithSelectedFolder = () => {
  const [currentFolder, setCurrentFolder] = useState(folders[0]);
  return (
    <FolderSelector
      folders={folders}
      currentFolder={currentFolder}
      onFolderChange={setCurrentFolder}
      onNewFolder={() => console.log('New folder clicked')}
    />
  );
};

export const EmptyFolders = () => {
  const [currentFolder, setCurrentFolder] = useState(null);
  return (
    <FolderSelector
      folders={[]}
      currentFolder={currentFolder}
      onFolderChange={setCurrentFolder}
      onNewFolder={() => console.log('New folder clicked')}
    />
  );
};

