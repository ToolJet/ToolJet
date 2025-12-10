import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return <div className={cn('tw-animate-pulse tw-rounded-md tw-bg-interactive-hover', className)} {...props} />;
}

export { Skeleton };
