import React from 'react';

export const Spinner = ({ properties, styles, height, dataCy }) => {
  const { colour, size, boxShadow } = styles;
  const { visibility } = properties;

  const baseStyle = {
    height,
    display: visibility ? '' : 'none',
    boxShadow,
  };

  return (
    <div className="spinner-container" style={baseStyle} data-cy={dataCy}>
      <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
    </div>
  );
};
