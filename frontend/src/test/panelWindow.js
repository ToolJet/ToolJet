/*
  The browser window a pop-out panel opens, for specs. jsdom has no `window.open`, and this is a browser boundary a
  spec may control. The stand-in is an iframe's window: a real second document in its own realm (its `HTMLElement` is
  not the test page's), so code that confuses the two windows fails here as it would in a browser.
*/

/** One window: `close()` behaves like the user closing it (a `pagehide`, then `closed`). */
export const createPanelWindow = () => {
  const frame = document.createElement('iframe');
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  let closed = false;
  let closing = false;
  Object.defineProperty(win, 'closed', { configurable: true, get: () => closed });
  win.close = jest.fn(() => {
    if (closed || closing) return;
    closing = true;
    win.dispatchEvent(new win.Event('pagehide'));
    closed = true;
  });
  win.focus = jest.fn();
  return win;
};

/**
 * Makes `window.open` hand out panel windows. `opened` lists them in order; `block()` makes the next opens fail as a
 * pop-up blocker would (null). Restored by `jest.restoreAllMocks()` or `restore()`.
 */
export const stubWindowOpen = () => {
  const opened = [];
  let blocked = false;
  const open = jest.spyOn(window, 'open').mockImplementation(() => {
    if (blocked) return null;
    const win = createPanelWindow();
    opened.push(win);
    return win;
  });
  return {
    open,
    opened,
    block: (on = true) => {
      blocked = on;
    },
    restore: () => {
      open.mockRestore();
      document.querySelectorAll('iframe').forEach((frame) => frame.remove());
    },
  };
};

/** Whether the browser would let the page open a window now (a click or key press just happened). */
export const setUserActivation = (isActive) => {
  Object.defineProperty(window.navigator, 'userActivation', { configurable: true, value: { isActive } });
};
