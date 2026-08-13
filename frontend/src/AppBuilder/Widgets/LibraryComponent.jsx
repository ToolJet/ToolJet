import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEffectiveLibraryRevision, libraryFileUrl } from './libraryComponentRevision';
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

const META_KEYS = new Set(['libraryId', 'componentName', 'revisionId']);

/*same-origin iframe and speaks the postMessage protocol:
   shell → ready → we send load {bundleUrl, cssUrl, componentName}
   props change → we send props
   shell → stateChange/event → setExposedVariable / fireEvent 
*/
export const LibraryComponent = ({ properties = {}, styles = {}, height, setExposedVariable, fireEvent, dataCy }) => {
  const { libraryId, componentName, revisionId } = properties;
  const safeHeight = Math.max(height ?? 0, 0);

  const devPreview = useCustomComponentPreviewStore((state) => state.devPreviews?.[libraryId]);
  const devEmail = useCustomComponentPreviewStore((state) => state.devPreviewEmails?.[libraryId]);
  const devBadge = devPreview ? <DevBadge label={devEmail ?? devPreview.replace('dev:', '')} /> : null;

  const effectiveRevision = useEffectiveLibraryRevision(libraryId, revisionId);
  const configured = Boolean(libraryId && componentName && effectiveRevision);

  const iframeRef = useRef(null);
  const [shellReady, setShellReady] = useState(false);

  const fileUrl = (file) => libraryFileUrl(libraryId, effectiveRevision, file);

  // The component's own props = everything the Inspector sets minus our meta keys.
  const componentProps = useMemo(
    () => Object.fromEntries(Object.entries(properties).filter(([k]) => !META_KEYS.has(k))),
    [properties]
  );

  const postToShell = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, '*');

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
    const onMessage = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { type, key, value, name, message } = e.data ?? {};
      if (type === 'ready') {
        setShellReady(true);
        const { configured, componentName, componentProps, bundleUrl, cssUrl } = latest.current;
        if (configured) {
          postToShell({ type: 'load', bundleUrl, cssUrl, componentName });
          postToShell({ type: 'props', data: componentProps });
        }
      }
      if (type === 'stateChange') setExposedVariable(key, value);
      if (type === 'event') fireEvent(name, { isCustomComponentEvent: true });
      if (type === 'error') {
        // Locked decision #18: never crash the app — degrade to blank + console.
        // eslint-disable-next-line no-console
        console.error(`[LibraryComponent] ${message}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setExposedVariable, fireEvent]);

  useEffect(() => {
    setShellReady(false);
  }, [libraryId, effectiveRevision, componentName]);

  // Forward resolved props on every change (shell holds them until load completes).
  useEffect(() => {
    if (!shellReady) return;
    postToShell({ type: 'props', data: componentProps });
  }, [shellReady, componentProps]);

  if (!configured) {
    // Unconfigured instance keeps the F1 "Slot" placeholder (design 47-4063).
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
        key={`${libraryId}|${effectiveRevision}|${componentName}`}
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
