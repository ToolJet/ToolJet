import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';

import { appsV2QueryOptions } from './hooks/useRootAppsQuery';
import { isAppItem } from './items';
import { FOLDER_PAGE_SIZE, type TAppType } from './helper';
import type { AppItem, ListResponse } from './dummyData/types';

export type FolderViewStatus = 'loading' | 'success' | 'error' | 'notFound';

interface FolderView {
  status: FolderViewStatus;
  apps: AppItem[];
  folderName: string | undefined;
  meta: ListResponse | undefined;
}

// The apps of one folder on the current page; with a search, whatever the backend returns for it.
export function useFolderView(folderId: string, appType: TAppType): FolderView {
  const currentPage = useAppsStore((state) => state.currentPage);
  const searchQuery: string = useSearchStore((state: { searchQuery: string }) => state.searchQuery);

  const { data, error, isLoading } = useQuery(
    appsV2QueryOptions({ appType, folderId, pageNo: currentPage, pageSize: FOLDER_PAGE_SIZE, searchQuery })
  );

  const apps = useMemo(() => data?.items.filter(isAppItem) ?? [], [data]);
  const view = { apps, folderName: data?.folder?.name, meta: data };

  if (isLoading) return { ...view, status: 'loading' };
  // A 4xx means the id is malformed, deleted or not visible to this user.
  if (error) {
    const isClientError = (error.statusCode ?? 0) >= 400 && (error.statusCode ?? 0) < 500;
    return { ...view, status: isClientError ? 'notFound' : 'error' };
  }
  // `folder` is null while searching: the backend runs a workspace-wide search and ignores `folder_id`.
  return { ...view, status: 'success' };
}
