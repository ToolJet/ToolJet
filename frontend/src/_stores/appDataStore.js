import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  isVersionReleased: false,
};

export const useAppDataStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
      updateIsVersionReleased: (isVersionReleased) => set(() => ({ isVersionReleased })),
    },
  }))
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
export const useIsReleasedVersion = () => useAppDataStore((state) => state.editingVersion);
export const useUpdateReleasedVersion = () => useAppDataStore((state) => state.actions);
