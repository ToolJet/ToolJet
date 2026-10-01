import React from 'react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * ImageColumnAdapter - Table adapter for ImageRenderer
 *
 * Wraps the shared ImageRenderer with Table-specific props.
 * Maintains the same API as the original ImageColumn for backward compatibility.
 */
export const ImageColumn = ({ cellValue, width, height, borderRadius, objectFit, horizontalAlignment, altText }) => {
  return (
    <ImageRenderer
      value={cellValue}
      width={width}
      height={height}
      borderRadius={borderRadius}
      objectFit={objectFit}
      horizontalAlignment={horizontalAlignment}
      altText={altText}
    />
  );
};

export default ImageColumn;
