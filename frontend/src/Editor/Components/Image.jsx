import React, { useRef, useEffect, useState } from 'react';
import LazyLoad from 'react-lazyload';

export const Image = function Image({ height, properties, styles, fireEvent }) {
  const { source } = properties;
  const { visibility, disabledState, borderType, backgroundColor } = styles;
  const widgetVisibility = visibility ?? true;
  const imageRef = useRef(null);
  const [imageOffset, setImageOffset] = useState(0);

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }

  useEffect(() => {
    setImageOffset(computeOffset());
  }, [imageRef]);

  function computeOffset() {
    if (imageRef.current) {
      const clientRect = imageRef.current.getBoundingClientRect();
      const layoutHeightWithOffset = clientRect.top + clientRect.height;
      return layoutHeightWithOffset - document.documentElement.clientHeight;
    }
    return 0;
  }

  return (
    <div data-disabled={disabledState} style={{ display: widgetVisibility ? '' : 'none' }} ref={imageRef}>
      {imageRef.current && (
        <LazyLoad
          offset={imageOffset > 0 ? imageOffset : 0}
          height={height}
          placeholder={<Placeholder />}
          debounce={500}
        >
          <img
            src={source}
            className={`${borderType !== 'none' ? borderType : ''}`}
            style={{ backgroundColor }}
            height={height}
            onClick={() => fireEvent('onClick')}
          />
        </LazyLoad>
      )}
    </div>
  );
};
