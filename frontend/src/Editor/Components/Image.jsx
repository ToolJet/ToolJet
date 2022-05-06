import React, { useRef, useEffect, useState } from 'react';
import LazyLoad from 'react-lazyload';

export const Image = function Image({ height, properties, styles, fireEvent }) {
  const { source, loadingState, alternativeText, zoomButtons } = properties;
  const { visibility, disabledState, borderType, backgroundColor, padding, objectFit } = styles;
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

  function zoomIn() {
    console.log('zzom');
    document.getElementsByClassName('zoom-image-wrap').classList.add('mystyle');
  }
  function zoomOut() {
    console.log('zzom');
    document.getElementsByClassName('zoom-image-wrap').classList.add('mystyle');
  }

  return (
    <div
      data-disabled={disabledState}
      style={{
        display: widgetVisibility ? 'flex' : 'none',
        justifyContent: 'center',
      }}
      ref={imageRef}
    >
      {imageRef.current && (
        <LazyLoad
          offset={imageOffset > 0 ? imageOffset : 0}
          height={height}
          placeholder={<Placeholder />}
          debounce={500}
        >
          {loadingState === true ? (
            <center>
              <div className="spinner-border " role="status"></div>
            </center>
          ) : (
            <>
              <img
                src={source}
                className={`zoom-image-wrap ${borderType !== 'none' ? borderType : ''}`}
                style={{ backgroundColor, padding: Number.parseInt(padding), objectFit }}
                height={height}
                onClick={() => fireEvent('onClick')}
                alt={alternativeText}
              />
              {zoomButtons && (
                <div>
                  <button className="btn" onClick={() => zoomIn()}>
                    +
                  </button>
                  <button className="btn" onClick={() => zoomOut()}>
                    -
                  </button>
                </div>
              )}
            </>
          )}
        </LazyLoad>
      )}
    </div>
  );
};
