import { create, zustandDevTools } from '@/_stores/utils';
import { immer } from 'zustand/middleware/immer';
// Imported from the module file, not the '@/_services' barrel: the barrel re-exports
// tooljetDatabase.service.js, which imports this store back - going through the barrel would
// close an ESM import cycle and leave `currentEnvironmentId` in the TDZ at module-eval time.
import { appEnvironmentService } from '@/_services/app_environment.service';

const initialState = {
  environments: [],
  selectedEnvironment: null,
  queryFilters: {},
  sortFilters: {},
  pageCount: 1,
  pageSize: 50,
  // Set by Table/index.jsx, which is the only component holding every derived cache an environment
  // switch has to clear. Never select this into a component - it is a callback slot, not state.
  onEnvironmentSwitch: null,
};

// Mirrors the useState setter contract these actions replace: a value or an updater function.
const applyUpdate = (previous, next) => (typeof next === 'function' ? next(previous) : next);

export const useTjdbStore = create(
  zustandDevTools(
    immer((set, get) => ({
      ...initialState,
      actions: {
        // Org-scoped (no app_id) - CE gets back a single-entry list (its one licensed environment),
        // EE/licensed orgs get dev/staging/production ordered by priority. Default selection is
        // always the lowest-priority entry (development).
        loadEnvironments: async () => {
          const { environments: fetchedEnvironments = [] } = await appEnvironmentService.getAllEnvironments();
          const sorted = [...fetchedEnvironments].sort((a, b) => a.priority - b.priority);
          set((state) => {
            state.environments = sorted;
            state.selectedEnvironment = sorted[0] ?? null;
          });
          return sorted;
        },

        setQueryFilters: (next) =>
          set((state) => {
            state.queryFilters = applyUpdate(state.queryFilters, next);
          }),
        setSortFilters: (next) =>
          set((state) => {
            state.sortFilters = applyUpdate(state.sortFilters, next);
          }),
        setPageCount: (next) =>
          set((state) => {
            state.pageCount = applyUpdate(state.pageCount, next);
          }),
        setPageSize: (next) =>
          set((state) => {
            state.pageSize = applyUpdate(state.pageSize, next);
          }),

        registerEnvironmentSwitchHandler: (handler) =>
          set((state) => {
            state.onEnvironmentSwitch = handler;
          }),

        // The one ordered environment switch. Two independent useEffects used to do this - one for
        // rows (index.jsx), one for metadata (Table/index.jsx) - with no ordering guarantee between
        // them, so the grid could briefly render the new environment's rows against the old
        // environment's columns.
        //
        // Filters and sort are reset rather than carried over: a filter on a column that has not
        // been promoted yet is a PostgREST 400 in the target environment, and "page 7" means
        // nothing when dev has 12 rows and prod has 400k.
        // ponytail: reset-all. If side-by-side env comparison ("show status=failed in dev, then in
        // prod") becomes a real workflow, keep queryFilters/sortFilters across the switch and reset
        // only pagination, gated on the filtered columns existing in the target env's freshly
        // fetched metadata. Do not build the envId x tableId cache until someone asks for it.
        switchEnvironment: async (environment) => {
          set((state) => {
            state.selectedEnvironment = environment;
            state.queryFilters = {};
            state.sortFilters = {};
            state.pageCount = 1;
          });
          await get().onEnvironmentSwitch?.();
        },
      },
    })),
    { name: 'TJDB Store' }
  )
);

// Non-React accessor: the service layer builds URLs outside any render, so it cannot use a hook.
export const currentEnvironmentId = () => useTjdbStore.getState().selectedEnvironment?.id ?? null;

export const useTjdbActions = () => useTjdbStore((state) => state.actions);
