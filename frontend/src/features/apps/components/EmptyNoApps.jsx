import React from 'react';
import { EmptyResource } from '@/features/commons/components';

export function EmptyNoApps() {
  return (
    <EmptyResource
      title="You don't have any apps yet"
      description="You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the option that best fits your workflow"
      iconName="mobile-empty-state"
      className="tw-mt-24"
    />
  );
}

export default EmptyNoApps;
