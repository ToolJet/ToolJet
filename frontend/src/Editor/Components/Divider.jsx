import React from 'react';

export const Divider = function Divider({ styles, dataCy }) {
  const { visibility, dividerColor } = styles;
  const color = dividerColor ?? '#E7E8EA';

  return (
    <div
      className="hr mt-1"
      style={{ display: visibility ? '' : 'none', color: color, opacity: '1' }}
      data-cy={dataCy}
    ></div>
  );
};
