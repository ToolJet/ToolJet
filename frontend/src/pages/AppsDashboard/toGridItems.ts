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
  is_pinned?: boolean;
  /** Folders only: at least one app inside is pinned. */
  has_pinned_apps?: boolean;
  /** Apps only: false when the app has changes not yet pushed to git. */
  is_app_synced?: boolean;
}

const toFolderItem = (item: RootItem): FolderItem => {
  const appCount = item.app_count ?? 0;
  return {
    id: item.id,
    name: item.name,
    description: `${appCount} ${appCount === 1 ? 'app' : 'apps'} • Edited ${moment(item.updated_at).format('MMM DD, YYYY')}`,
    isPinned: item.is_pinned ?? false,
    hasPinnedApps: item.has_pinned_apps ?? false,
  };
};

const toAppItem = (item: RootItem): AppItem => ({
  id: item.id,
  name: item.name,
  description: `Edited ${moment(item.updated_at).fromNow()}${item.modified_by ? ` by ${item.modified_by.name}` : ''}`,
  icon: item.icon,
  iconColor: item.icon_color,
  isPinned: item.is_pinned ?? false,
  isUnsynced: item.is_app_synced === false,
});

export const toGridItems = (items: RootItem[]) => ({
  folders: items.filter((item) => item.kind === 'folder').map(toFolderItem),
  apps: items.filter((item) => item.kind === 'app').map(toAppItem),
});
