import React from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
export const NoCondition = () => {
  return (
    <div className="border-dashed d-flex justify-content-center align-items-center h-32 border-radius-6">
      <Information width="14" />
      <span className="tj-text-sm ml-1" style={{ color: 'var(--slate11)', marginLeft: '04px', fontSize: '12px' }}>
        No conditions added
      </span>
    </div>
  );
};
