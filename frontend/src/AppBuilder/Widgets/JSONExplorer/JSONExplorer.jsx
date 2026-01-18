import React, { useState, useEffect } from 'react';
import { JSONTree } from 'react-json-tree';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import './jsonExplorer.scss';

export const JSONExplorer = function JSONExplorer(props) {
  // ===== PROPS DESTRUCTURING =====
  const { properties, styles, setExposedVariable, setExposedVariables } = props;

  const { value, shouldExpandEntireJSON, shouldShowRootNode, loadingState, visibility } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
  });

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const shouldExpandNodeInitially = (keyPath, data, level) => {
    return shouldExpandEntireJSON;
  };

  // ===== COMPUTED VALUES =====
  const theme = {
    base00: 'transparent',
    base0D: 'var(--cc-primary-brand)',
  };

  const containerComputedStyles = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    boxShadow,
    visibility: exposedVariablesTemporaryState.isVisible ? 'visible' : 'hidden',
    ...(exposedVariablesTemporaryState.isLoading
      ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {}),
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
      dep: value,
      sideEffect: () => {
        setExposedVariable('value', value);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      isLoading: loadingState,
      isVisible: visibility,
      value: value,
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div className="json-explorer" style={containerComputedStyles}>
      {exposedVariablesTemporaryState.isLoading ? (
        <Loader width="24" absolute={false} />
      ) : (
        <JSONTree
          key={`json-tree-${shouldExpandEntireJSON}`}
          data={value}
          theme={theme}
          shouldExpandNodeInitially={shouldExpandNodeInitially}
          hideRoot={!shouldShowRootNode}
        />
      )}
    </div>
  );
};
