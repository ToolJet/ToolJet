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
        updateAppVersion: async (appId, versionId, pageId, appDefinitionDiff, isUserSwitchedVersion = false) => {
          return await appVersionService.autoSaveApp(
            appId,
            versionId,
            appDefinitionDiff.updateDiff,
            appDefinitionDiff.type,
            pageId,
            appDefinitionDiff.operation,
            isUserSwitchedVersion
          );
        },
        updateAppVersionEventHandlers: async (events) => {
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, events);

          const updatedEvents = get().events;

          updatedEvents.forEach((e, index) => {
            if (e.id === response[index].id) {
              updatedEvents[index] = response[index];
            }
          });

          console.log('----arpit should update events store', { updatedEvents, response });

          set(() => ({ events: updatedEvents }));
        },

        createAppVersionEventHandlers: async (event) => {
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;
          const response = await appVersionService.createAppVersionEventHandler(appId, versionId, event);
          updatedEvents.push(response);

          set(() => ({ events: updatedEvents }));
        },

        deleteAppVersionEventHandler: async (eventId) => {
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;

          const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);

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

// if (operation === 'delete') {
//   const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);
//   const updatedEvents = get().events.filter((e) => e.id !== response.id);
//   set(() => ({ events: updatedEvents }));
// }
