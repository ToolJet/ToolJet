/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from 'react';
import 'draft-js/dist/Draft.css';
import { DraftEditor } from './DraftEditor';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export default function RichTextEditor({
  id,
  width,
  height,
  properties,
  styles,
  setExposedVariables,
  fireEvent,
  dataCy,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const isInitialRender = useRef(true);
  const { visibility, disabledState, boxShadow } = styles;
  const placeholder = properties.placeholder;
  const defaultValue = properties?.defaultValue ?? '';
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const currentValue = useExposedVariable(id, 'value', exposedOpts, defaultValue);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, properties?.loadingState);

  const { csaShims, registerEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  useDynamicHeight({
    isDynamicHeightEnabled,
    id: id,
    height,
    value: currentValue,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  /* ── Property-change write-throughs (skip-initial) ────────────────────── */
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isDisabled: disabledState });
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isVisible: visibility });
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isLoading: properties.loadingState });
  }, [properties.loadingState]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setValue routes to DraftEditor's effect handler — rebuilding the
     Draft.js EditorState needs the mounted instance). ───────────────────── */
  useEffect(() => {
    setExposedVariables({
      value: defaultValue,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: properties?.loadingState,
      ...csaShims(),
    });
    isInitialRender.current = false;
  }, []);

  // Keystrokes / toolbar edits publish the derived HTML (old handleChange).
  function handleChange(html) {
    setExposedVariables({ value: html });
  }

  return (
    <div
      data-disabled={isDisabled}
      style={{
        height: isDynamicHeightEnabled ? '100%' : `${height}px`,
        ...(isDynamicHeightEnabled && { minHeight: `${height}px` }),
        display: isVisible ? '' : 'none',
        boxShadow,
      }}
      data-cy={dataCy}
      className="scrollbar-container"
      component-id={id}
      aria-label="Text Editor"
      aria-hidden={!isVisible}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      <DraftEditor
        handleChange={handleChange}
        registerEffects={registerEffects}
        height={height}
        width={width}
        placeholder={placeholder}
        defaultValue={defaultValue}
        isLoading={isLoading}
        isVisible={isVisible}
        isDisabled={isDisabled}
        isDynamicHeightEnabled={isDynamicHeightEnabled}
      ></DraftEditor>
    </div>
  );
}
