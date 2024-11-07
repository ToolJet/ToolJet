import useStore from '@/AppBuilder/_stores/store';

const initialState = {
  showGitSyncModal: false,
};

export const createGitSyncSlice = (set, get) => ({
  ...initialState,
  toggleGitSyncModal: () => {
    const creationMode = useStore.getState()?.app.creationMode;
    const featureAccess = useStore.getState()?.license?.featureAccess;
    const selectedEnvironment = useStore.getState()?.selectedEnvironment;
    const isEditorFreezed = useStore.getState()?.isEditorFreezed;

    return featureAccess?.gitSync && selectedEnvironment?.priority === 1 && (creationMode === 'GIT' || !isEditorFreezed)
      ? set((state) => ({ showGitSyncModal: !state.showGitSyncModal }), false, 'toggleGitSyncModal')
      : () => {};
  },
});
