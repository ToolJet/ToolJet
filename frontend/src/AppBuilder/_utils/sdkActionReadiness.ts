/**
 * Whether a pack (or custom) component's actions are ready to call, by module and component. A pack component exposes
 * its actions once its manifest is read, after the page's first render, so an On page load action on it found none and
 * did nothing (QA item 33). An action called on it in the meantime waits, but only while the widget is still loading:
 *
 *  - loading (its host has mounted, its manifest has not been read): wait;
 *  - ready: its manifest is read, and `actions` are the ones it exposes. One of them runs once it reaches the store (the
 *    page's exposed-value writes go out together, after the last widget of the commit has mounted); any other name is
 *    not one it has, so the wait ends at once;
 *  - no host: the widget has not mounted (a lazy widget still loading, or one never drawn, as in a tab not yet opened).
 *    The wait ends if none mounts within MOUNT_WAIT_MS, or once a mounted one is removed.
 *
 * MAX_WAIT_MS ends any wait, should a manifest never load.
 */
export type SdkActionReadiness = { status: 'loading' } | { status: 'ready'; actions: ReadonlySet<string> };

export const MOUNT_WAIT_MS = 3000;
export const MAX_WAIT_MS = 15000;

// By widget, then by mounted instance: a widget in a List view's rows mounts once per row, under one id.
const readiness = new Map<string, Map<object, SdkActionReadiness>>();
const listeners = new Set<() => void>();
const keyOf = (moduleId: string, componentId: string) => `${moduleId}:${componentId}`;
const ONE_INSTANCE = {};

/** A mounted instance's report (`owner` tells instances apart): loading, ready with its actions, or null once gone. */
export const setSdkActionReadiness = (
  moduleId: string,
  componentId: string,
  value: SdkActionReadiness | null,
  owner: object = ONE_INSTANCE
): void => {
  const key = keyOf(moduleId, componentId);
  const instances = readiness.get(key);
  if (value) {
    if (instances) instances.set(owner, value);
    else readiness.set(key, new Map([[owner, value]]));
  } else {
    if (!instances?.delete(owner)) return;
    if (!instances.size) readiness.delete(key);
  }
  listeners.forEach((listener) => listener());
};

/** The widget's readiness across its mounted instances: ready once any is (with all their actions), else loading. */
export const getSdkActionReadiness = (moduleId: string, componentId: string): SdkActionReadiness | undefined => {
  const instances = readiness.get(keyOf(moduleId, componentId));
  if (!instances?.size) return undefined;
  const ready = [...instances.values()].filter(
    (state): state is Extract<SdkActionReadiness, { status: 'ready' }> => state.status === 'ready'
  );
  if (!ready.length) return { status: 'loading' };
  return ready.length === 1 ? ready[0] : { status: 'ready', actions: new Set(ready.flatMap((r) => [...r.actions])) };
};

type Action = (...args: unknown[]) => unknown;

/** The component's action `handle` once it can be called, or undefined once it never will be (above). */
export const awaitSdkAction = ({
  moduleId,
  componentId,
  handle,
  read,
  subscribeStore,
  mountWaitMs = MOUNT_WAIT_MS,
  maxWaitMs = MAX_WAIT_MS,
}: {
  moduleId: string;
  componentId: string;
  handle: string;
  /** The component's exposed action, read from the store. */
  read: () => unknown;
  subscribeStore: (listener: () => void) => () => void;
  mountWaitMs?: number;
  maxWaitMs?: number;
}): Promise<Action | undefined> =>
  new Promise((resolve) => {
    let settled = false;
    let mounted = !!getSdkActionReadiness(moduleId, componentId);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsubscribers: (() => void)[] = [];
    const finish = (action: Action | undefined) => {
      if (settled) return;
      settled = true;
      timers.forEach(clearTimeout);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(action);
    };
    const check = () => {
      const action = read();
      if (typeof action === 'function') return finish(action as Action);
      const state = getSdkActionReadiness(moduleId, componentId);
      if (state) mounted = true;
      else if (mounted) return finish(undefined); // its host was removed
      if (state?.status === 'ready' && !state.actions.has(handle)) finish(undefined);
    };
    check();
    if (settled) return;
    timers.push(setTimeout(() => !getSdkActionReadiness(moduleId, componentId) && finish(undefined), mountWaitMs));
    timers.push(setTimeout(() => finish(undefined), maxWaitMs));
    unsubscribers.push(subscribeStore(check));
    listeners.add(check);
    unsubscribers.push(() => listeners.delete(check));
  });
