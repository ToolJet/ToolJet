import React from 'react';
import { DataTable } from '../DataTable';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper();

const mockData = Array.from({ length: 10 }, (_, i) => ({
  id: `row-${i + 1}`,
  name: `Item ${i + 1}`,
  status: ['Active', 'Inactive', 'Pending'][i % 3],
  value: Math.floor(Math.random() * 1000),
}));

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('value', {
    header: 'Value',
    cell: (info) => `$${info.getValue()}`,
  }),
];

function createMockTable(data) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}

export default {
  title: 'UI/Blocks/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => {
  const table = createMockTable(mockData);
  return <DataTable table={table} isLoading={false} />;
};

export const Empty = () => {
  const table = createMockTable([]);
  return <DataTable table={table} isLoading={false} />;
};

export const Loading = () => {
  const table = createMockTable([]);
  return <DataTable table={table} isLoading={true} />;
};

export const WithManyRows = () => {
  const manyRows = Array.from({ length: 50 }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `Item ${i + 1}`,
    status: ['Active', 'Inactive', 'Pending'][i % 3],
    value: Math.floor(Math.random() * 1000),
  }));
  const table = createMockTable(manyRows);
  return <DataTable table={table} isLoading={false} />;
};

