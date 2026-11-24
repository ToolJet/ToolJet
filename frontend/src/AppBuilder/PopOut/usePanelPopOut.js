import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { boundsOf, buildScope, mirrorStyles, moveInto, openPanelWindow } from './panelWindow';
import { readPanelPreference, writePanelPreference } from './popOutPreferences';
import { registerPanelWindow } from './panelWindows';

/*
  One pop-out panel: the element it renders into (`host`), and that element's place, either docked in the editor or in
  the panel's own window.

  The moves are done here, at once, and React state follows: when a window closes, its content has to be back in the
  editor before the window's document is gone, and effects that bind to "the window the panel is in" must find the DOM
  already there when they run.
*/

// Different on every page load: a window left by an earlier load can no longer be reached, and is never reused.
const pageId = Math.random().toString(36).slice(2, 8);

// A click or key press the browser still counts: the only time it lets a page open a window.
const userIsActing = () => globalThis.navigator?.userActivation?.isActive === true;

/**
 * @param id        the panel's name in the kept preferences and in the registry (`focusPanelWindow`)
 * @param title     the window's title
 * @param scope     class names for the wrappers around the panel in its window, outermost first (see `buildScope`)
 * @param dockTo    'body' when the panel docks straight under the editor's body; otherwise render a `PopOutSlot`
 * @param enabled   false where this panel cannot pop out (its button is then not offered)
 * @param onOpened  called once the panel is in its window
 * @param onDocked  called once the panel is back in the editor, with `{ byUser }`
 * @param onBlocked called when the browser refused the window after the user asked for it
 */
export const usePanelPopOut = ({ id, title, scope, dockTo, enabled = true, onOpened, onDocked, onBlocked }) => {
  const [host] = useState(() => {
    const el = document.createElement('div');
    el.className = 'tj-popout-host';
    el.dataset.popoutPanel = id;
    return el;
  });
  const [win, setWin] = useState(null);
  const [prefersWindow, setPrefersWindow] = useState(() => readPanelPreference(id).poppedOut);
  const session = useRef(null);
  const dockTarget = useRef(null);
  const latest = useRef({});
  latest.current = { title, scope, onOpened, onDocked, onBlocked };

  const remember = useCallback(
    (poppedOut) => {
      writePanelPreference(id, { poppedOut });
      setPrefersWindow(poppedOut);
    },
    [id]
  );

  // Back to the editor. `byUser`: the user closed the window or docked the panel, so it stays docked next time;
  // otherwise (the editor is leaving, the panel is going away) the choice of a window is kept.
  const settle = useCallback(
    ({ byUser }) => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      current.stop();
      // A window that is already gone reports no size: keep the last one known.
      if (!current.win.closed && current.win.innerWidth > 0) {
        writePanelPreference(id, { bounds: boundsOf(current.win) });
      }
      host.classList.remove('tj-popout-host--window');
      if (dockTarget.current) moveInto(host, dockTarget.current);
      else host.remove();
      current.win.close();
      if (byUser) remember(false);
      setWin(null);
      latest.current.onDocked?.({ byUser });
    },
    [host, id, remember]
  );

  const open = useCallback(
    ({ quiet = false } = {}) => {
      if (!enabled) return false;
      if (session.current) {
        session.current.win.focus();
        return true;
      }
      const opened = openPanelWindow({
        name: `tj-panel-${id}-${pageId}`,
        title: latest.current.title,
        bounds: readPanelPreference(id).bounds,
      });
      if (!opened) {
        if (!quiet) latest.current.onBlocked?.();
        return false;
      }
      const stopMirror = mirrorStyles(document, opened.document);
      const frame = buildScope(opened.document, latest.current.scope);
      host.classList.add('tj-popout-host--window');
      moveInto(host, frame.mount);

      const onWindowGone = () => settle({ byUser: true });
      const onEditorGone = () => settle({ byUser: false });
      opened.addEventListener('pagehide', onWindowGone);
      window.addEventListener('pagehide', onEditorGone);
      // A window that goes without a `pagehide` (killed, crashed) still brings the panel back.
      const watch = window.setInterval(() => opened.closed && onWindowGone(), 500);
      session.current = {
        win: opened,
        frame,
        stop: () => {
          stopMirror();
          opened.removeEventListener('pagehide', onWindowGone);
          window.removeEventListener('pagehide', onEditorGone);
          window.clearInterval(watch);
        },
      };
      remember(true);
      setWin(opened);
      latest.current.onOpened?.();
      return true;
    },
    [enabled, host, id, remember, settle]
  );

  const dock = useCallback(() => settle({ byUser: true }), [settle]);
  /** Closes the window without it being the user's choice (the panel is being hidden): a window is still preferred. */
  const close = useCallback(() => settle({ byUser: false }), [settle]);
  const focus = useCallback(() => {
    session.current?.win.focus();
    return !!session.current;
  }, []);

  /** Opens the window again when this user had the panel there, if the browser will allow it right now. */
  const restore = useCallback(
    () => enabled && !session.current && readPanelPreference(id).poppedOut && userIsActing() && open({ quiet: true }),
    [enabled, id, open]
  );

  /** The panel's place in the editor: the element it is put under while docked (null when it has none). */
  const setDockTarget = useCallback(
    (el) => {
      dockTarget.current = el;
      if (session.current) return;
      if (el) moveInto(host, el);
      else host.remove();
    },
    [host]
  );

  useLayoutEffect(() => {
    if (dockTo !== 'body') return undefined;
    setDockTarget(document.body);
    return () => setDockTarget(null);
  }, [dockTo, setDockTarget]);

  // The wrappers in the window follow the scope (a theme switch changes its class names).
  const scopeKey = (scope ?? []).join('|');
  useLayoutEffect(() => {
    session.current?.frame.update(latest.current.scope);
  }, [scopeKey, win]);

  useEffect(() => {
    if (session.current) session.current.win.document.title = title;
  }, [title, win]);

  useEffect(() => registerPanelWindow(id, { focus, window: () => session.current?.win ?? null }), [id, focus]);

  // The panel is going away for good (the editor closed, the mode changed): its window goes with it.
  useEffect(() => () => settle({ byUser: false }), [settle]);
  useEffect(() => {
    if (!enabled) settle({ byUser: false });
  }, [enabled, settle]);

  return useMemo(
    () => ({
      id,
      host,
      window: win,
      isPoppedOut: !!win,
      prefersWindow,
      available: enabled,
      open,
      dock,
      close,
      focus,
      restore,
      setDockTarget,
    }),
    [id, host, win, prefersWindow, enabled, open, dock, close, focus, restore, setDockTarget]
  );
};
