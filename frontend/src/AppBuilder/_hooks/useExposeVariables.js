import { useEffect, useState } from 'react';

export const useExposeState = (loadingState, visibleState, disabledState, setExposedVariables, setExposedVariable) => {
  const [isDisabled, setDisable] = useState(disabledState || false);
  const [isVisible, setVisibility] = useState(visibleState || true);
  const [isLoading, setLoading] = useState(loadingState || false);

  // Sync local state AND the exposed store value in the same tick. Keeping
  // them in separate effects produced a one-render gap where WidgetWrapper
  // (which reads exposed `isVisible` from the store) still saw the old
  // visibility while `useDynamicHeight` saw the new one. On a hidden→visible
  // transition that gap made the wrapper stay `display:none` on the render
  // the hook fired, so `offsetParent===null` tripped the guard in
  // useDynamicHeight.jsx and the reflow never ran — leaving dynamic-height
  // containers stuck at their hidden-state (canonical) height.
  const applyVisibility = (value) => {
    setVisibility(value);
    setExposedVariable('isVisible', value);
  };

  // Effect to conditionally update state from properties passed to widget
  useEffect(() => {
    setDisable(disabledState);
  }, [disabledState]);

  useEffect(() => {
    applyVisibility(visibleState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleState]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  // exposed variables with state and async setters, happens on first time load
  useEffect(() => {
    setExposedVariables({
      setDisable: async (value) => setDisable(value),
      setVisibility: async (value) => applyVisibility(value),
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
