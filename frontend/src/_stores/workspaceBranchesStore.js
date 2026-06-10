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
  remoteBranches: [],
  remoteCursor: null,
  hasMoreRemote: false,
  isLoadingMore: false,
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
            // Prefer sessionStorage branch over server-returned activeBranchId
            const storedBranch = getActiveBranch();
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            const effectiveActiveBranchId = storedBranch?.id || serverActiveBranchId;
            const currentBranch = resolveCurrentBranch(branches, effectiveActiveBranchId);

            // Persist resolved branch to sessionStorage
            if (currentBranch) {
              setActiveBranch(currentBranch);
            }

            registerBranchFocusSync();
            set({
              branches,
              activeBranchId: currentBranch?.id || effectiveActiveBranchId,
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

        async pushWorkspace(commitMessage, targetBranch, options = {}) {
          set({ isPushing: true });
          try {
            const branchId = get().activeBranchId;
            const result = await workspaceBranchesService.pushWorkspace(commitMessage, targetBranch, branchId, options);
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
            const branchId = get().activeBranchId;
            const result = await workspaceBranchesService.pullWorkspace(sourceBranch, branchId);
            set({ isPulling: false });
            return result;
          } catch (error) {
            set({ isPulling: false });
            throw error;
          }
        },

        async fetchRemoteBranches() {
          try {
            const result = await workspaceBranchesService.listRemoteBranches(10, null);
            const branches = result?.branches || [];
            set({
              remoteBranches: branches,
              remoteCursor: result?.nextCursor || null,
              hasMoreRemote: result?.hasMore || false,
            });
            return branches;
          } catch (error) {
            console.error('Failed to fetch remote branches:', error);
            return [];
          }
        },

        async loadMoreRemoteBranches() {
          const cursor = get().remoteCursor;
          if (!cursor || get().isLoadingMore) return;
          set({ isLoadingMore: true });
          try {
            const result = await workspaceBranchesService.listRemoteBranches(10, cursor);
            const newBranches = result?.branches || [];
            const existingIds = new Set(get().remoteBranches.map((b) => b.id));
            const uniqueNew = newBranches.filter((b) => !existingIds.has(b.id));
            set({
              remoteBranches: [...get().remoteBranches, ...uniqueNew],
              remoteCursor: result?.nextCursor || null,
              hasMoreRemote: result?.hasMore || false,
              isLoadingMore: false,
            });
          } catch (error) {
            console.error('Failed to load more remote branches:', error);
            set({ isLoadingMore: false });
          }
        },

        async checkForUpdates(branch) {
          return await workspaceBranchesService.checkForUpdates(branch);
        },

        async checkBranchExistsOnRemote(branchName) {
          if (get().branches.some((b) => b.name === branchName)) return true;
          // Not in DB — GitHub-only branch. Check remote sample.
          const loaded = get().remoteBranches;
          if (loaded.some((b) => b.name === branchName)) return true;
          const result = await workspaceBranchesService.listRemoteBranches(10, null);
          return (result?.branches || []).some((b) => b.name === branchName);
        },

        resetRemoteBranches() {
          set({ remoteBranches: [], remoteCursor: null, hasMoreRemote: false });
        },
        ensureActiveBranchVisible() {
          const { activeBranchId, branches, remoteBranches, remoteCursor } = get();
          if (!activeBranchId) return;
          const isInList = remoteBranches.some((b) => b.id === activeBranchId);
          if (isInList) return;
          const activeBranch = branches.find((b) => b.id === activeBranchId);
          if (!activeBranch) return;

          const PAGE_SIZE = 10;
          if (remoteBranches.length < PAGE_SIZE) {
            // Fewer than 10 returned (small repo) — just append, total stays ≤ 10
            set({ remoteBranches: [...remoteBranches, { ...activeBranch, lastCommitAt: null }] });
          } else {
            const trimmed = remoteBranches.slice(0, PAGE_SIZE - 1);
            set({ remoteBranches: [...trimmed, { ...activeBranch, lastCommitAt: null }] });
          }
        },

        resetDeleteState() {
          set({ isDeletingBranch: false, deleteBranchError: null });
        },

        reset() {
          unregisterBranchFocusSync();
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
            const storedBranch = getActiveBranch();
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            const effectiveActiveBranchId = storedBranch?.id || serverActiveBranchId;
            const currentBranch = resolveCurrentBranch(branches, effectiveActiveBranchId);

            // Persist resolved branch to sessionStorage
            if (currentBranch) {
              setActiveBranch(currentBranch);
            }

            registerBranchFocusSync();
            set({
              branches,
              activeBranchId: currentBranch?.id || effectiveActiveBranchId,
              currentBranch,
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
