import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAppDataStore = create(
  devtools((set) => ({
    editingVersion: null,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
    },
  }))
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
