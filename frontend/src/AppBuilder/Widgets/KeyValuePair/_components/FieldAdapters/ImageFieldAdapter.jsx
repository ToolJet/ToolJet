import React from 'react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes';

/**
 * ImageFieldAdapter - KeyValuePair adapter for ImageRenderer
 */
export const ImageField = ({ value, field }) => {
  return (
    <ImageRenderer
      value={value}
      // The renderer appends px; a '100%' default became the invalid '100%px', which the browser ignored as auto.
      width={field?.width || undefined}
      height={field?.height || '100%'}
      borderRadius={field?.borderRadius}
      objectFit={field?.objectFit}
      horizontalAlignment={'left'}
    />
  );
};

export default ImageField;
