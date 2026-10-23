import { useRef } from 'react';

// Every UI 2.0 widget is its own lazy chunk (registry.ts), loaded by its first render, which suspends until it has.

/** React.lazy's component: `_init` loads it, throwing the pending load until it has. */
interface Lazy {
  $$typeof: symbol;
  _payload: { _status: number };
  _init: (payload: unknown) => unknown;
}

const RESOLVED = 1; // React's status for a loaded lazy component
const isUnloadedLazy = (component: unknown): component is Lazy =>
  (component as Lazy | null)?.$$typeof === Symbol.for('react.lazy') &&
  (component as Lazy)._payload?._status !== RESOLVED;
const noop = () => undefined;

/**
 * Starts loading the lazy components not loaded yet, as their first render would, and returns what resolves once they
 * have, or null when none is left to load. A failed load resolves too: the component's own render reports it.
 */
export const loadLazy = (components: unknown[]): Promise<unknown> | null => {
  const loads = components.filter(isUnloadedLazy).flatMap((lazy) => {
    try {
      lazy._init(lazy._payload);
      return [];
    } catch (pending) {
      return typeof (pending as Promise<unknown>)?.then === 'function'
        ? [(pending as Promise<unknown>).then(noop, noop)]
        : [];
    }
  });
  return loads.length ? Promise.all(loads) : null;
};

/**
 * Suspends a widget's first render until the lazy components it draws many of (a List view's row template) have
 * loaded. Drawn before, each row's components mounted in a later Suspense retry of its own, outside the batch the
 * widget opens for its rows, so every value they published derived the widget's children in a store update of its own.
 * Only the first render waits: a component added later loads as it first renders.
 */
export const useLazyLoadedFirst = (components: () => unknown[]): void => {
  const loaded = useRef(false);
  if (loaded.current) return;
  const pending = loadLazy(components());
  if (pending) throw pending;
  loaded.current = true;
};
