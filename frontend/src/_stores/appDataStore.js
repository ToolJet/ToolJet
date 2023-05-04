import { create } from 'zustand';
import { zustandDevTools } from './utils';

export const useAppDataStore = create(
  zustandDevTools((set) => ({
    editingVersion: null,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
    },
  }))
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
