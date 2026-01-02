import useStore from '@/AppBuilder/_stores/store';
import { gitSyncService } from '@/_services';
import { useAppDataStore } from '@/_stores/appDataStore';
const initialState = {
  showGitSyncModal: false,
  allowEditing: false,
  appLoading: false,
  orgGit: null,
  appGit: null,
};
export const createGitSyncSlice = (set, get) => ({
  ...initialState,
  toggleGitSyncModal: (creationMode) => {
    const featureAccess = useStore.getState()?.license?.featureAccess;
    const selectedEnvironment = useStore.getState()?.selectedEnvironment;
    const isEditorFreezed = useStore.getState()?.isEditorFreezed;

    return featureAccess?.gitSync && selectedEnvironment?.priority === 1
      ? set((state) => ({ showGitSyncModal: !state.showGitSyncModal }), false, 'toggleGitSyncModal')
      : () => {};
  },
  fetchAppGit: async (currentOrganizationId, currentAppVersionId) => {
    set((state) => ({ appLoading: true }), false, 'setAppLoading');

    try {
      const data = await gitSyncService.getAppGitConfigs(currentOrganizationId, currentAppVersionId);
      const allowEditing = data?.app_git?.allow_editing ?? false;
      const orgGit = data?.app_git?.org_git;
      const appGit = data?.app_git;
      const isBranchingEnabled = orgGit?.is_branching_enabled ?? false;

      set((state) => ({ orgGit }), false, 'setOrgGit');
      set((state) => ({ appGit }), false, 'setAppGit');
      set((state) => ({ allowEditing }), false, 'setAllowEditing');

      // Update branchingEnabled in branchSlice
      get().updateBranchingEnabled?.(isBranchingEnabled);

      return allowEditing;
    } catch (error) {
      console.error('Failed to fetch app git configs:', error);
      // Set allowEditing to false on error
      set((state) => ({ allowEditing: false }), false, 'setAllowEditing');
      // Also reset branching on error
      get().updateBranchingEnabled?.(false);
      return false;
    } finally {
      set((state) => ({ appLoading: false }), false, 'setAppLoading');
    }
  },
});
