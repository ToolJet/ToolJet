import React from 'react';
import { Plus } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../Empty';
import { Button } from '../../Button/Button';
import WorkflowsIllustration from '../illustrations/WorkflowsIllustration';

function WorkflowsEmptyState({ className, size = 'large', onCreateWorkflow, ...props }) {
  return (
    <Empty size={size} className={className} {...props}>
      <EmptyMedia>
        <WorkflowsIllustration width="176" height="121" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>You don&apos;t have any workflows yet</EmptyTitle>
        <EmptyDescription>Create a workflow to start automating your tasks.</EmptyDescription>
      </EmptyHeader>
      {onCreateWorkflow && (
        <EmptyContent>
          <Button variant="outline" size="default" leadingVisual={<Plus size={14} />} onClick={onCreateWorkflow}>
            Create new workflow
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default WorkflowsEmptyState;
