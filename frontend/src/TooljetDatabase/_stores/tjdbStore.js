import { create, zustandDevTools } from '@/_stores/utils';
import { immer } from 'zustand/middleware/immer';
// Imported from the module file, not the '@/_services' barrel: the barrel re-exports
// tooljetDatabase.service.js, which imports this store back - going through the barrel would
// close an ESM import cycle and leave `currentEnvironmentId` in the TDZ at module-eval time.
import { appEnvironmentService } from '@/_services/app_environment.service';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { getColumnDataType, isEnvironmentLocked } from '@/TooljetDatabase/constants';

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
  migrationsVersion: 0,
};

// Per tab, so a reload or a trip out of the dashboard returns to the same environment. Only the
// in-memory selection is reset on unmount (resetStore), never this key - App Builder reads the
// store, not storage. Storage can be blocked (private mode), so failures fall back to development.
const SELECTED_ENVIRONMENT_KEY = 'tjdb-selected-environment-id';
const readSelectedEnvironmentId = () => {
  try {
    return window.sessionStorage.getItem(SELECTED_ENVIRONMENT_KEY);
  } catch {
    return null;
  }
};
const writeSelectedEnvironmentId = (environmentId) => {
  try {
    window.sessionStorage.setItem(SELECTED_ENVIRONMENT_KEY, environmentId);
  } catch {
    // Not persisted; the selection still works for this page load.
  }
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
        // the tab's last selection when it is still licensed (after a lapse the list keeps the locked
        // environments, flagged `enabled: false`), else the lowest-priority entry (development).
        loadEnvironments: async () => {
          const { environments: fetchedEnvironments = [] } = await appEnvironmentService.getAllEnvironments();
          const sorted = [...fetchedEnvironments].sort((a, b) => a.priority - b.priority);
          const restoredId = readSelectedEnvironmentId();
          set((state) => {
            state.environments = sorted;
            state.selectedEnvironment =
              sorted.find((env) => env.id === restoredId && !isEnvironmentLocked(env)) ?? sorted[0] ?? null;
          });
          return sorted;
        },

        // The single metadata read. Six copies of this body used to exist, and exactly one of them
        // passed the environment - which is why five paths rendered development's schema while the
        // user was on staging. viewTable now injects environment_id itself, so the duplication is
        // the only remaining hazard; this removes it.
        //
        // Returns rather than sets: setColumns/setForeignKeys/setConfigurations live in
        // TooljetDatabaseContext and stay there (design doc 3.4), so a store action cannot call them.
        fetchTableMetadata: async (organizationId, tableName) => {
          const { data = [], error } = await tooljetDatabaseService.viewTable(organizationId, tableName);
          if (error) {
            toast.error(error?.message ?? `Error fetching metadata for table "${tableName}"`);
            return null;
          }
          const { foreign_keys = [], configurations = {}, columns: rawColumns = [] } = data?.result || {};
          return {
            rawColumns,
            columns: rawColumns.map(({ column_name, data_type, ...rest }) => ({
              Header: column_name,
              accessor: column_name,
              dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
              ...rest,
            })),
            foreignKeys: foreign_keys,
            configurations,
          };
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

        // Bumped whenever a migration is recorded. EnvironmentSwitcher owns the migration-chain fetch
        // in local state; this is the one signal that tells it to re-read. Called from useMigrationModal
        // and TableListItem (which calls deleteTable directly).
        bumpMigrations: () =>
          set((state) => {
            state.migrationsVersion += 1;
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
          writeSelectedEnvironmentId(environment.id);
          set((state) => {
            state.selectedEnvironment = environment;
            state.queryFilters = {};
            state.sortFilters = {};
            state.pageCount = 1;
          });
          await get().onEnvironmentSwitch?.();
        },

        // Called on TooljetDatabase unmount (leaving the admin panel). This store is a module-level
        // singleton, not React state scoped to that route - without this, `selectedEnvironment`
        // survives client-side navigation into App Builder, where `currentEnvironmentId()` is read
        // as the ambient default for TJDB data-source queries (tooljetDatabase.service.js). An admin
        // who last had staging/production selected here would otherwise have App Builder's TJDB
        // query editor silently read that environment's schema instead of development's.
        resetStore: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),
      },
    })),
    { name: 'TJDB Store' }
  )
);

// Non-React accessor: the service layer builds URLs outside any render, so it cannot use a hook.
export const currentEnvironmentId = () => useTjdbStore.getState().selectedEnvironment?.id ?? null;

// priority 1 is development by backend convention (DEVELOPMENT_PRIORITY in relation-resolver.service.ts).
// Fall back to true when nothing is loaded yet so CE (single environment) behaves exactly as before.
export const useIsDevelopmentEnvironment = () =>
  useTjdbStore((state) => (state.selectedEnvironment ? state.selectedEnvironment.priority === 1 : true));

export const useTjdbActions = () => useTjdbStore((state) => state.actions);
