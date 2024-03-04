import { create, zustandDevTools } from './utils';

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

export const useAppVersionStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        updateEditingVersion: (version) =>
          set({ editingVersion: version, isVersionReleased: get().releasedVersionId === version?.id }),
        enableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: true }),
        disableReleasedVersionPopupState: () => set({ isUserEditingTheVersion: false }),
        updateReleasedVersionId: (versionId) =>
          set({
            releasedVersionId: versionId,
            isVersionReleased: get().editingVersion?.id ? get().editingVersion?.id === versionId : false,
          }),
        onEditorFreeze: (value = false, isBannerMandatory = true) => set({ isEditorFreezed: value, isBannerMandatory }),
        setAppVersions: (versions) => set({ appVersions: versions }),
        setAppVersionCurrentEnvironment: (environment) => set({ currentAppVersionEnvironment: environment }),
        setAppVersionPromoted: (value) => set({ isAppVersionPromoted: value }),
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

export const useAppVersionActions = () => useAppVersionStore((state) => state.actions);
export const useAppVersionState = () => useAppVersionStore((state) => state);
