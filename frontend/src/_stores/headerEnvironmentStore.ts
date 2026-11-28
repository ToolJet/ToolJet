import type { StateCreator, StoreApi, UseBoundStore } from 'zustand';

import { createZustandStoreWithImmer } from '@/_stores/utils';
import type { EnvironmentSwitcherOption } from '@/components/ui/Rocket/EnvironmentSwitcher/EnvironmentSwitcher';

export interface HeaderEnvironment extends Pick<EnvironmentSwitcherOption, 'meta' | 'disabled' | 'disabledReason'> {
  id: string;
  name: string;
}

export interface HeaderEnvironmentSelectConfig {
  environments: HeaderEnvironment[];
  /** The environment in force; undefined while the environments load. */
  environmentId: string | undefined;
  onChange: (environmentId: string) => void;
  /** A row under the environments, for example "View migration history". */
  footerAction?: { label: string; onSelect: () => void };
  /** Shown when the select is hovered or focused. */
  tooltip?: string;
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
