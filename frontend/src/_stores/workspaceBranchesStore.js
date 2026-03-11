import { create, zustandDevTools } from './utils';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { gitSyncService } from '@/_services/git_sync.service';

const initialState = {
  branches: [],
  activeBranchId: null,
  currentBranch: null,
  isLoading: false,
  isInitialized: false,
  orgGitConfig: null,
  isPushing: false,
  isPulling: false,
  remoteBranches: [],
};

// Helper to resolve current branch from branches list + active ID
function resolveCurrentBranch(branches, activeBranchId) {
  if (!branches || branches.length === 0) return null;
  // Try matching by activeBranchId
  if (activeBranchId) {
    const match = branches.find((b) => b.id === activeBranchId);
    if (match) return match;
  }
  // Fallback: find the default branch
  const defaultBranch = branches.find((b) => b.is_default || b.isDefault);
  if (defaultBranch) return defaultBranch;
  // Ultimate fallback: first branch
  return branches[0] || null;
}

export const useWorkspaceBranchesStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,

      actions: {
        async initialize(workspaceId) {
          if (get().isInitialized) return;
          set({ isLoading: true });
          try {
            const [branchData, gitStatus] = await Promise.all([
              workspaceBranchesService.list().catch(() => null),
              gitSyncService.getGitStatus(workspaceId).catch(() => null),
            ]);

            const branches = branchData?.branches || [];
            const activeBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            const currentBranch = resolveCurrentBranch(branches, activeBranchId);

            set({
              branches,
              activeBranchId: currentBranch?.id || activeBranchId,
              currentBranch,
              orgGitConfig: gitStatus,
              isLoading: false,
              isInitialized: true,
            });
          } catch (error) {
            set({ isLoading: false, isInitialized: true });
          }
        },

        async fetchBranches() {
          try {
            const data = await workspaceBranchesService.list();
            const branches = data?.branches || [];
            const activeBranchId = data?.active_branch_id || data?.activeBranchId || null;
            const currentBranch = resolveCurrentBranch(branches, activeBranchId);
            set({ branches, activeBranchId: currentBranch?.id || activeBranchId, currentBranch });
          } catch (error) {
            console.error('Failed to fetch branches:', error);
          }
        },

        async createBranch(name, sourceBranchId) {
          const newBranch = await workspaceBranchesService.create(name, sourceBranchId);
          await get().actions.fetchBranches();
          return newBranch;
        },

        async switchBranch(branchId) {
          await workspaceBranchesService.switchBranch(branchId);
          const branches = get().branches;
          const currentBranch = branches.find((b) => b.id === branchId) || null;
          set({ activeBranchId: branchId, currentBranch });
        },

        async deleteBranch(branchId) {
          await workspaceBranchesService.deleteBranch(branchId);
          await get().actions.fetchBranches();
        },

        async pushWorkspace(commitMessage, targetBranch) {
          set({ isPushing: true });
          try {
            const result = await workspaceBranchesService.pushWorkspace(commitMessage, targetBranch);
            set({ isPushing: false });
            return result;
          } catch (error) {
            set({ isPushing: false });
            throw error;
          }
        },

        async pullWorkspace(sourceBranch) {
          set({ isPulling: true });
          try {
            const result = await workspaceBranchesService.pullWorkspace(sourceBranch);
            set({ isPulling: false });
            return result;
          } catch (error) {
            set({ isPulling: false });
            throw error;
          }
        },

        async fetchRemoteBranches() {
          try {
            const result = await workspaceBranchesService.listRemoteBranches();
            set({ remoteBranches: result || [] });
            return result || [];
          } catch (error) {
            console.error('Failed to fetch remote branches:', error);
            return [];
          }
        },

        async checkForUpdates(branch) {
          try {
            const result = await workspaceBranchesService.checkForUpdates(branch);
            return result;
          } catch (error) {
            throw error;
          }
        },

        reset() {
          set(initialState);
        },
      },
    }),
    { name: 'Workspace Branches' }
  )
);
