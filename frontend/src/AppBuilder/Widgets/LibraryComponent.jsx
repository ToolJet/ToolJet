import React, { useEffect, useMemo, useRef, useState } from 'react';
import config from 'config';

// Keys in `properties` that configure WHICH component renders — everything else
// is forwarded into the iframe as the component's own props.
const META_KEYS = new Set(['libraryId', 'componentName', 'revisionId']);

// F3: LibraryComponentRunner (LLD §5.2). Renders the static shell in a
// same-origin iframe and speaks the postMessage protocol:
//   shell → ready → we send load {bundleUrl, cssUrl, componentName}
//   props change → we send props
//   shell → stateChange/event → setExposedVariable / fireEvent
export const LibraryComponent = ({ properties = {}, height, setExposedVariable, fireEvent, dataCy }) => {
  const { libraryId, componentName, revisionId } = properties;
  const configured = Boolean(libraryId && componentName && revisionId);

  const iframeRef = useRef(null);
  const [shellReady, setShellReady] = useState(false);

  const fileUrl = (file) =>
    `${config.apiUrl}/custom-component-libraries/${libraryId}/revisions/${revisionId}/files/${file}`;

  // The component's own props = everything the Inspector sets minus our meta keys.
  const componentProps = useMemo(
    () => Object.fromEntries(Object.entries(properties).filter(([k]) => !META_KEYS.has(k))),
    [properties]
  );

  const postToShell = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, '*');

  // iframe → parent. One listener per instance; e.source check keeps instances
  // (and unrelated windows) from crossing wires.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { type, key, value, name, message } = e.data ?? {};
      if (type === 'ready') setShellReady(true);
      if (type === 'stateChange') setExposedVariable(key, value);
      if (type === 'event') fireEvent(name);
      if (type === 'error') {
        // Locked decision #18: never crash the app — degrade to blank + console.
        // eslint-disable-next-line no-console
        console.error(`[LibraryComponent] ${message}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setExposedVariable, fireEvent]);

  // Identity change remounts the iframe (see key=) — the fresh shell must
  // handshake from scratch, so ready-state resets with it.
  useEffect(() => {
    setShellReady(false);
  }, [libraryId, revisionId, componentName]);

  // Shell said ready → tell it what to load. The iframe is keyed on
  // library/revision/component, so any change remounts a fresh shell and this
  // whole handshake naturally re-runs — no unload protocol needed.
  useEffect(() => {
    if (!shellReady || !configured) return;
    postToShell({
      type: 'load',
      bundleUrl: fileUrl('index.js'),
      cssUrl: fileUrl('index.css'),
      componentName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellReady, configured]);

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
          height,
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
      </div>
    );
  }

  return (
    <iframe
      key={`${libraryId}|${revisionId}|${componentName}`}
      ref={iframeRef}
      src="/assets/custom-components/shell.html"
      title={componentName}
      data-cy={dataCy}
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  );
};
