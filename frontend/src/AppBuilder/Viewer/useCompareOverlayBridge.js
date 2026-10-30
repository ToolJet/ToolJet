import { useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { COMPARE_OVERLAY_MESSAGE, COMPARE_OVERLAY_RESULT, muteCompareEvents } from '@/AppBuilder/_utils/compareFrame';

// Overlays the compare view can open: the ones with an open and a close action.
const OVERLAY_TYPES = /^(Modal|ModalV2|ShadDialog)$/;

// A parent reference is a component id, or "<id>-<slot>" for a slot (a header, a footer, a tab).
const parentId = (components, parent) => {
  if (!parent) return null;
  if (components[parent]) return parent;
  const id = String(parent).slice(0, 36);
  return components[id] ? id : null;
};

/**
 * Which overlay to open for a request: the first of `names` (the changed component, then its
 * parents as either version had them) found on this page, walked up to the dialog it sits in.
 * `missing`: none of the names is on this page. `none`: found, but not inside a dialog.
 */
export const resolveCompareOverlay = (components, names = []) => {
  const byName = new Map(Object.entries(components ?? {}).map(([id, def]) => [def?.component?.name, id]));
  for (const name of names) {
    let id = byName.get(name);
    if (!id) continue;
    const seen = new Set();
    while (id && !seen.has(id)) {
      seen.add(id);
      const component = components[id]?.component;
      if (OVERLAY_TYPES.test(component?.component ?? '')) return { status: 'found', id, name: component.name };
      id = parentId(components, component?.parent);
    }
    return { status: 'none' };
  }
  return { status: 'missing' };
};

/**
 * What a frame does with one request: { names } opens the dialog those names live in (closing the
 * one opened before), { names: null } closes it. Returns what happened, for the reply. The dialog's
 * own events are muted first, so opening it runs none of the app's actions.
 */
export function createCompareOverlayHandler(getState, moduleId = 'canvas') {
  let opened = null;
  const run = (id, action) => {
    const exposed = getState().getExposedValueOfComponent?.(id, moduleId);
    if (typeof exposed?.[action] !== 'function') return false;
    muteCompareEvents(id);
    exposed[action]();
    return true;
  };
  return (names) => {
    const result = names?.length
      ? resolveCompareOverlay(getState().getCurrentPageComponents?.(moduleId), names)
      : { status: 'none' };
    if (opened && opened !== result.id) {
      run(opened, 'close');
      opened = null;
    }
    if (result.status !== 'found') return result;
    if (opened === result.id || run(result.id, 'open')) {
      opened = result.id;
      return { status: 'opened', name: result.name };
    }
    return { status: 'unsupported', name: result.name };
  };
}

/**
 * Listens for the compare view's requests in a frame that previews a version (`?version=`) inside
 * a same-origin parent, and replies to each with what happened.
 */
export function useCompareOverlayBridge(moduleId = 'canvas', enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || window.parent === window) return undefined;
    if (!new URLSearchParams(window.location.search).get('version')) return undefined;
    const handle = createCompareOverlayHandler(useStore.getState, moduleId);
    const onMessage = (event) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== COMPARE_OVERLAY_MESSAGE) return;
      const result = handle(event.data.names);
      window.parent.postMessage(
        { type: COMPARE_OVERLAY_RESULT, requestId: event.data.requestId, ...result },
        window.location.origin
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [moduleId, enabled]);
}
