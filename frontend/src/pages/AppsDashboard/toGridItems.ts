import moment from 'moment';

import type { AppItem, FolderItem } from './dashboard.types';

// Shape of a root item returned by the dashboard items API (see `HomePage/ItemsList/services`).
export interface RootItem {
  kind: 'app' | 'folder';
  id: string;
  name: string;
  updated_at: string;
  modified_by?: { name: string };
  app_count?: number;
  icon?: string;
  icon_color?: string;
}

const toFolderItem = (item: RootItem): FolderItem => {
  const appCount = item.app_count ?? 0;
  return {
    id: item.id,
    name: item.name,
    description: `${appCount} ${appCount === 1 ? 'app' : 'apps'} • Edited ${moment(item.updated_at).format('MMM DD, YYYY')}`,
    // TODO: Pinning has no API field yet.
    isPinned: false,
  };
};

const toAppItem = (item: RootItem): AppItem => ({
  id: item.id,
  name: item.name,
  description: `Edited ${moment(item.updated_at).fromNow()}${item.modified_by ? ` by ${item.modified_by.name}` : ''}`,
  icon: item.icon,
  iconColor: item.icon_color,
});

export const toGridItems = (items: RootItem[]) => ({
  folders: items.filter((item) => item.kind === 'folder').map(toFolderItem),
  apps: items.filter((item) => item.kind === 'app').map(toAppItem),
});
