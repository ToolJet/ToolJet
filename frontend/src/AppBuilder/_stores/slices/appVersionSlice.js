const initialState = {
  editingVersion: null,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
  isVersionReleased: false,
  isEditorFreezed: false,
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

  setAppVersions: (versions) => set(() => ({ appVersions: versions }), false, 'setAppVersions'),

  setAppVersionCurrentEnvironment: (environment) =>
    set(() => ({ currentAppVersionEnvironment: environment }), false, 'setAppVersionCurrentEnvironment'),

  setAppVersionPromoted: (value) => set(() => ({ isAppVersionPromoted: value }), false, 'setAppVersionPromoted'),

  getShouldFreeze: () => {
    return get().isVersionReleased || get().isEditorFreezed || get().selectedVersion?.id === get().releasedVersionId;
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
