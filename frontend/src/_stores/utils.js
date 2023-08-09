import { isString } from 'lodash';
import { create as _create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const zustandDevTools = (fn, options = {}) =>
  devtools(fn, { ...options, enabled: process.env.NODE_ENV === 'production' ? false : true });

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
