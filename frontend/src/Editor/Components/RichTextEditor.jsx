/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';

export const RichTextEditor = function RichTextEditor({
  id,
  width,
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
  adjustComponentPositions,
  currentLayout,
  currentMode,
  subContainerIndex,
}) {
  const isInitialRender = useRef(true);
  const { visibility, disabledState, boxShadow } = styles;
  const placeholder = properties.placeholder;
  const defaultValue = properties?.defaultValue ?? '';
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const [currentValue, setCurrentValue] = useState(defaultValue);

  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isLoading, setIsLoading] = useState(properties?.loadingState);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id: id,
    height,
    value: currentValue,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
  });

  useEffect(() => {
    if (isDisabled !== disabledState) setIsDisabled(disabledState);
    if (isVisible !== visibility) setIsVisible(visibility);
    if (isLoading !== properties.loadingState) setIsLoading(properties.loadingState);
  }, [properties.loadingState, styles.visibility, styles.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', isLoading);
  }, [isLoading]);

  function handleChange(html) {
    setExposedVariable('value', html);
    setCurrentValue(html);
  }

  return (
    <div
      data-disabled={isDisabled}
      style={{
        height: isDynamicHeightEnabled ? '100%' : `${height}px`,
        ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
        display: isVisible ? '' : 'none',
        boxShadow,
      }}
      data-cy={dataCy}
      className="scrollbar-container"
      component-id={id}
      aria-label="Text Editor"
      aria-hidden={!visibility}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      <DraftEditor
        isInitialRender={isInitialRender}
        handleChange={handleChange}
        height={height}
        width={width}
        placeholder={placeholder}
        defaultValue={defaultValue}
        isLoading={isLoading}
        isVisible={visibility}
        isDisabled={disabledState}
        setExposedVariable={setExposedVariable}
        setExposedVariables={setExposedVariables}
        setIsDisabled={setIsDisabled}
        setIsVisible={setIsVisible}
        setIsLoading={setIsLoading}
        isDynamicHeightEnabled={isDynamicHeightEnabled}
      ></DraftEditor>
    </div>
  );
};
