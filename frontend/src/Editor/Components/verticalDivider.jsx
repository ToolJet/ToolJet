import React from 'react';

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode, properties }) {
  const { dividerColor, boxShadow, dividerStyle } = styles;
  const { visibility } = properties;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;

  return (
    <div
      className="row"
      style={{ display: visibility ? 'flex' : 'none', padding: '0 8px', width, height }}
      data-cy={dataCy}
    >
      <div className="col-6"></div>
      <div
        className="col-6"
        style={{
          height,
          width: '1px',
          backgroundColor: dividerStyle === 'solid' ? color : 'transparent',
          borderLeft: dividerStyle === 'dashed' ? `1px dashed ${color}` : 'none',
          padding: '0rem',
          marginLeft: '0.5rem',
          boxShadow,
        }}
      ></div>
    </div>
  );
};
