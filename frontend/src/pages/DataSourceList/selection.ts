import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ExpandedState, RowSelectionState } from '@tanstack/react-table';

import type {
  DataSourceListItem,
  DataSourceListResponse,
  DataSourcePinKind,
} from '@/_services/types/globalDatasource.types';

// Selection holds a single kind at a time, so the first row id's prefix (`data_source:` / `folder:`) decides it.
export const getSelectedKind = (rowSelection: RowSelectionState): DataSourcePinKind | null =>
  (Object.keys(rowSelection)[0]?.split(':')[0] as DataSourcePinKind | undefined) ?? null;

// `data_source:<id>` / `folder:<id>` → `<id>`.
export const getIdFromRowId = (rowId: string): string => rowId.slice(rowId.indexOf(':') + 1);

// Selectable rows of `kind` on this page, from counts in the root response: no folder page has to be loaded.
// Data sources: root rows plus every expanded folder's `data_source_count`. A pinned data source inside an expanded
// folder is listed at root and counted in its folder, under one row id, so the root row is skipped.
export function countPageRowsOfKind(
  items: DataSourceListItem[],
  expanded: ExpandedState,
  kind: DataSourcePinKind | null
): number {
  if (kind === 'folder') return items.filter((item) => item.kind === 'folder').length;
  if (kind !== 'data_source') return 0;

  const isExpandedFolderId = (folderId: string) => expanded === true || Boolean(expanded[`folder:${folderId}`]);
  return items.reduce((count, item) => {
    if (item.kind === 'folder') return isExpandedFolderId(item.id) ? count + item.data_source_count : count;
    return item.folder && isExpandedFolderId(item.folder.id) ? count : count + 1;
  }, 0);
}

export interface LoadedDataSourceItem {
  id: string;
  name: string;
  kind?: DataSourcePinKind;
  /** Plugin kind for the icon; absent for folders and items not loaded. */
  dataSourceKind?: string;
  /** Folder a data source sits in; absent at root, for folders and for items not loaded. */
  folderName?: string;
}

// Rows for ids, from the `/v2/data-sources` pages already loaded (root, search and expanded folders).
// An id that isn't loaded falls back to showing the id as its name.
export function getLoadedDataSourceItems(queryClient: QueryClient, ids: string[]): LoadedDataSourceItem[] {
  const itemsById = new Map<string, LoadedDataSourceItem>();
  queryClient
    .getQueriesData<DataSourceListResponse | InfiniteData<DataSourceListResponse>>({ queryKey: ['dataSourcesV2'] })
    .forEach(([, data]) => {
      const pages = !data ? [] : 'pages' in data ? data.pages : [data];
      pages.forEach((page) =>
        page.items.forEach((item) => {
          // Folder-mode pages name their folder once at the top, not on each row.
          const folderName = item.kind === 'data_source' ? (item.folder ?? page.folder)?.name : undefined;
          itemsById.set(item.id, {
            id: item.id,
            name: item.name,
            kind: item.kind,
            dataSourceKind: item.kind === 'data_source' ? item.data_source_kind : undefined,
            folderName,
          });
        })
      );
    });

  return ids.map((id) => itemsById.get(id) ?? { id, name: id });
}
