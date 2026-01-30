import React, { useEffect, useState } from 'react';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const IFrame = function IFrame({
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
}) {
  // ===== PROPS DESTRUCTURING =====
  const { source, loadingState, disabledState, visibility } = properties;
  const { boxShadow } = styles;

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
    url: source,
  });

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // ===== EFFECTS =====
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
    {
      dep: source,
      sideEffect: () => {
        updateExposedVariablesState('url', source);
        setExposedVariable('url', source);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      url: source,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: loadingState,
      setUrl: async function (url) {
        if (typeof url === 'string') {
          updateExposedVariablesState('url', url);
          setExposedVariable('url', url);
        }
      },
      setDisable: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div
      className="tw-h-full"
      data-disabled={exposedVariablesTemporaryState.isDisabled}
      style={{ display: exposedVariablesTemporaryState.isVisible ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
          <Spinner />
        </div>
      ) : (
        <iframe
          width={width - 4}
          height={height}
          src={exposedVariablesTemporaryState.url}
          title="IFrame Widget"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};
