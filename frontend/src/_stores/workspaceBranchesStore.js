import { create, zustandDevTools } from './utils';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { gitSyncService } from '@/_services/git_sync.service';
import { getBranchNameFromUrl, setActiveBranch } from '@/_helpers/active-branch';

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
  hasUnsyncedDatasources: false,
  // When false (single-branch mode) only the default branch is available; the UI hides feature
  // branches and disables branch create / switch. Defaults to true (multi-branch).
  isMultiBranchingEnabled: true,
  // Git-sync license/configuration state, sourced from the git-sync status API (not the license
  // store). isGitSyncConfigured = a provider is connected in the workspace (license-independent).
  // isGitSyncLicensed = the git-sync license is active. When configured && !licensed the editor is
  // frozen and the config page prompts the user to turn git off. Default licensed=true so we never
  // flash a frozen state before the status has loaded.
  isGitSyncConfigured: false,
  isGitSyncLicensed: true,
};

// Reads the multi-branching flag from the list() response (snake_case via the API interceptor,
// camelCase as a fallback). Defaults to true so non-git / older responses keep multi-branch UI.
function readMultiBranchingEnabled(data) {
  return data?.is_multi_branching_enabled ?? data?.isMultiBranchingEnabled ?? true;
}

// Git-sync configured/licensed flags from the git-sync status API. Licensed defaults to true when
// there's no status yet so the editor never flashes a frozen state before the status loads.
function readGitSyncLicenseState(gitStatus) {
  return {
    isGitSyncConfigured: !!(gitStatus?.is_git_sync_configured ?? gitStatus?.isGitSyncConfigured),
    isGitSyncLicensed: gitStatus ? !!(gitStatus?.git_sync_licensed ?? gitStatus?.gitSyncLicensed) : true,
  };
}

// The git-sync STATUS endpoint can be unavailable (e.g. it 400s on an expired license on an
// un-updated server). The git CONFIG endpoint (getGitConfig) is never license-gated, so we use it
// to (a) reliably detect "a provider is connected" and (b) synthesize an orgGitConfig for the UI
// when the status payload is missing — so the dashboard still renders the git-sync UI (frozen).
function resolveGitConfigState(gitStatus, gitConfigResp) {
  const og = gitConfigResp?.organization_git || null;
  const providerConnected = !!(og?.git_https?.is_enabled || og?.git_ssh?.is_enabled || og?.git_lab?.is_enabled);

  let effectiveGitConfig = gitStatus || null;
  // Only synthesize when a provider is actually CONNECTED. A config row can exist with the provider
  // turned OFF (is_enabled=false) — in that case git sync is disabled and we must NOT render the
  // git UI, so leave orgGitConfig null.
  if (!effectiveGitConfig && og && providerConnected) {
    effectiveGitConfig = {
      id: og.id,
      git_type: og.git_type,
      repo_url: og.git_https?.https_url || og.git_ssh?.git_url || og.git_lab?.gitlab_url || '',
      default_git_branch: og.git_https?.github_branch || og.git_ssh?.git_branch || og.git_lab?.gitlab_branch || 'main',
      is_branching_enabled: og.is_branching_enabled,
      is_git_sync_configured: providerConnected,
    };
  }

  const isGitSyncConfigured =
    !!(
      gitStatus?.is_git_sync_configured ??
      gitStatus?.isGitSyncConfigured ??
      gitStatus?.isEnabled ??
      gitStatus?.is_enabled
    ) || providerConnected;

  return { effectiveGitConfig, isGitSyncConfigured };
}

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

