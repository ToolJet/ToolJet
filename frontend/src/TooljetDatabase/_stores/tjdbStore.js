import { create, zustandDevTools } from '@/_stores/utils';
import { immer } from 'zustand/middleware/immer';
// Imported from the module file, not the '@/_services' barrel: the barrel re-exports
// tooljetDatabase.service.js, which imports this store back - going through the barrel would
// close an ESM import cycle and leave `currentEnvironmentId` in the TDZ at module-eval time.
import { appEnvironmentService } from '@/_services/app_environment.service';

const initialState = {
  environments: [],
  selectedEnvironment: null,
};

export const useTjdbStore = create(
  zustandDevTools(
    immer((set) => ({
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
      },
    })),
    { name: 'TJDB Store' }
  )
);

// Non-React accessor: the service layer builds URLs outside any render, so it cannot use a hook.
export const currentEnvironmentId = () => useTjdbStore.getState().selectedEnvironment?.id ?? null;

export const useTjdbActions = () => useTjdbStore((state) => state.actions);
