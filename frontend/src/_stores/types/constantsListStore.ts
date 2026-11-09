import type { StateCreator } from 'zustand';
import type { RowSelectionState, Updater } from '@tanstack/react-table';

import type {
  BulkDeleteConstantsResult,
  ConstantDetail,
  ConstantListItem,
  ConstantsListMeta,
  ConstantSort,
  ConstantSource,
  ConstantType,
  CreateConstantBody,
  ListConstantsParams,
  UpdateConstantBody,
} from '@/_services/types/organizationConstantsV2.types';

export type ConstantsListStatus = 'idle' | 'loading' | 'success' | 'error';

/** The URL-owned filters of a fetch; the store adds the page and the search term itself. */
export type FetchConstantsListParams = Pick<ListConstantsParams, 'environmentId' | 'type'> & {
  sort: ConstantSort;
  source: ConstantSource[];
};

export interface ConstantsListStoreState {
  query: { page: number; searchKey: string };
  /** `meta` is the API response without its items. */
  root: { items: ConstantListItem[]; meta: ConstantsListMeta | null; status: ConstantsListStatus };
  /** Keyed by constant id. */
  rowSelection: RowSelectionState;
  /** Ordered constant ids per tab type. */
  pins: Record<ConstantType, string[]>;
}

export interface ConstantsListStore extends ConstantsListStoreState {
  setSearch: (searchKey: string) => void;
  setPage: (page: number) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  clearSelection: () => void;
  removeItems: (ids: string[]) => void;
  pinConstants: (type: ConstantType, ids: string[], sort: ConstantSort) => void;
  unpinConstants: (type: ConstantType, ids: string[]) => void;
  /** `toIndex` counts among the pins on the loaded page. */
  movePin: (type: ConstantType, id: string, toIndex: number) => void;
  fetchList: (params: FetchConstantsListParams) => Promise<void>;
  createConstant: (body: CreateConstantBody) => Promise<ConstantDetail>;
  updateConstant: (id: string, body: UpdateConstantBody) => Promise<ConstantDetail>;
  bulkDeleteConstants: (ids: string[]) => Promise<BulkDeleteConstantsResult>;
}

// Mirrors createZustandStoreWithImmer, which wraps the creator as devtools(immer(...)).
export type ConstantsListStoreCreator = StateCreator<
  ConstantsListStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
>;
