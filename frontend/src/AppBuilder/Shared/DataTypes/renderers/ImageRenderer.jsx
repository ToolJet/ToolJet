import React, { useEffect, useState } from 'react';
import { IconPhotoOff } from '@tabler/icons-react';
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
  const [hasLoadError, setHasLoadError] = useState(false);
  useEffect(() => setHasLoadError(false), [value]);

  if (!value) {
    return null;
  }

  return (
    <div
      className={`h-100 d-flex align-items-center w-100 justify-content-${determineJustifyContentValue(
        horizontalAlignment
      )}`}
    >
      {hasLoadError ? (
        // A broken image renders 0×0; show a visible, labelled fallback instead.
        <IconPhotoOff
          role="img"
          aria-label="Image failed to load"
          width={20}
          height={20}
          color="var(--cc-default-icon, currentColor)"
        />
      ) : (
        <img
          onError={() => setHasLoadError(true)}
          src={value}
          alt=""
          style={{
            pointerEvents: 'auto',
            width: width ? `${width}px` : 'auto',
            height: height || '100%',
            borderRadius: borderRadius ? `${borderRadius}px` : undefined,
            objectFit: objectFit,
          }}
        />
      )}
    </div>
  );
};

export default ImageRenderer;
