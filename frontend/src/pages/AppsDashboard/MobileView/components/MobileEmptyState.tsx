import React from 'react';

import { cn } from '@/lib/utils';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Rocket/Empty/Empty';

interface MobileEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  classes?: { emptyContainer: string } | null;
}

export function MobileEmptyState({ icon, title, description, classes = null }: MobileEmptyStateProps) {
  return (
    <Empty className={cn('tw-gap-3 tw-px-4 tw-py-10', classes?.emptyContainer)}>
      <EmptyHeader className="tw-gap-0">
        <EmptyMedia variant="icon" className="tw-mb-0 tw-size-16 tw-p-1.5 tw-rounded-full tw-bg-interactive-default">
          {icon}
        </EmptyMedia>

        <EmptyTitle className="tw-mt-2.5">{title}</EmptyTitle>

        {Boolean(description) && (
          <EmptyDescription className="tw-mt-0.5 tw-whitespace-pre-line">{description}</EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}
