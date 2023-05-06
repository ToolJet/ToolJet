import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
};

export const useAppDataStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
    },
  }))
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
