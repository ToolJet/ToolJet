import React from 'react';
import { ResourceTable } from '@/features/commons/components';

export function AppsTable({ table, isLoading }) {
  return <ResourceTable table={table} isLoading={isLoading} />;
}

export default AppsTable;
