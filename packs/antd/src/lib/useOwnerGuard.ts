import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// Ant portals every popup (a Select's list, a picker's panel, a Dropdown's menu, an Image preview) into the shared popup
// layer, outside the widget's own subtree, so the host's disabled, loading or hidden state (inert or aria-disabled on
// the widget, a disabled parent, an inactive tab) never reached an open one: a click on it still chose an option
// (shadcn pack audit SP-02, 2026-10-23, the same in this pack). Ant closes a Select whose own `disabled` turns on, but
// not a picker, a Dropdown or a preview, and never for the host's inert. The popup closes once its owner cannot take
// input, and a choice made in the same instant is refused.

// A disabled fieldset is how a native Form disables what it holds.
const BLOCKED = '[inert],[aria-disabled="true"],fieldset:disabled';

// A frame where the browser draws, a short timer where it has no frames to give.
const nextFrame = (f: () => void): (() => void) => {
  if (typeof requestAnimationFrame !== 'undefined') {
    const id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(f, 16);
  return () => clearTimeout(id);
};

/** Whether the element that owns a popup can take input: it is drawn, and neither it nor anything around it (across
 *  the shadow roots it sits in) is inert or aria-disabled. `requireDrawn: false` skips the first check, for a popup
 *  that runs without its owner on screen (a Modal opened by an action while its own button is hidden). */
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

/** Watches `check` each frame while `active`, and runs `onBlocked` (as of the latest render) once it fails. */
const useWatch = (active: boolean, check: () => boolean, onBlocked: () => void) => {
  const latest = useRef(onBlocked);
  latest.current = onBlocked;
  useEffect(() => {
    if (!active) return undefined;
    let cancel = () => {};
    const watch = () => {
      if (!check()) {
        latest.current();
        return;
      }
      cancel = nextFrame(watch);
    };
    watch();
    return () => cancel();
  }, [active, check]);
};

/**
 * The open state of an Ant popup, controlled here so it can be closed when its owner stops taking input. Pass
 * `open` to the Ant component and `onOpenChange` as its handler; `available()` guards the popup's own handlers.
 *
 * `onClose` is the component's own close bookkeeping (exposed open state, validation touch, onOpenChange): a guarded
 * close goes through the same path as a dismiss, so exposed state and events agree with what is drawn (SP-24).
 */
export const usePopupOwner = (
  anchorRef: RefObject<Element | null>,
  disabled: boolean,
  onChange?: (open: boolean) => void
) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const available = useCallback(() => !disabled && ownerAvailable(anchorRef.current), [anchorRef, disabled]);
  const latest = useRef(onChange);
  latest.current = onChange;
  const change = useCallback(
    (next: boolean) => {
      // An owner that cannot take input does not open; it always may close. Ant also reports a close on every blur.
      if ((next && !available()) || openRef.current === next) return;
      openRef.current = next;
      setOpen(next);
      latest.current?.(next);
    },
    [available]
  );
  useWatch(open, available, () => change(false));
  return { open, onOpenChange: change, available };
};

/** For a dialog (Modal): whether its owner takes input, read each frame while it is open. The dialog itself stays
 *  open (its body may hold what the user typed), but it refuses to confirm while blocked. The owner need not be drawn:
 *  an action opens a Modal whose own button is hidden. */
export const useDialogOwner = (anchorRef: RefObject<Element | null>, open: boolean, disabled: boolean) => {
  const takesInput = useCallback(
    () => !disabled && ownerAvailable(anchorRef.current, { requireDrawn: false }),
    [anchorRef, disabled]
  );
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    let cancel = () => {};
    const watch = () => {
      setBlocked(!takesInput());
      cancel = nextFrame(watch);
    };
    watch();
    return () => cancel();
  }, [open, takesInput]);
  return { blocked: blocked || disabled, takesInput };
};

/** Whether the owner is on screen and takes input, polled while `active` (an autoplaying Carousel): a hidden one (an
 *  inactive tab, a closed panel, a background browser tab) stops, so it fires no events nobody sees (SP-09). */
export const useOwnerShown = (anchorRef: RefObject<Element | null>, active: boolean, every = 500) => {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (!active) return undefined;
    const read = () =>
      setShown(ownerAvailable(anchorRef.current) && (typeof document === 'undefined' || document.visibilityState !== 'hidden'));
    read();
    const timer = setInterval(read, every);
    document.addEventListener('visibilitychange', read);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', read);
    };
  }, [anchorRef, active, every]);
  return shown;
};

/** usePopupOwner with its own anchor: pass `anchor` to AntProvider's ownerRef. */
export const useOwnedPopup = (disabled: boolean, onChange?: (open: boolean) => void) => {
  const anchor = useRef<HTMLElement | null>(null);
  return { anchor, ...usePopupOwner(anchor, disabled, onChange) };
};
