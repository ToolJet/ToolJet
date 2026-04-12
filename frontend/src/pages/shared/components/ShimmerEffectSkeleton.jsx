import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { cn } from '@/lib/utils';

export default function ShimmerEffectSkeleton({ className }) {
  return <Skeleton className={cn('tw-bg-interactive-default tw-rounded tw-h-5', className)} />;
}
