import useStore from '@/AppBuilder/_stores/store';
import { gitSyncService } from '@/_services';

// allowEditing is always true post-app_git_sync teardown — workspace-level git sync
// considers every app in a git-enabled org editable on feature branches. The freeze
// logic now relies on version type/status + branching state on the server side.
const initialState = {
  showGitSyncModal: false,
  allowEditing: true,
  appLoading: false,
  orgGit: null,
  appGit: null,
  isGitSyncConfigured: false,
};
export const createGitSyncSlice = (set, get) => ({
  ...initialState,
  toggleGitSyncModal: () => {
    const featureAccess = useStore.getState()?.license?.featureAccess;
    if (!featureAccess?.gitSync) return;
    set((state) => ({ showGitSyncModal: !state.showGitSyncModal }), false, 'toggleGitSyncModal');
  },
  fetchAppGit: async (currentOrganizationId, currentAppVersionId) => {
    set((state) => ({ appLoading: true }), false, 'setAppLoading');
    try {
      const data = await gitSyncService.getAppGitConfigs(currentOrganizationId, currentAppVersionId);
      const orgGit = data?.app_git?.org_git;
      const isBranchingEnabled = orgGit?.is_branching_enabled ?? false;
      const appGit = data?.app_git;
      const isGitSyncConfigured = data?.app_git?.is_git_sync_configured;
      get().updateBranchingEnabled?.(isBranchingEnabled);
      set((state) => ({ isGitSyncConfigured }), false, 'isGitSyncConfigured');
      set((state) => ({ orgGit }), false, 'setOrgGit');
      set((state) => ({ appGit }), false, 'setAppGit');
      return true;
    } catch (error) {
      console.error('Failed to fetch app git configs:', error);
      get().updateBranchingEnabled?.(false);
      return false;
    } finally {
      set((state) => ({ appLoading: false }), false, 'setAppLoading');
    }
  },
  setAppGit(appGit) {
    set((state) => ({ appGit: appGit }), false, 'setAppGit');
  },
});
