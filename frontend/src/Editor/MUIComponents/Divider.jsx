import React from 'react';
import MUIDivider from '@mui/material/Divider';

export const Divider = function Divider({ styles, dataCy }) {
  const { visibility, dividerColor, boxShadow } = styles;
  const color = dividerColor ?? '#E7E8EA';

  return (
    <div
      className="Divider MUI"
      style={{ display: 'flex', height: '40px', alignItems: 'center' }}
    >
      <MUIDivider
        style={{
          display: visibility ? '' : 'none',
          backgroundColor: color,
          opacity: 1,
          boxShadow,
          width: '100%',
        }}
      />
    </div>
  );
};
