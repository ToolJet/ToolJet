import React, { useMemo } from 'react';

import type { AppItem, FolderItem } from '../dashboard.types';
import { toGridItems, type RootItem } from '../toGridItems';
import { useRootItemsSync } from '@/HomePage/ItemsList/hooks/useRootItemsSync';
import { useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';
import AppCard from './AppCard';
import FolderCard from './FolderCard';
import GridSection from './GridSection';

const getId = (item: { id: string }) => item.id;

const renderFolder = (folder: FolderItem) => (
  <FolderCard name={folder.name} description={folder.description} isPinned={folder.isPinned} />
);

const renderApp = (app: AppItem) => (
  <AppCard name={app.name} description={app.description} icon={app.icon} iconColor={app.iconColor} />
);

// Pinned folders show only under Pinned, not again under Folders.
export default function GridView() {
  useRootItemsSync();
  const rootItems: RootItem[] = useItemsListStore((state: { root: { items: RootItem[] } }) => state.root.items);
  const { folders, apps } = useMemo(() => toGridItems(rootItems), [rootItems]);

  const pinnedFolders = folders.filter((folder) => folder.isPinned);
  const otherFolders = folders.filter((folder) => !folder.isPinned);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <GridSection title="Pinned" items={pinnedFolders} getKey={getId} renderItem={renderFolder} />
      <GridSection title="Folders" items={otherFolders} getKey={getId} renderItem={renderFolder} />
      <GridSection title="Stray apps" items={apps} getKey={getId} renderItem={renderApp} />
    </div>
  );
}
