import React, { useEffect, useMemo, useRef, useState } from 'react';

import useStore from '@/AppBuilder/_stores/store';
import Loader from '@/ToolJetUI/Loader/Loader';
import { cn } from '@/lib/utils';
import { libraryFileUrl } from '@/_helpers/customComponentLibrariesStoreUtils';
import { useEffectiveLibraryRevision } from './hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from './hooks/useLibraryManifest';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

const DevBadge = ({ label }) => (
  <div className="tw-absolute tw-left-0 -tw-bottom-6 tw-h-5 tw-inline-flex tw-items-center tw-px-1 tw-py-0.5 tw-rounded-md tw-text-white tw-text-sm tw-font-medium tw-whitespace-nowrap tw-pointer-events-none tw-z-10 tw-bg-background-success-strong">
    dev: {label}
  </div>
);

const META_KEYS = new Set(['libraryId', 'correlationId', 'libraryName', 'componentName', 'visibility', 'loadingState']);

/* sandboxed (opaque-origin) iframe — no parent DOM/cookie access, postMessage only:
   shell → ready → we send load {bundleUrl, cssUrl, componentName}
   props change → we send props
   shell → stateChange/event → setExposedVariable / fireEvent
*/
const LibraryComponent = ({
  properties = {},
  styles = {},
  height,
  setExposedVariable,
  setExposedVariables,
  resetExposedVariables,
  fireEvent,
  dataCy,
}) => {
  const { libraryId, correlationId, componentName } = properties;
  const safeHeight = Math.max(height ?? 0, 0);

  // Mirrors every other widget's setVisibility/setLoading CSA — local state, flippable
  // imperatively via the action, independent of the properties bindings WidgetWrapper reads.
  const resolvedVisibility = properties.visibility ?? true;
  const resolvedLoading = properties.loadingState ?? false;

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: resolvedVisibility,
    isLoading: resolvedLoading,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // Shared by the mount effect and the identity-reset effect below, so both declare
  // the same static exposed variables. Reads resolvedVisibility/resolvedLoading, not
  // exposedVariablesTemporaryState, to avoid a same-commit stale-state read.
  const buildStaticExposedVariables = () => ({
    isVisible: resolvedVisibility,
    isLoading: resolvedLoading,
    setVisibility: async function (value) {
      setExposedVariable('isVisible', !!value);
      updateExposedVariablesState('isVisible', !!value);
    },
    setLoading: async function (value) {
      setExposedVariable('isLoading', !!value);
      updateExposedVariablesState('isLoading', !!value);
    },
  });

  useEffect(() => {
    setExposedVariables(buildStaticExposedVariables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Property bindings changing after mount — batched into one effect instead of
  // one useEffect per property (see useBatchedUpdateEffectArray).
  useBatchedUpdateEffectArray([
    {
      dep: resolvedVisibility,
      sideEffect: () => {
        setExposedVariable('isVisible', resolvedVisibility);
        updateExposedVariablesState('isVisible', resolvedVisibility);
      },
    },
    {
      dep: resolvedLoading,
      sideEffect: () => {
        setExposedVariable('isLoading', resolvedLoading);
        updateExposedVariablesState('isLoading', resolvedLoading);
      },
    },
  ]);

  const currentMode = useStore((state) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');
  const hasCustomComponentLibrariesAccess = useStore(
    (state) => state.license?.featureAccess?.customComponentLibraries === true
  );

  const effectiveRevision = useEffectiveLibraryRevision(correlationId);
  const isDevPin = Boolean(effectiveRevision?.startsWith?.('dev:'));
  const devUserId = isDevPin ? effectiveRevision.slice(4) : undefined;

  const devEmail = useCustomComponentLibrariesStore((state) => state.devPreviewEmailsByUserId?.[devUserId]);
  const devNonce = useCustomComponentLibrariesStore((state) =>
    isDevPin ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  const devBadge = isDevPin && currentMode === 'edit' ? <DevBadge label={devEmail ?? devUserId} /> : null;

  // A dev-bundle push, or switching to a different published revision/component export,
  // can remove/rename a `useStateX` variable or an action; setExposedVariable is
  // additive-only (nothing else ever deletes a key from currentState), so a removed
  // variable's last value or a stale action would otherwise linger forever. Reset
  // whenever either the dev nonce or the rendered library identity changes.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    resetExposedVariables?.();
    // Re-declare right after the (synchronous) reset, same effect, so ordering is guaranteed.
    setExposedVariables(buildStaticExposedVariables());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    devNonce,
    libraryId,
    effectiveRevision,
    componentName,
    resetExposedVariables,
    setExposedVariables,
    setExposedVariable,
  ]);

  const configured = Boolean(libraryId && componentName && effectiveRevision);

  const iframeRef = useRef(null);
  const [shellReady, setShellReady] = useState(false);
  const pendingInvocations = useRef(new Map());
  const invocationSeq = useRef(0);

  const fileUrl = (file) => libraryFileUrl(libraryId, effectiveRevision, file);

  // The component's own props = everything the Inspector sets minus our meta keys.
  const componentProps = useMemo(
    () => Object.fromEntries(Object.entries(properties).filter(([k]) => !META_KEYS.has(k))),
    [properties]
  );

  // Sends a message from this parent widget down into the widget's iframe.
  const postToShell = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, '*');

  const invokeInShell = (msg) => {
    const id = ++invocationSeq.current;
    return new Promise((resolve, reject) => {
      pendingInvocations.current.set(id, { resolve, reject });
      postToShell({ ...msg, id });
    });
  };

  const rejectAllPending = (reason) => {
    pendingInvocations.current.forEach(({ reject }) => reject(new Error(reason)));
    pendingInvocations.current.clear();
  };

  // Latest render values, readable from the stable message listener below.
  const latest = useRef({});
  latest.current = {
    configured,
    componentName,
    componentProps,
    bundleUrl: configured ? fileUrl('index.js') : null,
    cssUrl: configured ? fileUrl('index.css') : null,
  };

  useEffect(() => {
    // Handles a message sent up from the widget's iframe (ready/stateChange/event/actionResult/error).
    const handleMessageFromShell = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { type, key, value, name, message } = e.data ?? {};
      if (type === 'ready') {
        rejectAllPending('component reloaded before the action completed');
        setShellReady(true);
        const { configured, componentName, componentProps, bundleUrl, cssUrl } = latest.current;
        if (configured) {
          postToShell({ type: 'load', bundleUrl, cssUrl, componentName });
          postToShell({ type: 'props', data: componentProps });
        }
      }
      if (type === 'stateChange') setExposedVariable(key, value);
      if (type === 'event') fireEvent(name, { isCustomComponentEvent: true });
      if (type === 'actionResult') {
        const pending = pendingInvocations.current.get(e.data.id);
        if (pending) {
          pendingInvocations.current.delete(e.data.id);
          if (e.data.error) pending.reject(new Error(e.data.error));
          else pending.resolve(e.data.result);
        }
      }
      if (type === 'error') {
        console.error(`[LibraryComponent] ${message}`);
      }
    };
    window.addEventListener('message', handleMessageFromShell);
    return () => window.removeEventListener('message', handleMessageFromShell);
  }, [setExposedVariable, fireEvent]);

  useEffect(() => {
    setShellReady(false);
  }, [libraryId, effectiveRevision, componentName]);

  const manifest = useLibraryManifest(libraryId, effectiveRevision);
  const manifestActions = manifest?.components?.[componentName]?.actions;

  useEffect(() => {
    if (!configured || !manifestActions?.length) return;
    manifestActions.forEach((a) =>
      setExposedVariable(a.name, (...args) => invokeInShell({ type: 'invokeAction', name: a.name, args }))
    );
  }, [configured, manifestActions, setExposedVariable]);

  useEffect(
    () => () => {
      rejectAllPending('component was removed before the action completed');
    },
    []
  );

  useEffect(() => {
    if (!shellReady) return;
    postToShell({ type: 'props', data: componentProps });
  }, [shellReady, componentProps]);

  if (!hasCustomComponentLibrariesAccess && currentMode === 'view') {
    return <></>;
  }

  if (!configured) {
    return (
      <div
        data-cy={dataCy}
        // tw-relative anchors the dev badge
        className="tw-relative tw-items-center tw-justify-center tw-border tw-border-dashed tw-border-border-accent-strong tw-rounded tw-text-base tw-text-text-accent"
        // display stays inline: toggled by isVisible at runtime, and jsdom's toHaveStyle
        // (used in tests) only sees inline styles, not compiled Tailwind CSS.
        style={{
          background: 'color-mix(in srgb, var(--cc-primary-brand) 8%, transparent)',
          height: safeHeight,
          display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
        }}
      >
        Slot
        {devBadge}
      </div>
    );
  }

  return (
    <div
      className={cn('tw-relative tw-w-full', {
        'tw-opacity-50 tw-pointer-events-none': !hasCustomComponentLibrariesAccess && currentMode === 'edit',
      })}
      style={{ height: safeHeight, display: exposedVariablesTemporaryState.isVisible ? 'block' : 'none' }}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
          <Loader width="16" absolute={false} />
        </div>
      ) : (
        <iframe
          key={`${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`}
          ref={iframeRef}
          src="/assets/custom-components/shell.html"
          title={componentName}
          data-cy={dataCy}
          // Opaque origin: uploaded/dev-pushed bundle JS gets no window.parent DOM access and no
          // shared cookies/storage — only the postMessage channel above. Do NOT add allow-same-origin.
          sandbox="allow-scripts"
          className="tw-w-full tw-h-full tw-border-0 tw-block"
          style={{ boxShadow: styles.boxShadow }}
        />
      )}
      {devBadge}
    </div>
  );
};

export default LibraryComponent;
