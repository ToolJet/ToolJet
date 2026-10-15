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
