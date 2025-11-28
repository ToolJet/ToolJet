import React from 'react';
import { AppsGrid } from '../components/AppsGrid';
import { generateMockApps } from './utils';
import { appsColumns } from '@/features/apps/columns';
import { useResourcePageAdapter } from '@/features/apps/hooks/useResourcePageAdapter';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

// Helper to create a mock table
function createMockTable(data, columns) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}

const mockActions = {
  play: (app) => console.log('Play:', app),
  edit: (app) => console.log('Edit:', app),
  delete: (app) => console.log('Delete:', app),
  clone: (app) => console.log('Clone:', app),
  export: (app) => console.log('Export:', app),
};

const mockPerms = {
  canPlay: () => true,
  canEdit: () => true,
};

export default {
  title: 'Features/Apps/Components/AppsGrid',
  component: AppsGrid,
  parameters: {
    layout: 'padded',
  },
};

function AppsGridWrapper({ apps, perms = mockPerms, canDelete = true }) {
  const columns = React.useMemo(() => appsColumns({ perms, actions: mockActions, canDelete }), [perms, canDelete]);
  const { table } = useResourcePageAdapter({
    data: { apps, isLoading: false, error: null, meta: {} },
    filters: { appSearchKey: '', currentFolder: {} },
    actions: {},
    columns,
  });

  return <AppsGrid table={table} actions={mockActions} perms={perms} canDelete={canDelete} />;
}

export const Default = () => {
  const apps = generateMockApps(12);
  return <AppsGridWrapper apps={apps} />;
};

export const Empty = () => {
  return <AppsGridWrapper apps={[]} />;
};

export const Loading = () => {
  // Loading state would be handled by parent, but showing empty for demo
  return <AppsGridWrapper apps={[]} />;
};

export const WithPermissions = () => {
  const apps = generateMockApps(8);
  const restrictedPerms = {
    canPlay: (app) => app.id !== 'app-2',
    canEdit: (app) => app.id !== 'app-3',
  };
  return <AppsGridWrapper apps={apps} perms={restrictedPerms} canDelete={false} />;
};

