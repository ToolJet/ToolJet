import { gitSyncService } from '@/_services';

const initialState = {
  currentBranch: null,
  allBranches: [],
  pullRequests: [],
  branchingEnabled: false,
  isDraftVersionActive: false,
  isLoadingBranches: false,
  isLoadingPRs: false,
  branchError: null,
};

export const createBranchSlice = (set, get) => ({
  ...initialState,

  /**
   * Fetch all branches for the current app
   * @param {string} appId - Application ID
   * @param {string} organizationId - Organization ID
   */
  fetchBranches: async (appId, organizationId) => {
    set(() => ({ isLoadingBranches: true, branchError: null }), false, 'fetchBranches:start');

    try {
      const response = await gitSyncService.getAllBranches(appId, organizationId);
      const branches = response?.branches || [];
      // Determine default current branch if not already set
      let defaultBranch = get().currentBranch;
      if (!defaultBranch && branches.length) {
        defaultBranch =
          branches.find((b) => b.name === 'main') || branches.find((b) => b.name === 'master') || branches[0];
      }

      set(
        () => ({
          allBranches: branches,
          isLoadingBranches: false,
          currentBranch: defaultBranch || null,
        }),
        false,
        'fetchBranches:success'
      );

      return { success: true, branches };
    } catch (error) {
      console.error('Error fetching branches:', error);
      set(
        () => ({
          isLoadingBranches: false,
          branchError: error.message || 'Failed to fetch branches',
        }),
        false,
        'fetchBranches:error'
      );

      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new branch
   * @param {string} appId - Application ID
   * @param {string} organizationId - Organization ID
   * @param {object} branchData - { branchName, versionFromId, baseBranch, autoCommit }
   */
  createBranch: async (appId, organizationId, branchData) => {
    set(() => ({ branchError: null }), false, 'createBranch:start');

    // Check for draft version before creating
    const isDraft = get().checkDraftStatus();
    if (isDraft && !branchData.force) {
      return {
        success: false,
        error: 'DRAFT_EXISTS',
        message: 'You can only have one draft version at a time. Please save or release your current draft first.',
      };
    }

    try {
      const response = await gitSyncService.createBranch(appId, organizationId, {
        branchName: branchData.branchName,
        versionFromId: branchData.versionFromId,
        baseBranch: branchData.baseBranch || 'main', // Default to 'main' if not provided
        autoCommit: branchData.autoCommit || false,
      });

      // Refresh branches list after creation
      await get().fetchBranches(appId, organizationId);

      // Update current branch if successful
      if (response?.branch) {
        set(
          () => ({
            currentBranch: response.branch,
          }),
          false,
          'createBranch:success'
        );
      }

      return { success: true, branch: response?.branch };
    } catch (error) {
      console.error('Error creating branch:', error);
      set(
        () => ({
          branchError: error.message || 'Failed to create branch',
        }),
        false,
        'createBranch:error'
      );

      return { success: false, error: error.message };
    }
  },

  /**
   * Switch to a different branch (pulls commits from that branch)
   * @param {string} appId - Application ID
   * @param {string} branchName - Target branch name
   */
  switchBranch: async (appId, branchName) => {
    set(() => ({ branchError: null }), false, 'switchBranch:start');

    try {
      // Call auto-save before switching (handled by componentsSlice)
      const componentsSlice = get();
      if (componentsSlice.saveComponentChanges) {
        await componentsSlice.saveComponentChanges();
      }

      // Pull commits from target branch
      const response = await gitSyncService.switchBranch(appId, branchName);

      // Update current branch
      const targetBranch = get().allBranches.find((b) => b.name === branchName);
      set(
        () => ({
          currentBranch: targetBranch || { name: branchName },
        }),
        false,
        'switchBranch:success'
      );

      return { success: true, data: response };
    } catch (error) {
      console.error('Error switching branch:', error);
      set(
        () => ({
          branchError: error.message || 'Failed to switch branch',
        }),
        false,
        'switchBranch:error'
      );

      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch pull requests for the current app
   * @param {string} appId - Application ID
   */
  fetchPullRequests: async (appId) => {
    set(() => ({ isLoadingPRs: true, branchError: null }), false, 'fetchPullRequests:start');

    try {
      const response = await gitSyncService.getPullRequests(appId);
      const pullRequests = response?.pull_requests || [];

      set(
        () => ({
          pullRequests,
          isLoadingPRs: false,
        }),
        false,
        'fetchPullRequests:success'
      );

      return { success: true, pullRequests };
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      set(
        () => ({
          isLoadingPRs: false,
          branchError: error.message || 'Failed to fetch pull requests',
        }),
        false,
        'fetchPullRequests:error'
      );

      return { success: false, error: error.message };
    }
  },

  /**
   * Check if a draft version is currently active
   * @returns {boolean} True if draft version exists
   */
  checkDraftStatus: () => {
    const appVersions = get().appVersions || [];
    const hasDraft = appVersions.some((version) => version.isDraft || version.is_draft);

    set(
      () => ({
        isDraftVersionActive: hasDraft,
      }),
      false,
      'checkDraftStatus'
    );

    return hasDraft;
  },

  /**
   * Update branching enabled status
   * @param {boolean} enabled - Whether branching is enabled
   */
  updateBranchingEnabled: (enabled) =>
    set(
      () => ({
        branchingEnabled: enabled,
      }),
      false,
      'updateBranchingEnabled'
    ),

  /**
   * Set current branch
   * @param {object} branch - Branch object
   */
  setCurrentBranch: (branch) =>
    set(
      () => ({
        currentBranch: branch,
      }),
      false,
      'setCurrentBranch'
    ),

  /**
   * Clear branch error
   */
  clearBranchError: () =>
    set(
      () => ({
        branchError: null,
      }),
      false,
      'clearBranchError'
    ),

  /**
   * Reset branch slice to initial state
   */
  resetBranchSlice: () =>
    set(
      () => ({
        ...initialState,
      }),
      false,
      'resetBranchSlice'
    ),

  /**
   * Get PR status for a specific branch
   * @param {string} branchName - Branch name
   * @returns {object|null} PR object or null
   */
  getPRForBranch: (branchName) => {
    const pullRequests = get().pullRequests;
    return pullRequests.find((pr) => pr.source_branch === branchName || pr.sourceBranch === branchName) || null;
  },

  /**
   * Check if branch is readonly (merged or released)
   * @param {string} branchName - Branch name
   * @returns {boolean} True if branch is readonly
   */
  isBranchReadonly: (branchName) => {
    const branch = get().allBranches.find((b) => b.name === branchName);
    if (!branch) return false;

    return branch.is_merged || branch.isMerged || branch.is_released || branch.isReleased || false;
  },
});
