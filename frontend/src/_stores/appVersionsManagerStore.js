import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  showCreateVersionModalPrompt: false,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
};

export const useAppVersionManagerStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
      closeCreateVersionModalPrompt: () => {
        set(() => ({ showCreateVersionModalPrompt: false }));
      },
      enableReleasedVersionPopupState: () => set(() => ({ isUserEditingTheVersion: true })),
      disableReleasedVersionPopupState: () => set(() => ({ isUserEditingTheVersion: false })),
      updateReleasedVersionId: (versionId) => set(() => ({ releasedVersionId: versionId })),
    },
  }))
);

export const useEditingVersion = () => useAppVersionManagerStore((state) => state.editingVersion);
export const useEditingVersionId = () => useAppVersionManagerStore((state) => state?.editingVersion?.id);
export const useAppVersionsManagerActions = () => useAppVersionManagerStore((state) => state.actions);
export const useShowCreateVersionModalPrompt = () =>
  useAppVersionManagerStore((state) => state.showCreateVersionModalPrompt);
export const useIsUserEditingTheVersion = () => useAppVersionManagerStore((state) => state.isUserEditingTheVersion);
export const useIsVersionReleased = () =>
  useAppVersionManagerStore((state) => state.releasedVersionId === state.editingVersion?.id);
