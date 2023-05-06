import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const zustandDevTools = process.env.NODE_ENV === 'production' ? (fn) => fn : devtools;

const resetters = [];

export const create = (fn) => {
  if (fn === undefined) return create;
  const store = _create(fn);
  const initialState = store.getState();
  resetters.push(() => {
    store.setState(initialState, true);
  });
  return store;
};

export const resetAllStores = () => {
  for (const resetter of resetters) {
    resetter();
  }
};
