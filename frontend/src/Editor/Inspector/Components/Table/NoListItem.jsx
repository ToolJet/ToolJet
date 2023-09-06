import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';

const NoListItem = ({ text }) => {
  return (
    <div
      className="d-flex justify-content-center"
      style={{
        padding: '6px 32px',
        borderRadius: '6px',
        border: '1px dashed var(--slate5)',
        color: 'var(--slate8)',
        marginBottom: '8px',
      }}
    >
      <span className="d-flex align-items-center" style={{ marginRight: '2px' }}>
        <SolidIcon name="information" width="14" fill={`var(--slate8)`} />
      </span>
      {text}
    </div>
  );
};

export default NoListItem;
