import create from 'zustand';
import { zustandDevTools } from './utils';
import { appEnvironmentService } from '../_services/app_environment.service';

const initialState = {
  selectedVersion: null,
  selectedEnvironment: null,
  appVersionEnvironment: null,
  versionsPromotedToEnvironment: [],
  environments: [],
  shouldRenderPromoteButton: false,
  shouldRenderReleaseButton: false,
  initializedEnvironmentDropdown: false,
  initializedVersionsDropdown: false,
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
      },
    }),
    { name: 'App Version Manager Store' }
  )
);

export const useEnvironmentsAndVersionsActions = () => useEnvironmentsAndVersionsStore((state) => state.actions);
