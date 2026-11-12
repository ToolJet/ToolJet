type ActionHandler = (...args: unknown[]) => unknown;
type Waiter = (handler: ActionHandler | undefined) => void;
interface RegistryState {
  waiting: Map<string, Set<Waiter>>;
  settled: boolean;
}

// A plain Map with its own `set`, not a subclass of Map: the build compiles classes for older browsers, where a
// subclass of a built-in needs Babel's wrapper to work at all.
const registries = new WeakMap<Map<string, ActionHandler>, RegistryState>();

/**
 * A pack component's action handlers by name, as its ToolJet.useAction calls register them. The widget exposes its
 * actions as soon as its manifest is read, before the bundle has loaded and the component has mounted, so an action
 * can be called before its handler exists: a page's On page load opening a pack Dialog did nothing (QA item 33).
 */
export const createActionRegistry = (): Map<string, ActionHandler> => {
  const actions = new Map<string, ActionHandler>();
  const state: RegistryState = { waiting: new Map(), settled: false };
  registries.set(actions, state);
  actions.set = (name: string, handler: ActionHandler) => {
    Map.prototype.set.call(actions, name, handler);
    state.waiting.get(name)?.forEach((resolve) => resolve(handler));
    return actions;
  };
  return actions;
};

/** Whether the component has drawn (its handlers registered) or failed to load: no further handler is coming. */
export const isActionRegistrySettled = (actions: Map<string, ActionHandler>): boolean =>
  registries.get(actions)?.settled ?? true;

/**
 * Marks the component drawn or failed (settled), which ends every wait for a handler it has not registered, or
 * loading again (another bundle or component), when calls wait for its handlers again.
 */
export const setActionRegistrySettled = (actions: Map<string, ActionHandler>, settled: boolean): void => {
  const state = registries.get(actions);
  if (!state) return;
  state.settled = settled;
  if (settled) [...state.waiting.values()].forEach((waiters) => [...waiters].forEach((resolve) => resolve(undefined)));
};

/**
 * The handler `name` once it is registered: at once when it is, undefined at once when the registry is settled without
 * it, else when it is registered, the registry settles, or `timeoutMs` passes.
 */
export const whenActionRegistered = (
  actions: Map<string, ActionHandler>,
  name: string,
  timeoutMs: number
): Promise<ActionHandler | undefined> => {
  const handler = actions.get(name);
  const state = registries.get(actions);
  if (handler || !state || state.settled) return Promise.resolve(handler);
  return new Promise((resolve) => {
    const waiters = state.waiting.get(name) ?? new Set<Waiter>();
    const done: Waiter = (found) => {
      clearTimeout(timer);
      waiters.delete(done);
      if (!waiters.size) state.waiting.delete(name);
      resolve(found);
    };
    const timer = setTimeout(() => done(undefined), timeoutMs);
    waiters.add(done);
    state.waiting.set(name, waiters);
  });
};
