import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import React, { useState, useEffect, useRef } from 'react';

export const TextArea = function TextArea({
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
}) {
  const isInitialRender = useRef(true);
  const [value, setValue] = useState(properties.value);
  const textAreaRef = useRef(null);
  const resizeTextArea = () => {
    if (!textAreaRef.current || !properties.dynamicHeight) {
      textAreaRef.current.style.height = `${height}px`;
      return;
    }
    textAreaRef.current.style.height = 'auto';
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight + 20}px`;
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setValue(properties.value);
    setExposedVariable('value', properties.value);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  useEffect(() => {
    const exposedVariables = {
      setText: async function (text) {
        setValue(text);
        setExposedVariable('value', text);
      },
      clear: async function () {
        setValue('');
        setExposedVariable('value', '');
      },
      value: properties.value,
    };
    setExposedVariables(exposedVariables);
    setValue(properties.value);
    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resizeTextArea();
  }, [width, height, properties.dynamicHeight, value]);

  useDynamicHeight({
    dynamicHeight: properties.dynamicHeight,
    id,
    height,
    value,
    adjustComponentPositions,
    currentLayout,
    width,
  });

  return (
    <textarea
      ref={textAreaRef}
      disabled={styles.disabledState}
      onChange={(e) => {
        setValue(e.target.value);
        setExposedVariable('value', e.target.value);
      }}
      type="text"
      className="form-control textarea"
      placeholder={properties.placeholder}
      style={{
        height,
        overflow: properties.dynamicHeight && 'hidden',
        resize: 'none',
        display: styles.visibility ? '' : 'none',
        borderRadius: `${styles.borderRadius}px`,
        boxShadow: styles.boxShadow,
      }}
      value={value}
      data-cy={dataCy}
    ></textarea>
  );
};
