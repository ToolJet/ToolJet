import React, { useRef } from 'react';
import LazyLoad from 'react-lazyload';

export const Image = function Image({ height, properties, styles, fireEvent }) {
  const source = properties.source;
  const widgetVisibility = styles.visibility ?? true;
  const imageRef = useRef(null);

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }

  function computeOffset() {
    if (imageRef.current) {
      const clientRect = imageRef.current.getBoundingClientRect();
      const layoutHeightWithOffset = clientRect.top + clientRect.height;
      return layoutHeightWithOffset - document.documentElement.clientHeight;
    }
    return 0;
  }

  const imageOffset = computeOffset();

  return (
    <div data-disabled={styles.disabledState} style={{ display: widgetVisibility ? '' : 'none' }} ref={imageRef}>
      {imageRef.current && (
        <LazyLoad
          offset={imageOffset > 0 ? imageOffset : 0}
          height={height}
          placeholder={<Placeholder />}
          debounce={500}
        >
          <img src={source} height={height} onClick={() => fireEvent('onClick')} />
        </LazyLoad>
      )}
    </div>
  );
};
