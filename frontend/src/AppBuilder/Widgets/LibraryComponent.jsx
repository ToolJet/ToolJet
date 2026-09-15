import React, { useEffect, useMemo, useRef, useState } from 'react';

import useStore from '@/AppBuilder/_stores/store';
import { cn } from '@/lib/utils';
import { libraryFileUrl } from '@/_helpers/customComponentLibrariesStoreUtils';
import { useEffectiveLibraryRevision } from './hooks/useEffectiveLibraryRevision';
import { useLibraryManifest } from './hooks/useLibraryManifest';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';

const DevBadge = ({ label }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      bottom: -22,
      height: 20,
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 4px',
      borderRadius: '6px',
      background: 'var(--background-success-strong, #1e823b)',
      color: '#fff',
      fontSize: '11px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  >
    dev: {label}
  </div>
);

const META_KEYS = new Set(['libraryId', 'correlationId', 'libraryName', 'componentName']);

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
  resetExposedVariables,
  fireEvent,
  dataCy,
}) => {
  const { libraryId, correlationId, componentName } = properties;
  const safeHeight = Math.max(height ?? 0, 0);

  const currentMode = useStore((state) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');
  const hasCustomComponentLibrariesAccess = useStore(
    (state) => state.license?.featureAccess?.customComponentLibraries === true
  );

  const effectiveRevision = useEffectiveLibraryRevision(correlationId);
  const isDevPin = Boolean(effectiveRevision?.startsWith?.('dev:'));

  const devEmail = useCustomComponentLibrariesStore((state) => state.devPreviewEmails?.[libraryId]);
  const devNonce = useCustomComponentLibrariesStore((state) =>
    isDevPin ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  const devBadge = isDevPin ? <DevBadge label={devEmail ?? effectiveRevision.slice(4)} /> : null;

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
  }, [devNonce, libraryId, effectiveRevision, componentName, resetExposedVariables]);

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
        style={{
          position: 'relative', // anchors the dev badge
          height: safeHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--cc-primary-brand)',
          borderRadius: '4px',
          background: 'color-mix(in srgb, var(--cc-primary-brand) 8%, transparent)',
          color: 'var(--cc-primary-brand)',
          fontSize: '12px',
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
      style={{ height: safeHeight }}
    >
      <iframe
        key={`${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`}
        ref={iframeRef}
        src="/assets/custom-components/shell.html"
        title={componentName}
        data-cy={dataCy}
        // Opaque origin: uploaded/dev-pushed bundle JS gets no window.parent DOM access and no
        // shared cookies/storage — only the postMessage channel above. Do NOT add allow-same-origin.
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', boxShadow: styles.boxShadow }}
      />
      {devBadge}
    </div>
  );
};

export default LibraryComponent;
