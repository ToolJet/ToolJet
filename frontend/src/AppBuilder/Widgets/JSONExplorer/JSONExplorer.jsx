import React, { useEffect, useRef, useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { getBase16Theme } from 'react-base16-styling';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import './jsonExplorer.scss';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

export const JSONExplorer = function JSONExplorer(props) {
  // ===== PROPS DESTRUCTURING =====
  const {
    id,
    height,
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    currentLayout,
    width,
    currentMode,
    subContainerIndex,
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const { value, shouldExpandEntireJSON, shouldShowRootNode, loadingState, visibility, disabledState, theme } =
    properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  // ===== STATE MANAGEMENT =====
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const isInitialRender = useRef(true);

  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
  });

  // Store is the source of truth for the exposed value/isVisible/isLoading/isDisabled.
  const storeValue = useExposedVariable(id, 'value', exposedOpts, undefined);
  const displayValue = storeValue !== undefined ? storeValue : value;
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  const [forceDynamicHeightUpdate, setForceDynamicHeightUpdate] = useState(false);
  const containerRef = useRef(null);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: forceDynamicHeightUpdate,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  // ===== HELPER FUNCTIONS =====
  const shouldExpandNodeInitially = (_keyPath, _data, _level) => {
    return shouldExpandEntireJSON;
  };

  // ===== COMPUTED VALUES =====
  const styling = getBase16Theme(theme);
  const resolvedTheme = {
    ...styling,
    base00: 'transparent',
  };

  const containerComputedStyles = {
    height: isDynamicHeightEnabled ? '100%' : height,
    ...(isDynamicHeightEnabled ? { minHeight: `${height}px` } : {}),
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    boxShadow,
    visibility: isVisible ? 'visible' : 'hidden',
    ...(isLoading
      ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {}),
  };

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setForceDynamicHeightUpdate((prev) => !prev);
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setForceDynamicHeightUpdate((prev) => !prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldExpandEntireJSON]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (setValue matches the contract's reducer exactly — no override needed).
  useEffect(() => {
    setExposedVariables({
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState,
      value: value,
      ...csaShims(),
    });
    isInitialRender.current = false;
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
    <div ref={containerRef} className="json-explorer scrollbar-container" style={containerComputedStyles}>
      {isLoading ? (
        <Loader width="24" absolute={false} />
      ) : (
        <JSONTree
          key={`json-tree-${shouldExpandEntireJSON}`}
          data={displayValue}
          theme={resolvedTheme}
          shouldExpandNodeInitially={shouldExpandNodeInitially}
          hideRoot={!shouldShowRootNode}
        />
      )}
    </div>
  );
};
