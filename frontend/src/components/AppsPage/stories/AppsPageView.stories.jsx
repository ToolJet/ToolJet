import React from 'react';
import data from '../data.json';
import { AppsShellView } from '../AppsShellView';
import { AppsTabs } from '../AppsTabs';
import { EmptyNoApps } from '../EmptyNoApps';
import { appsColumns } from '../AppsPage.columns';
import { useAppsTableState } from '@/features/apps/hooks/useAppsTableState';
import { TablePaginationFooter } from '@/components/AppsPage/TablePaginationFooter';

export default {
  title: 'Flows/AppsPage/Page',
  component: AppsShellView,
  parameters: { layout: 'fullscreen' },
};

export const Default = () => {
  const columns = appsColumns({});
  const { table, getSearch, setSearch } = useAppsTableState({ data, columns });

  return (
    <AppsShellView
      title="Applications"
      menuItems={[{ label: 'Import template', onClick: () => {}, icon: 'Download' }]}
      searchValue={getSearch()}
      onSearch={setSearch}
      footer={<TablePaginationFooter table={table} />}
      contentSlot={<AppsTabs table={table} />}
    />
  );
};

export const EmptyState = () => {
  const columns = appsColumns({});
  const { table, getSearch, setSearch } = useAppsTableState({ data: [], columns });

  return (
    <AppsShellView
      title="Applications"
      menuItems={[]}
      searchValue={getSearch()}
      onSearch={setSearch}
      footer={<TablePaginationFooter table={table} />}
      contentSlot={<AppsTabs table={table} appsEmpty emptyAppsSlot={<EmptyNoApps />} />}
    />
  );
};

export const ModulesFirstTimeEmpty = () => {
  const columns = appsColumns({});
  const { table, getSearch, setSearch } = useAppsTableState({ data, columns });

  return (
    <AppsShellView
      title="Applications"
      menuItems={[]}
      searchValue={getSearch()}
      onSearch={setSearch}
      footer={<TablePaginationFooter table={table} />}
      contentSlot={<AppsTabs table={table} modulesEmpty emptyModulesSlot={<EmptyNoApps />} />}
    />
  );
};

export const NoResults = () => {
  const columns = appsColumns({});
  const { table, getSearch, setSearch } = useAppsTableState({
    data,
    columns,
    initial: { globalFilter: '___no_match___' },
  });

  return (
    <AppsShellView
      title="Applications"
      menuItems={[]}
      searchValue={getSearch()}
      onSearch={setSearch}
      footer={<TablePaginationFooter table={table} />}
      contentSlot={<AppsTabs table={table} />}
    />
  );
};


