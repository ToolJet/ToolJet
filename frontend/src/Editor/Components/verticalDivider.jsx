import React from 'react';

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode }) {
  const { visibility, dividerColor, boxShadow } = styles;

  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;
  return (
    <div
      className="justify-content-center"
      style={{ display: visibility ? 'flex' : 'none', width: '100%', height: '100%' }}
      data-cy={dataCy}
    >
      <div
        style={{
          height: '100%',
          width: '1px',
          backgroundColor: color,
          border: 'none',
          padding: '0rem',
          boxShadow,
        }}
      ></div>
    </div>
  );
};
