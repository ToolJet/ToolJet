import React from 'react';
import { ResourceShellView } from '@/features/commons/components';

// App-specific wrapper that uses the generic ResourceShellView
export function AppsShellView(props) {
  return <ResourceShellView searchPlaceholder="Search apps..." {...props} />;
}

export default AppsShellView;
