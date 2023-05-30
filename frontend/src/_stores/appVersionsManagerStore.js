import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  showCreateVersionModalPrompt: false,
  isCreatingOrEditingVersion: false,
};

export const useAppVersionManagerStore = create(
  zustandDevTools((set) => ({
    ...initialState,
    actions: {
      updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
      closeCreateVersionModalPrompt: () => {
        set(() => ({ showCreateVersionModalPrompt: false }));
      },
    },
  }))
);

export const useEditingVersion = () => useAppVersionManagerStore((state) => state.editingVersion);
export const useEditingVersionId = () => useAppVersionManagerStore((state) => state?.editingVersion?.id);
export const useAppVersionManagerActions = () => useAppVersionManagerStore((state) => state.actions);
export const useShowCreateVersionModalPrompt = () =>
  useAppVersionManagerStore((state) => state.showCreateVersionModalPrompt);
