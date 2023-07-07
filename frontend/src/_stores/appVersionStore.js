import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
  isVersionReleased: false,
  isEditorFreezed: false,
};

export const useAppVersionStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        updateEditingVersion: (version) =>
          set({ editingVersion: version, isVersionReleased: get().releasedVersionId === version?.id }),
        enableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: true }),
        disableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: false }),
        updateReleasedVersionId: (versionId) =>
          set({
            releasedVersionId: versionId,
            isVersionReleased: get().editingVersion?.id ? get().editingVersion?.id === versionId : false,
          }),
        onEditorFreeze: (value = false) => set({ isEditorFreezed: value }),
      },
    }),
    { name: 'App Version Manager Store' }
  )
);
