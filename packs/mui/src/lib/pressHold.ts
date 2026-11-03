import { useCallback, useRef } from 'react';
import type React from 'react';

// A widget that owns presses (a Kanban's card drag, a map's pan) marks itself [data-tj-no-drag], which makes the
// ToolJet host stop the press at the widget (InlineLibraryComponent's isolateInteractiveEvents) so the editor does not
// start a widget drag. The editor selects a widget on that same press, so a widget marked all the time could never be
// selected by a click, inside a container or out. Here the mark goes on only after a press inside has ended, and comes
// off at the next press outside: the first press selects the widget (as any widget), the presses after it drag cards or
// pan the map, and clicking elsewhere starts over. In preview nothing listens above the widget, so every press works.
// The same file in every pack (keep the copies the same).
export const holdPressesAfterFirst = (el: HTMLElement): (() => void) => {
  const doc = el.ownerDocument;
  const hold = () => el.setAttribute('data-tj-no-drag', '');
  const release = (e: Event) => {
    if (!e.composedPath().includes(el)) el.removeAttribute('data-tj-no-drag');
  };
  el.addEventListener('pointerup', hold);
  el.addEventListener('touchend', hold);
  doc.addEventListener('pointerdown', release, true);
  doc.addEventListener('touchstart', release, true);
  return () => {
    el.removeEventListener('pointerup', hold);
    el.removeEventListener('touchend', hold);
    doc.removeEventListener('pointerdown', release, true);
    doc.removeEventListener('touchstart', release, true);
    el.removeAttribute('data-tj-no-drag');
  };
};

/** A callback ref that fills `ref` and holds presses (above) on whatever element React attaches, which can come after
 *  the first render (a provider that waits for its popup container). */
export const usePressHoldRef = <T extends HTMLElement>(ref: React.MutableRefObject<T | null>) => {
  const off = useRef<(() => void) | null>(null);
  return useCallback(
    (el: T | null) => {
      off.current?.();
      off.current = el ? holdPressesAfterFirst(el) : null;
      ref.current = el;
    },
    [ref]
  );
};
