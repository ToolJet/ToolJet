import React from 'react';
import { Skeleton } from './Skeleton';

export default {
  title: 'Rocket/Skeleton',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export const Default = {
  render: () => <Skeleton className="tw-h-4 tw-w-48" />,
};

export const Card = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-w-[320px]">
      <Skeleton className="tw-h-32 tw-w-full" />
      <Skeleton className="tw-h-4 tw-w-3/4" />
      <Skeleton className="tw-h-4 tw-w-1/2" />
    </div>
  ),
};

export const ListRow = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3 tw-w-[400px]">
      <Skeleton className="tw-size-10 tw-rounded-full" />
      <div className="tw-flex tw-flex-col tw-gap-2 tw-flex-1">
        <Skeleton className="tw-h-4 tw-w-3/4" />
        <Skeleton className="tw-h-3 tw-w-1/2" />
      </div>
    </div>
  ),
};
