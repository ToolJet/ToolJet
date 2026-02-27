import React from 'react';
import { EndUserResourceShellView } from '@/features/commons/components';

// App-specific wrapper that uses the generic EndUserResourceShellView
export function EndUserShellView(props) {
  return <EndUserResourceShellView searchPlaceholder="Search apps..." {...props} />;
}

export default EndUserShellView;
