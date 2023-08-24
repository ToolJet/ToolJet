import React from 'react';

const NoListItem = ({ text }) => {
  return (
    <div
      className="d-flex justify-content-center"
      style={{ padding: '6px 32px', borderRadius: '6px', border: '1px dashed var(--slate8)', color: 'var(--slate11' }}
    >
      {text}
    </div>
  );
};

export default NoListItem;
