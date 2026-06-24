import { create, zustandDevTools } from './utils';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { gitSyncService } from '@/_services/git_sync.service';
import {
  getActiveBranch,
  setActiveBranch,
  cleanupStaleBranchKeys,
  registerBranchFocusSync,
  unregisterBranchFocusSync,
} from '@/_helpers/active-branch';

const initialState = {
  branches: [],
  activeBranchId: null,
  currentBranch: null,
  isLoading: false,
  isInitialized: false,
  orgGitConfig: null,
  isPushing: false,
  isPulling: false,
  pullingModuleComponentId: null,
  remoteBranches: [],
  visibleCount: 10,
  hasMoreRemote: false,
  isDeletingBranch: false,
  deleteBranchError: null,
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
          // Remove stale tj_active_branch_* keys from other orgs / migration dumps
          cleanupStaleBranchKeys();
          try {
            const [branchData, gitStatus] = await Promise.all([
              workspaceBranchesService.list().catch(() => null),
              gitSyncService.getGitStatus(workspaceId).catch(() => null),
            ]);

            const branches = branchData?.branches || [];
            const isGitSyncEnabled = !!(gitStatus?.isEnabled ?? gitStatus?.is_enabled);
            // Prefer sessionStorage branch over server-returned activeBranchId
            const storedBranch = isGitSyncEnabled ? getActiveBranch() : null;
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            const effectiveActiveBranchId = isGitSyncEnabled ? storedBranch?.id || serverActiveBranchId : null;
            const currentBranch = isGitSyncEnabled ? resolveCurrentBranch(branches, effectiveActiveBranchId) : null;

            if (isGitSyncEnabled) {
              if (currentBranch) setActiveBranch(currentBranch);
              registerBranchFocusSync();
            } else {
              unregisterBranchFocusSync();
              setActiveBranch(null);
            }

            set({
              branches,
              activeBranchId: isGitSyncEnabled ? currentBranch?.id || effectiveActiveBranchId : null,
              currentBranch: isGitSyncEnabled ? currentBranch : null,
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
            // Prefer sessionStorage branch over server default
            const storedBranch = getActiveBranch();
            const serverActiveBranchId = data?.active_branch_id || data?.activeBranchId || null;
            const effectiveActiveBranchId = storedBranch?.id || serverActiveBranchId;
            const currentBranch = resolveCurrentBranch(branches, effectiveActiveBranchId);
            set({ branches, activeBranchId: currentBranch?.id || effectiveActiveBranchId, currentBranch });
          } catch (error) {
            console.error('Failed to fetch branches:', error);
          }
        },

        async createBranch(name, sourceBranchId, commitSha) {
          const newBranch = await workspaceBranchesService.create(name, sourceBranchId, commitSha);
          await get().actions.fetchBranches();
          return newBranch;
        },

        async switchBranch(branchId) {
          // No longer calling backend — branch is tracked client-side only
          const branches = get().branches;
          const currentBranch = branches.find((b) => b.id === branchId) || null;
          if (currentBranch) {
            setActiveBranch(currentBranch);
          }
          set({ activeBranchId: branchId, currentBranch });
        },

        async deleteBranch(branchId) {
          await workspaceBranchesService.deleteBranch(branchId);
          await get().actions.fetchBranches();
        },

        async deleteWorkspaceBranch(branchId) {
          set({ isDeletingBranch: true, deleteBranchError: null });
          try {
            await workspaceBranchesService.deleteBranch(branchId);
            set({ isDeletingBranch: false });
            return { success: true };
          } catch (err) {
            const message = err?.error || err?.message || 'Failed to delete branch';
            set({ isDeletingBranch: false, deleteBranchError: message });
            throw err;
          }
        },

        async pushWorkspace(commitMessage, targetBranch, options = {}, scope) {
          set({ isPushing: true });
          try {
            const branchId = get().activeBranchId;
            const result = await workspaceBranchesService.pushWorkspace(commitMessage, targetBranch, branchId, {
              ...options,
              ...(scope && { scope }),
            });
            set({ isPushing: false });
            return result;
          } catch (error) {
            set({ isPushing: false });
            throw error;
          }
        },

        async pullWorkspace(sourceBranch, targetBranchId) {
          set({ isPulling: true });
          try {
            const branchId = targetBranchId || get().activeBranchId;
            const result = await workspaceBranchesService.pullWorkspace(sourceBranch, branchId);
            set({ isPulling: false });
            return result;
          } catch (error) {
            set({ isPulling: false });
            throw error;
          }
        },

        async pullApp(appId, tagSha, tagName, tagDescription) {
          set({ isPulling: true });
          try {
            const branchId = get().activeBranchId;
            const result = await workspaceBranchesService.pullApp(appId, branchId, tagSha, tagName, tagDescription);
            set({ isPulling: false });
            return result;
          } catch (error) {
            set({ isPulling: false });
            throw error;
          }
        },

        async pullModule(moduleId, tagSha, tagName, tagDescription) {
          set({ isPulling: true });
          try {
            const branchId = get().activeBranchId;
            const result = await workspaceBranchesService.pullModule(
              moduleId,
              tagSha,
              tagName,
              tagDescription,
              branchId
            );
            set({ isPulling: false });
            return result;
          } catch (error) {
            set({ isPulling: false });
            throw error;
          }
        },

        setPullingModuleComponentId(componentId) {
          set({ pullingModuleComponentId: componentId ?? null });
        },

        async fetchRemoteBranches() {
          try {
            const result = await workspaceBranchesService.listRemoteBranches();
            const branches = result?.branches || [];
            set({
              remoteBranches: branches,
              visibleCount: 10,
              hasMoreRemote: branches.length > 10,
            });
            return branches;
          } catch (error) {
            console.error('Failed to fetch remote branches:', error);
            return [];
          }
        },

        loadMoreRemoteBranches() {
          const { remoteBranches, visibleCount } = get();
          const newCount = visibleCount + 10;
          set({ visibleCount: newCount, hasMoreRemote: newCount < remoteBranches.length });
        },

        async checkForUpdates(branch) {
          return await workspaceBranchesService.checkForUpdates(branch);
        },

        checkBranchExistsOnRemote(branchName) {
          // Full list is already in store — check DB branches first, then remote
          if (get().branches.some((b) => b.name === branchName)) return true;
          return get().remoteBranches.some((b) => b.name === branchName);
        },

        resetRemoteBranches() {
          set({ remoteBranches: [], visibleCount: 10, hasMoreRemote: false });
        },

        resetDeleteState() {
          set({ isDeletingBranch: false, deleteBranchError: null });
        },

        clearActiveBranchContext() {
          unregisterBranchFocusSync();
          setActiveBranch(null);
          set({ activeBranchId: null, currentBranch: null });
        },

        reset() {
          unregisterBranchFocusSync();
          setActiveBranch(null);
          set(initialState);
        },

        async reinitialize(workspaceId) {
          set({ ...initialState, isLoading: true });
          try {
            const [branchData, gitStatus] = await Promise.all([
              workspaceBranchesService.list().catch(() => null),
              gitSyncService.getGitStatus(workspaceId).catch(() => null),
            ]);

            const branches = branchData?.branches || [];
            const isGitSyncEnabled = !!(gitStatus?.isEnabled ?? gitStatus?.is_enabled);
            const storedBranch = isGitSyncEnabled ? getActiveBranch() : null;
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            const effectiveActiveBranchId = isGitSyncEnabled ? storedBranch?.id || serverActiveBranchId : null;
            const currentBranch = isGitSyncEnabled ? resolveCurrentBranch(branches, effectiveActiveBranchId) : null;

            if (isGitSyncEnabled) {
              if (currentBranch) setActiveBranch(currentBranch);
              registerBranchFocusSync();
            } else {
              unregisterBranchFocusSync();
              setActiveBranch(null);
            }

            set({
              branches,
              activeBranchId: isGitSyncEnabled ? currentBranch?.id || effectiveActiveBranchId : null,
              currentBranch: isGitSyncEnabled ? currentBranch : null,
              orgGitConfig: gitStatus,
              isLoading: false,
              isInitialized: true,
            });
          } catch (error) {
            set({ isLoading: false, isInitialized: true });
          }
        },
      },
    }),
    { name: 'Workspace Branches' }
  )
);
