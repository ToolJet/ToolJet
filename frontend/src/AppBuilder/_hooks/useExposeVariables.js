import { useEffect, useState } from 'react';

export const useExposeState = (loadingState, visibleState, disabledState, setExposedVariables, setExposedVariable) => {
  const [isDisabled, setDisable] = useState(disabledState || false);
  const [isVisible, setVisibility] = useState(visibleState || true);
  const [isLoading, setLoading] = useState(loadingState || false);

  // Effect to conditionally update state from properties passed to widget
  useEffect(() => {
    setDisable(disabledState);
  }, [disabledState]);

  useEffect(() => {
    setVisibility(visibleState);
  }, [visibleState]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  // exposed variables with state and async setters, happens on first time load
  useEffect(() => {
    setExposedVariables({
      setDisable: async (value) => setDisable(value),
      setVisibility: async (value) => setVisibility(value),
      setLoading: async (value) => setLoading(value),
    });
  }, [setExposedVariables]);

  //Side effect to state variables, these will run after the state is set and the values will be exposed
  useEffect(() => {
    setExposedVariable('isDisabled', isDisabled);
  }, [isDisabled, setExposedVariable]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
  }, [isVisible, setExposedVariable]);

  useEffect(() => {
    setExposedVariable('isLoading', isLoading);
  }, [isLoading, setExposedVariable]);

  return {
    isDisabled,
    setDisable,
    isVisible,
    setVisibility,
    isLoading,
    setLoading,
  };
};
