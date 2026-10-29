import { useCallback, useEffect, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { libraryRunEnvironment, viewedLibraryVersionId } from '@/AppBuilder/_stores/slices/queryLibrarySlice';
import { authenticationService } from '@/_services';
import { canUseDataSourceForQuery } from '@/_helpers';
import { getEnvironmentOptions } from '@/AppBuilder/Header/VersionManager/environmentOptions';

export default function useLibraryVersionLifecycle({ queryId }) {
  const { view, selectedVersionId, environments, selectedEnvironment, featureAccess, library, workspaceId, sessionId } =
    useStore(
      (state) => ({
        view: state.queryLibrary.versionsByQueryId[queryId],
        selectedVersionId: viewedLibraryVersionId(state, queryId),
        environments: state.environments,
        selectedEnvironment: libraryRunEnvironment(state, queryId),
        featureAccess: state.license.featureAccess,
        library: state.queryLibrary,
        workspaceId: state.queryLibrary.workspaceId,
        sessionId: state.queryLibrary.sessionId,
      }),
      shallow
    );
  const [session, setSession] = useState(authenticationService.currentSessionValue);
  const [loading, setLoading] = useState(!view);
  const [error, setError] = useState(null);
  const [browsedEnvironment, setBrowsedEnvironment] = useState(selectedEnvironment);
  const browsing = useRef(selectedEnvironment);
  const loadRequest = useRef(0);
  const currentQueryId = useRef(queryId);
  currentQueryId.current = queryId;
  const loadLibraryVersions = library.loadLibraryVersions;
  const loadVersions = useCallback(async () => {
    const request = ++loadRequest.current;
    const accepts = () => {
      const currentLibrary = useStore.getState().queryLibrary;
      return (
        request === loadRequest.current &&
        currentQueryId.current === queryId &&
        currentLibrary.workspaceId === workspaceId &&
        currentLibrary.sessionId === sessionId
      );
    };
    setLoading(true);
    setError(null);
    try {
      return await loadLibraryVersions(queryId);
    } catch (reason) {
      if (accepts()) setError(reason?.error || reason?.message || 'Could not load versions');
    } finally {
      if (accepts()) setLoading(false);
    }
  }, [loadLibraryVersions, queryId, workspaceId, sessionId]);
  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe(setSession);
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    browsing.current = selectedEnvironment;
    setBrowsedEnvironment(selectedEnvironment);
  }, [selectedEnvironment]);
  useEffect(() => {
    loadVersions();
    return () => {
      loadRequest.current += 1;
    };
  }, [loadVersions]);

  const development = environments.find((environment) => environment.priority === 1);
  const versions = [
    ...(view?.drafts || []).map((draft) => ({
      ...draft,
      status: 'DRAFT',
      currentEnvironmentId: development?.id,
      parentVersionId: draft.createdFromVersionId,
      createdFromVersion: draft.createdFrom,
    })),
    ...(view?.versions || []).map((version) => ({
      ...version,
      status: 'PUBLISHED',
      currentEnvironmentId: version.environment?.id,
      parentVersionId: version.createdFromVersionId,
      createdFromVersion: version.createdFrom,
    })),
  ];
  const selected = versions.find((version) => version.id === selectedVersionId);
  const readOnly = !selected || (selected.dataSourceId !== null && !canUseDataSourceForQuery(selected.dataSourceId));
  const multiEnvironment = !!featureAccess?.multiEnvironment;
  const admin = session?.admin || session?.super_admin;
  // These are workspace defaults; app-specific grants never authorize a library resource.
  const environmentAccess = admin
    ? { development: true, staging: true, production: true }
    : session?.app_group_permissions?.environment_access;
  const licenseStatus = featureAccess?.licenseStatus || {};
  const environmentOptions = getEnvironmentOptions({
    environments,
    allowEmptyEnvironments: true,
    environmentAccess,
    multiEnvironmentEnabled: multiEnvironment,
    licenseType: licenseStatus.licenseType,
    licenseValid: !licenseStatus.isExpired && licenseStatus.isLicenseValid,
  });
  const accessible = (id) => environmentOptions.some((option) => option.environment.id === id && !option.disabled);
  const refresh = async () => {
    browsing.current = selectedEnvironment;
    setBrowsedEnvironment(selectedEnvironment);
    return loadVersions();
  };
  return {
    resourceType: 'query-library',
    selectedVersionId,
    versions,
    environments,
    selectedEnvironment,
    releasedVersionId: view?.versions?.find((version) => version.isReleased)?.id ?? null,
    loading,
    error,
    capabilities: {
      readOnly,
      multiEnvironment,
      canPromote: !readOnly && multiEnvironment,
      canRelease: !readOnly,
      isSaving: library.isSaving,
      visibleVersionIds: versions
        .filter((version) => !multiEnvironment || version.currentEnvironmentId === browsedEnvironment?.id)
        .map(({ id }) => id),
      developmentVersionIds: versions.map(({ id }) => id),
      environmentOptions,
      git: { enabled: false },
    },
    notices: {
      release: [],
      dependencyMessage: (name) => `Cannot delete ${name} because it is used by apps or modules.`,
    },
    actions: {
      refresh,
      selectEnvironment: async (id) => {
        if (!accessible(id)) return;
        const environment = environments.find((entry) => entry.id === id);
        browsing.current = environment;
        setBrowsedEnvironment(environment);
      },
      selectVersion: async (id) => {
        const target = browsing.current || selectedEnvironment;
        if (!accessible(target?.id)) return;
        if (target?.id === selectedEnvironment?.id && id === selectedVersionId) return;
        if (target?.id !== selectedEnvironment?.id) library.setLibraryRunEnvironment(queryId, target);
        library.viewLibraryVersion(queryId, id);
      },
      saveDraft: (id, values) => library.saveLibraryDraft(queryId, id, values),
      createDraft: (values) => library.createLibraryDraft(queryId, values),
      editDraft: (id, values) => library.editLibraryDraft(queryId, id, values),
      promote: (id) => library.promoteLibraryVersion(queryId, id),
      release: (id) => library.releaseLibraryVersion(queryId, id),
      deleteVersion: (id) =>
        versions.find((version) => version.id === id)?.status === 'DRAFT'
          ? library.deleteLibraryDraft(queryId, id)
          : library.deleteLibraryVersion(queryId, id),
    },
  };
}
