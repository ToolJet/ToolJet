// zustand as every jest suite sees it (frontend/__mocks__/zustand.js, which resets each store after a test), with each
// store's live subscriptions counted in globalThis.__ui2LeakCounts.subscriptions. A store's subscribe is wrapped from
// inside its state creator, on the api object useSyncExternalStore and `useStore.subscribe` both call, so a hook's
// subscription and a direct one count alike. The leak suites install it with
// `jest.mock('zustand', () => require('./countingZustand'))`.
const base = jest.requireActual('../../../../../../__mocks__/zustand');

const counts = (globalThis.__ui2LeakCounts ||= { subscriptions: 0 });

const counted = (stateCreator) => (set, get, api) => {
  const subscribe = api.subscribe;
  api.subscribe = (...args) => {
    counts.subscriptions += 1;
    const unsubscribe = subscribe(...args);
    let done = false;
    return () => {
      if (!done) counts.subscriptions -= 1;
      done = true;
      return unsubscribe();
    };
  };
  return stateCreator(set, get, api);
};

const wrap = (factory) => (stateCreator) =>
  typeof stateCreator === 'function' ? factory(counted(stateCreator)) : (sc) => factory(counted(sc));

const create = wrap(base.create);
const createStore = wrap(base.createStore);

module.exports = {
  ...base,
  __esModule: true,
  default: create,
  create,
  createStore,
  useStore: base.useStore,
  __resetAllStores: base.__resetAllStores,
};
