import React from 'react';

export const Spinner = ({ styles, height }) => {
  const { colour, size, visibility } = styles;

  const baseStyle = {
    height,
    display: visibility ? '' : 'none',
  };

  return (
    <div className="spinner-container" style={baseStyle}>
      <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
    </div>
  );
};
