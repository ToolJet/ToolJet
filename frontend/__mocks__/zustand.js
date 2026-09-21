// Auto-mock for the `zustand` package (picked up automatically because this
// __mocks__ dir sits next to node_modules). Every store created during a test
// is reset to its initial state after each test, so module-singleton stores in
// src/_stores/* can't leak state between tests.
const zustand = jest.requireActual('zustand');

const storeResetFns = new Set();

const createUncurried = (stateCreator) => {
  const store = zustand.create(stateCreator);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

// zustand's `create` supports both `create(fn)` and the curried `create()(fn)`.
export const create = (stateCreator) => {
  return typeof stateCreator === 'function' ? createUncurried(stateCreator) : createUncurried;
};

const createStoreUncurried = (stateCreator) => {
  const store = zustand.createStore(stateCreator);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

export const createStore = (stateCreator) => {
  return typeof stateCreator === 'function' ? createStoreUncurried(stateCreator) : createStoreUncurried;
};

// Legacy default import (`import create from 'zustand'`).
export default create;

export const useStore = zustand.useStore;

// Called from src/test/setupTests.js after each test. Not registered as an
// afterEach here because this module can load lazily mid-test, and hooks
// cannot be defined inside a running test.
export const __resetAllStores = () => {
  storeResetFns.forEach((resetFn) => resetFn());
};
