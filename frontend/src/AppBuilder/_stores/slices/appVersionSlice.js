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
    const isGitSyncLicenseLocked = get().isGitSyncLicenseLocked;
    const result =
      isVersionReleased ||
      isGitSyncLicenseLocked ||
      (!skipIsEditorFreezedCheck && isEditorFreezed) ||
      selectedVersionId === releasedVersionId;
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
});
