import { createContext, useContext } from 'react';

/*
  Which browser window a panel's DOM is in. A pop-out panel keeps running in the editor's page while its DOM is in
  another window, so inside one the globals `window` and `document` are the wrong ones for anything about the DOM:
  listeners, focus, measuring, the clipboard, and where an overlay is put. Code that can render in a pop-out panel
  takes them from here. With no provider (and while the panel is docked) these give the editor's own window.
*/

export const PanelWindowContext = createContext(null);

/** The window the panel is shown in: add listeners here, and use its `document`, timers and `navigator`. */
export const usePanelWindow = () => useContext(PanelWindowContext)?.window ?? window;

/**
 * Where an overlay opened from the panel (menu, popover, tooltip, dialog) is rendered: the body of the panel's own
 * window, or undefined while it is docked, so each library keeps its default (the editor's body).
 */
export const usePortalContainer = () => useContext(PanelWindowContext)?.portalContainer ?? undefined;

const NO_CONTROLS = { available: false, isPoppedOut: false, popOut: () => false, dock: () => {} };

/**
 * For the panel's own buttons: `available` (it can pop out here), `isPoppedOut`, `popOut()` and `dock()`. Outside a
 * pop-out panel `available` is false and the functions do nothing.
 */
export const usePopOutControls = () => useContext(PanelWindowContext)?.controls ?? NO_CONTROLS;
