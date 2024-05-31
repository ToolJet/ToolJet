import React from 'react';

export const Divider = function Divider({ styles, dataCy, height, width }) {
  const { visibility, dividerColor, boxShadow } = styles;
  const color = dividerColor ?? '#E7E8EA';
  return (
    <div
      className="row"
      style={{ display: visibility ? 'flex' : 'none', padding: '0 8px', width, height, alignItems: 'center' }}
      data-cy={dataCy}
    >
      <div
        className="col-6 border-top"
        style={{ height: '1px', width, backgroundColor: color, padding: '0rem', marginLeft: '0.5rem', boxShadow }}
      ></div>
    </div>
  );
};
