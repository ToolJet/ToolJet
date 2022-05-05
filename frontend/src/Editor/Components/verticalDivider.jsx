import React from 'react';

export const VerticalDivider = function Divider({ styles, height, width }) {
  const { visibility, dividerColor } = styles;
  const color = dividerColor ?? '#E7E8EA';

  return (
    <div className="row" style={{ display: visibility ? 'flex' : 'none', padding: '0 8px', width, height }}>
      <div className="col-6"></div>
      <div
        className="col-6 border-right"
        style={{ height, width: '1px', backgroundColor: color, padding: '0rem', marginLeft: '0.5rem' }}
      ></div>
    </div>
  );
};
