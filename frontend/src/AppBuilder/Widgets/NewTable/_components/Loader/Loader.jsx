import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

export const Loader = React.memo(({ width, height }) => (
  <SkeletonTheme baseColor="var(--slate3)">
    <Skeleton count={1} width={width} height={height} className="mb-1" />
  </SkeletonTheme>
));
