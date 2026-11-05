import { useEffect, useRef } from 'react';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';

// Lets another part of the editor (the review panel in the compare view, once a review is approved) open the
// Promote or Release dialog of one version, the same one its button in the version menu opens, with the same
// checks. The menu is opened first: its version rows hold those buttons.
export const VERSION_ACTION_EVENT = 'tooljet:version-action';

// `action`: 'promote' or 'release'. Asks until the version's row has mounted and answered, for up to two seconds.
export const requestVersionAction = (action, versionId) => {
  useVersionManagerStore.getState().setDropdownOpen?.(true);
  const started = Date.now();
  const ask = () => {
    const detail = { action, versionId, handled: false };
    window.dispatchEvent(new CustomEvent(VERSION_ACTION_EVENT, { detail }));
    if (!detail.handled && Date.now() - started < 2000) setTimeout(ask, 150);
  };
  setTimeout(ask, 0);
};

export const useVersionActionRequest = (action, versionId, onRequest) => {
  const handler = useRef(onRequest);
  handler.current = onRequest;
  useEffect(() => {
    if (!versionId) return undefined;
    const listen = (event) => {
      const detail = event.detail;
      if (detail?.action !== action || detail.versionId !== versionId || detail.handled) return;
      detail.handled = true;
      handler.current?.();
    };
    window.addEventListener(VERSION_ACTION_EVENT, listen);
    return () => window.removeEventListener(VERSION_ACTION_EVENT, listen);
  }, [action, versionId]);
};
