import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// Escape from a ToolJet component in a Modal's or Drawer's body closes it, as it does from the dialog's own buttons and
// in the MUI and Rocket packs. Those components are the host's (projected through the body's <slot>), outside Ant's
// React tree, so rc-dialog's and rc-drawer's onKeyDown never saw their keys. Watched from the window's capture phase,
// decided once the key is handled: a press an inner popup takes (its combobox was expanded, or a field used the key, as
// a search box clearing itself) leaves the dialog open. A collapsed combobox is not using it: ToolJet's Select prevents
// the default of every Escape, its menu open or not. Keys from the dialog's own elements are left to Ant.
const EXPANDED_POPUP =
  '[aria-expanded="true"][role="combobox"], [aria-expanded="true"][aria-haspopup]:not([aria-haspopup="false"])';

export const useProjectedEscape = (dialogRef: RefObject<HTMLElement | null>, active: boolean, close: () => void) => {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active) return undefined;
    let timer = 0;
    let live = true;
    const onKey = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (e.key !== 'Escape' || e.isComposing || !dialog) return;
      const path = e.composedPath();
      const origin = path[0];
      if (!path.includes(dialog) || !(origin instanceof Node) || origin.getRootNode() === dialog.getRootNode()) return;
      // An open popup's control (a combobox, a menu button) keeps the key for its list. An expanded disclosure (a Kanban
      // card's "Show less", an open accordion header) opens no popup and does not.
      if (origin instanceof Element && origin.closest(EXPANDED_POPUP)) return;
      const collapsed = origin instanceof Element && origin.getAttribute('aria-expanded') === 'false';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (live && (collapsed || !e.defaultPrevented)) closeRef.current();
      });
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      live = false;
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, dialogRef]);
};
