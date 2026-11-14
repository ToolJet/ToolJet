import moment from 'moment';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { RowSelectionState } from '@tanstack/react-table';

import type { AppItem, FolderItem, ListItem, ListResponse } from './dummyData/types';
import type { TItemKind } from './types';
import { appTypeToDisplayNameMapping, type TAppType } from './helper';

// Selection holds a single kind at a time, so the first row id's prefix (`app:` / `folder:`) decides it.
export const getSelectedKind = (rowSelection: RowSelectionState): TItemKind | null =>
  (Object.keys(rowSelection)[0]?.split(':')[0] as TItemKind | undefined) ?? null;

// `app:<id>` / `folder:<id>` → `<id>`.
export const getIdFromRowId = (rowId: string): string => rowId.slice(rowId.indexOf(':') + 1);

export interface LoadedItemSummary {
  id: string;
  name: string;
  /** App icon name; absent for folders and for items not loaded. */
  icon?: string;
  /** Name of the folder an app sits in; absent for stray apps, folders and items not loaded. */
  folderName?: string;
}

// Rows for ids, from the `/v2/apps` pages already loaded (root, folder views, expanded folders).
// An id that isn't loaded falls back to showing the id as its name.
export function getLoadedItems(queryClient: QueryClient, ids: string[]): LoadedItemSummary[] {
  const itemsById = new Map<string, ListItem>();
  queryClient
    .getQueriesData<ListResponse | InfiniteData<ListResponse>>({ queryKey: ['appsV2'] })
    .forEach(([, data]) => {
      const pages = !data ? [] : 'pages' in data ? data.pages : [data];
      pages.forEach((page) => page.items.forEach((item) => itemsById.set(item.id, item)));
    });

  return ids.map((id) => {
    const item = itemsById.get(id);
    if (!item) return { id, name: id };
    if (!isAppItem(item)) return { id, name: item.name };
    return { id, name: item.name, icon: item.icon, folderName: item.folder?.name };
  });
}

export const isFolderItem = (item: ListItem): item is FolderItem => item.kind === 'folder';

export const isAppItem = (item: ListItem): item is AppItem => item.kind === 'app';

// Listed under Pinned: pinned itself, or a folder holding a pinned app.
export const isInPinnedSection = (item: ListItem): boolean =>
  item.pinned || (item.kind === 'folder' && Boolean(item.has_pinned_apps));

// e.g. "9 apps • Edited Sep 12, 2026" for a folder, "Edited 2 hours ago by Priya Nair" for an app.
// The folder's noun follows the app type: app(s), module(s) or workflow(s).
export const getItemDescription = (item: ListItem, appType: TAppType): string => {
  if (item.kind === 'folder') {
    const noun = appTypeToDisplayNameMapping[appType];
    return `${item.app_count} ${item.app_count === 1 ? noun : `${noun}s`} • Edited ${moment(item.last_modified_at).format('MMM DD, YYYY')}`;
  }
  return `Edited ${moment(item.last_modified_at).fromNow()}${item.modified_by ? ` by ${item.modified_by.name}` : ''}`;
};
