import React from 'react';
import { ResourceTableSkeleton } from '@/features/commons/components';

export function AppsTableSkeleton({ rowCount = 5 }) {
  return <ResourceTableSkeleton rowCount={rowCount} columnCount={5} />;
}

export default AppsTableSkeleton;
