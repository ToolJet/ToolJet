import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { appsV2QueryOptions as untypedAppsV2QueryOptions } from '@/_services/hooks/appsServiceHooks';

import { ROOT_PAGE_SIZE, type TAppType } from '../helper';
import type { ListResponse } from '../dummyData/types';

interface AppsV2Params {
  appType: TAppType;
  folderId?: string;
  searchQuery?: string;
  pageNo?: number;
  pageSize?: number;
}

/** The rejection shape of `handleResponse`. */
export interface AppsV2Error {
  error: string;
  data: unknown;
  statusCode?: number;
}

// appsServiceHooks.js is untyped, so `/v2/apps` gets its contract types here, once.
export const appsV2QueryOptions = untypedAppsV2QueryOptions as (
  params: AppsV2Params
) => UseQueryOptions<ListResponse, AppsV2Error>;

// Options for the root page on screen; its `queryKey` lets mutations edit that cache entry.
export function useRootAppsQueryOptions(appType: TAppType) {
  const currentPage = useAppsStore((state) => state.currentPage);
  const searchQuery: string = useSearchStore((state) => state.debouncedSearchQuery);

  return appsV2QueryOptions({ appType, pageNo: currentPage, pageSize: ROOT_PAGE_SIZE, searchQuery });
}

// `index.tsx` and `GridView` both call this with the same params, so they share one cache entry and one request.
export function useRootAppsQuery(appType: TAppType) {
  return useQuery(useRootAppsQueryOptions(appType));
}
