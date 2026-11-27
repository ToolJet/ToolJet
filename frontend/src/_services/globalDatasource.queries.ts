import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';

import { dataSourceFolderService } from '@/_services/dataSourceFolder.service';
import { globalDatasourceService } from '@/_services/globalDatasource.service';

import type { DataSourceListResponse, DataSourcesQueryParams } from './types/globalDatasource.types';

// One page of the root list, a search, or a folder, for `useQuery`. Every param is in the key, so any change refetches.
export const dataSourcesQueryOptions = ({
  pageNo = 1,
  pageSize = 50,
  folderId,
  search,
  branchId,
}: DataSourcesQueryParams) => {
  const queryParams = { branchId, pageSize, pageNo, folderId, search };

  return queryOptions<DataSourceListResponse>({
    queryKey: ['dataSourcesV2', queryParams],
    queryFn: ({ signal }) => globalDatasourceService.getAllV2(queryParams, { signal }),
    // The previous page stays visible while the next one loads.
    placeholderData: keepPreviousData,
  });
};

// A folder's data sources loaded page by page, for the list's expanded folders.
// The `'infinite'` suffix keeps it apart from a `useQuery` entry with the same params; the prefix keeps `dataSourcesV2` invalidation covering it.
export const dataSourcesInfiniteQueryOptions = ({
  pageSize = 20,
  folderId,
  branchId,
}: Omit<DataSourcesQueryParams, 'pageNo' | 'search'>) => {
  const queryParams = { branchId, pageSize, folderId };

  return infiniteQueryOptions({
    queryKey: ['dataSourcesV2', queryParams, 'infinite'],
    queryFn: ({ pageParam, signal }): Promise<DataSourceListResponse> =>
      globalDatasourceService.getAllV2({ ...queryParams, pageNo: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total ? lastPage.page + 1 : undefined,
  });
};

export interface DataSourceFolderOption {
  label: string;
  value: string;
}

// Folder picker options from the v1 `GET /folder-data-sources` (the branch is read from the store there).
// Kept off the `dataSourcesV2` prefix so lookups over the list cache only ever see list responses.
export const dataSourceFolderOptionsQueryOptions = (branchId: string | null) =>
  queryOptions({
    queryKey: ['dataSourceFolders', { branchId }],
    queryFn: (): Promise<{ folders?: { id: string; name: string }[] }> => dataSourceFolderService.getFolders(),
    select: (data): DataSourceFolderOption[] =>
      (data?.folders ?? []).map((folder) => ({ label: folder.name, value: folder.id })),
  });
