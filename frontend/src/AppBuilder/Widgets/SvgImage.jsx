import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import './svgImage.scss';

export const SvgImage = function SvgImage({
  properties,
  styles,
  height,
  width,
  dataCy,
  id,
  setExposedVariable,
  setExposedVariables,
  currentLayout,
  currentMode,
  subContainerIndex,
}) {
  const { boxShadow, alignment } = styles;
  const { data, loadingState, disabledState } = properties;
  // Apps saved before the visibility data migration still carry it under styles.
  const resolvedVisibility = properties.visibility ?? styles.visibility ?? true;

  const isInitialRender = useRef(true);
  const imageRef = useRef(null);
  const [visibility, setVisibility] = useState(resolvedVisibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // View mode only: free the authored box and let the vector's viewBox ratio at the current
  // width decide the height; the wrapper is measured and siblings reflow (same as Image).
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(imageRef, isDynamicHeightEnabled);
  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
  });

  useEffect(() => {
    setVisibility(resolvedVisibility);
    setIsLoading(loadingState);
    setIsDisabled(disabledState);
    if (!isInitialRender.current) {
      setExposedVariables({ isVisible: resolvedVisibility, isLoading: loadingState, isDisabled: disabledState });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedVisibility, loadingState, disabledState]);

  useEffect(() => {
    setExposedVariables({
      isVisible: resolvedVisibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        setVisibility(!!value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        setIsLoading(!!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        setIsDisabled(!!value);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: visibility ? '' : 'none',
        overflow: 'hidden',
        height: isDynamicHeightEnabled ? 'auto' : height,
        boxShadow,
      }}
      data-cy={dataCy}
      data-disabled={isDisabled}
    >
      {isLoading ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader width="16" absolute={false} />
        </div>
      ) : (
        <div
          ref={imageRef}
          role="img"
          id={`component-${id}`}
          className={`svg-image-widget${isDynamicHeightEnabled ? ' svg-image-widget--dynamic' : ''}`}
          style={{ display: 'flex', justifyContent: alignment, height: '100%' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
        ></div>
      )}
    </div>
  );
};
