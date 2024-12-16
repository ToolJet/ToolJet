/* eslint-disable import/no-unresolved */
import React, { useRef, useEffect, useState } from 'react';
import LazyLoad, { forceCheck } from 'react-lazyload';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import BrokenImage from '@/Editor/Components/Image/icons/broken-image.svg';
import ZoomInImage from '@/Editor/Components/Image/icons/zoomin-image.svg';
import ZoomOutImage from '@/Editor/Components/Image/icons/zoomout-image.svg';
import RotateImage from '@/Editor/Components/Image/icons/rotate-image.svg';
import './image.scss';
import Loader from '@/ToolJetUI/Loader/Loader';

export const Image = function Image({
  componentName,
  height,
  properties,
  styles,
  fireEvent,
  width,
  parentId = null,
  dataCy,
}) {
  const { source, loadingState, alternativeText, zoomButtons, rotateButton } = properties;
  const { visibility, disabledState, borderType, backgroundColor, padding, imageFit, boxShadow } = styles;
  const hasOnClickEvent = false;
  const widgetVisibility = visibility ?? true;
  const imageRef = useRef(null);
  const [imageOffset, setImageOffset] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoomReset, setZoomReset] = useState(false);
  const [isError, setIsError] = useState(false);

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }
  useEffect(() => {
    if (parentId === null) {
      setImageOffset(computeOffset());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageRef]);

  useEffect(() => {
    setIsError(false);
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
      onError={() => setIsError(true)}
    />
  );

  const resetZoom = (resetTransform) => {
    setZoomReset(false);
    resetTransform();
  };

  const renderImageContainer = () => {
    return (
      <>
        {loadingState === true ? (
          <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <center>
              <Loader width="16" absolute={false} />
            </center>
          </div>
        ) : isError ? (
          <div className="broken-url-placeholder">
            {alternativeText && (
              <>
                <BrokenImage />
                <p>{alternativeText}</p>
              </>
            )}
          </div>
        ) : zoomButtons ? (
          <TransformWrapper centerOnInit={true}>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {zoomReset && resetZoom(resetTransform)}
                <TransformComponent>{renderImage()}</TransformComponent>
                {zoomButtons && (
                  <div className="img-control-wrapper">
                    <button className="img-control-btn" onClick={() => zoomIn()}>
                      <ZoomInImage />
                    </button>
                    <button className="img-control-btn" onClick={() => zoomOut()}>
                      <ZoomOutImage />
                    </button>
                    {rotateButton && (
                      <button className="img-control-btn" onClick={rotateImage}>
                        <RotateImage />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </TransformWrapper>
        ) : (
          <>
            {rotateButton && (
              <div className="img-control-wrapper" style={{ zIndex: 1 }}>
                <button className="img-control-btn" onClick={rotateImage}>
                  <RotateImage />
                </button>
              </div>
            )}
            {renderImage()}
          </>
        )}
      </>
    );
  };

  return (
    <div
      data-disabled={disabledState}
      data-cy={`draggable-widget-${String(componentName).toLowerCase()}`}
      style={{
        height,
        width: '100%',
        display: widgetVisibility ? 'flex' : 'none',
        justifyContent: 'center',
        boxShadow,
      }}
      ref={imageRef}
      className="image-widget-wrapper"
    >
      {imageRef.current && parentId === null ? (
        <LazyLoad
          offset={imageOffset > 0 ? imageOffset : 0}
          height={height}
          style={{ width: '100%' }}
          placeholder={<Placeholder />}
          debounce={500}
          scrollContainer={'.canvas-container'}
        >
          {renderImageContainer()}
        </LazyLoad>
      ) : (
        imageRef.current && renderImageContainer()
      )}
    </div>
  );
};
