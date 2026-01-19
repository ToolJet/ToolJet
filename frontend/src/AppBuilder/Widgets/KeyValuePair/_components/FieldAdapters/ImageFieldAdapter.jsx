import React from 'react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * ImageFieldAdapter - KeyValuePair adapter for ImageRenderer
 */
export const ImageField = ({
  value,
  width,
  height,
  borderRadius,
  objectFit = 'contain',
  horizontalAlignment = 'left',
}) => {
  return (
    <ImageRenderer
      value={value}
      width={width}
      height={height}
      borderRadius={borderRadius}
      objectFit={objectFit}
      horizontalAlignment={horizontalAlignment}
    />
  );
};

export default ImageField;
