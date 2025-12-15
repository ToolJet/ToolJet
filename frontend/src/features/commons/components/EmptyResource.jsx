import React from 'react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/Rocket/empty';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function EmptyResource({
  title = "You don't have any resources yet",
  description = 'You can start creating resources using the options available in your interface.',
  iconName = 'mobile-empty-state',
  className = 'tw-mt-24',
}) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <SolidIcon name={iconName} width="200" height="140" fill="var(--icon-default)" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default EmptyResource;
