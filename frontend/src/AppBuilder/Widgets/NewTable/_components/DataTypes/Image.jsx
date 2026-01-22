import React from 'react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/ImageRenderer';

export const ImageColumn = ({ cellValue, width, height, borderRadius, objectFit, horizontalAlignment }) => {
  return (
    <ImageRenderer
      value={cellValue}
      width={width}
      height={height}
      borderRadius={borderRadius}
      objectFit={objectFit}
      horizontalAlignment={horizontalAlignment}
    />
  );
};
