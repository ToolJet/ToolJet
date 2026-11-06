import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';

import { appsService } from '@/_services/apps.service';
import { handleError } from '@/_services/hooks/appsServiceHooks';

import type { TAppType } from '../../helper';
import type { ListResponse } from '../../dummyData/types';
import { movePinnedItem } from '../../ItemsList/pinOrder';

interface ReorderVariables {
  appType: TAppType;
  /** Key of the infinite root query whose cache is rewritten. */
  queryKey: QueryKey;
  /** Positions among the pinned rows, not the whole list. */
  fromIndex: number;
  toIndex: number;
}

// Moves a pin within the flattened pages, then cuts them back to their original sizes.
export function reorderPinnedInPages(
  data: InfiniteData<ListResponse>,
  fromIndex: number,
  toIndex: number
): InfiniteData<ListResponse> {
  const moved = movePinnedItem(
    data.pages.flatMap((page) => page.items),
    fromIndex,
    toIndex
  );

  let offset = 0;
  const pages = data.pages.map((page) => {
    const items = moved.slice(offset, offset + page.items.length);
    offset += page.items.length;
    return { ...page, items };
  });

  return { ...data, pages };
}

// Same flow as `useReorderPins`, for the infinite root cache the mobile view uses.
export function useReorderPinsInfinite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appType, queryKey }: ReorderVariables) => {
      const data = queryClient.getQueryData<InfiniteData<ListResponse>>(queryKey);
      if (!data) return Promise.resolve();

      // onMutate has already moved the row, so the cache holds the order to send.
      return appsService.reorderPins({
        appType,
        pins: data.pages
          .flatMap((page) => page.items)
          .filter((item) => item.pinned)
          .map((item) => ({ resource_type: item.kind, resource_id: item.id })),
      });
    },
    onMutate: async ({ queryKey, fromIndex, toIndex }) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<InfiniteData<ListResponse>>(queryKey);
      queryClient.setQueryData<InfiniteData<ListResponse>>(
        queryKey,
        (data) => data && reorderPinnedInPages(data, fromIndex, toIndex)
      );
      return { previous };
    },
    onError: (error, { queryKey }, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      handleError(error);
    },
    onSettled: (_data, _error, { appType }) => queryClient.invalidateQueries({ queryKey: ['appsV2', { appType }] }),
  });
}
