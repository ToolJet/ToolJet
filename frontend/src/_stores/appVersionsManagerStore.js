import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  showCreateVersionModalPrompt: false,
  isCreatingOrEditingVersion: false,
  isUserEditingTheVersion: false,
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
    },
  }))
);

export const useEditingVersion = () => useAppVersionManagerStore((state) => state.editingVersion);
export const useEditingVersionId = () => useAppVersionManagerStore((state) => state?.editingVersion?.id);
export const useAppVersionsManagerActions = () => useAppVersionManagerStore((state) => state.actions);
export const useShowCreateVersionModalPrompt = () =>
  useAppVersionManagerStore((state) => state.showCreateVersionModalPrompt);
export const useIsUserEditingTheVersion = () => useAppVersionManagerStore((state) => state.isUserEditingTheVersion);
