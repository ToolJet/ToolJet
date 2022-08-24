/* eslint-disable import/no-unresolved */
import React, { useRef, useEffect, useState } from 'react';
import LazyLoad, { forceCheck } from 'react-lazyload';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export const Image = function Image({ component, height, properties, styles, fireEvent, width }) {
  const { source, loadingState, alternativeText, zoomButtons, rotateButton } = properties;
  const { visibility, disabledState, borderType, backgroundColor, padding, imageFit } = styles;
  const {
    definition: { events },
  } = component;
  const hasOnClickEvent = events.some((event) => event.eventId === 'onClick');
  const widgetVisibility = visibility ?? true;
  const imageRef = useRef(null);
  const [imageOffset, setImageOffset] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoomReset, setZoomReset] = useState(false);

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }
  useEffect(() => {
    setImageOffset(computeOffset());
  }, [imageRef]);

  useEffect(() => {
    setRotation(0);
    setZoomReset(true);
  }, [source]);

  function computeOffset() {
    if (imageRef.current) {
      const clientRect = imageRef.current.getBoundingClientRect();
      const layoutHeightWithOffset = clientRect.top + clientRect.height;
      return layoutHeightWithOffset - document.documentElement.clientHeight;
    }
    return 0;
  }
  useEffect(() => {
    forceCheck();
  }, [visibility]);

  const rotateImage = () => setRotation((prevValue) => (prevValue === 270 ? 0 : prevValue + 90));

  const renderImage = () => (
    <img
      src={source}
      className={`zoom-image-wrap ${borderType !== 'none' ? borderType : ''}`}
      style={{
        backgroundColor,
        padding: Number.parseInt(padding),
        objectFit: imageFit ? imageFit : 'contain',
        cursor: hasOnClickEvent ? 'pointer' : 'inherit',
        pointerEvents: 'auto',
        width,
        height,
        transform: `rotate(${rotation}deg)`,
      }}
      height={height}
      onClick={() => fireEvent('onClick')}
      alt={alternativeText}
      width={width}
    />
  );

  const resetZoom = (resetTransform) => {
    setZoomReset(false);
    resetTransform();
  };

  return (
    <div
      data-disabled={disabledState}
      style={{
        display: widgetVisibility ? 'flex' : 'none',
        justifyContent: 'center',
      }}
      ref={imageRef}
      className="image-widget-wrapper"
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
          ) : zoomButtons ? (
            <>
              <TransformWrapper>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    {zoomReset && resetZoom(resetTransform)}
                    <TransformComponent>{renderImage()}</TransformComponent>
                    {zoomButtons && (
                      <div className="zoom-button-wrapper">
                        {rotateButton && (
                          <button className="btn zoom-buttons" onClick={rotateImage}>
                            <span>↻</span>
                          </button>
                        )}
                        <button className="btn zoom-buttons" onClick={() => zoomIn()}>
                          +
                        </button>
                        <button className="btn zoom-buttons" onClick={() => zoomOut()}>
                          -
                        </button>
                      </div>
                    )}
                  </>
                )}
              </TransformWrapper>
            </>
          ) : (
            <>
              {rotateButton && (
                <div className="zoom-button-wrapper" style={{ zIndex: 1 }}>
                  <button className="btn zoom-buttons" onClick={rotateImage}>
                    <span>↻</span>
                  </button>
                </div>
              )}
              {renderImage()}
            </>
          )}
        </LazyLoad>
      )}
    </div>
  );
};
