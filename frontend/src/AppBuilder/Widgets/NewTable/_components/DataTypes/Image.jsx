import React from 'react';

export const ImageColumn = ({ cellValue, width, height, borderRadius, objectFit }) => {
  if (!cellValue) return null;

  return (
    <div className="h-100 d-flex align-items-center">
      <img
        src={cellValue}
        style={{
          pointerEvents: 'auto',
          width: width ? `${width}px` : 'auto',
          height: height || '100%',
          borderRadius: borderRadius ? `${borderRadius}%` : '0',
          objectFit: objectFit || 'contain',
        }}
        alt=""
      />
    </div>
  );
};
