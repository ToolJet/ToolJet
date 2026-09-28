const initialState = {
  editingVersion: null,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
  isVersionReleased: false,
  isEditorFreezed: false,
  // Git sync is configured but not covered by the current license — freezes the whole editor
  // until the user turns git off. Synced from useGitSyncConfig (git-sync status API).
  isGitSyncLicenseLocked: false,
  isBannerMandatory: false,
  appVersions: [],
  isAppVersionPromoted: false,
  currentAppVersionEnvironment: null,
  restoredAppHistoryId: null, // Used to trigger app refresh flow after restoring app history
  restoreTimestamp: null, // Timestamp to ensure re-fetch even when restoring to same entry twice
  isEditorReadOnly: false, // module opened in Build-with (view-only) mode
  hotReloadTimestamp: null, // Timestamp to re-fetch the app in place (canvas-only loader, stays on current page)
};

export const createAppVersionSlice = (set, get) => ({
  ...initialState,

  updateEditingVersion: (version) =>
    set(
      () => ({
        editingVersion: version,
        isVersionReleased: get().releasedVersionId === version?.id,
      }),
      false,
      'updateEditingVersion'
    ),

  enableReleasedVersionPopupState: () =>
    set(() => ({ isUserEditingTheVersion: true }), false, 'enableReleasedVersionPopupState'),

  disableReleasedVersionPopupState: () =>
    set(() => ({ isUserEditingTheVersion: false }), false, 'disableReleasedVersionPopupState'),

  updateReleasedVersionId: (versionId) =>
    set(
      () => ({
        releasedVersionId: versionId,
        isVersionReleased: get().editingVersion?.id ? get().editingVersion?.id === versionId : false,
      }),
      false,
      'updateReleasedVersionId'
    ),

  onEditorFreeze: (value = false, isBannerMandatory = true) =>
    set(() => ({ isEditorFreezed: value, isBannerMandatory }), false, 'onEditorFreeze'),

  setIsEditorFreezed: (value = false) =>
    set(
      (state) => {
        state.isEditorFreezed = value;
      },
      false,
      'setIsEditorFreezed'
    ),

  setGitSyncLicenseLocked: (value = false) =>
    set(
      (state) => {
        state.isGitSyncLicenseLocked = value;
      },
      false,
      'setGitSyncLicenseLocked'
    ),

  setIsEditorReadOnly: (value = false) =>
    set(
      (state) => {
        state.isEditorReadOnly = value;
      },
      false,
      'setIsEditorReadOnly'
    ),

  setAppVersions: (versions) => set(() => ({ appVersions: versions }), false, 'setAppVersions'),

  setAppVersionCurrentEnvironment: (environment) =>
    set(() => ({ currentAppVersionEnvironment: environment }), false, 'setAppVersionCurrentEnvironment'),

  setAppVersionPromoted: (value) => set(() => ({ isAppVersionPromoted: value }), false, 'setAppVersionPromoted'),

  getShouldFreeze: (skipIsEditorFreezedCheck = false, _isModuleEditor = false) => {
    const isVersionReleased = get().isVersionReleased;
    const selectedVersionId = get().selectedVersion?.id;
    const releasedVersionId = get().releasedVersionId;
    const isEditorFreezed = get().isEditorFreezed;
    // Git-sync-license lock freezes the editor unconditionally (independent of the
    // skipIsEditorFreezedCheck escape hatch) — there is no editing at all in this state.
    const isEditorReadOnly = get().isEditorReadOnly;
    const isGitSyncLicenseLocked = get().isGitSyncLicenseLocked;
    const result =
      isVersionReleased ||
      isGitSyncLicenseLocked ||
      (!skipIsEditorFreezedCheck && isEditorFreezed) ||
      selectedVersionId === releasedVersionId ||
      isEditorReadOnly;
    return result;
  },

  setRestoredAppHistoryId: (id) => {
    set(
      (state) => {
        state.restoredAppHistoryId = id;
        state.restoreTimestamp = Date.now(); // Always update timestamp to trigger re-fetch
      },
      false,
      'setRestoredAppHistoryId'
    );
  },

  /**
   * Re-fetches the current app version and rebuilds the canvas in place. Runs the same refresh
   * pipeline as a version switch (see useAppData), except the editor chrome — header, sidebars,
   * and the AI chat with its conversation and streaming response — stays mounted, and the user
   * stays on the page they were on.
   *
   * Use it when something outside the editor changed the app wholesale (e.g. the AI builder
   * editing pages/queries/global settings) and an incremental store update won't cover it.
   */
  triggerHotReload: () => {
    set(
      (state) => {
        state.hotReloadTimestamp = Date.now();
      },
      false,
      'triggerHotReload'
    );
  },
});
