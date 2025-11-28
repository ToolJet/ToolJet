import React from 'react';
import { PaginationFooterSkeleton } from '../../ui/blocks/PaginationFooterSkeleton';

export default {
  title: 'Features/Apps/Components/TablePaginationFooterSkeleton',
  component: PaginationFooterSkeleton,
};

export const Default = () => <PaginationFooterSkeleton />;

export const InContext = () => (
  <div className="tw-w-full tw-border-t tw-border-border-weak tw-bg-background-surface-layer-01">
    <div className="tw-px-20">
      <div className="tw-w-full tw-max-w-[1232px] tw-mx-auto">
        <PaginationFooterSkeleton />
      </div>
    </div>
  </div>
);
InContext.parameters = {
  docs: {
    description: {
      story: 'Skeleton shown within footer context with proper container styling.',
    },
  },
};
