/* eslint-disable import/no-unresolved */
import React, { useRef, useEffect, useState } from 'react';
import LazyLoad from 'react-lazyload';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export const Image = function Image({ component, height, properties, styles, fireEvent, width }) {
  const { source, loadingState, alternativeText, zoomButtons } = properties;
  const { visibility, disabledState, borderType, backgroundColor, padding, imageFit } = styles;
  const {
    definition: { events },
  } = component;
  const hasOnClickEvent = events.some((event) => event.eventId === 'onClick');
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
                {({ zoomIn, zoomOut }) => (
                  <>
                    <React.Fragment>
                      <TransformComponent>
                        <img
                          src={source}
                          className={`zoom-image-wrap ${borderType !== 'none' ? borderType : ''}`}
                          style={{
                            backgroundColor,
                            padding: Number.parseInt(padding),
                            objectFit: imageFit ? imageFit : 'contain',
                            cursor: hasOnClickEvent ? 'pointer' : 'inherit',
                            pointerEvents: 'auto',
                          }}
                          height={height}
                          onClick={() => fireEvent('onClick')}
                          alt={alternativeText}
                          width={width}
                        />
                      </TransformComponent>
                    </React.Fragment>
                    {zoomButtons && (
                      <div className="zoom-button-wrapper">
                        <button className="btn zoom-buttons " onClick={() => zoomIn()}>
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
            <img
              src={source}
              className={`zoom-image-wrap ${borderType !== 'none' ? borderType : ''}`}
              style={{
                backgroundColor,
                padding: Number.parseInt(padding),
                objectFit: imageFit ? imageFit : 'contain',
                cursor: hasOnClickEvent ? 'pointer' : 'inherit',
                pointerEvents: 'auto',
              }}
              height={height}
              onClick={() => fireEvent('onClick')}
              alt={alternativeText}
              width={width}
            />
          )}
        </LazyLoad>
      )}
    </div>
  );
};
