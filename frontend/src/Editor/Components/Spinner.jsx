import React from 'react';

export const Spinner = ({ styles, height }) => {
  const { colour, size } = styles;

  return (
    <div className="spinner-container" style={{ height }}>
      <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
    </div>
  );
};
