import { useCallback, useEffect, useRef, type RefObject } from 'react';

// A popup (Select's menu, Autocomplete's listbox, a picker, Menu, Dialog) portals into the shared popup layer
// (usePortalContainer), outside the widget's own subtree, so the host's disabled, loading or hidden state (inert or
// aria-disabled on the widget, or a pane that is no longer drawn: an inactive tab) never reached an open popup: a click
// on it still chose an option (shadcn pack audit SP-02, 2026-10-23). The popup closes once its owner cannot take
// input, and a choice made in the same instant is refused. Copied from the shadcn pack (packs do not share code).

// A disabled fieldset is how a native Form disables what it holds.
const BLOCKED = '[inert],[aria-disabled="true"],fieldset:disabled';

/** Whether the element that owns a popup can take input: it is drawn, and neither it nor anything around it (across
 *  the shadow roots it sits in) is inert or aria-disabled. `requireDrawn: false` skips the first check, for a popup
 *  that runs without its owner on screen (a Dialog opened by an action while its trigger is hidden). */
export const ownerAvailable = (anchor: Element | null, { requireDrawn = true }: { requireDrawn?: boolean } = {}): boolean => {
  if (!anchor || !anchor.isConnected) return false;
  // jsdom lays nothing out, so there everything counts as drawn.
  const drawn = (el: Element | null) => !!el && el.getClientRects().length > 0;
  const layout = !/jsdom/i.test(globalThis.navigator?.userAgent ?? '');
  if (requireDrawn && layout && !drawn(anchor) && !drawn(anchor.firstElementChild)) return false;
  let el: Element | null = anchor;
  while (el) {
    if (el.closest(BLOCKED)) return false;
    const root = el.getRootNode();
    el = root instanceof ShadowRoot ? root.host : null;
  }
  return true;
};

/** Closes the owner's open popup when it stops taking input, checked each frame while it is open (the host's inert
 *  attribute re-renders nothing here). Returns the check, for the popup's own handlers to refuse a choice with.
 *
 *  `close` should be the component's whole close transition, as a dismiss runs it (visible and exposed open state,
 *  validation touch, onClose): closing only the visible state left exposed open true with no onClose (SP-24). It runs
 *  as of the latest render. */
export const useOwnerGuard = (anchorRef: RefObject<Element | null>, open: boolean, close: () => void, disabled = false) => {
  const available = useCallback(() => !disabled && ownerAvailable(anchorRef.current), [anchorRef, disabled]);
  const latestClose = useRef(close);
  latestClose.current = close;
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const watch = () => {
      if (!available()) {
        latestClose.current();
        return;
      }
      frame = requestAnimationFrame(watch);
    };
    watch();
    return () => cancelAnimationFrame(frame);
  }, [open, available]);
  return available;
};
