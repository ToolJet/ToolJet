import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { PanelWindowContext } from './PanelWindowContext';
import './popOut.scss';

/**
 * Renders a pop-out panel's content. Always through the same portal into the panel's element, wherever that element
 * is, so moving the panel between the editor and its window never remounts it (open files, tabs and scroll stay).
 * `popOut` is what `usePanelPopOut` returned.
 */
export const PopOutPanel = ({ popOut, children }) => {
  const value = useMemo(
    () => ({
      window: popOut.window,
      portalContainer: popOut.window?.document.body,
      controls: {
        available: popOut.available,
        isPoppedOut: popOut.isPoppedOut,
        popOut: popOut.open,
        dock: popOut.dock,
      },
    }),
    [popOut.window, popOut.available, popOut.isPoppedOut, popOut.open, popOut.dock]
  );
  return createPortal(<PanelWindowContext.Provider value={value}>{children}</PanelWindowContext.Provider>, popOut.host);
};

/**
 * The panel's place in the editor while it is docked: render it where the panel belongs in the layout, before the
 * `PopOutPanel` in the tree. It takes no part in the layout itself.
 */
export const PopOutSlot = ({ popOut, className }) => {
  const { setDockTarget } = popOut;
  const ref = useCallback((el) => setDockTarget(el), [setDockTarget]);
  return <div ref={ref} className={cx('tj-popout-slot', className)} />;
};
