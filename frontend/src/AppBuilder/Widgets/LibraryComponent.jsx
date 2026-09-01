import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEffectiveLibraryRevision, libraryFileUrl, setLibraryComponentActions } from './libraryComponentRevision';
import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';

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

const META_KEYS = new Set(['libraryId', 'correlationId', 'libraryName', 'componentName', 'revisionId']);

/*same-origin iframe and speaks the postMessage protocol:
   shell → ready → we send load {bundleUrl, cssUrl, componentName}
   props change → we send props
   shell → stateChange/event → setExposedVariable / fireEvent 
*/
export const LibraryComponent = ({
  id,
  properties = {},
  styles = {},
  height,
  setExposedVariable,
  resetExposedVariables,
  fireEvent,
  dataCy,
}) => {
  const { libraryId, correlationId, componentName, revisionId } = properties;
  const safeHeight = Math.max(height ?? 0, 0);

  const effectiveRevision = useEffectiveLibraryRevision(correlationId, revisionId);
  const isDevPin = Boolean(effectiveRevision?.startsWith?.('dev:'));

  const devEmail = useCustomComponentPreviewStore((state) => state.devPreviewEmails?.[libraryId]);
  const devNonce = useCustomComponentPreviewStore((state) =>
    isDevPin ? state.devBundleUpdatedAt?.[libraryId] : undefined
  );

  const devBadge = isDevPin ? <DevBadge label={devEmail ?? effectiveRevision.slice(4)} /> : null;

  // A dev-bundle push can remove/rename a `useStateX` variable; setExposedVariable is
  // additive-only (nothing else ever deletes a key from currentState), so a removed
  // variable's last value would otherwise linger forever in the left-sidebar Inspector.
  const isFirstDevNonce = useRef(true);

  useEffect(() => {
    if (isFirstDevNonce.current) {
      isFirstDevNonce.current = false;
      return;
    }

    resetExposedVariables?.();
  }, [devNonce, resetExposedVariables]);

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

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    fetch(libraryFileUrl(libraryId, effectiveRevision, 'manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((manifest) => {
        if (cancelled) return;
        const actions = manifest?.components?.[componentName]?.actions ?? [];
        actions.forEach((a) =>
          setExposedVariable(a.name, (...args) => invokeInShell({ type: 'invokeAction', name: a.name, args }))
        );
        setLibraryComponentActions(id, actions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [configured, libraryId, effectiveRevision, componentName, id, setExposedVariable]);

  useEffect(
    () => () => {
      setLibraryComponentActions(id, null);
      rejectAllPending('component was removed before the action completed');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  useEffect(() => {
    if (!shellReady) return;
    postToShell({ type: 'props', data: componentProps });
  }, [shellReady, componentProps]);

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
    <div style={{ position: 'relative', width: '100%', height: safeHeight }}>
      <iframe
        key={`${libraryId}|${effectiveRevision}|${componentName}|${devNonce ?? ''}`}
        ref={iframeRef}
        src="/assets/custom-components/shell.html"
        title={componentName}
        data-cy={dataCy}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', boxShadow: styles.boxShadow }}
      />
      {devBadge}
    </div>
  );
};
