import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/Rocket/shadcn/skeleton';

const skeletonClasses = 'tw-animate-pulse tw-rounded-md tw-bg-interactive-hover';

function Skeleton({ className, ...props }) {
  return <ShadcnSkeleton className={cn(skeletonClasses, className)} {...props} />;
}
Skeleton.displayName = 'Skeleton';
Skeleton.propTypes = {
  className: PropTypes.string,
};

export { Skeleton, skeletonClasses };
