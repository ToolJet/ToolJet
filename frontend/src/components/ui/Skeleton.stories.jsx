import React from 'react';
import { Skeleton } from './skeleton';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
};

export const Default = () => (
  <div className="tw-space-y-2">
    <Skeleton className="tw-h-4 tw-w-[250px]" />
    <Skeleton className="tw-h-4 tw-w-[200px]" />
  </div>
);

export const Card = () => (
  <div className="tw-flex tw-flex-col tw-space-y-3">
    <Skeleton className="tw-h-[125px] tw-w-[250px] tw-rounded-xl" />
    <div className="tw-space-y-2">
      <Skeleton className="tw-h-4 tw-w-[250px]" />
      <Skeleton className="tw-h-4 tw-w-[200px]" />
    </div>
  </div>
);
