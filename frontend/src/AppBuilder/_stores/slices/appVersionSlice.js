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
});
