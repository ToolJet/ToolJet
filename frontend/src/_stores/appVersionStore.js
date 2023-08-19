import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  isUserEditingTheVersion: false,
  releasedVersionId: null,
  isVersionReleased: false,
  appVersions: [],
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
        setAppVersions: (versions) => set({ appVersions: versions }),
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

export const useAppVersionActions = () => useAppVersionStore((state) => state.actions);
