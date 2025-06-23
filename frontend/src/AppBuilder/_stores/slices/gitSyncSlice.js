import useStore from '@/AppBuilder/_stores/store';
import { gitSyncService } from '@/_services';
import { useAppDataStore } from '@/_stores/appDataStore';
const initialState = {
  showGitSyncModal: false,
  allowEditing: false,
  appLoading: false,
};
export const createGitSyncSlice = (set, get) => ({
  ...initialState,
  toggleGitSyncModal: (creationMode) => {
    const featureAccess = useStore.getState()?.license?.featureAccess;
    const selectedEnvironment = useStore.getState()?.selectedEnvironment;
    const isEditorFreezed = useStore.getState()?.isEditorFreezed;

    return featureAccess?.gitSync && selectedEnvironment?.priority === 1 && (creationMode === 'GIT' || !isEditorFreezed)
      ? set((state) => ({ showGitSyncModal: !state.showGitSyncModal }), false, 'toggleGitSyncModal')
      : () => {};
  },
  fetchAppGit: async (currentOrganizationId, currentAppVersionId) => {
    set((state) => ({ appLoading: true }), false, 'setAppLoading');

    try {
      const data = await gitSyncService.getAppGitConfigs(currentOrganizationId, currentAppVersionId);
      const allowEditing = data?.app_git?.allow_editing ?? false;

      set((state) => ({ allowEditing }), false, 'setAllowEditing');
      return allowEditing;
    } catch (error) {
      console.error('Failed to fetch app git configs:', error);
      // Set allowEditing to false on error
      set((state) => ({ allowEditing: false }), false, 'setAllowEditing');
      return false;
    } finally {
      set((state) => ({ appLoading: false }), false, 'setAppLoading');
    }
  },
});
