import { useInfiniteQuery } from '@tanstack/react-query';

import { appsService } from '@/_services/apps.service';

import { FOLDER_PAGE_SIZE, type TAppType } from '../../helper';
import type { ListResponse } from '../../dummyData/types';
import type { AppsV2Error } from '../../hooks/useRootAppsQuery';

// Same key shape as the desktop list's folder query, minus a branch id: mobile has no branch picker, so the backend serves the default branch.
export function useFolderAppsInfiniteQuery(appType: TAppType, folderId: string) {
  const queryParams = { appType, branchId: undefined, pageSize: FOLDER_PAGE_SIZE, folderId };

  return useInfiniteQuery<ListResponse, AppsV2Error>({
    queryKey: ['appsV2', queryParams, 'infinite'],
    queryFn: ({ pageParam, signal }) =>
      appsService.fetchAppsV2({ ...queryParams, searchQuery: '', pageNo: pageParam as number }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total ? lastPage.page + 1 : undefined,
  });
}
