import { appEnvironmentService, appVersionService, authenticationService } from '@/_services';
import useStore from '@/AppBuilder/_stores/store';
import toast from 'react-hot-toast';
import {
  getEnvironmentAccessFromPermissions,
  hasEnvironmentAccess,
  getSafeEnvironment,
} from '@/_helpers/environmentAccess';

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

      const hasEditPermission =
        app_group_permissions?.is_all_editable || (appId && app_group_permissions?.editable_apps_id?.includes(appId));

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
        // Skip this check if user is owner requesting development
        const skipAccessCheck = isOwner && requestedEnvName === 'development';

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

      set((state) => ({
        ...state,
        selectedEnvironment,
        selectedVersion: response.editorVersion,
        appVersionEnvironment: response.appVersionEnvironment,
        shouldRenderPromoteButton: response.shouldRenderPromoteButton,
        shouldRenderReleaseButton: response.shouldRenderReleaseButton,
        environments: response.environments,
        versionsPromotedToEnvironment: [response.editorVersion],
      }));
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
      current_environment_id: newVersion.current_environment_id,
      status: newVersion.status,
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
    onFailure
  ) => {
    try {
      const editorEnvironment = get().selectedEnvironment.id;
      const newVersion = await appVersionService.create(
        appId,
        versionName,
        versionDescription,
        selectedVersionId,
        editorEnvironment
      );
      const editorVersion = {
        id: newVersion.id,
        name: newVersion.name,
        current_environment_id: newVersion.current_environment_id,
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

  deleteVersionAction: async (appId, versionId, onSuccess, onFailure) => {
    try {
      // Delete versions
      await appVersionService.del(appId, versionId);

      // Delete version from every environment
      const response = await appEnvironmentService.postVersionDeleteAction({
        appId,
        editorVersionId: versionId,
        deletedVersionId: versionId,
        editorEnvironmentId: get().selectedEnvironment.id,
      });
      const editorVersion = response.editorVersion;

      set((state) => {
        const newState = {
          versionsPromotedToEnvironment: [editorVersion],
          appVersionsLazyLoaded: false,
          selectedEnvironment: response.editorEnvironment,
          appVersionEnvironment: response.appVersionEnvironment,
          environments: response?.environments?.length ? response.environments : get().environments,
        };

        if (state.selectedVersion?.id === versionId) {
          const newSelectedVersion = editorVersion; // last version can't be deleted
          newState.selectedVersion = newSelectedVersion;
          newState.currentVersionId = newSelectedVersion.id;
        }

        return newState;
      });

      onSuccess();
    } catch (error) {
      console.error('Error in deleteVersionAction:', error);
      onFailure(error);
    }
  },
  changeEditorVersionAction: async (appId, versionId, onSuccess, onFailure) => {
    try {
      const data = await appVersionService.getAppVersionData(appId, versionId, get().currentMode);
      const selectedVersion = {
        id: data.editing_version.id,
        name: data.editing_version.name,
        current_environment_id: data.editing_version.currentEnvironmentId,
        status: data.editing_version.status,
      };
      const appVersionEnvironment = get().environments.find(
        (environment) => environment.id === selectedVersion.current_environment_id
      );
      let updatedVersionsArray = [...get().versionsPromotedToEnvironment];
      const versionIndex = get().versionsPromotedToEnvironment.findIndex((v) => v.id === data?.editing_version?.id);
      if (versionIndex !== -1 && data?.editing_version) {
        updatedVersionsArray[versionIndex] = data?.editing_version;
      }
      let optionsToUpdate = {
        selectedVersion,
        appVersionEnvironment,
        versionsPromotedToEnvironment: [...updatedVersionsArray],
        ...calculatePromoteAndReleaseButtonVisibility(
          selectedVersion.id,
          get().selectedEnvironment,
          useStore.getState().releasedVersionId,
          useStore.getState()?.license?.featureAccess
        ),
      };
      set((state) => ({ ...state, ...optionsToUpdate }));
      onSuccess(data);
    } catch (error) {
      onFailure(error);
    }
  },

  environmentChangedAction: async (environment, _onSuccess, _onFailure) => {
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
          const { appId } = useStore.getState().appStore.modules.canvas.app;
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

  promoteAppVersionAction: async (versionId, onSuccess, onFailure) => {
    try {
      const { appId } = useStore.getState().appStore.modules.canvas.app;

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
    return {
      canPromote: hasMultiEnvironmentAccess && !isLastEnvironment && !isVersionReleased,
      canRelease: !hasMultiEnvironmentAccess || isLastEnvironment || isVersionReleased,
      isPromoteVersionEnabled: hasPromotePermission,
      isReleaseVersionEnabled: hasReleasePermission,
    };
  },
  createDraftVersionAction: async (appId, selectedVersionId, onSuccess, onFailure) => {
    try {
      const editorEnvironment = get().selectedEnvironment.id;
      const newVersion = await appVersionService.createDraftVersion(appId, selectedVersionId, editorEnvironment);
      const editorVersion = {
        id: newVersion.id,
        name: newVersion.name,
        current_environment_id: newVersion.current_environment_id,
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
