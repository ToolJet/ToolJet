import React, { useState, useEffect, useRef } from 'react';
import { JSONTree } from 'react-json-tree';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import './jsonExplorer.scss';

export const JSONExplorer = function JSONExplorer(props) {
  // ===== PROPS DESTRUCTURING =====
  const {
    id,
    height,
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    adjustComponentPositions,
    currentLayout,
    width,
    currentMode,
    subContainerIndex,
  } = props;

  const { value, shouldExpandEntireJSON, shouldShowRootNode, loadingState, visibility, disabledState } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  // ===== STATE MANAGEMENT =====
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
  });
  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const containerRef = useRef(null);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    adjustComponentPositions,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
  });

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const shouldExpandNodeInitially = (_keyPath, _data, _level) => {
    return shouldExpandEntireJSON;
  };

  // ===== COMPUTED VALUES =====
  const theme = {
    base00: 'transparent',
    base0D: 'var(--cc-primary-brand)',
  };

  const containerComputedStyles = {
    height: isDynamicHeightEnabled ? '100%' : height,
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
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
    {
      dep: value,
      sideEffect: () => {
        setForceDynamicHeightUpdate((prev) => !prev);
        setExposedVariable('value', value);
      },
    },
    {
      dep: shouldExpandEntireJSON,
      sideEffect: () => {
        setForceDynamicHeightUpdate((prev) => !prev);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      value: value,
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisabled: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for DOM changes when nodes are expanded/collapsed
  useEffect(() => {
    if (!containerRef.current || !isDynamicHeightEnabled) return;

    const observer = new MutationObserver(() => {
      // Trigger dynamic height recalculation when DOM structure changes
      setForceDynamicHeightUpdate((prev) => !prev);
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => observer.disconnect();
  }, [isDynamicHeightEnabled]);

  // ===== MAIN RENDER =====
  return (
    <div ref={containerRef} className="json-explorer" style={containerComputedStyles}>
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
