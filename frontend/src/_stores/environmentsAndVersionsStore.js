import create from 'zustand';
import { zustandDevTools } from './utils';
import { appEnvironmentService, appVersionService } from '@/_services';

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
};

export const useEnvironmentsAndVersionsStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        init: async (editingVersionId) => {
          try {
            const response = await appEnvironmentService.init(editingVersionId);
            set((state) => ({
              ...state,
              selectedEnvironment: response.editorEnvironment,
              selectedVersion: response.editorVersion,
              appVersionEnvironment: response.appVersionEnvironment,
              shouldRenderPromoteButton: response.shouldRenderPromoteButton,
              shouldRenderReleaseButton: response.shouldRenderReleaseButton,
              environments: [response.editorEnvironment],
              versionsPromotedToEnvironment: [response.editorVersion],
            }));
          } catch (error) {
            console.error('Error while initializing the environment dropdown', error);
          }
        },
        setEnvironmentDropdownStatus: (state) => set({ initializedEnvironmentDropdown: state }),
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
        createNewVersion: async (appId, versionName, selectedVersionId, onSuccess, onFailure) => {
          try {
            const newVersion = await appVersionService.create(appId, versionName, selectedVersionId);
            const editorVersion = {
              id: newVersion.id,
              name: newVersion.name,
              current_environment_id: newVersion.current_environment_id,
            };
            set((state) => ({
              ...state,
              selectedVersion: editorVersion,
              versionsPromotedToEnvironment: [editorVersion],
              appVersionsLazyLoaded: false,
            }));
            onSuccess(newVersion);
          } catch (error) {
            onFailure(error);
          }
        },
        updateVersionName: async (appId, versionId, versionName, onSuccess, onFailure) => {
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
        deleteVersion: async (appId, versionId, onSuccess, onFailure) => {
          try {
            await appVersionService.del(appId, versionId);
            const isCurrentVersion = get().selectedVersion.id === versionId;
            let optionsToUpdate = {
              appVersionsLazyLoaded: false,
            };
            if (isCurrentVersion) {
              /* User is deleted the editor version (currently selected).  */
              const response = await appEnvironmentService.postVersionDeleteAction({
                appId,
                editorVersionId: versionId,
                deletedVersionId: versionId,
              });
              optionsToUpdate = {
                ...optionsToUpdate,
                selectedVersion: response.editorVersion,
                selectedEnvironment: response.editorEnvironment,
                appVersionEnvironment: response.appVersionEnvironment,
                shouldRenderPromoteButton: response.shouldRenderPromoteButton,
                shouldRenderReleaseButton: response.shouldRenderReleaseButton,
              };
            }
            set((state) => ({
              ...state,
              ...optionsToUpdate,
            }));
            onSuccess();
          } catch (error) {
            onFailure(error);
          }
        },
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

export const useEnvironmentsAndVersionsActions = () => useEnvironmentsAndVersionsStore((state) => state.actions);
