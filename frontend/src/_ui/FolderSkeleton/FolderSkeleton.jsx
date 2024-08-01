import React from 'react';
import Skeleton from 'react-loading-skeleton';
export default function FolderSkeleton() {
  return (
    <>
      <Skeleton count={1} height={22} width={'80%'} className="mb-1" />
      <Skeleton count={1} height={22} className="mb-1" />
      <Skeleton count={1} height={22} width={'60%'} className="mb-1" />
      <Skeleton count={1} height={22} width={'80%'} className="mb-1" />
    </>
  );
}
