import React, { useState, useEffect } from 'react';
import Loader from '@/_ui/Loader';

export const FileButton = ({
  height,
  width,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  id,
}) => {
  const { loadingState, visibility, disabledState } = properties;

  const [isVisible, setIsVisible] = useState(visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  // Expose variables and CSA methods on mount
  useEffect(() => {
    setExposedVariables({
      // exposed variables from schema
      files: [],
      isParsing: false,
      isValid: false,
      isMandatory: false,
      // standard CSA methods
      setVisibility: async (value) => { setIsVisible(value); setExposedVariable('isVisible', value); },
      setLoading:    async (value) => { setIsLoading(value);  setExposedVariable('isLoading', value); },
      setDisable:    async (value) => { setIsDisabled(value); setExposedVariable('isDisabled', value); },
      // extra CSA methods from schema
      clear: async () => {
        // TODO: implement Clear
      },
      setFocus: async () => {
        // TODO: implement Set focus
      },
      setBlur: async () => {
        // TODO: implement Set blur
      },
    });
  }, []);

  // Sync props → state + exposed variables
  useEffect(() => { setIsLoading(loadingState);   setExposedVariable('isLoading', loadingState);   }, [loadingState]);
  useEffect(() => { setIsVisible(visibility);     setExposedVariable('isVisible', visibility);     }, [visibility]);
  useEffect(() => { setIsDisabled(disabledState); setExposedVariable('isDisabled', disabledState); }, [disabledState]);

  // Event handlers
  const handleOnFileSelected = () => fireEvent('onFileSelected');
  const handleOnFileLoaded = () => fireEvent('onFileLoaded');

  if (!isVisible) return null;

  return (
    <div
      className="fileButton-widget"
      style={{ height, width }}
      data-cy={dataCy}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div
          style={{
            opacity: isDisabled ? 0.5 : 1,
            pointerEvents: isDisabled ? 'none' : 'auto',
            height: '100%',
          }}
        >
          {/* TODO: implement FileButton widget UI */}
        </div>
      )}
    </div>
  );
};
