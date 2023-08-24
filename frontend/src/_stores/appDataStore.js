import { appVersionService } from '@/_services';
import { create, zustandDevTools } from './utils';

const initialState = {
  editingVersion: null,
  currentUser: null,
  apps: [],
  appName: null,
  slug: null,
  isPublic: null,
  isMaintenanceOn: null,
  organizationId: null,
  currentVersionId: null,
  userId: null,
  app: {},
  components: [],
  pages: [],
  layouts: [],
  events: [],
  eventHandlers: [],
  appDefinitionDiff: null,
  appDiffOptions: {},
  isSaving: false,
  appId: null,
};

export const useAppDataStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        updateEditingVersion: (version) => set(() => ({ editingVersion: version })),
        updateApps: (apps) => set(() => ({ apps: apps })),
        updateState: (state) => set((prev) => ({ ...prev, ...state })),
        updateAppDefinitionDiff: (appDefinitionDiff) => set(() => ({ appDefinitionDiff: appDefinitionDiff })),
        updateAppVersion: (appId, versionId, pageId, appDefinitionDiff, isUserSwitchedVersion = false) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          appVersionService
            .autoSaveApp(
              appId,
              versionId,
              appDefinitionDiff.updateDiff,
              appDefinitionDiff.type,
              pageId,
              appDefinitionDiff.operation,
              isUserSwitchedVersion
            )
            .then(() => {
              useAppDataStore.getState().actions.setIsSaving(false);
            });
        },
        updateAppVersionEventHandlers: async (events) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, events);

          useAppDataStore.getState().actions.setIsSaving(false);
          const updatedEvents = get().events;

          updatedEvents.forEach((e, index) => {
            const toUpdate = response.find((r) => r.id === e.id);
            if (toUpdate) {
              updatedEvents[index] = toUpdate;
            }
          });

          set(() => ({ events: updatedEvents }));
        },

        createAppVersionEventHandlers: async (event) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;
          const response = await appVersionService.createAppVersionEventHandler(appId, versionId, event);
          useAppDataStore.getState().actions.setIsSaving(false);
          updatedEvents.push(response);

          set(() => ({ events: updatedEvents }));
        },

        deleteAppVersionEventHandler: async (eventId) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;

          const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);
          useAppDataStore.getState().actions.setIsSaving(false);
          if (response?.affected === 1) {
            updatedEvents.splice(
              updatedEvents.findIndex((e) => e.id === eventId),
              1
            );

            set(() => ({ events: updatedEvents }));
          }
        },

        setIsSaving: (isSaving) => set(() => ({ isSaving })),
        setAppId: (appId) => set(() => ({ appId })),
      },
    }),
    { name: 'App Data Store' }
  )
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion);
export const useIsSaving = () => useAppDataStore((state) => state.isSaving);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions);
export const useCurrentUser = () => useAppDataStore((state) => state.currentUser);
export const useAppInfo = () => useAppDataStore((state) => state);
export const useAppDataActions = () => useAppDataStore((state) => state.actions);
