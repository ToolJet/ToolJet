import React from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { DataTable } from './DataTable';

export default {
  title: 'Blocks/DataTable',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const sampleData = [
  { id: 1, name: 'My first app', type: 'App', editedBy: 'Alice', editedAt: 'Edited 2m ago' },
  { id: 2, name: 'Customer dashboard', type: 'App', editedBy: 'Bob', editedAt: 'Edited 1h ago' },
  { id: 3, name: 'Sales pipeline', type: 'Workflow', editedBy: 'Carol', editedAt: 'Edited yesterday' },
  { id: 4, name: 'HR onboarding', type: 'Workflow', editedBy: 'Dan', editedAt: 'Edited 3 days ago' },
  { id: 5, name: 'Inventory tracker', type: 'App', editedBy: 'Eve', editedAt: 'Edited last week' },
];

const columnHelper = createColumnHelper();
const columns = [
  columnHelper.accessor('name', { header: 'Name', cell: (info) => info.getValue() }),
  columnHelper.accessor('type', { header: 'Type', cell: (info) => info.getValue() }),
  columnHelper.accessor('editedBy', { header: 'Edited by', cell: (info) => info.getValue() }),
  columnHelper.accessor('editedAt', { header: 'Edited at', cell: (info) => info.getValue() }),
];

function useTable(data) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}

// ── Default ─────────────────────────────────────────────────────────────────

export const Default = {
  render: () => {
    const table = useTable(sampleData);
    return <DataTable table={table} />;
  },
};

// ── Compact ─────────────────────────────────────────────────────────────────

export const Compact = {
  render: () => {
    const table = useTable(sampleData);
    return <DataTable table={table} density="compact" />;
  },
};

// ── Loading ─────────────────────────────────────────────────────────────────

export const Loading = {
  render: () => {
    const table = useTable([]);
    return <DataTable table={table} isLoading />;
  },
};

// ── Empty ───────────────────────────────────────────────────────────────────

export const Empty = {
  render: () => {
    const table = useTable([]);
    return <DataTable table={table} emptyMessage="No apps found. Create one to get started." />;
  },
};
