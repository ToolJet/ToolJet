import React from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
export const NoCondition = ({ text = 'There are no condition' }) => {
  return (
    <div className="border-dashed d-flex justify-content-center align-items-center h-32 border-radius-6">
      <Information width="14" />
      <span className="tj-text-sm" style={{ color: 'var(--slate11)' }}>
        {text}
      </span>
    </div>
  );
};
