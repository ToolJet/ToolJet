import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  showCreateVersionModalPrompt: false,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
  isVersionReleased: false,
};

export const useAppVersionStore = create(
  zustandDevTools((set, get) => ({
    ...initialState,
    actions: {
      updateEditingVersion: (version) =>
        set({ editingVersion: version, isVersionReleased: get().releasedVersionId === version?.id }),
      closeCreateVersionModalPrompt: () => {
        set({ showCreateVersionModalPrompt: false });
      },
      enableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: true }),
      disableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: false }),
      updateReleasedVersionId: (versionId) => set({ releasedVersionId: versionId }),
    },
  }))
);

export const useEditingVersion = () => useAppVersionStore((state) => state.editingVersion);
export const useEditingVersionId = () => useAppVersionStore((state) => state?.editingVersion?.id);
export const useAppVersionsManagerActions = () => useAppVersionStore((state) => state.actions);
export const useShowCreateVersionModalPrompt = () => useAppVersionStore((state) => state.showCreateVersionModalPrompt);
export const useIsUserEditingTheVersion = () => useAppVersionStore((state) => state.isUserEditingTheVersion);
export const useIsVersionReleased = () =>
  useAppVersionStore((state) => state.releasedVersionId === state.editingVersion?.id);
