import { useInfiniteQuery } from '@tanstack/react-query';

import { appsService } from '@/_services/apps.service';
import { useSearchStore } from '@/_stores/searchStore';

import { ROOT_PAGE_SIZE, type TAppType } from '../../helper';
import type { ListResponse } from '../../dummyData/types';
import type { AppsV2Error } from '../../hooks/useRootAppsQuery';

// No branch id: mobile has no branch picker, so the backend serves the default branch.
// The `appsV2` prefix keeps the pin and unpin invalidations covering this cache; the `'infinite'` suffix keeps it apart from the paged entry.
export function useRootAppsInfiniteQuery(appType: TAppType) {
  const searchQuery: string = useSearchStore((state) => state.debouncedSearchQuery);
  const queryParams = { appType, folderId: '', branchId: undefined, pageSize: ROOT_PAGE_SIZE, searchQuery };
  const queryKey = ['appsV2', queryParams, 'infinite'];

  const query = useInfiniteQuery<ListResponse, AppsV2Error>({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      appsService.fetchAppsV2({ ...queryParams, pageNo: pageParam as number }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total ? lastPage.page + 1 : undefined,
  });

  return { ...query, queryKey, searchQuery };
}
