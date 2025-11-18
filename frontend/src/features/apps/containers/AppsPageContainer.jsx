import React, { useEffect, useMemo } from 'react';
import { AppsShellView } from '@/components/AppsPage/AppsShellView';
import { AppsTabs } from '@/components/AppsPage/AppsTabs';
import { appsColumns } from '@/components/AppsPage/AppsPage.columns';
import { useAppsQuery } from '@/features/apps/hooks/useAppsQuery';
import { useAppsPermissions } from '@/features/apps/hooks/useAppsPermissions';
import { useAppsTableState } from '@/features/apps/hooks/useAppsTableState';
import { useAppsUrlState } from '@/features/apps/hooks/useAppsUrlState';
import { TablePaginationFooter } from '@/components/AppsPage/TablePaginationFooter';
import { EmptyNoApps } from '@/components/ui/blocks/EmptyNoApps';

export function AppsPageContainer() {
  const { data = [], isLoading, error } = useAppsQuery();
  const perms = useAppsPermissions();
  const url = useAppsUrlState();

  const columns = useMemo(() => appsColumns({ perms }), [perms]);
  const { table, getSearch, setSearch, state } = useAppsTableState({
    data,
    columns,
    initial: {
      globalFilter: url.search,
      sorting: url.sorting,
      pagination: url.pagination,
      columnFilters: url.filters,
    },
  });

  // Push table state back to URL
  useEffect(() => {
    const search = getSearch();
    url.setSearch(search);
  }, [getSearch, url]);
  useEffect(() => {
    url.setSorting(state.sorting);
  }, [state.sorting, url]);
  useEffect(() => {
    url.setPagination(state.pagination);
  }, [state.pagination, url]);
  useEffect(() => {
    url.setFilters(state.columnFilters);
  }, [state.columnFilters, url]);

  const menuItems = perms.canImport ? [{ label: 'Import template', onClick: () => {}, icon: 'Download' }] : [];

  if (isLoading) return <div className="tw-p-6">Loading…</div>;
  if (error) return <div className="tw-p-6">Failed to load</div>;

  const hasQuery = !!url.search || (url.filters?.length ?? 0) > 0;
  const appsEmpty = data.length === 0 && !hasQuery;
  const modulesEmpty = appsEmpty; // until modules data is wired, mirror apps emptiness

  return (
    <AppsShellView
      title="Applications"
      menuItems={menuItems}
      searchValue={getSearch()}
      onSearch={setSearch}
      footer={<TablePaginationFooter table={table} />}
      contentSlot={
        <AppsTabs
          table={table}
          appsEmpty={appsEmpty}
          emptyAppsSlot={<EmptyNoApps />}
          modulesEmpty={modulesEmpty}
          emptyModulesSlot={<EmptyNoApps />}
        />
      }
    />
  );
}

export default AppsPageContainer;
