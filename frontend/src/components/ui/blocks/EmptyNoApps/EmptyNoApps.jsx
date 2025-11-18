import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function EmptyNoApps() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <SolidIcon name="mobile-empty-state" width="200" height="140" fill="var(--icon-default)" />
        </EmptyMedia>
        <EmptyTitle>You don&apos;t have any apps yet</EmptyTitle>
        <EmptyDescription>
          You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the
          option that best fits your workflow
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}




