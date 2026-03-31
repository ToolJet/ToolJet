import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

export const LoadingMessageSkeleton = () => (
  <div className="d-flex flex-column custom-gap-16">
    {[1, 2].map((item, index) => (
      <div key={index} className="d-flex flex-row align-items-start custom-gap-12 position-relative w-100">
        <SkeletonTheme baseColor="var(--slate3)" highlightColor="var(--slate4)">
          <Skeleton width={38} height={38} borderRadius={'50%'} /> {/* For name */}
        </SkeletonTheme>{' '}
        <div className="d-flex flex-column flex-grow-1 message-content-title-container">
          <div className="d-flex custom-gap-16 align-items-center">
            <SkeletonTheme baseColor="var(--slate3)" highlightColor="var(--slate4)">
              <Skeleton width={51} height={12} borderRadius={18} /> {/* For name */}
            </SkeletonTheme>
            <SkeletonTheme baseColor="var(--slate3)" highlightColor="var(--slate4)">
              <Skeleton width={53} height={12} borderRadius={18} /> {/* For name */}
            </SkeletonTheme>
          </div>
          <div className="tj-text-md message-content">
            <SkeletonTheme baseColor="var(--slate3)" highlightColor="var(--slate4)">
              <Skeleton width={'70%'} height={12} borderRadius={18} /> {/* For message content */}
            </SkeletonTheme>
          </div>
        </div>
      </div>
    ))}
  </div>
);
