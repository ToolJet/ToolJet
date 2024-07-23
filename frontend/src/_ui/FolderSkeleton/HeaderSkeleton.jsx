import React from 'react';
import Skeleton from 'react-loading-skeleton';

export default function HeaderSkeleton() {
  return (
    <div
      className="d-flex justify-content-between w-100"
      style={{ marginTop: '2rem', borderBottom: '1px solid var(--slate5)' }}
    >
      <div className="justify-content-start">
        <Skeleton count={1} height={20} width={60} className="mb-3" />
      </div>
      <div className="justify-content-end">
        <Skeleton count={1} height={20} width={120} className="mb-3" />
      </div>
    </div>
  );
}
