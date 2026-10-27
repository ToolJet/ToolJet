const noop = () => {};

/**
 * Runs callbacks as new tasks, one at a time: `schedule(fn)` posts `fn` to run soon, after the browser has had a chance
 * to handle input and paint. A MessageChannel, not setTimeout, which adds 4 ms between nested calls. `close()` releases
 * the channel (an open one keeps a Node process alive in tests).
 */
export const taskQueue = () => {
  if (typeof MessageChannel !== 'function') return { schedule: (fn) => setTimeout(fn, 0), close: noop };
  const channel = new MessageChannel();
  let next = null;
  channel.port1.onmessage = () => next?.();
  return {
    schedule: (fn) => {
      next = fn;
      channel.port2.postMessage(null);
    },
    close: () => channel.port1.close(),
  };
};

/**
 * A taskQueue for background work nobody waits on: each callback runs once the browser is idle (requestIdleCallback),
 * at the latest after `timeoutMs`, and is given the idle deadline (`timeRemaining()`, `didTimeout`) to fit its work
 * in. A plain taskQueue where there is no requestIdleCallback (no deadline then).
 */
export const idleQueue = ({ timeoutMs = 1000 } = {}) => {
  if (typeof requestIdleCallback !== 'function') return taskQueue();
  let handle = null;
  return {
    schedule: (fn) => {
      handle = requestIdleCallback(
        (deadline) => {
          handle = null;
          fn(deadline);
        },
        { timeout: timeoutMs }
      );
    },
    close: () => {
      if (handle !== null) cancelIdleCallback(handle);
      handle = null;
    },
  };
};
