import { useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';

/**
 * Lets code search open an item this component shows behind a click (a list row's popover, an
 * event handler, a tab). `open(itemId)` opens it and returns true when this instance owns the item;
 * the request is then consumed. Several instances may share a kind and owner (a Table's component,
 * column and action event lists), so ownership is decided by `open`, not by mounting.
 *
 * `deps`: values `open` reads (e.g. the loaded list), so a request that arrived before the item
 * existed is retried once it does.
 */
export const useCodeSearchReveal = (kind, ownerId, open, deps = []) => {
  const request = useStore((state) => state.codeSearch.revealRequest);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!request || request.kind !== kind || request.ownerId !== ownerId) return;
    if (openRef.current(request.itemId)) useStore.getState().consumeCodeSearchReveal(request.nonce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, kind, ownerId, ...deps]);
};
