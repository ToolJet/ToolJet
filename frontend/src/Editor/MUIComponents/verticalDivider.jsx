import React from 'react';
import { Divider as MUIDivider } from '@mui/material';

export const VerticalDivider = function Divider({ styles, height, width, dataCy, darkMode }) {
  const { visibility, dividerColor, boxShadow } = styles;
  const color =
    dividerColor === '' || ['#000', '#000000'].includes(dividerColor) ? (darkMode ? '#fff' : '#000') : dividerColor;
  return (
    <div
      style={{
        display: visibility ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MUIDivider
        orientation="vertical"
        style={{ height, backgroundColor: color, boxShadow, opacity: 1 }}
      />
    </div>
  );
};
