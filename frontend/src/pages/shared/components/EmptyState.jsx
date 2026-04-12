import React from 'react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/Rocket/Empty/Empty';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

export default function EmptyState({
  title,
  children,
  description,
  resourceType,
  illustrationSlot,
  className = 'tw-h-full',
}) {
  return (
    <Empty className={className} data-cy={`${generateCypressDataCy(resourceType)}-empty-state`}>
      <EmptyHeader>
        <EmptyMedia variant="default" data-cy={`${generateCypressDataCy(resourceType)}-empty-state-image`}>
          {illustrationSlot}
        </EmptyMedia>

        <EmptyTitle data-cy={`${generateCypressDataCy(resourceType)}-empty-state-header`}>{title}</EmptyTitle>

        <EmptyDescription data-cy={`${generateCypressDataCy(resourceType)}-empty-state-description`}>
          {description}
        </EmptyDescription>

        <EmptyContent>{children}</EmptyContent>
      </EmptyHeader>
    </Empty>
  );
}
