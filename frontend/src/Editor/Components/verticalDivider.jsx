import React from 'react';

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode, boxShadow }) {
  const { visibility, dividerColor } = styles;
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
        className="col-6 border-right"
        style={{ height, width: '1px', backgroundColor: color, padding: '0rem', marginLeft: '0.5rem', boxShadow }}
      ></div>
    </div>
  );
};
