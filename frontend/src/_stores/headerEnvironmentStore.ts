import type { StateCreator, StoreApi, UseBoundStore } from 'zustand';

import { createZustandStoreWithImmer } from '@/_stores/utils';

export interface HeaderEnvironment {
  id: string;
  name: string;
}

export interface HeaderEnvironmentSelectConfig {
  environments: HeaderEnvironment[];
  /** The environment in force; undefined while the environments load. */
  environmentId: string | undefined;
  onChange: (environmentId: string) => void;
}

interface HeaderEnvironmentStore {
  select: HeaderEnvironmentSelectConfig | null;
  setSelect: (select: HeaderEnvironmentSelectConfig | null) => void;
}

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
type HeaderEnvironmentStoreCreator = StateCreator<
  HeaderEnvironmentStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
>;

const createHeaderEnvironmentStore: HeaderEnvironmentStoreCreator = (set) => ({
  select: null,
  setSelect: (select) => {
    set((state) => {
      state.select = select;
    });
  },
});

// Pages put an environment select in the new layout header through `useHeaderEnvironmentSelect`, not by calling this.
export const useHeaderEnvironmentStore: UseBoundStore<StoreApi<HeaderEnvironmentStore>> = createZustandStoreWithImmer(
  createHeaderEnvironmentStore,
  { storeName: 'Header environment store' }
);