// Resolve the active branch. The browser URL (`?branch=<name>`) is the source of truth; when
// it's absent/unknown, fall back to the server's active/default branch.
function resolveActiveBranch(branches, serverActiveBranchId) {
  if (!branches || branches.length === 0) return null;
  const urlName = getBranchNameFromUrl();
  if (urlName) {
    const byName = branches.find((b) => b.name === urlName);
    if (byName) return byName;
  }
  return resolveCurrentBranch(branches, serverActiveBranchId);
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
            const [branchData, gitStatus, gitConfigResp] = await Promise.all([
              workspaceBranchesService.list().catch(() => null),
              gitSyncService.getGitStatus(workspaceId).catch(() => null),
              gitSyncService.getGitConfig(workspaceId).catch(() => null),
            ]);

            const branches = branchData?.branches || [];
            // Git is "on" whenever a provider is CONNECTED (license-independent) — falls back to the
            // config endpoint when the status endpoint is unavailable — so a configured-but-unlicensed
            // workspace still renders the git-sync UI (branch selector, etc.), just frozen.
            const { effectiveGitConfig, isGitSyncConfigured } = resolveGitConfigState(gitStatus, gitConfigResp);
            const isGitSyncEnabled = isGitSyncConfigured;
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            // URL (`?branch=<name>`) is the source of truth; fall back to server active/default.
            const currentBranch = isGitSyncEnabled ? resolveActiveBranch(branches, serverActiveBranchId) : null;

            // Cache the id (for API calls) and reflect the name into the URL — always-show,
            // including the default branch. null clears both for non-git workspaces.
            setActiveBranch(isGitSyncEnabled ? currentBranch : null);

            set({
              branches,
              activeBranchId: isGitSyncEnabled ? currentBranch?.id || null : null,
              currentBranch: isGitSyncEnabled ? currentBranch : null,
              isMultiBranchingEnabled: readMultiBranchingEnabled(branchData),
              orgGitConfig: effectiveGitConfig,
              ...readGitSyncLicenseState(gitStatus),
              // "Configured" comes from the resolver (status OR config endpoint) so the dashboard git
              // controls + data-source lock stay consistent with the branch selector.
              isGitSyncConfigured,
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
            const serverActiveBranchId = data?.active_branch_id || data?.activeBranchId || null;
            // URL is the source of truth; fall back to server active/default.
            const currentBranch = resolveActiveBranch(branches, serverActiveBranchId);
            setActiveBranch(currentBranch);
            set({
              branches,
              activeBranchId: currentBranch?.id || null,
              currentBranch,
              isMultiBranchingEnabled: readMultiBranchingEnabled(data),
            });
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
          // Branch is tracked client-side (URL). We only ping the backend to persist this as the
          // user's last-used branch for the workspace (restored on next login) — fire-and-forget,
          // never blocks the switch.
          const branches = get().branches;
          const currentBranch = branches.find((b) => b.id === branchId) || null;
          if (currentBranch) {
            setActiveBranch(currentBranch);
          }
          set({ activeBranchId: branchId, currentBranch });
          workspaceBranchesService.switchBranch(branchId).catch(() => {
            /* best-effort last-branch persistence */
          });
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

        setHasUnsyncedDatasources(value) {
          set({ hasUnsyncedDatasources: value });
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
          setActiveBranch(null);
          set({ activeBranchId: null, currentBranch: null });
        },

        reset() {
          setActiveBranch(null);
          set(initialState);
        },

        async reinitialize(workspaceId) {
          set({ ...initialState, isLoading: true });
          try {
            const [branchData, gitStatus, gitConfigResp] = await Promise.all([
              workspaceBranchesService.list().catch(() => null),
              gitSyncService.getGitStatus(workspaceId).catch(() => null),
              gitSyncService.getGitConfig(workspaceId).catch(() => null),
            ]);

            const branches = branchData?.branches || [];
            // Git is "on" whenever a provider is CONNECTED (license-independent) — falls back to the
            // config endpoint when the status endpoint is unavailable — so a configured-but-unlicensed
            // workspace still renders the git-sync UI (branch selector, etc.), just frozen.
            const { effectiveGitConfig, isGitSyncConfigured } = resolveGitConfigState(gitStatus, gitConfigResp);
            const isGitSyncEnabled = isGitSyncConfigured;
            const serverActiveBranchId = branchData?.active_branch_id || branchData?.activeBranchId || null;
            // URL (`?branch=<name>`) is the source of truth; fall back to server active/default.
            const currentBranch = isGitSyncEnabled ? resolveActiveBranch(branches, serverActiveBranchId) : null;

            setActiveBranch(isGitSyncEnabled ? currentBranch : null);

            set({
              branches,
              activeBranchId: isGitSyncEnabled ? currentBranch?.id || null : null,
              currentBranch: isGitSyncEnabled ? currentBranch : null,
              isMultiBranchingEnabled: readMultiBranchingEnabled(branchData),
              orgGitConfig: effectiveGitConfig,
              ...readGitSyncLicenseState(gitStatus),
              // "Configured" comes from the resolver (status OR config endpoint) so the dashboard git
              // controls + data-source lock stay consistent with the branch selector.
              isGitSyncConfigured,
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
