import React, { useEffect, useRef } from 'react';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const IFrame = function IFrame({
  id,
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariables,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
}) {
  // ===== PROPS DESTRUCTURING =====
  const { source, loadingState, disabledState, visibility } = properties;
  const { boxShadow } = styles;

  const iframeRef = useRef(null);

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const url = useExposedVariable(id, 'url', exposedOpts, source);

  const { csaShims, useEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Bucket C: reload needs the mounted iframe's ref.
  useEffects({
    reload: () => {
      try {
        iframeRef.current?.contentWindow?.location?.reload();
      } catch (e) {
        // Cross-origin iframe — fallback to re-assigning src
        const iframe = iframeRef.current;
        if (iframe) {
          const src = iframe.src;
          iframe.src = '';
          iframe.src = src;
        }
      }
    },
  });

  /* ── Property-change write-throughs (skip-initial via the batched hook) ── */
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => setExposedVariables({ isLoading: loadingState }),
    },
    {
      dep: visibility,
      sideEffect: () => setExposedVariables({ isVisible: visibility }),
    },
    {
      dep: disabledState,
      sideEffect: () => setExposedVariables({ isDisabled: disabledState }),
    },
    {
      dep: source,
      sideEffect: () => setExposedVariables({ url: source }),
    },
  ]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setUrl/setDisable/setVisibility/setLoading/reload) ─────────────────── */
  useEffect(() => {
    setExposedVariables({
      url: source,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: loadingState,
      ...csaShims(),
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== MAIN RENDER =====
  return (
    <div
      className="tw-h-full"
      data-disabled={isDisabled}
      style={{ display: isVisible ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      {isLoading ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
          <Spinner />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          key={url}
          width={width - 4}
          height={height}
          src={url}
          title="IFrame Widget"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};
