import React from 'react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * ImageFieldAdapter - KeyValuePair adapter for ImageRenderer
 */
export const ImageField = ({ value, field }) => {
  return (
    <ImageRenderer
      value={value}
      width={field?.width || '100%'}
      height={field?.height || '100%'}
      borderRadius={field?.borderRadius}
      objectFit={field?.objectFit}
      horizontalAlignment={'left'}
    />
  );
};

export default ImageField;
