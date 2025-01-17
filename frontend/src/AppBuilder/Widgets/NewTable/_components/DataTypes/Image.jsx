import React from 'react';

export const ImageColumn = ({ cellValue, width, height, borderRadius, objectFit }) => {
  console.log('here--- cellValue', cellValue);

  if (!cellValue) return null;

  return (
    <img
      src={cellValue}
      style={{
        pointerEvents: 'auto',
        width: `${width}px`,
        height: height,
        borderRadius: `${borderRadius}%`,
        objectFit: `${objectFit}`,
      }}
    />
  );
};
