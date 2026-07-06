import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const Html = function ({
  id,
  height,
  width,
  properties,
  styles,
  darkMode,
  dataCy,
  setExposedVariables,
  fireEvent,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const { rawHtml: stringifyHTML, loadingState, disabledState, visibility } = properties || {};
  const baseStyle = {
    backgroundColor: darkMode ? '#47505D' : '#ffffff',
    color: darkMode ? 'white' : 'black',
    width: '100%',
  };
  const { boxShadow } = styles || {};

  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  const contentRef = useRef(null);
  const heightChangeValue = useHeightObserver(contentRef, isDynamicHeightEnabled);

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const rawHtml = useExposedVariable(id, 'rawHTML', exposedOpts, stringifyHTML || '');

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  useEffect(() => {
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      // set all elements owning target to target=_blank
      if ('target' in node) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener');
      }
    });
  }, []);

  /* ── Property-change write-throughs (skip-initial via the batched hook) ── */
  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => setExposedVariables({ isVisible: visibility }),
    },
    {
      dep: loadingState,
      sideEffect: () => setExposedVariables({ isLoading: loadingState }),
    },
    {
      dep: disabledState,
      sideEffect: () => setExposedVariables({ isDisabled: disabledState }),
    },
    {
      dep: stringifyHTML || '',
      sideEffect: () => setExposedVariables({ rawHTML: stringifyHTML || '' }),
    },
  ]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setRawHTML/setVisibility/setLoading/setDisable) ────────────────────── */
  useEffect(() => {
    setExposedVariables({
      rawHTML: stringifyHTML || '',
      isVisible: visibility,
      isLoading: loadingState,
      isDisabled: disabledState,
      ...csaShims(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`jet-container ${isLoading && 'jet-container-loading'}`}
      data-disabled={isDisabled}
      style={{
        background: isLoading && 'var(--cc-surface1-surface)',
        display: isVisible ? 'flex' : 'none',
        border: isLoading && '1px solid var(--cc-default-border)',
        borderRadius: isLoading && '6px',
        width: '100%',
        height: isDynamicHeightEnabled ? 'auto' : height,
        ...(isDynamicHeightEnabled ? { minHeight: height } : { overflowY: 'auto' }),
        boxShadow,
        position: 'relative',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
      }}
      data-cy={dataCy}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <div
          ref={contentRef}
          style={baseStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, { FORCE_BODY: true }) }}
        />
      )}
    </div>
  );
};
