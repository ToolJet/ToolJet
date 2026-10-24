import { useCallback, useEffect, useRef, type RefObject } from 'react';

// A popup portals into the shared popup layer (usePortalContainer), outside the widget's own subtree, so the host's
// disabled, loading or hidden state (inert or aria-disabled on the widget, or a pane that is no longer
// drawn: an inactive tab, a closed accordion) never reached an open list: a click on it still chose an option
// (architecture audit, 2026-10-23). The popup closes once its owner cannot take input, and a choice made in the same
// instant is refused. Only this owner's popup: the layer itself stays live for the other widgets.

// Not aria-hidden: an open Radix list hides everything outside itself that way (hideOthers), the owner included; a
// host part that is aria-hidden (a loading modal body) is inert too.
const BLOCKED = '[inert],[aria-disabled="true"]';

/** Whether the element that owns a popup can take input: it is drawn, and neither it nor anything around it (across
 *  the shadow roots it sits in) is inert or aria-disabled. `requireDrawn: false` skips the first check, for a popup
 *  that runs without its owner on screen (a Dialog opened by an action while its own button is hidden). */
export const ownerAvailable = (
  anchor: Element | null,
  { requireDrawn = true }: { requireDrawn?: boolean } = {}
): boolean => {
  if (!anchor || !anchor.isConnected) return false;
  // Drawn: a box of its own, or (an anchor with display: contents has none) its first child's. jsdom lays nothing out,
  // so there everything counts as drawn.
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

/** Closes the owner's open popup when it stops taking input (disabled, or blocked or hidden by the host), checked each
 *  frame while it is open. Returns the check for the popup's own handlers, which refuse a choice when it fails.
 *
 *  `close` should be the component's whole close transition, as a dismiss runs it: visible and exposed open state, the
 *  search text, focus and validation bookkeeping, onClose. Closing only the visible state left a picker that fired no
 *  onFocus/onBlur again, kept its old search, or exposed isOpen true with no onClose (SP-24). It runs as of the latest
 *  render, so it reads current state rather than the state the popup opened with. Unlike a dismiss it should not return
 *  focus to the owner, which cannot take it. */
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
