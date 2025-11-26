import React from 'react';
import { DataTable } from '@/components/ui/blocks/DataTable';

export function AppsTable({ table, isLoading }) {
  return <DataTable table={table} isLoading={isLoading} />;
}
