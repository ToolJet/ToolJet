import React from 'react';
import { determineJustifyContentValue } from '@/_helpers/utils';

/**
 * ImageRenderer - Pure image value renderer
 *
 * Renders an image with customizable dimensions and styling.
 *
 * @param {Object} props
 * @param {string} props.value - The image URL/source
 * @param {number|string} props.width - Image width
 * @param {string} props.height - Image height
 * @param {string} props.borderRadius - Border radius for the image
 * @param {string} props.objectFit - CSS object-fit property ('cover' | 'contain' | 'fill' | etc.)
 * @param {string} props.horizontalAlignment - Horizontal alignment ('left' | 'center' | 'right')
 */
export const ImageRenderer = ({
  value,
  width,
  height = '100%',
  borderRadius,
  objectFit = 'contain',
  horizontalAlignment = 'left',
}) => {
  if (!value) {
    return null;
  }

  return (
    <div
      className={`h-100 d-flex align-items-center w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
    >
      <img
        src={value}
        alt=""
        style={{
          width: width ? `${width}px` : 'auto',
          height: height,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          objectFit: objectFit,
        }}
      />
    </div>
  );
};

export default ImageRenderer;
