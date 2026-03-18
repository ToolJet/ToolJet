import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const KEYS = {
  q: 'q',
  sort: 'sort', // e.g. name.asc or lastEdited.desc
  page: 'page',
  pageSize: 'pageSize',
  filters: 'filters', // JSON encoded
};

function parseSort(value) {
  if (!value) return [];
  const [id, dir] = String(value).split('.');
  if (!id) return [];
  return [{ id, desc: dir === 'desc' }];
}

function serializeSort(sorting) {
  if (!Array.isArray(sorting) || sorting.length === 0) return '';
  const { id, desc } = sorting[0] || {};
  if (!id) return '';
  return `${id}.${desc ? 'desc' : 'asc'}`;
}

function parseNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readParams() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const q = params.get(KEYS.q) || '';
  const sorting = parseSort(params.get(KEYS.sort));
  const pageIndex = parseNumber(params.get(KEYS.page), 0);
  const pageSize = parseNumber(params.get(KEYS.pageSize), 10);
  let filters = [];
  const filtersStr = params.get(KEYS.filters);
  if (filtersStr) {
    try {
      const parsed = JSON.parse(filtersStr);
      if (Array.isArray(parsed)) filters = parsed;
    } catch (_) {}
  }
  return { q, sorting, pagination: { pageIndex, pageSize }, filters };
}

function writeParams(next) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const { q, sorting, pagination, filters } = next;
  if (q) params.set(KEYS.q, q); else params.delete(KEYS.q);
  const sortStr = serializeSort(sorting);
  if (sortStr) params.set(KEYS.sort, sortStr); else params.delete(KEYS.sort);
  if (pagination?.pageIndex) params.set(KEYS.page, String(pagination.pageIndex)); else params.delete(KEYS.page);
  if (pagination?.pageSize && pagination.pageSize !== 10) params.set(KEYS.pageSize, String(pagination.pageSize)); else params.delete(KEYS.pageSize);
  if (filters && filters.length) params.set(KEYS.filters, JSON.stringify(filters)); else params.delete(KEYS.filters);
  const nextUrl = `${url.pathname}?${params.toString()}${url.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

export function useAppsUrlState({ defaults } = {}) {
  const initial = useMemo(() => ({
    q: defaults?.q ?? '',
    sorting: defaults?.sorting ?? [],
    pagination: defaults?.pagination ?? { pageIndex: 0, pageSize: 10 },
    filters: defaults?.filters ?? [],
  }), [defaults]);

  const [state, setState] = useState(() => ({ ...initial, ...readParams() }));
  const isSettingRef = useRef(false);

  // Write to URL when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    isSettingRef.current = true;
    writeParams(state);
    // allow the flag to drop after this tick
    const t = setTimeout(() => { isSettingRef.current = false; }, 0);
    return () => clearTimeout(t);
  }, [state.q, state.sorting, state.pagination?.pageIndex, state.pagination?.pageSize, JSON.stringify(state.filters)]);

  // React to back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (isSettingRef.current) return;
      setState((prev) => ({ ...prev, ...readParams() }));
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const setSearch = useCallback((q) => setState((s) => ({ ...s, q })), []);
  const setSorting = useCallback((sorting) => setState((s) => ({ ...s, sorting })), []);
  const setPagination = useCallback((pagination) => setState((s) => ({ ...s, pagination })), []);
  const setFilters = useCallback((filters) => setState((s) => ({ ...s, filters })), []);

  return {
    search: state.q,
    setSearch,
    sorting: state.sorting,
    setSorting,
    pagination: state.pagination,
    setPagination,
    filters: state.filters,
    setFilters,
  };
}

export default useAppsUrlState;


