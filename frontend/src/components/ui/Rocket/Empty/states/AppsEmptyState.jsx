import React from 'react';
import { Plus } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../Empty';
import { Button } from '../../Button/Button';
import AppsIllustration from '../illustrations/AppsIllustration';

function AppsEmptyState({ className, size = 'large', onCreateApp, ...props }) {
  return (
    <Empty size={size} className={className} {...props}>
      <EmptyMedia>
        <AppsIllustration width="176" height="121" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>You don&apos;t have any apps yet</EmptyTitle>
        <EmptyDescription>
          You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the
          option that best fits your workflow
        </EmptyDescription>
      </EmptyHeader>
      {onCreateApp && (
        <EmptyContent>
          <Button variant="outline" size="default" leadingVisual={<Plus size={14} />} onClick={onCreateApp}>
            Create new app
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default AppsEmptyState;
