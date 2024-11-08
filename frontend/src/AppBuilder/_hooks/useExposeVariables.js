import { useEffect, useState, useCallback } from 'react';

export const useExposeState = (loadingState, visibleState, disabledState, setExposedVariables, setExposedVariable) => {
  const [isDisabled, setDisable] = useState(loadingState || disabledState);
  const [isVisible, setVisibility] = useState(visibleState || true);
  const [isLoading, setLoading] = useState(loadingState || false);

  // Wrapping state update functions with useCallback prevent rerenders
  const setDisableIfChangedWithSideEffect = useCallback(
    (newValue) => {
      setDisable((prev) => {
        if (prev !== newValue) {
          setExposedVariable('isDisabled', newValue);
          return newValue;
        }
        return prev;
      });
    },
    [setExposedVariable]
  );

  const setVisibilityIfChangedWithSideEffect = useCallback(
    (newValue) => {
      setVisibility((prev) => {
        if (prev !== newValue) {
          setExposedVariable('isVisible', newValue);
          return newValue;
        }
        return prev;
      });
    },
    [setExposedVariable]
  );

  const setLoadingIfChangedWithSideEffect = useCallback(
    (newValue) => {
      setLoading((prev) => {
        if (prev !== newValue) {
          setExposedVariable('isLoading', newValue);
          return newValue;
        }
        return prev;
      });
    },
    [setExposedVariable]
  );

  // Effect to conditionally update states with side effects
  useEffect(() => {
    setDisable(disabledState);
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState, setDisable, setExposedVariable]);

  useEffect(() => {
    setVisibility(visibleState);
    setExposedVariable('isVisible', visibleState);
  }, [visibleState, setVisibility, setExposedVariable]);

  useEffect(() => {
    setLoading(loadingState);
    setExposedVariable('isLoading', loadingState);
  }, [loadingState, setLoading, setExposedVariable]);

  useEffect(() => {
    setDisableIfChangedWithSideEffect(disabledState);
    setVisibilityIfChangedWithSideEffect(visibleState);
    setLoadingIfChangedWithSideEffect(loadingState);
  }, [
    loadingState,
    visibleState,
    disabledState,
    setDisableIfChangedWithSideEffect,
    setVisibilityIfChangedWithSideEffect,
    setLoadingIfChangedWithSideEffect,
  ]);

  // exposed variables with state and async setters
  useEffect(() => {
    setExposedVariables({
      setDisable: async (value) => setDisableIfChangedWithSideEffect(value),
      setVisibility: async (value) => setVisibilityIfChangedWithSideEffect(value),
      setLoading: async (value) => setLoadingIfChangedWithSideEffect(value),
    });
  }, [
    setExposedVariables,
    setDisableIfChangedWithSideEffect,
    setVisibilityIfChangedWithSideEffect,
    setLoadingIfChangedWithSideEffect,
  ]);

  return {
    isDisabled,
    setDisable: setDisableIfChangedWithSideEffect,
    isVisible,
    setVisibility: setVisibilityIfChangedWithSideEffect,
    isLoading,
    setLoading: setLoadingIfChangedWithSideEffect,
  };
};
