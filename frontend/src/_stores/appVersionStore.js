import { create, zustandDevTools } from './utils';
import { useContext } from 'react';
import { useSuperStore } from './superStore';
import { ModuleContext } from '../_contexts/ModuleContext';

export function createAppVersionStore(moduleName) {
  const initialState = {
    editingVersion: null,
    isUserEditingTheVersion: false,
    releasedVersionId: null,
    isVersionReleased: false,
    appVersions: [],
    moduleName,
  };

  return create(
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
}

export const useAppVersionStore = (callback, shallow) => {
  const moduleName = useContext(ModuleContext);

  if (!moduleName) throw Error('module context not available');

  const _useAppVersionStore = useSuperStore((state) => state.modules[moduleName].useAppVersionStore);

  return _useAppVersionStore(callback, shallow);
};

export const useAppVersionActions = () => useAppVersionStore((state) => state.actions);
export const useAppVersionState = () => useAppVersionStore((state) => state);
