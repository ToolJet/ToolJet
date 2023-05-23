import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  isSaving: false,
};

export const useAppDataStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
        setIsSaving: (isSaving) => set(() => ({ isSaving })),
      },
    }),
    { name: 'App Data Store' }
  )
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useIsSaving = () => useAppDataStore((state) => state.isSaving);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
