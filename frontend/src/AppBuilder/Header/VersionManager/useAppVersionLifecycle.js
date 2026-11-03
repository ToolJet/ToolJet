import { useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useGitSyncConfig } from '@/AppBuilder/_hooks/useGitSyncConfig';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { appVersionService, appsService, gitSyncService, authenticationService } from '@/_services';
import { normalizePin } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { getEnvironmentAccessFromPermissions } from '@/_helpers/environmentAccess';
import { getEnvironmentOptions } from './environmentOptions';
import { fetchEdition } from '@/modules/common/helpers/utils';
import config from 'config';

const callbackPromise = (invoke) => new Promise((resolve, reject) => invoke(resolve, reject));
const normalizeVersion = (version) => ({
  ...version,
  currentEnvironmentId: version.currentEnvironmentId ?? version.current_environment_id,
  parentVersionId: version.parentVersionId ?? version.parent_version_id,
  createdFromVersion: version.createdFromVersion ?? version.created_from_version,
  versionType: version.versionType ?? version.version_type ?? 'version',
});

export function useAppVersionLifecycle({
  loadVersions = false,
  loadDevelopment = false,
  orgGit: orgGitProp,
  isBranchingEnabled,
  onBrowseEnvironment,
} = {}) {
  const { moduleId, appType } = useModuleContext();
  const state = useStore(
    (s) => ({
      app: s.appStore.modules[moduleId]?.app,
      appId: s.appId ?? s.appStore.modules[moduleId]?.app?.appId,
      currentVersionId: s.currentVersionId,
      selectedVersion: s.selectedVersion,
      currentEnvironment: s.selectedEnvironment,
      environments: s.environments || [],
      developmentVersions: s.developmentVersions,
      promotedVersions: s.versionsPromotedToEnvironment,
      releasedVersionId: s.releasedVersionId,
      changeEditorVersionAction: s.changeEditorVersionAction,
      setCurrentVersionId: s.setCurrentVersionId,
      setSelectedVersion: s.setSelectedVersion,
      deleteVersionAction: s.deleteVersionAction,
      environmentChangedAction: s.environmentChangedAction,
      fetchDevelopmentVersions: s.fetchDevelopmentVersions,
      createNewVersionAction: s.createNewVersionAction,
      updateVersionNameAction: s.updateVersionNameAction,
      promoteAppVersionAction: s.promoteAppVersionAction,
      updateReleasedVersionId: s.updateReleasedVersionId,
      getCanPromoteAndRelease: s.getCanPromoteAndRelease,
      isEditorReadOnly: s.isEditorReadOnly,
      featureAccess: s.license?.featureAccess,
      currentMode: s.currentMode,
      orgGit: s.orgGit,
      branchingEnabled: s.branchingEnabled,
      isGitSyncConfigured: s.isGitSyncConfigured,
      customComponentLibraries: s.globalSettings?.customComponentLibraries,
      isAiBuildingApp: s.ai?.isLoading ?? false,
    }),
    shallow
  );
  const {
    appId,
    currentEnvironment,
    environments,
    developmentVersions,
    releasedVersionId,
    changeEditorVersionAction,
    setCurrentVersionId,
    setSelectedVersion,
    deleteVersionAction,
    environmentChangedAction,
    fetchDevelopmentVersions,
  } = state;
  const { versions, loading, error, fetchVersionsForEnvironment, refreshVersions } = useVersionManagerStore();
  const { pullAppAction, isMultiBranchingEnabled, branches } = useWorkspaceBranchesStore(
    (s) => ({
      pullAppAction: s.actions.pullApp,
      isMultiBranchingEnabled: s.isMultiBranchingEnabled,
      branches: s.branches,
    }),
    shallow
  );
  const { isGitSyncEnabled, defaultBranch } = useGitSyncConfig();
  const appCoRelationId = state.app?.co_relation_id;
  const browsingEnvironment = useRef(currentEnvironment);
  const [gitVersionStatus, setGitVersionStatus] = useState(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPullingVersion, setIsPullingVersion] = useState(null);
  useEffect(() => {
    browsingEnvironment.current = currentEnvironment;
    if (loadVersions && appId && currentEnvironment?.id) fetchVersionsForEnvironment(appId, currentEnvironment.id);
  }, [loadVersions, appId, currentEnvironment, fetchVersionsForEnvironment]);
  // fetchDevelopmentVersions early-returns until environments are hydrated — include
  // environments.length so we retry after init() rather than staying on [].
  useEffect(() => {
    if ((loadVersions || loadDevelopment) && appId && environments.length > 0) fetchDevelopmentVersions(appId);
  }, [loadVersions, loadDevelopment, appId, environments.length, fetchDevelopmentVersions]);

  const allVersions = useMemo(() => {
    const rows = new Map();
    [...developmentVersions, ...state.promotedVersions, ...versions].forEach((v) =>
      rows.set(v.id, normalizeVersion(v))
    );
    if (state.selectedVersion) {
      const previous = rows.get(state.selectedVersion.id);
      rows.set(
        state.selectedVersion.id,
        normalizeVersion({
          ...previous,
          ...state.selectedVersion,
          // Trust fetched rows over the selectedVersion snapshot for status —
          // same rule as currentEnvironmentId below. Preferring selectedStatus
          // left the dropdown stuck on DRAFT after an out-of-band publish
          // (cy.apiPublishDraftVersion / another tab), so Promote stayed hidden
          // while the lock banner (fed by developmentVersions) already showed
          // PUBLISHED.
          status: previous?.status ?? state.selectedVersion.status,
          // Promotion refreshes rows without rewriting the selected snapshot.
          // Keep selected metadata for immediate edits, but trust the fetched environment.
          currentEnvironmentId:
            previous?.currentEnvironmentId ?? normalizeVersion(state.selectedVersion).currentEnvironmentId,
        })
      );
    }
    return [...rows.values()];
  }, [developmentVersions, versions, state.promotedVersions, state.selectedVersion]);

  const selectVersion = async (id) => {
    const target = browsingEnvironment.current || currentEnvironment;
    if (target?.id !== currentEnvironment?.id) {
      await callbackPromise((resolve, reject) => environmentChangedAction(target, resolve, reject, moduleId));
    }
    await callbackPromise((resolve, reject) =>
      changeEditorVersionAction(
        appId,
        id,
        () => {
          setCurrentVersionId(id);
          const selected = allVersions.find((v) => v.id === id);
          if (selected) setSelectedVersion(selected);
          resolve();
        },
        reject,
        moduleId
      )
    );
  };
  const refresh = () => refreshVersions(appId, (browsingEnvironment.current || currentEnvironment)?.id);
  const selectEnvironment = async (id) => {
    const environment = environments.find((env) => env.id === id);
    browsingEnvironment.current = environment;
    if (environment) onBrowseEnvironment?.(environment);
    if (appId && id) await fetchVersionsForEnvironment(appId, id);
  };
  const reportError = (key, errorMessage, errorDetails = errorMessage) => {
    try {
      useStore.getState().debugger.log({
        logLevel: 'error',
        type: 'component',
        key,
        message: errorMessage,
        description: errorDetails,
        error: { message: errorMessage, description: errorDetails },
        errorTarget: 'Version',
        timestamp: new Date().toISOString(),
      });
    } catch {
      /* The debugger is unavailable outside an initialized editor. */
    }
  };
  const saveDraft = async (id, { name, description }) => {
    const orgGit = orgGitProp ?? state.orgGit;
    const gitSaveEnabled = orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled;
    if (gitSaveEnabled && (isBranchingEnabled ?? state.branchingEnabled)) {
      let tagCheck;
      try {
        tagCheck = await gitSyncService.checkTagExists(appId, name.trim());
      } catch (error) {
        console.warn('Tag existence check failed, proceeding with save', error);
      }
      if (tagCheck?.exists)
        throw new Error(
          `Cannot save: Tag '${tagCheck.tagName}' already exists. Please rename your version to a unique name before saving.`
        );
      if (tagCheck?.invalidFormat)
        throw new Error(
          'Version name cannot contain spaces or special characters (`~ ^ : ? * [ \\ @ {`). Please remove them and try again.'
        );
    }
    const values = { name, description, status: 'PUBLISHED' };
    await (gitSaveEnabled ? gitSyncService.saveVersion(appId, id, values) : appVersionService.save(appId, id, values));
    fetchDevelopmentVersions(appId);
    try {
      const data = await appVersionService.getAppVersionData(appId, id, state.currentMode);
      if (data.editing_version?.id) {
        const environmentId = data.editing_version.currentEnvironmentId;
        if (environmentId !== currentEnvironment?.id) {
          const target = environments.find((env) => env.id === environmentId);
          if (target)
            await callbackPromise((resolve, reject) => environmentChangedAction(target, resolve, reject, moduleId));
        }
        await callbackPromise((resolve, reject) =>
          changeEditorVersionAction(appId, data.editing_version.id, resolve, reject, moduleId)
        );
      }
    } catch (error) {
      console.error('Error switching to newly created version:', error);
      toast.error('Version created but failed to switch to it');
    }
  };
  const hasSyncedDraft = developmentVersions.some(
    (v) => v.versionType === 'version' && v.status === 'DRAFT' && v.isSynced !== false
  );
  const isReplaceFlow = isGitSyncEnabled && !isMultiBranchingEnabled && hasSyncedDraft;
  const createDraft = async ({ name, fromVersionId }) => {
    const source = allVersions.find((v) => v.id === fromVersionId);
    const gitName = (isGitSyncEnabled && source?.isSynced !== false) || isReplaceFlow;
    const created = await callbackPromise((resolve, reject) =>
      state.createNewVersionAction(
        appId,
        gitName ? defaultBranch : name.trim(),
        fromVersionId,
        gitName ? 'Latest commit to main will appear here' : '',
        resolve,
        reject,
        'version',
        isReplaceFlow
      )
    );
    fetchDevelopmentVersions(appId);
    refreshVersions(appId, currentEnvironment?.id);
    try {
      await callbackPromise((resolve, reject) =>
        changeEditorVersionAction(appId, created.id, resolve, reject, moduleId)
      );
    } catch (error) {
      console.error('Error switching to new draft version:', error);
      toast.error('Draft created but failed to switch to it');
    }
    return created;
  };
  const editDraft = (id, { name, description }) =>
    callbackPromise((resolve, reject) => state.updateVersionNameAction(appId, id, name, description, resolve, reject));
  const promote = (id) =>
    callbackPromise((resolve, reject) => state.promoteAppVersionAction(id, resolve, reject, moduleId));
  const release = async (id) => {
    await appsService.releaseVersion(appId, id);
    state.updateReleasedVersionId(id);
  };
  const deleteVersion = (id) => callbackPromise((resolve, reject) => deleteVersionAction(appId, id, resolve, reject));
  const loadReleaseNotices = async (id, explicitAppId) => {
    const targetApp = explicitAppId || appId;
    if (!targetApp || !id) return [];
    const response = await appsService.getLibraryPins(targetApp, id);
    return [
      ...new Set(
        (response?.pins || [])
          .filter((pin) => pin.pinnedVersion !== pin.releasedVersion)
          .map(
            ({ consumerQueryName, libraryQueryName, pinnedVersion, releasedVersion }) =>
              `${consumerQueryName} uses ${libraryQueryName} ${pinnedVersion}; the released version is ${releasedVersion ?? 'none'}.`
          )
      ),
    ];
  };
  const handleRefreshFromGit = async () => {
    if (isRefreshing) return;
    if (!appCoRelationId || !isGitSyncEnabled) return;
    setIsRefreshing(true);
    try {
      const tags = await workspaceBranchesService.getEntityTags(appCoRelationId);
      const newStatus = new Map();
      tags.forEach((tag) => {
        const versionName = tag.name.split('/').slice(1).join('/');
        if (!versionName) return;
        // NOTE: `versions` is scoped to the current environment. A version pulled in another
        // environment may incorrectly appear as git-only here.
        const isLocal = versions.some(
          (v) => v.name === versionName && (v.versionType || v.version_type) === 'version' && v.status !== 'DRAFT'
        );
        newStatus.set(versionName, {
          isInGit: true,
          isLocal,
          tagSha: tag.commit?.sha,
          tagName: tag.name,
          tagDescription: tag.message?.trim() || undefined,
        });
      });
      setGitVersionStatus(newStatus);

      // Remove local versions that no longer exist as remote git tags
      const remoteVersionNames = new Set(newStatus.keys());
      const staleVersions = versions.filter(
        (v) =>
          (v.versionType || v.version_type) === 'version' &&
          v.status !== 'DRAFT' &&
          v.id !== releasedVersionId &&
          !remoteVersionNames.has(v.name)
      );

      for (const staleVersion of staleVersions) {
        await new Promise((resolve) => {
          deleteVersionAction(
            appId,
            staleVersion.id,
            () => resolve(),
            (error) => {
              toast.error(error?.error || error?.message || `Failed to remove version "${staleVersion.name}"`);
              resolve();
            }
          );
        });
      }

      if (staleVersions.length > 0) {
        const environmentToRefresh = browsingEnvironment.current || currentEnvironment;
        await refreshVersions(appId, environmentToRefresh?.id);
      }
    } catch {
      toast.error('Failed to refresh versions from git');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePullVersion = async (version, gitStatus) => {
    if (!gitStatus?.tagSha) return;
    if (!appId || isPullingVersion) return;
    setIsPullingVersion(version.name);
    try {
      const result = await pullAppAction(appId, gitStatus.tagSha, version.name, gitStatus.tagDescription);
      if (!result || !result.success) {
        toast.error(result?.message || `Failed to pull version "${version.name}"`);
        return;
      }
      const draftVersionId = result?.draftVersionId;
      const environmentToRefresh = browsingEnvironment.current || currentEnvironment;
      await refreshVersions(appId, environmentToRefresh?.id);
      toast.success(`Version "${version.name}" pulled successfully`);
      if (draftVersionId) {
        changeEditorVersionAction(
          appId,
          draftVersionId,
          () => {
            setCurrentVersionId(draftVersionId);
          },
          (error) => {
            toast.error(error?.message || 'Failed to switch to pulled version');
          },
          moduleId
        );
      }
      setGitVersionStatus((prev) => {
        const updated = new Map(prev);
        updated.set(version.name, { ...gitStatus, isLocal: true });
        return updated;
      });
    } catch (error) {
      toast.error(error?.message || `Failed to pull ${version.name}`);
    } finally {
      setIsPullingVersion(null);
    }
  };

  const permission = state.getCanPromoteAndRelease();
  const featureAccess = state.featureAccess;
  const licenseStatus = featureAccess?.licenseStatus || {};
  const environmentOptions =
    fetchEdition(config) === 'ce'
      ? []
      : getEnvironmentOptions({
          environments,
          environmentAccess: getEnvironmentAccessFromPermissions(
            authenticationService.currentSessionValue?.app_group_permissions,
            appId
          ),
          isModuleApp: state.app?.appType === 'module',
          isWorkflowApp: moduleId === 'workflow',
          multiEnvironmentEnabled: featureAccess?.multiEnvironment,
          licenseType: licenseStatus.licenseType,
          licenseValid: !licenseStatus.isExpired && licenseStatus.isLicenseValid,
        });
  const devPinnedLibrariesCount = Object.values(state.customComponentLibraries ?? {}).filter((value) => {
    const pin = normalizePin(value);
    return typeof pin === 'string' && pin.startsWith('dev:');
  }).length;
  return {
    resourceType: appType === 'module' || state.app?.appType === 'module' ? 'module' : 'app',
    selectedVersionId: state.currentVersionId || state.selectedVersion?.id,
    versions: allVersions,
    environments,
    selectedEnvironment: currentEnvironment,
    releasedVersionId,
    loading,
    error,
    capabilities: {
      readOnly: state.isEditorReadOnly,
      multiEnvironment: featureAccess?.multiEnvironment,
      canPromote: permission.isPromoteVersionEnabled,
      canRelease: permission.isReleaseVersionEnabled,
      isSaving: state.app?.isSaving,
      isAiBuildingApp: state.isAiBuildingApp,
      devPinnedLibrariesCount,
      // Empty arrays are truthy — the dropdown treats them as "restrict to these
      // ids" and would hide every row (and Create draft) while fetches are still
      // in flight. Omit until at least one id is known so allVersions is used as-is.
      visibleVersionIds: versions.length > 0 ? versions.map((v) => v.id) : undefined,
      environmentOptions,
      developmentVersionIds: developmentVersions.length > 0 ? developmentVersions.map((v) => v.id) : undefined,
      git: {
        enabled: isGitSyncEnabled || !!(orgGitProp?.git_https?.is_enabled || orgGitProp?.git_lab?.is_enabled),
        defaultBranch,
        isMultiBranchingEnabled,
        branches,
        status: gitVersionStatus,
        isRefreshing,
        isPullingVersion,
        isReplaceFlow,
        fetchingOrgGit: state.isGitSyncConfigured && !state.orgGit,
      },
    },
    notices: [],
    actions: {
      selectVersion,
      selectEnvironment,
      openDropdown: async () => {
        browsingEnvironment.current = currentEnvironment;
        if (appId && currentEnvironment?.id) await fetchVersionsForEnvironment(appId, currentEnvironment.id);
      },
      refresh,
      saveDraft,
      createDraft,
      editDraft,
      promote,
      release,
      deleteVersion,
      refreshFromGit: handleRefreshFromGit,
      pullVersion: handlePullVersion,
      reportError,
      loadReleaseNotices,
    },
  };
}
