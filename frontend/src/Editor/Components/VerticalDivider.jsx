import React from 'react';

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode, properties }) {
  const { dividerColor, boxShadow, dividerStyle } = styles;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  return (
    <div
      className="justify-content-center"
      style={{ display: properties?.visibility ? 'flex' : 'none', width: '100%', height: '100%' }}
      data-cy={dataCy}
    >
      <div
        style={{
          height: '100%',
          width: '1px',
          backgroundColor: dividerStyle === 'solid' ? color : 'transparent',
          borderLeft: dividerStyle === 'dashed' ? `1px dashed ${color}` : 'none',
          padding: '0rem',
          boxShadow,
        }}
      ></div>
    </div>
  );
};
