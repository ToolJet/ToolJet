/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';

export const RichTextEditor = function RichTextEditor({
  width,
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  dataCy,
}) {
  const isInitialRender = useRef(true);
  const { visibility, disabledState, boxShadow } = styles;
  const placeholder = properties.placeholder;
  const defaultValue = properties?.defaultValue ?? '';

  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isLoading, setIsLoading] = useState(properties?.loadingState);

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
  }

  return (
    <div
      data-disabled={isDisabled}
      style={{ height: `${height}px`, display: isVisible ? '' : 'none', boxShadow }}
      data-cy={dataCy}
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
      ></DraftEditor>
    </div>
  );
};
