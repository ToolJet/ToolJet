import {
  appEnvironmentService,
  appVersionService,
  authenticationService,
  dataqueryService,
  gitSyncService,
  orgEnvironmentConstantService,
} from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import toast from 'react-hot-toast';
import queryString from 'query-string';
import { camelCase, isEmpty, mapKeys } from 'lodash';
import { deepCamelCase } from '@/_helpers/appUtils';
import { baseTheme } from '../utils';
import {
  getEnvironmentAccessFromPermissions,
  hasEnvironmentAccess,
  getSafeEnvironment,
} from '@/_helpers/environmentAccess';
import { normalizeQueryTransformationOptions } from '@/AppBuilder/_stores/utils/appDataCaseConversion';

const initialState = {
  selectedVersion: null,
  selectedEnvironment: null,
  appVersionEnvironment: null,
  versionsPromotedToEnvironment: [],
  environments: [],
  shouldRenderPromoteButton: false, // TODO: need to check if this is needed
  shouldRenderReleaseButton: false, // TODO: need to check if this is needed
  initializedEnvironmentDropdown: true,
  environmentsLazyLoaded: false,
  appVersionsLazyLoaded: false,
  previewInitialEnvironmentId: null,
  developmentVersions: [],
  draftVersions: [],
  publishedVersions: [],
  environmentLoadingState: 'completed',
  isPublicAccess: false,
};

