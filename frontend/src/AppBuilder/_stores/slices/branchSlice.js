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
   * Switch to a different branch (changes the editing version to the branch version)
   * Branches are represented as versions with versionType === 'branch'
   * @param {string} appId - Application ID
   * @param {string} branchName - Target branch name
   */
  switchBranch: async (appId, branchName) => {
    set(() => ({ branchError: null }), false, 'switchBranch:start');

    try {
      const state = get();

      // Debug: Log available data
      console.log('switchBranch - branchName:', branchName);
      console.log('switchBranch - allBranches:', state.allBranches);
      console.log('switchBranch - appVersions:', state.appVersions);
      console.log('switchBranch - versionsPromotedToEnvironment:', state.versionsPromotedToEnvironment);

      // Try to find the version in appVersions first (includes all versions, even drafts)
      const allVersions = state.appVersions || [];
      const branchVersionFromAll = allVersions.find(
        (version) =>
          (version.versionType === 'branch' || version.version_type === 'branch') && version.name === branchName
      );

      console.log('switchBranch - branchVersionFromAll:', branchVersionFromAll);

      // Fallback: check in versionsPromotedToEnvironment for non-draft versions
      let targetVersion = branchVersionFromAll;

      if (!branchVersionFromAll) {
        const versionsPromotedToEnvironment = state.versionsPromotedToEnvironment || [];
        const branchVersions = versionsPromotedToEnvironment.filter((v) => v.versionType === 'branch');
        const branchVersion = branchVersions.find((version) => version.name === branchName);

        console.log('switchBranch - branchVersions (filtered):', branchVersions);
        console.log('switchBranch - found branchVersion in promoted:', branchVersion);

        if (!branchVersion) {
          // Check if branch exists in allBranches but not as a version
          const branchExists = state.allBranches.find((b) => b.name === branchName);
          if (branchExists) {
            throw new Error(
              `Branch "${branchName}" exists in Git but has no corresponding version. You may need to create this branch in ToolJet first.`
            );
          }

          throw new Error(
            `Branch version not found: ${branchName}. Available branch versions: ${branchVersions
              .map((v) => v.name)
              .join(', ')}`
          );
        }

        targetVersion = branchVersion;
      }

      // Use changeEditorVersionAction to switch to the branch version
      // This is the same way the version dropdown switches versions
      return new Promise((resolve, reject) => {
        state.changeEditorVersionAction(
          appId,
          targetVersion.id,
          (data) => {
            console.log('switchBranch - changeEditorVersionAction success:', data);

            // Update current branch in state
            const targetBranch = state.allBranches.find((b) => b.name === branchName);

            // changeEditorVersionAction will update selectedVersion with data from API
            // We just need to update the currentBranch
            set(
              (state) => ({
                ...state,
                currentBranch: targetBranch || { name: branchName },
              }),
              false,
              'switchBranch:success'
            );

            resolve({ success: true, data });
          },
          (error) => {
            console.error('switchBranch - changeEditorVersionAction error:', error);
            set(
              () => ({
                branchError: error.message || 'Failed to switch branch',
              }),
              false,
              'switchBranch:error'
            );
            reject({ success: false, error: error.message });
          }
        );
      });
    } catch (error) {
      console.error('Error switching branch:', error);
      set(
        () => ({
          branchError: error.message || 'Failed to switch branch',
        }),
        false,
        'switchBranch:error'
      );

      throw error; // Re-throw to be caught by the modal
    }
  },

  /**
   * Switch to the default branch (main/master/configured branch)
   *
   * This function mimics the behavior of the version dropdown's handleVersionSelect (line 144):
   * 1. Switch to Development environment first (if not already there)
   * 2. Determine which version to switch to based on PRD scenarios
   * 3. Call changeEditorVersionAction to load version data
   * 4. Update currentBranch and selectedVersion
   *
   * Version Selection Logic (Based on PRD Scenarios):
   * PRIORITY 1: DRAFT version (latest draft if multiple exist - v3 draft > v2.1 draft)
   * PRIORITY 2: RELEASED version (latest released - v2 > v1)
   * PRIORITY 3: PUBLISHED/Saved version (latest published)
   *
   * @param {string} appId - Application ID
   * @param {string} defaultBranchName - Name of the default branch (from git config)
   */
  switchToDefaultBranch: async (appId, defaultBranchName) => {
    set(() => ({ branchError: null }), false, 'switchToDefaultBranch:start');

    try {
      const state = get();

      console.log('switchToDefaultBranch - defaultBranchName:', defaultBranchName);
      console.log('switchToDefaultBranch - currentEnvironment:', state.selectedEnvironment);

      // Get all branch names to filter out branch versions
      const branchNames = state.allBranches.map((b) => b.name);

      // Branches always work in Development environment - ALWAYS use developmentVersions
      // This matches the PRD scenarios where all branch work happens in Development
      const developmentVersions = state.developmentVersions || [];
      console.log('switchToDefaultBranch - developmentVersions:', developmentVersions);

      // Filter to get ONLY default branch versions (exclude branch-type versions)
      const defaultBranchVersions = developmentVersions.filter((v) => {
        const hasBranchType = v.versionType === 'branch' || v.version_type === 'branch';
        const nameMatchesBranch = branchNames.includes(v.name) && v.name !== defaultBranchName;
        return !hasBranchType && !nameMatchesBranch;
      });

      console.log('switchToDefaultBranch - defaultBranchVersions:', defaultBranchVersions);

      // Version selection priority (PRD Scenarios 1-4)
      let targetVersion = null;

      // PRIORITY 1: DRAFT version (Scenarios 1, 2, 3, 4)
      // Get LATEST draft (most recently created) if multiple exist
      const draftVersions = defaultBranchVersions
        .filter((v) => v.status === 'DRAFT' || v.isDraft || v.is_draft)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          return dateB - dateA; // Descending - latest first
        });

      targetVersion = draftVersions[0];
      console.log('switchToDefaultBranch - found draftVersion:', targetVersion);

      // PRIORITY 2: RELEASED version (Scenario 2 - when no draft exists after v1 released)
      if (!targetVersion) {
        console.log('switchToDefaultBranch - no draft found, looking for released versions');
        const releasedVersions = defaultBranchVersions
          .filter((v) => v.status === 'RELEASED' || v.isReleased || v.is_released)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA; // Latest released
          });

        targetVersion = releasedVersions[0];
        console.log('switchToDefaultBranch - found releasedVersion:', targetVersion);
      }

      // PRIORITY 3: PUBLISHED version (fallback)
      if (!targetVersion) {
        console.log('switchToDefaultBranch - no released found, looking for published versions');
        const publishedVersions = defaultBranchVersions
          .filter((v) => v.status === 'PUBLISHED' || v.isPublished || v.is_published)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA;
          });

        targetVersion = publishedVersions[0];
        console.log('switchToDefaultBranch - found publishedVersion:', targetVersion);
      }

      // If no version found, error
      if (!targetVersion) {
        console.error('switchToDefaultBranch - no versions found!');
        console.error('switchToDefaultBranch - developmentVersions:', developmentVersions);
        console.error('switchToDefaultBranch - defaultBranchVersions:', defaultBranchVersions);
        throw new Error('No versions found for the default branch. Please create a version first.');
      }

      console.log('switchToDefaultBranch - targetVersion to switch to:', targetVersion);

      // Get Development environment
      const developmentEnv = state.environments?.find((env) => env.name === 'Development' || env.priority === 1);
      if (!developmentEnv) {
        throw new Error('Development environment not found');
      }

      // Check if already on this version AND in Development environment
      const alreadyOnVersion = state.selectedVersion?.id === targetVersion.id;
      const alreadyInDevelopment = state.selectedEnvironment?.id === developmentEnv.id;

      if (alreadyOnVersion && alreadyInDevelopment) {
        console.log('switchToDefaultBranch - already on target version in Development, just updating branch');

        const defaultBranch = state.allBranches.find((b) => b.name === defaultBranchName) || {
          name: defaultBranchName,
        };

        set(
          (state) => ({
            ...state,
            currentBranch: defaultBranch,
          }),
          false,
          'switchToDefaultBranch:already-on-version'
        );

        return { success: true, data: state.selectedVersion, version: targetVersion };
      }

      // Update current branch first
      const defaultBranch = state.allBranches.find((b) => b.name === defaultBranchName) || {
        name: defaultBranchName,
      };

      set(
        (state) => ({
          ...state,
          currentBranch: defaultBranch,
        }),
        false,
        'switchToDefaultBranch:updating-branch'
      );

      // EXACTLY MATCH handleVersionSelect behavior (line 144 in VersionManagerDropdown.jsx)
      return new Promise((resolve, reject) => {
        // If not in Development environment, switch to it first (like handleVersionSelect does)
        if (!alreadyInDevelopment) {
          console.log('switchToDefaultBranch - switching to Development environment first');
          state.environmentChangedAction(developmentEnv, () => {
            // After environment switch, change the version
            state.changeEditorVersionAction(
              appId,
              targetVersion.id,
              (data) => {
                console.log('switchToDefaultBranch - version switched after environment change');
                state.setCurrentVersionId(targetVersion.id);
                resolve({ success: true, data, version: targetVersion });
              },
              (error) => {
                console.error('switchToDefaultBranch - error after environment change:', error);
                set(
                  () => ({ branchError: error.message || 'Failed to switch version' }),
                  false,
                  'switchToDefaultBranch:error'
                );
                reject({ success: false, error: error.message });
              }
            );
          });
        } else {
          // Already in Development, just switch version (like handleVersionSelect does)
          console.log('switchToDefaultBranch - already in Development, switching version');
          state.changeEditorVersionAction(
            appId,
            targetVersion.id,
            (data) => {
              console.log('switchToDefaultBranch - version switched');
              state.setCurrentVersionId(targetVersion.id);
              state.setSelectedVersion(targetVersion);
              resolve({ success: true, data, version: targetVersion });
            },
            (error) => {
              console.error('switchToDefaultBranch - error switching version:', error);
              set(
                () => ({ branchError: error.message || 'Failed to switch version' }),
                false,
                'switchToDefaultBranch:error'
              );
              reject({ success: false, error: error.message });
            }
          );
        }
      });
    } catch (error) {
      console.error('Error switching to default branch:', error);
      set(
        () => ({
          branchError: error.message || 'Failed to switch to default branch',
        }),
        false,
        'switchToDefaultBranch:error'
      );

      throw error;
    }
  },

  /**
   * Fetch pull requests for the current app
   * @param {string} appId - Application ID
   */
  fetchPullRequests: async (appId, organizationId) => {
    set(() => ({ isLoadingPRs: true, branchError: null }), false, 'fetchPullRequests:start');

    try {
      const response = await gitSyncService.getPullRequests(appId, organizationId);
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
