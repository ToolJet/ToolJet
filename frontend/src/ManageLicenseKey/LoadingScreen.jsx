import React from 'react';
import Skeleton from 'react-loading-skeleton';

const LoadingScreen = () => {
  return (
    <div className="license-skeleton-loader">
      <Skeleton width="60%" height="20px" />
      <Skeleton width="25%" height="20px" />
      <Skeleton width="60%" height="20px" />
      <Skeleton width="60%" height="20px" />
      <Skeleton width="25%" height="20px" />
    </div>
  );
};

export { LoadingScreen };
