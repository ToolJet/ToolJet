import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DEFAULT_SORT, FILTER_GROUPS, SORT_VALUES } from '../listQueryOptions';
import { useItemsListStore } from '../store/itemsListStore';

const SORT_PARAM = 'sort';

// Hand-edited or stale URLs may carry unknown values; those are dropped instead of being sent to the API.
function parseFilterParam(rawValue, group) {
  const values = (rawValue ?? '').split(',');
  return group.options.map((option) => option.value).filter((value) => values.includes(value));
}

// Sort and filters live in the URL (PRD) so they survive refresh, sharing and back/forward.
export function useListQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const setPage = useItemsListStore((state) => state.setPage);

  const sortParam = searchParams.get(SORT_PARAM);
  const sort = SORT_VALUES.includes(sortParam) ? sortParam : DEFAULT_SORT;
  // Keyed on the raw filter params only, so a sort change doesn't produce new filter arrays
  // (consumers treat a filter change as "collapse all folders").
  const rawFiltersKey = JSON.stringify(FILTER_GROUPS.map((group) => searchParams.get(group.urlParam)));
  const filters = useMemo(() => {
    const rawFilters = JSON.parse(rawFiltersKey);
    return Object.fromEntries(
      FILTER_GROUPS.map((group, index) => [group.id, parseFilterParam(rawFilters[index], group)])
    );
  }, [rawFiltersKey]);

  // Functional update keeps unrelated params such as `branch`; replace avoids a history entry per click.
  const updateParams = useCallback(
    (mutate) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);
          return next;
        },
        { replace: true }
      );
      setPage(1);
    },
    [setSearchParams, setPage]
  );

  const setSort = useCallback(
    (value) =>
      updateParams((params) => {
        if (value === DEFAULT_SORT) params.delete(SORT_PARAM);
        else params.set(SORT_PARAM, value);
      }),
    [updateParams]
  );

  const toggleFilter = useCallback(
    (groupId, value) =>
      updateParams((params) => {
        const group = FILTER_GROUPS.find(({ id }) => id === groupId);
        const current = parseFilterParam(params.get(group.urlParam), group);
        const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
        if (next.length) params.set(group.urlParam, next.join(','));
        else params.delete(group.urlParam);
      }),
    [updateParams]
  );

  const clearFilters = useCallback(
    () => updateParams((params) => FILTER_GROUPS.forEach((group) => params.delete(group.urlParam))),
    [updateParams]
  );

  return { sort, filters, setSort, toggleFilter, clearFilters };
}
