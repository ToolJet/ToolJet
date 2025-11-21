import React from 'react';
import { TablePaginationFooterSkeleton } from '../TablePaginationFooterSkeleton';

export default {
  title: 'AppsPage/TablePaginationFooterSkeleton',
  component: TablePaginationFooterSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => <TablePaginationFooterSkeleton />;

export const InContext = () => (
  <div className="tw-w-full tw-border-t tw-border-border-weak tw-bg-background-surface-layer-01">
    <div className="tw-px-20">
      <div className="tw-w-full tw-max-w-[1232px] tw-mx-auto">
        <TablePaginationFooterSkeleton />
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

