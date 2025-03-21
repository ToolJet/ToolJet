import create from 'zustand';
import { zustandDevTools } from './utils';
import { appEnvironmentService, appVersionService } from '@/_services';
import { useAppDataStore } from './appDataStore';
import { useAppVersionStore } from './appVersionStore';
import { useEditorStore } from './editorStore';

const initialState = {
  selectedVersion: null,
  selectedEnvironment: null,
  appVersionEnvironment: null,
  versionsPromotedToEnvironment: [],
  environments: [],
  shouldRenderPromoteButton: false,
  shouldRenderReleaseButton: false,
  initializedEnvironmentDropdown: false,
  environmentsLazyLoaded: false,
  appVersionsLazyLoaded: false,
  previewInitialEnvironmentId: null,
  developmentVersions: [],
};

export const useEnvironmentsAndVersionsStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        init: async (editingVersionId) => {
          try {
            const response = await appEnvironmentService.init(editingVersionId);
            const previewInitialEnvironmentId = get().previewInitialEnvironmentId;
            let selectedEnvironment = response.editorEnvironment;
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
            console.error('Error while initializing the environment dropdown', error);
          }
        },
        setEnvironmentDropdownStatus: (state) => set({ initializedEnvironmentDropdown: state }),

        fetchDevelopmentVersions: async (appId) => {
          const developmentEnvironmentId = get().environments.find(
            (environment) => environment.name === 'development'
          ).id;

          try {
            const response = await appEnvironmentService.getVersionsByEnvironment(appId, developmentEnvironmentId);
            set((state) => ({
              ...state,
              developmentVersions: response.appVersions,
            }));
          } catch (error) {
            console.error('Error while getting the versions', error);
          }
        },

        lazyLoadAppVersions: async (appId) => {
          try {
            const response = await appEnvironmentService.getVersionsByEnvironment(appId, get().selectedEnvironment.id);
            set((state) => ({
              ...state,
              versionsPromotedToEnvironment: response.appVersions,
              appVersionsLazyLoaded: true,
            }));
          } catch (error) {
            console.error('Error while getting the versions', error);
          }
        },
        setSelectedVersion: (selectedVersion) => set({ selectedVersion }),
        setEnvironmentAndVersionsInitStatus: (state) => set({ completedEnvironmentAndVersionsInit: state }),
        createNewVersionAction: async (appId, versionName, selectedVersionId, onSuccess, onFailure) => {
          try {
            const editorEnvironment = get().selectedEnvironment.id;
            const newVersion = await appVersionService.create(appId, versionName, selectedVersionId, editorEnvironment);
            const editorVersion = {
              id: newVersion.id,
              name: newVersion.name,
              current_environment_id: newVersion.current_environment_id,
            };
            set((state) => ({
              ...state,
              selectedVersion: editorVersion,
              //Switch back to development env
              selectedEnvironment: get().environments.find(
                (environment) => environment.id === editorVersion.current_environment_id
              ),
              versionsPromotedToEnvironment: [editorVersion],
              appVersionsLazyLoaded: false,
              appVersionEnvironment: get().environments.find(
                (environment) => environment.id === editorVersion.current_environment_id
              ),
              ...calculatePromoteAndReleaseButtonVisibilityForCreateNewVersion(),
            }));
            onSuccess(newVersion);
          } catch (error) {
            onFailure(error);
          }
        },
        updateVersionNameAction: async (appId, versionId, versionName, onSuccess, onFailure) => {
          try {
            await appVersionService.save(appId, versionId, { name: versionName });
            const selectedVersion = get().selectedVersion;
            selectedVersion.name = versionName;
            set((state) => ({
              ...state,
              selectedVersion,
              versionsPromotedToEnvironment: [selectedVersion],
              appVersionsLazyLoaded: false,
            }));
            onSuccess();
          } catch (error) {
            onFailure(error);
          }
        },
        deleteVersionAction: async (appId, versionId, onSuccess, onFailure) => {
          try {
            await appVersionService.del(appId, versionId);
            const isCurrentVersion = get().selectedVersion.id === versionId;
            let newVersionDef;
            let optionsToUpdate = {
              appVersionsLazyLoaded: false,
            };
            if (isCurrentVersion) {
              /* User is deleted the editor version (currently selected).  */
              const response = await appEnvironmentService.postVersionDeleteAction({
                appId,
                editorVersionId: versionId,
                deletedVersionId: versionId,
                editorEnvironmentId: get().selectedEnvironment.id,
              });
              const selectedVersion = response.editorVersion;
              const selectedEnvironment = response.editorEnvironment;
              optionsToUpdate = {
                ...optionsToUpdate,
                selectedVersion,
                selectedEnvironment,
                appVersionEnvironment: response.appVersionEnvironment,
                versionsPromotedToEnvironment: [selectedVersion],
                environments: response.environments,
                ...calculatePromoteAndReleaseButtonVisibility(selectedVersion.id, selectedEnvironment),
              };
              /* Setting for editorRef */
              useEditorStore.getState().actions.setCurrentAppEnvironmentId(selectedEnvironment.id);
              const newEditorVersion = optionsToUpdate.selectedVersion;
              if (newEditorVersion) {
                newVersionDef = await appVersionService.getAppVersionData(appId, newEditorVersion.id);
              }
            }
            set((state) => ({
              ...state,
              ...optionsToUpdate,
            }));
            onSuccess(newVersionDef);
          } catch (error) {
            onFailure(error);
          }
        },
        changeEditorVersionAction: async (appId, versionId, onSuccess, onFailure) => {
          try {
            const data = await appVersionService.getAppVersionData(appId, versionId);
            const selectedVersion = {
              id: data.editing_version.id,
              name: data.editing_version.name,
              current_environment_id: data.editing_version.currentEnvironmentId,
            };
            const appVersionEnvironment = get().environments.find(
              (environment) => environment.id === selectedVersion.current_environment_id
            );
            let optionsToUpdate = {
              selectedVersion,
              appVersionEnvironment,
              ...calculatePromoteAndReleaseButtonVisibility(selectedVersion.id, get().selectedEnvironment),
            };
            set((state) => ({ ...state, ...optionsToUpdate }));
            onSuccess(data);
          } catch (error) {
            onFailure(error);
          }
        },
        environmentChangedAction: async (environment, onSuccess, onFailure) => {
          try {
            const environmentId = environment.id;
            let selectedVersion;
            let selectedEnvironment;
            let selectedVersionDef;
            if (get().selectedEnvironment.id !== environmentId) {
              selectedEnvironment = environment;
              let optionsToUpdate = {
                selectedEnvironment,
                appVersionsLazyLoaded: false,
                ...calculatePromoteAndReleaseButtonVisibility(get().selectedVersion.id, environment),
              };

              const versionIsAvailableInEnvironment = environment.priority <= get().appVersionEnvironment.priority;
              if (!versionIsAvailableInEnvironment) {
                /* Call POST api to get the new version from the server */
                const appId = useAppDataStore.getState().appId;
                const response = await appEnvironmentService.postEnvironmentChangedAction({
                  appId,
                  editorEnvironmentId: environmentId,
                });
                selectedVersion = response.editorVersion;
                const appVersionEnvironment = get().environments.find(
                  (environment) => environment.id === selectedVersion.current_environment_id
                );
                selectedVersionDef = await appVersionService.getAppVersionData(appId, selectedVersion.id);
                optionsToUpdate['selectedVersion'] = selectedVersion;
                optionsToUpdate['appVersionEnvironment'] = appVersionEnvironment;
                optionsToUpdate['versionsPromotedToEnvironment'] = [selectedVersion];
                const { shouldRenderPromoteButton, shouldRenderReleaseButton } =
                  calculatePromoteAndReleaseButtonVisibility(selectedVersion.id, environment);
                optionsToUpdate['shouldRenderPromoteButton'] = shouldRenderPromoteButton;
                optionsToUpdate['shouldRenderReleaseButton'] = shouldRenderReleaseButton;
              }
              set((state) => ({ ...state, ...optionsToUpdate }));
            }
            const callBackResponse = {
              selectedVersion,
              selectedEnvironment,
              selectedVersionDef,
            };
            onSuccess(callBackResponse);
          } catch (error) {
            onFailure(error);
          }
        },
        promoteAppVersionAction: async (versionId, onSuccess, onFailure) => {
          try {
            const appId = useAppDataStore.getState().appId;
            const response = await appVersionService.promoteEnvironment(appId, versionId, get().selectedEnvironment.id);
            set((state) => ({
              ...state,
              selectedEnvironment: response.editorEnvironment,
              appVersionEnvironment: response.editorEnvironment,
              environments: response.environments,
              appVersionsLazyLoaded: false,
              ...calculatePromoteAndReleaseButtonVisibility(versionId, response.editorEnvironment),
            }));
            onSuccess({
              selectedEnvironment: response.editorEnvironment,
            });
          } catch (error) {
            onFailure(error);
          }
        },
        setPreviewInitialEnvironmentId: (previewInitialEnvironmentId) => set({ previewInitialEnvironmentId }),
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

const calculatePromoteAndReleaseButtonVisibility = (selectedVersionId, selectedEnvironment) => {
  const isVersionReleased = useAppVersionStore.getState().releasedVersionId === selectedVersionId;
  const isLastEnvironment = selectedEnvironment.isDefault;
  const featureAccess = useEditorStore.getState().featureAccess;

  return {
    shouldRenderPromoteButton: featureAccess?.multiEnvironment && !isLastEnvironment && !isVersionReleased,
    shouldRenderReleaseButton: !featureAccess?.multiEnvironment || isLastEnvironment || isVersionReleased,
  };
};

const calculatePromoteAndReleaseButtonVisibilityForCreateNewVersion = () => {
  const featureAccess = useEditorStore.getState().featureAccess;

  return {
    shouldRenderPromoteButton: featureAccess?.multiEnvironment,
    shouldRenderReleaseButton: !featureAccess?.multiEnvironment,
  };
};

export const useEnvironmentsAndVersionsActions = () => useEnvironmentsAndVersionsStore((state) => state.actions);
