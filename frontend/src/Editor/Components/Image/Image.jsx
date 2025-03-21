/* eslint-disable import/no-unresolved */
import React, { useRef, useEffect, useState } from 'react';
import LazyLoad, { forceCheck } from 'react-lazyload';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Loader from '@/ToolJetUI/Loader/Loader';
import BrokenImage from '@/Editor/Components/Image/icons/broken-image.svg';
import ZoomInImage from '@/Editor/Components/Image/icons/zoomin-image.svg';
import ZoomOutImage from '@/Editor/Components/Image/icons/zoomout-image.svg';
import RotateImage from '@/Editor/Components/Image/icons/rotate-image.svg';
import './image.scss';

export const Image = function Image({
  setExposedVariable,
  setExposedVariables,
  componentName,
  height,
  properties,
  styles,
  fireEvent,
  width,
  parentId = null,
  dataCy,
}) {
  const { imageFormat, source, jsSchema, alternativeText, zoomButtons, rotateButton, loadingState, disabledState } =
    properties;
  const {
    imageFit,
    imageShape,
    backgroundColor,
    padding,
    customPadding,
    boxShadow,
    borderRadius,
    borderColor,
    alignment,
  } = styles;

  const isInitialRender = useRef(true);

  const computeUrl = () => {
    return imageFormat === 'imageUrl' ? source : `data:${jsSchema?.type};base64,${jsSchema?.base64Data}`;
  };

  const [sourceURL, setSourceURL] = useState(computeUrl());
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  const hasOnClickEvent = false;
  const imageRef = useRef(null);
  const [imageOffset, setImageOffset] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoomReset, setZoomReset] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);
  const [zoomMode, setZoomMode] = useState('in');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    isInitialRender.current = false;
    const url = computeUrl();
    setSourceURL(url);
    setExposedVariable('imageURL', url);
  }, [imageFormat, source, jsSchema]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (alternativeText === '') {
      setExposedVariable('alternativeText', null);
    }
    setExposedVariable('alternativeText', alternativeText);
  }, [alternativeText]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

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
  }, [sourceURL]);

  useEffect(() => {
    forceCheck();
  }, [visibility]);

  useEffect(() => {
    const exposedVariables = {
      imageURL: computeUrl(),
      alternativeText: alternativeText,
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState,
      setImageURL: async function (value) {
        setSourceURL(value);
        setExposedVariable('imageURL', value);
      },
      clearImage: async function () {
        setSourceURL('');
        setExposedVariable('imageURL', '');
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', value);
        setVisibility(value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', value);
        setIsLoading(value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', value);
        setIsDisabled(value);
      },
    };
    setExposedVariables(exposedVariables);

    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const rotateImage = () => setRotation((prevValue) => (prevValue === 270 ? 0 : prevValue + 90));

  const renderImage = () => (
    <img
      src={sourceURL}
      className={`zoom-image-wrap`}
      style={{
        backgroundColor,
        padding: padding === 'default' ? '0px' : Number.parseInt(customPadding),
        objectFit: imageFit ? imageFit : 'contain',
        cursor: hasOnClickEvent ? 'pointer' : 'inherit',
        pointerEvents: 'auto',
        width,
        height,
        transform: `rotate(${rotation}deg)`,
        border: '1px solid',
        borderRadius: imageShape === 'circle' ? '50%' : `${borderRadius}px`,
        borderColor: borderColor ? borderColor : 'transparent',
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

  const FallbackState = () => {
    return (
      <div className="broken-url-placeholder" onClick={() => fireEvent('onClick')}>
        {isLoading && (
          <center>
            <Loader width="16" absolute={false} />
          </center>
        )}
        {!isLoading && alternativeText && (
          <>
            <BrokenImage />
            <p>{alternativeText}</p>
          </>
        )}
      </div>
    );
  };

  const ImageControls = (zoomIn, zoomOut) => {
    return (
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
    );
  };

  const handlePointerDown = (e) => {
    console.log({ x: e.clientX, y: e.clientY });
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    // If the mouse has moved more than a threshold, it's considered a drag
    if (Math.abs(e.clientX - dragStart.x) > 5 || Math.abs(e.clientY - dragStart.y) > 5) {
      setIsDragging(true);
    }
  };

  const handleZoomMode = ({ state }) => {
    console.log(state);
    if (state.scale === 8) setZoomMode('out');
    if (state.scale === 1) setZoomMode('in');
  };

  const handleClick = (e, zoomOut, rest) => {
    if (!isDragging) {
      if (!isZoomEnabled) return;
      if (zoomMode === 'out') {
        zoomOut();
      }
      if (zoomMode === 'in') {
        const targetElement = document.querySelector('.react-transform-component');
        const dblClickEvent = new MouseEvent('dblclick', e);
        targetElement.dispatchEvent(dblClickEvent);
      }
    }
    if (isDragging) setIsDragging(false);
    handleZoomMode(rest);
  };

  const renderImageContainer = () => {
    return (
      <>
        {(isLoading || isError) && FallbackState()}
        {!isLoading && !isError && zoomButtons && (
          <TransformWrapper centerOnInit={true} doubleClick={{ disabled: zoomMode === 'in' ? false : true }}>
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                {zoomReset && resetZoom(resetTransform)}
                <div
                  className="transform-component-wrapper"
                  style={{ cursor: isZoomEnabled ? (zoomMode === 'in' ? 'zoom-in' : 'zoom-out') : 'default' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onMouseEnter={() => setIsZoomEnabled(true)}
                  onMouseLeave={() => setIsZoomEnabled(false)}
                  onClick={(e) => handleClick(e, zoomOut, rest)}
                >
                  <TransformComponent>{renderImage()}</TransformComponent>
                </div>
                {zoomButtons && ImageControls(zoomIn, zoomOut)}
              </>
            )}
          </TransformWrapper>
        )}
        {!isLoading && !isError && !zoomButtons && (
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
      data-disabled={isDisabled}
      data-cy={`draggable-widget-${String(componentName).toLowerCase()}`}
      style={{
        height,
        display: visibility ? 'flex' : 'none',
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