export const createEnvironmentsAndVersionsSlice = (set, get) => ({
  ...initialState,

  init: async (editingVersionId, envFromQueryParams) => {
    try {
      const response = await appEnvironmentService.init(editingVersionId, envFromQueryParams);

      const previewInitialEnvironmentId = !envFromQueryParams
        ? null
        : response.environments.find((environment) => environment.name === envFromQueryParams)?.id;

      let selectedEnvironment = response.editorEnvironment;

      // Check if user is view-only and current environment is production
      const currentSession = authenticationService.currentSessionValue;
      const { app_group_permissions } = currentSession;

      // Get app ID from the response (similar to how AppEnvironments.jsx gets it)
      const appId = response.editorVersion?.app?.id || response.editorVersion?.appId;

      const storeState = get();
      const isModuleApp = storeState.appStore?.modules?.canvas?.app?.appType === 'module';
      const isWorkflowApp = !!storeState.appStore?.modules?.workflow?.app?.appId;
      const bypassEnvCheck = isModuleApp || isWorkflowApp;

      const hasEditPermission =
        bypassEnvCheck ||
        app_group_permissions?.is_all_editable ||
        (appId && app_group_permissions?.editable_apps_id?.includes(appId));

      // Check if user is viewer without edit permission
      const isViewOnlyUser = !hasEditPermission;
      const isProductionEnvironment = selectedEnvironment?.name === 'production';

      // If view-only user is in production, redirect to development environment
      if (isViewOnlyUser && isProductionEnvironment && !previewInitialEnvironmentId) {
        const developmentEnvironment = response.environments.find((env) => env.name === 'development');
        if (developmentEnvironment) {
          selectedEnvironment = developmentEnvironment;
        }
      }

      // Check environment access and fallback to safe environment if needed
      if (appId) {
        const environmentAccess = getEnvironmentAccessFromPermissions(app_group_permissions, appId);
        let requestedEnvName = previewInitialEnvironmentId
          ? response.environments.find((env) => env.id === previewInitialEnvironmentId)?.name
          : selectedEnvironment?.name;

        // Check if user is the owner of the app
        const currentUserId = currentSession?.current_user?.id;
        const appOwnerId = response.editorVersion?.app?.user_id || response.editorVersion?.app?.userId;
        const isOwner = currentUserId && appOwnerId && currentUserId === appOwnerId;

        // Backend now checks if user has access to version's current environment
        // and only falls back to development if they don't have access
        if (hasEditPermission && !previewInitialEnvironmentId) {
          // Use the environment returned by backend (response.editorEnvironment)
          // which is already set in selectedEnvironment above
          requestedEnvName = selectedEnvironment?.name;

          // Special case: If user is owner and doesn't have explicit access to the requested environment,
          // then fallback to development (this handles new apps where permissions haven't synced yet)
          if (
            isOwner &&
            requestedEnvName !== 'development' &&
            !hasEnvironmentAccess(environmentAccess, requestedEnvName)
          ) {
            requestedEnvName = 'development';
            const developmentEnvironment = response.environments.find((env) => env.name === 'development');
            if (developmentEnvironment) {
              selectedEnvironment = developmentEnvironment;
            }
          }
        }

        // Check if user has access to the requested environment
        // Skip this check if user is owner requesting development, or for module/workflow apps
        // (module/workflow app IDs are absent from app_group_permissions env access maps, so the
        // access check always falls back to development even when the backend returned a higher env)
        const skipAccessCheck = (isOwner && requestedEnvName === 'development') || bypassEnvCheck;

        if (!skipAccessCheck && requestedEnvName && !hasEnvironmentAccess(environmentAccess, requestedEnvName)) {
          // User doesn't have access, find the closest available environment
          const safeEnvName = getSafeEnvironment(environmentAccess, requestedEnvName, hasEditPermission);
          const safeEnvironment = response.environments.find((env) => env.name === safeEnvName);

          if (safeEnvironment) {
            selectedEnvironment = safeEnvironment;

            // Fetch the version for the safe environment
            try {
              const envChangeResponse = await appEnvironmentService.postEnvironmentChangedAction({
                appId,
                editorEnvironmentId: safeEnvironment.id,
                editorVersionId: response.editorVersion?.id,
              });

              if (envChangeResponse.editorVersion) {
                response.editorVersion = envChangeResponse.editorVersion;
                response.appVersionEnvironment = response.environments.find(
                  (env) => env.id === envChangeResponse.editorVersion.currentEnvironmentId
                );
              }
            } catch (error) {
              console.error('Error switching to safe environment:', error);
            }
          }
        }
      }

      if (previewInitialEnvironmentId) {
        selectedEnvironment = response.environments.find(
          (environment) => environment.id === previewInitialEnvironmentId
        );
      }

      set((state) => {
        const stateUpdate = {
          ...state,
          selectedEnvironment,
          selectedVersion: response.editorVersion,
          appVersionEnvironment: response.appVersionEnvironment,
          shouldRenderPromoteButton: response.shouldRenderPromoteButton,
          shouldRenderReleaseButton: response.shouldRenderReleaseButton,
          environments: response.environments,
          versionsPromotedToEnvironment: [response.editorVersion],
        };

        // Clear currentBranch if initial version is not a branch
        const versionType = response.editorVersion?.versionType || response.editorVersion?.version_type;
        if (versionType !== 'branch') {
          stateUpdate.currentBranch = null;
        }
        return stateUpdate;
      });
    } catch (error) {
      console.error('❌ DEBUG - Error while initializing the environment dropdown', error);
    }
  },
  setCurrentVersionId: (currentVersionId) => set(() => ({ currentVersionId }), false, 'setCurrentVersionId'),
  setSelectedEnvironment: (selectedEnvironment) => set({ selectedEnvironment }),
  setCurrentAppEnvironmentId: (environmentId) =>
    set((state) => {
      state.currentAppEnvironmentId = environmentId;
    }),
  setEnvironmentDropdownStatus: (status) => set({ initializedEnvironmentDropdown: status }),

  fetchDevelopmentVersions: async (appId) => {
    const developmentEnvironment = get().environments.find((environment) => environment.name === 'development');

    if (!developmentEnvironment) {
      console.warn('Development environment not found');
      return;
    }

    const developmentEnvironmentId = developmentEnvironment.id;

    try {
      const response = await appEnvironmentService.getVersionsByEnvironment(appId, developmentEnvironmentId);
      const draftVersions = response.appVersions.filter((version) => version.status === 'DRAFT');
      const publishedVersions = response.appVersions.filter((version) => version.status === 'PUBLISHED');
      set({ draftVersions });
      set({ publishedVersions });
      set({ developmentVersions: response.appVersions });
    } catch (error) {
      console.error('Error while getting the versions', error);
    }
  },

  lazyLoadAppVersions: async (appId) => {
    try {
      const response = await appEnvironmentService.getVersionsByEnvironment(appId, get().selectedEnvironment.id);
      set({
        versionsPromotedToEnvironment: response.appVersions,
        appVersionsLazyLoaded: true,
      });
    } catch (error) {
      console.error('Error while getting the versions', error);
    }
  },

  setSelectedVersion: (selectedVersion) => set({ selectedVersion }),

  // setEnvironmentAndVersionsInitStatus: (status) => set({ completedEnvironmentAndVersionsInit: status }),

  setAppDefinitionFromGitpullAction: (newVersion) => {
    const editorVersion = {
      id: newVersion.id,
      name: newVersion.name,
      displayName: newVersion.display_name || newVersion.displayName || newVersion.name,
      current_environment_id: newVersion.current_environment_id,
      status: newVersion.status,
      isSynced: newVersion.isSynced ?? newVersion.is_synced ?? false,
    };
    set((state) => ({
      ...state,
      selectedVersion: editorVersion,
      currentVersionId: editorVersion.id,
      selectedEnvironment: get().environments.find(
        (environment) => environment.id === editorVersion.current_environment_id
      ),
      versionsPromotedToEnvironment: [editorVersion],
      appVersionsLazyLoaded: false,
      appVersionEnvironment: get().environments.find(
        (environment) => environment.id === editorVersion.current_environment_id
      ),
      ...calculatePromoteAndReleaseButtonVisibilityForCreateNewVersion(useStore.getState().featureAccess),
    }));
  },

  createNewVersionAction: async (
    appId,
    versionName,
    selectedVersionId,
    versionDescription = '',
    onSuccess,
    onFailure,
    versionType = 'version',
    replace = false
  ) => {
    try {
      const editorEnvironment = get().selectedEnvironment.id;
      const newVersion = await appVersionService.create(
        appId,
        versionName,
        versionDescription,
        selectedVersionId,
        editorEnvironment,
        versionType,
        replace
      );
      const editorVersion = {
        id: newVersion.id,
        name: newVersion.name,
        current_environment_id: newVersion.current_environment_id,
        // Use the created version's actual sync state (git-off/normal drafts are unsynced; a
        // git single-branch replace draft stays synced), not a hardcoded false.
        isSynced: newVersion.isSynced ?? newVersion.is_synced ?? false,
      };
      set((state) => ({
        ...state,
        selectedVersion: editorVersion,
        currentVersionId: editorVersion.id,
        selectedEnvironment: get().environments.find(
          (environment) => environment.id === editorVersion.current_environment_id
        ),
        versionsPromotedToEnvironment: [editorVersion],
        appVersionsLazyLoaded: false,
        appVersionEnvironment: get().environments.find(
          (environment) => environment.id === editorVersion.current_environment_id
        ),
        ...calculatePromoteAndReleaseButtonVisibilityForCreateNewVersion(useStore.getState().featureAccess),
      }));
      onSuccess(newVersion);
    } catch (error) {
      onFailure(error);
    }
  },
  updateVersionNameAction: async (appId, versionId, versionName, versionDescription, onSuccess, onFailure) => {
    try {
      await appVersionService.save(appId, versionId, { name: versionName, description: versionDescription });

      set((state) => {
        if (state.selectedVersion && state.selectedVersion.id === versionId) {
          state.selectedVersion.name = versionName;
          state.selectedVersion.description = versionDescription;
        }

        const versionIndex = state.versionsPromotedToEnvironment.findIndex((v) => v.id === versionId);
        if (versionIndex !== -1) {
          state.versionsPromotedToEnvironment[versionIndex].name = versionName;
          state.versionsPromotedToEnvironment[versionIndex].description = versionDescription;
        }

        const devVersionIndex = state.developmentVersions.findIndex((v) => v.id === versionId);
        if (devVersionIndex !== -1) {
          state.developmentVersions[devVersionIndex].name = versionName;
          state.developmentVersions[devVersionIndex].description = versionDescription;
        }

        state.appVersionsLazyLoaded = false;
      });

      onSuccess();
    } catch (error) {
      console.log({ error });
      onFailure(error);
    }
  },

  deleteVersionAction: async (appId, versionId, onSuccess, onFailure, moduleId = 'canvas') => {
    try {
      // Delete the version. In a git-enabled workspace the app-git endpoint performs the DB delete
      // AND removes the git tag in one server-side call; non-git workspaces (incl. CE) use the
      // versions endpoint. (This replaces the old versions→app-git moduleRef git-tag cleanup.)
      const orgGit = useStore.getState().orgGit;
      const isGitSyncEnabled = !!(orgGit?.git_https?.is_enabled || orgGit?.git_lab?.is_enabled);
      if (isGitSyncEnabled) {
        await gitSyncService.deleteVersion(appId, versionId);
      } else {
        await appVersionService.del(appId, versionId);
      }

      // Delete version from every environment
      const response = await appEnvironmentService.postVersionDeleteAction({
        appId,
        editorVersionId: versionId,
        deletedVersionId: versionId,
        editorEnvironmentId: get().selectedEnvironment.id,
      });
      const editorVersion = response.editorVersion;
      const wasSelectedVersionDeleted = get().selectedVersion?.id === versionId;

      set((state) => {
        const newState = {
          versionsPromotedToEnvironment: [editorVersion],
          appVersionsLazyLoaded: false,
          selectedEnvironment: response.editorEnvironment,
          appVersionEnvironment: response.appVersionEnvironment,
          environments: response?.environments?.length ? response.environments : get().environments,
        };

        if (wasSelectedVersionDeleted) {
          newState.selectedVersion = editorVersion; // last version can't be deleted
          newState.currentVersionId = editorVersion.id;
        }

        return newState;
      });

      const isModuleApp = get().appStore?.modules?.canvas?.app?.appType === 'module';
      if (isModuleApp && wasSelectedVersionDeleted) {
        get().changeEditorVersionAction(appId, editorVersion.id, onSuccess, onFailure, moduleId);
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error in deleteVersionAction:', error);
      onFailure(error);
    }
  },
  changeEditorVersionAction: async (appId, versionId, onSuccess, onFailure, moduleId) => {
    // moduleId is a late addition — an older, now-unused 5th arg (env override) still gets
    // passed as `null` by one caller, so default via `||` rather than an ES6 default (which
    // only kicks in for `undefined`).
    moduleId = moduleId || 'canvas';
    try {
      const data = await appVersionService.getAppVersionData(appId, versionId, get().getCurrentMode(moduleId));
      // getAppVersionData doesn't include the resolved branchName/branchId (those come from the
      // environment-versions fetch). Carry them over from the already-enriched entry so the version
      // selector keeps showing the branch name instead of falling back to the raw UUID version name.
      const prevVersionEntry = get().versionsPromotedToEnvironment.find((v) => v.id === data?.editing_version?.id);
      const branchId =
        data.editing_version.branchId ??
        data.editing_version.branch_id ??
        prevVersionEntry?.branchId ??
        prevVersionEntry?.branch_id;
      const branchName =
        data.editing_version.branchName ??
        data.editing_version.branch_name ??
        prevVersionEntry?.branchName ??
        prevVersionEntry?.branch_name;
      const selectedVersion = {
        id: data.editing_version.id,
        name: data.editing_version.name,
        current_environment_id: data.editing_version.currentEnvironmentId,
        status: data.editing_version.status,
        // Preserve versionType from API response to distinguish between regular versions and branch versions
        versionType: data.editing_version.versionType || data.editing_version.version_type || 'version',
        isSynced: data.editing_version.isSynced ?? data.editing_version.is_synced ?? false,
        branchId,
        branchName,
      };
      // A version's own current_environment_id is how far it's been promoted (e.g. production),
      // not necessarily the environment the user is currently viewing it under (e.g. browsing
      // that same production-promoted version from the staging tab). Keep the user's selected
      // environment when the version is actually available there; only fall back to the
      // version's own environment otherwise (plain same-environment version switches, etc).
      const versionOwnEnvironment = get().environments.find(
        (environment) => environment.id === selectedVersion.current_environment_id
      );
      const currentSelectedEnvironment = get().selectedEnvironment;
      const isSelectedEnvironmentValid =
        currentSelectedEnvironment &&
        currentSelectedEnvironment.priority <= (versionOwnEnvironment?.priority ?? -Infinity);
      const appVersionEnvironment = isSelectedEnvironmentValid ? currentSelectedEnvironment : versionOwnEnvironment;
      let updatedVersionsArray = [...get().versionsPromotedToEnvironment];
      const versionIndex = get().versionsPromotedToEnvironment.findIndex((v) => v.id === data?.editing_version?.id);
      if (versionIndex !== -1 && data?.editing_version) {
        updatedVersionsArray[versionIndex] = { ...data.editing_version, branchId, branchName };
      }
      let optionsToUpdate = {
        selectedVersion,
        currentVersionId: selectedVersion.id,
        appVersionEnvironment,
        versionsPromotedToEnvironment: [...updatedVersionsArray],
        ...calculatePromoteAndReleaseButtonVisibility(
          selectedVersion.id,
          get().selectedEnvironment,
          useStore.getState().releasedVersionId,
          useStore.getState()?.license?.featureAccess
        ),
      };

      // Keep freeze state in sync with the version being switched to — otherwise it
      // keeps whatever value was set for the previously selected version (e.g. staying
      // frozen after switching from a locked version to a fresh, editable draft).
      if (data.should_freeze_editor !== undefined) {
        optionsToUpdate.isEditorFreezed = data.should_freeze_editor;
      }

      // Clear currentBranch if switching to a regular version (not a branch)
      if (selectedVersion.versionType !== 'branch') {
        optionsToUpdate.currentBranch = null;
      }

      set((state) => ({ ...state, ...optionsToUpdate }));

      // The App Builder's own version-switch effect (useAppData.js:880, skipped here via
      // moduleMode) redoes all of the below unconditionally a moment after this action returns
      // — so for the regular App Builder every one of these calls is pure redundant work (extra
      // fetches, duplicate writes) that gets overwritten anyway. Restrict them to the module
      // editor, which has no such follow-up effect and needs this action to be self-sufficient.
      const isModuleApp = get().appStore?.modules?.canvas?.app?.appType === 'module';

      if (isModuleApp) {
        // Old version's undo/redo history and query-panel selection/preview no longer apply
        // once the canvas has switched to a different version's (differently-id'd) state.
        get().resetUndoRedoStack();
        get().queryPanel.setSelectedQuery(null, moduleId);
        get().queryPanel.setPreviewData(null);

        // Global/Page "Variables" (exposedValues.variables/page.variables) otherwise carry
        // over from the previous version instead of resetting to the new version's declared
        // state, and ListView/Kanban's lazy-resolution bookkeeping keeps stale entries. Scoped
        // to just those — constants/globals are already (re)populated by the explicit calls
        // below/elsewhere in this action, so resetting them here too would just wipe fields
        // (theme/urlparams/mode/currentUser) that nothing repopulates in this path.
        get().resetExposedValues(moduleId, { resetConstants: false, resetGlobals: false });
      }

      get().setResolvedGlobals(
        'environment',
        { id: appVersionEnvironment?.id, name: appVersionEnvironment?.name },
        moduleId
      );
      // For branch-type versions, editing_version.name is the internal identifier — the
      // human-readable name lives in display_name/displayName (server: versions/service.ts).
      get().setResolvedGlobals(
        'appVersion',
        {
          name: data.editing_version?.display_name || data.editing_version?.displayName || data.editing_version?.name,
        },
        moduleId
      );

      if (isModuleApp) {
        // name/slug/isPublic/isMaintenanceOn are branch/version-scoped (see the app metadata
        // storage model), so they can legitimately differ between versions — merge onto the
        // existing app entry rather than replacing it. Unlike the App Builder's own switch
        // path, this action never runs cleanUpStore, so a wholesale setApp() here would wipe
        // fields (appId, co_relation_id, appType, ...) that this response doesn't carry.
        get().setApp(
          {
            ...get().appStore?.modules?.[moduleId]?.app,
            appName: data.branch_app_name || data.name,
            slug: data.slug,
            isPublic: data.isPublic,
            isMaintenanceOn:
              'is_maintenance_on' in data
                ? data.is_maintenance_on
                : 'isMaintenanceOn' in data
                  ? data.isMaintenanceOn
                  : false,
            homePageId: data.editing_version?.homePageId || data.editing_version?.home_page_id,
          },
          moduleId
        );

        // A branch/version switch can land on a version with different active datasources.
        get().fetchGlobalDataSources(
          get().appStore?.modules?.[moduleId]?.app?.organizationId,
          versionId,
          appVersionEnvironment?.id
        );

        // Org constants/secrets are environment-scoped. Can't gate this on "did environment
        // change" here: when this runs via environmentChangedAction's onSuccess (the
        // dropdown's env-switch path), that action already wrote both selectedEnvironment and
        // appVersionEnvironment to the new value before calling us — there's no pre-switch
        // snapshot left to compare against. Always refetching is the simplest correct fix;
        // it's one cheap, infrequent call, not a hot path.
        if (appVersionEnvironment?.id) {
          const { constants } = await orgEnvironmentConstantService.getConstantsFromEnvironment(
            appVersionEnvironment.id
          );
          const orgConstants = {};
          const orgSecrets = {};
          constants.forEach((constant) => {
            if (constant.type !== 'Secret') {
              orgConstants[constant.name] = constant.value;
            } else {
              orgSecrets[constant.name] = constant.value;
            }
          });
          get().setResolvedConstants(orgConstants, moduleId);
          get().setSecrets(orgSecrets, moduleId);
        }

        // Theme/JS-libraries/preloaded-script and page settings are stored per-version too —
        // without this, a switch to a version with different global/page settings keeps
        // showing the previous version's.
        const globalSettings = mapKeys(
          data.editing_version?.globalSettings || data.editing_version?.global_settings || data.globalSettings,
          (value, key) => camelCase(key)
        );
        if (!globalSettings?.theme) {
          globalSettings.theme = baseTheme;
        }
        get().setGlobalSettings(globalSettings);
        get().setPageSettings(
          get().computePageSettings(
            deepCamelCase(data.editing_version?.pageSettings ?? data.editing_version?.page_settings)
          ),
          moduleId
        );

        // theme/urlparams/mode/currentUser essentially never change value within a session
        // (same browser tab, same user, same dark-mode preference) — refreshed here anyway
        // for full parity with the reference effect.
        const exposedTheme =
          get().globalSettings?.appMode && get().globalSettings.appMode !== 'auto'
            ? get().globalSettings.appMode
            : localStorage.getItem('darkMode') === 'true'
              ? 'dark'
              : 'light';
        get().setResolvedGlobals('theme', { name: exposedTheme }, moduleId);
        get().setResolvedGlobals(
          'urlparams',
          JSON.parse(JSON.stringify(queryString.parse(window.location?.search))),
          moduleId
        );
        get().setResolvedGlobals('mode', { value: get().getCurrentMode(moduleId) }, moduleId);
        const rawSession = authenticationService.currentSessionValue;
        const sessionGroups = rawSession?.group_permissions
          ? ['all_users', ...rawSession.group_permissions.map((group) => group.name), rawSession?.role?.name]
          : ['all_users', rawSession?.role?.name];
        get().setResolvedGlobals(
          'currentUser',
          {
            ...get().user,
            groups: sessionGroups,
            role: rawSession?.role?.name,
            ssoUserInfo: rawSession?.current_user?.sso_user_info,
            ...(rawSession?.current_user?.metadata && !isEmpty(rawSession.current_user.metadata)
              ? { metadata: rawSession.current_user.metadata }
              : {}),
          },
          moduleId
        );
      }

      // Pages/components are cloned with new ids for every version (see server's
      // setupNewVersion), so the previously selected page id no longer exists on this
      // version. Without this, saves keep using the stale id and the backend rejects them
      // with "page id is required" until a full reload re-syncs pages/currentPageId.
      if (data.pages) {
        get().setPages(data.pages, moduleId);
        const homePageId = data.editing_version?.homePageId || data.editing_version?.home_page_id;
        const startingPage = data.pages.find((page) => page.id === homePageId) || data.pages[0];
        if (startingPage) {
          get().setCurrentPageId(startingPage.id, moduleId);
        }
        get().clearSelectedComponents();
        // The canvas renders off componentNameIdMapping + the dependency graph's resolved
        // values, not the raw page data — without rebuilding both here (mirroring the
        // mount-time load), the component tree stays blank until a reload recomputes them.
        get().setComponentNameIdMapping(moduleId);

        if (isModuleApp) {
          // Event handlers are cloned with new ids per version too — without this, click/
          // onPageLoad actions stay wired to the previous version's event definitions.
          get().eventsSlice.updateEventsField('events', data.events || [], moduleId);
          // "Go to app" link targets — stale otherwise.
          get().setLinkedApps(data.linkedApps ?? {}, moduleId);

          // Queries are cloned with new ids per version too (mirrors pages above), but
          // getAppVersionData doesn't return them — without this refetch, queryNameIdMapping/
          // queryIdNameMapping keep pointing at the previous version's query ids, so canvas
          // bindings referencing a query by name can't resolve and fall back to showing the
          // stale id instead of the name. Must run before initDependencyGraph below, which
          // reads the current queries list to register query dependencies.
          const dataQueries = (
            (await dataqueryService.getAll(versionId, get().getCurrentMode(moduleId))).data_queries || []
          ).map(normalizeQueryTransformationOptions);
          get().dataQuery.setQueries(dataQueries, moduleId);
          get().initialiseResolvedQuery(
            dataQueries.map((query) => query.id),
            moduleId
          );
          get().setQueryMapping(moduleId);
          if (dataQueries?.length > 0) {
            get().queryPanel.setSelectedQuery(dataQueries[0]?.id, moduleId);
          }
        }

        get().initDependencyGraph(moduleId);

        if (isModuleApp) {
          // runOnPageLoad queries normally run via AppCanvas's Suspense-resolved ->
          // isComponentLayoutReady(true) -> runOnLoadQueries cycle (useAppData.js), which
          // fires on mount/remount. The App Builder still gets that for free: its
          // version-switch effect (useAppData.js:880, skipped here via moduleMode)
          // unmounts/remounts the canvas behind its loader, retriggering the cycle there —
          // calling runOnLoadQueries here too would run every runOnPageLoad query twice. The
          // module editor never unmounts on switch (no loader), so it's the only case where
          // that cycle never fires and needs it explicitly.
          get().dataQuery.runOnLoadQueries(moduleId);
        }
      }

      onSuccess(data);
    } catch (error) {
      onFailure(error);
    }
  },

  environmentChangedAction: async (environment, _onSuccess, _onFailure, moduleId = 'canvas') => {
    try {
      const environmentId = environment.id;
      let selectedVersion = get().selectedVersion; // Initialize with current version
      let selectedEnvironment = get().selectedEnvironment; // Initialize with current environment
      let selectedVersionDef;
      let appVersionEnvironment = environment;
      if (get().selectedEnvironment.id !== environmentId) {
        selectedEnvironment = environment;
        let optionsToUpdate = {
          selectedEnvironment,
          appVersionsLazyLoaded: false,
          ...calculatePromoteAndReleaseButtonVisibility(
            get().selectedVersion.id,
            environment,
            useStore.getState().releasedVersionId,
            useStore.getState()?.license?.featureAccess
          ),
        };
        // Compare against the environment where the selected version currently lives
        const versionIsAvailableInEnvironment = environment?.priority <= get().appVersionEnvironment?.priority;
        if (!versionIsAvailableInEnvironment) {
          // Current version doesn't exist in target environment - fetch a version that does
          const modules = useStore.getState().appStore.modules;
          const appId = modules.canvas?.app?.appId || modules.workflow?.app?.appId;
          const response = await appEnvironmentService.postEnvironmentChangedAction({
            appId,
            editorEnvironmentId: environmentId,
            editorVersionId: get().selectedVersion?.id,
          });
          selectedVersion = response.editorVersion;
          appVersionEnvironment = get().environments.find((env) => env.id === selectedVersion.currentEnvironmentId);

          // Set version from response and environment to the one passed in function (clicked environment)
          optionsToUpdate['selectedVersion'] = selectedVersion;
          optionsToUpdate['currentVersionId'] = selectedVersion.id;
          optionsToUpdate['appVersionEnvironment'] = appVersionEnvironment;
          optionsToUpdate['versionsPromotedToEnvironment'] = [selectedVersion];
          optionsToUpdate['selectedEnvironment'] = environment; // Use clicked environment, not the version's environment

          const { shouldRenderPromoteButton, shouldRenderReleaseButton } = calculatePromoteAndReleaseButtonVisibility(
            selectedVersion.id,
            environment, // Use clicked environment for button visibility
            useStore.getState().releasedVersionId,
            useStore.getState()?.license?.featureAccess
          );
          optionsToUpdate['shouldRenderPromoteButton'] = shouldRenderPromoteButton;
          optionsToUpdate['shouldRenderReleaseButton'] = shouldRenderReleaseButton;
        } else {
          // Version is available in target environment - just switch environment, keep same version
          optionsToUpdate['selectedEnvironment'] = environment;
          optionsToUpdate['appVersionEnvironment'] = environment;
        }
        set((state) => ({ ...state, ...optionsToUpdate }));
        get().setResolvedGlobals(
          'environment',
          { id: optionsToUpdate.appVersionEnvironment?.id, name: optionsToUpdate.appVersionEnvironment?.name },
          moduleId
        );
      }
      const callBackResponse = {
        selectedVersion,
        selectedEnvironment,
        selectedVersionDef,
      };
      if (_onSuccess && typeof _onSuccess === 'function') {
        _onSuccess(callBackResponse);
      }
    } catch (error) {
      toast.error('Failed to switch environment: ' + error?.message);
      if (_onFailure && typeof _onFailure === 'function') {
        _onFailure(error);
      }
    }
  },

  promoteAppVersionAction: async (versionId, onSuccess, onFailure, moduleId = 'canvas') => {
    try {
      const modules = useStore.getState().appStore.modules;
      const appId = modules.canvas?.app?.appId || modules.workflow?.app?.appId;

      const response = await appVersionService.promoteEnvironment(appId, versionId, get().selectedEnvironment.id);

      // Check if user has access to the promoted environment
      const hasAccessToPromotedEnv = response.hasAccessToPromotedEnvironment !== false; // default to true if not specified
      const promotedToEnvironment = response.promotedToEnvironment;

      set((state) => ({
        ...state,
        selectedEnvironment: response.editorEnvironment,
        appVersionEnvironment: response.editorEnvironment,
        environments: response.environments,
        appVersionsLazyLoaded: false,
        ...calculatePromoteAndReleaseButtonVisibility(
          versionId,
          response.editorEnvironment,
          useStore.getState().releasedVersionId,
          useStore.getState()?.license?.featureAccess
        ),
      }));
      get().setResolvedGlobals(
        'environment',
        { id: response.editorEnvironment?.id, name: response.editorEnvironment?.name },
        moduleId
      );

      const isModuleApp = get().appStore?.modules?.canvas?.app?.appType === 'module';
      if (isModuleApp) {
        get().fetchGlobalDataSources(
          get().appStore?.modules?.[moduleId]?.app?.organizationId,
          versionId,
          response.editorEnvironment?.id
        );

        if (response.editorEnvironment?.id) {
          const { constants } = await orgEnvironmentConstantService.getConstantsFromEnvironment(
            response.editorEnvironment.id
          );
          const orgConstants = {};
          const orgSecrets = {};
          constants.forEach((constant) => {
            if (constant.type !== 'Secret') {
              orgConstants[constant.name] = constant.value;
            } else {
              orgSecrets[constant.name] = constant.value;
            }
          });
          get().setResolvedConstants(orgConstants, moduleId);
          get().setSecrets(orgSecrets, moduleId);
        }

        get().initDependencyGraph(moduleId);
        get().dataQuery.runOnLoadQueries(moduleId);
      }

      onSuccess({
        selectedEnvironment: response.editorEnvironment,
        hasAccessToPromotedEnvironment: hasAccessToPromotedEnv,
        promotedToEnvironment: promotedToEnvironment,
      });
    } catch (error) {
      console.error(error);
      onFailure(error);
    }
  },

  setPreviewInitialEnvironmentId: (previewInitialEnvironmentId) => set({ previewInitialEnvironmentId }),

  setEnvironmentLoadingState: (loadingState) => set({ environmentLoadingState: loadingState }),

  getCanPromoteAndRelease: () => {
    const isVersionReleased = get().releasedVersionId === get().selectedVersion?.id;
    const isLastEnvironment = get().selectedEnvironment?.isDefault;
    const hasMultiEnvironmentAccess = get().license?.featureAccess?.multiEnvironment;
    const hasPromotePermission = authenticationService.currentSessionValue?.user_permissions?.app_promote;
    const hasReleasePermission = authenticationService.currentSessionValue?.user_permissions?.app_release;
    // MODULE apps are not gated by app-level promote/release permissions, but Build-with
    // (view-only) module users must still be blocked — isEditorReadOnly carries that signal.
    const isModuleApp = get().appStore?.modules?.canvas?.app?.appType === 'module';
    const isEditorReadOnly = get().isEditorReadOnly;
    return {
      canPromote: hasMultiEnvironmentAccess && !isLastEnvironment && !isVersionReleased,
      canRelease: !hasMultiEnvironmentAccess || isLastEnvironment || isVersionReleased,
      isPromoteVersionEnabled: !isEditorReadOnly && (isModuleApp || hasPromotePermission),
      isReleaseVersionEnabled: !isEditorReadOnly && (isModuleApp || hasReleasePermission),
    };
  },
  createDraftVersionAction: async (appId, selectedVersionId, onSuccess, onFailure, replace = false) => {
    // Callers must follow up with changeEditorVersionAction to actually switch the editor
    // onto the new version — it applies the full state (selectedVersion, freeze status,
    // pages/currentPageId) from a fresh getAppVersionData fetch, so only selectedEnvironment
    // is set provisionally here (changeEditorVersionAction doesn't touch it).
    // `replace` — git single-branch mode already has one synced draft tied to the default
    // branch; pass true to swap it instead of hitting the backend's single-draft guard.
    try {
      const editorEnvironment = get().selectedEnvironment.id;
      const newVersion = await appVersionService.createDraftVersion(
        appId,
        selectedVersionId,
        editorEnvironment,
        '',
        replace
      );
      // A new draft always starts on development, regardless of which environment its
      // source version was on — sync the header's environment display to match.
      set((state) => ({
        ...state,
        selectedEnvironment: get().environments.find(
          (environment) => environment.id === newVersion.current_environment_id
        ),
      }));
      onSuccess(newVersion);
    } catch (error) {
      onFailure(error);
    }
  },

  promoteVersionAction: async (appId, versionId, versionName, versionDescription, onSuccess, onFailure) => {
    try {
      const editorEnvironment = get().selectedEnvironment.id;
      const response = await appVersionService.save(appId, versionId, {
        name: versionName,
        description: versionDescription,
        status: 'PUBLISHED', // Promote from DRAFT to PUBLISHED
      });

      // After promotion, refresh the state
      const editorVersion = {
        id: response.id || versionId,
        name: versionName,
        current_environment_id: editorEnvironment,
      };

      set((state) => ({
        ...state,
        selectedVersion: editorVersion,
        currentVersionId: editorVersion.id,
        versionsPromotedToEnvironment: [editorVersion],
        appVersionsLazyLoaded: false,
        ...calculatePromoteAndReleaseButtonVisibility(
          editorVersion.id,
          get().selectedEnvironment,
          useStore.getState().releasedVersionId,
          useStore.getState()?.license?.featureAccess
        ),
      }));

      onSuccess(response);
    } catch (error) {
      console.error('Failed to promote version:', error);
      onFailure(error);
    }
  },

  releaseVersionAction: async (appId, versionId, environmentId, onSuccess, onFailure) => {
    try {
      const response = await appVersionService.releaseVersion(appId, versionId, environmentId);

      // Update released version ID in global state
      set((state) => ({
        ...state,
        releasedVersionId: versionId,
        appVersionsLazyLoaded: false,
        ...calculatePromoteAndReleaseButtonVisibility(
          get().selectedVersion.id,
          get().selectedEnvironment,
          versionId,
          useStore.getState()?.license?.featureAccess
        ),
      }));

      onSuccess(response);
    } catch (error) {
      console.error('Failed to release version:', error);
      onFailure(error);
    }
  },

  setIsPublicAccess: (isPublicAccess) => set({ isPublicAccess }),
  getIsPublicAccess: () => get().isPublicAccess,
});
// Helper functions
const calculatePromoteAndReleaseButtonVisibility = (
  selectedVersionId,
  selectedEnvironment,
  releasedVersionId,
  featureAccess
) => {
  const isVersionReleased = releasedVersionId === selectedVersionId;
  const isLastEnvironment = selectedEnvironment.isDefault;
  // need to make an api call here to check if the current user has promote and release permissions or not
  return {
    shouldRenderPromoteButton: featureAccess?.multiEnvironment && !isLastEnvironment && !isVersionReleased,
    shouldRenderReleaseButton: !featureAccess?.multiEnvironment || isLastEnvironment || isVersionReleased,
  };
};

const calculatePromoteAndReleaseButtonVisibilityForCreateNewVersion = (featureAccess) => {
  return {
    shouldRenderPromoteButton: featureAccess?.multiEnvironment,
    shouldRenderReleaseButton: !featureAccess?.multiEnvironment,
  };
};
