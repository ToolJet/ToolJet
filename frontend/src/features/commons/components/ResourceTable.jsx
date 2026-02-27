import React from 'react';
import { DataTable } from '@/components/ui/blocks/DataTable';

export function ResourceTable({ table, isLoading }) {
  return <DataTable table={table} isLoading={isLoading} />;
}

export default ResourceTable;
