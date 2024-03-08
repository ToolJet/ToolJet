import { appVersionService } from '@/_services';
import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';
import { useResolveStore } from './resolverStore';
import { useEditorStore } from './editorStore';
import { useDataQueriesStore } from './dataQueriesStore';
import _ from 'lodash';
import { handleReferenceTransactions } from './handleReferenceTransactions';

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
  areOthersOnSameVersionAndPage: false,
  appVersionPreviewLink: null,
  metadata: null,
  eventsUpdatedLoader: false,
  eventsCreatedLoader: false,
  actionsUpdatedLoader: false,
  eventToDeleteLoaderIndex: null,
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
          return new Promise((resolve, reject) => {
            useAppDataStore.getState().actions.setIsSaving(true);
            const isComponentCutProcess = get().appDiffOptions?.componentCut === true;

            let updateDiff = appDefinitionDiff.updateDiff;

            if (appDefinitionDiff.operation === 'update') {
              updateDiff = useResolveStore.getState().actions.findReferences(updateDiff);
            }

            appVersionService
              .autoSaveApp(
                appId,
                versionId,
                updateDiff,
                appDefinitionDiff.type,
                pageId,
                appDefinitionDiff.operation,
                isUserSwitchedVersion,
                isComponentCutProcess
              )
              .then(() => {
                useAppDataStore.getState().actions.setIsSaving(false);
              })
              .catch((error) => {
                useAppDataStore.getState().actions.setIsSaving(false);
                reject(error);
              })
              .finally(() => resolve());
          });
        },
        updateAppVersionEventHandlers: async (events, updateType = 'update', param) => {
          useAppDataStore.getState().actions.setIsSaving(true);
          if (param === 'actionId') {
            set({ actionsUpdatedLoader: true });
          }
          if (param === 'eventId') {
            set({ eventsUpdatedLoader: true });
          }
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, events, updateType);

          useAppDataStore.getState().actions.setIsSaving(false);
          set({ eventsUpdatedLoader: false, actionsUpdatedLoader: false });
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
          set({ eventsCreatedLoader: true });

          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;
          const response = await appVersionService.createAppVersionEventHandler(appId, versionId, event);
          useAppDataStore.getState().actions.setIsSaving(false);
          set({ eventsCreatedLoader: false });

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

          set({ eventToDeleteLoaderIndex: null });
          if (response?.affected === 1) {
            updatedEvents.splice(
              updatedEvents.findIndex((e) => e.id === eventId),
              1
            );

            set(() => ({ events: updatedEvents }));
          }
        },
        autoUpdateEventStore: async (versionId) => {
          const appId = get().appId;
          const response = await appVersionService.findAllEventsWithSourceId(appId, versionId);

          set(() => ({ events: response }));
        },
        setIsSaving: (isSaving) => set(() => ({ isSaving })),
        setAppId: (appId) => set(() => ({ appId })),
        setAppPreviewLink: (appVersionPreviewLink) => set(() => ({ appVersionPreviewLink })),
        setComponents: (components) => set(() => ({ components })),
        setMetadata: (metadata) => set(() => ({ metadata })),
        setEventToDeleteLoaderIndex: (index) => set(() => ({ eventToDeleteLoaderIndex: index })),
      },
    }),
    { name: 'App Data Store' }
  )
);

const itemToObserve = 'appDiffOptions';

useAppDataStore.subscribe(
  (state) => {
    const isComponentNameUpdated = state[itemToObserve]?.componentNameUpdated;

    const { appDefinition, currentPageId, isUpdatingEditorStateInProcess } = useEditorStore.getState();
    const { dataQueries } = useDataQueriesStore.getState();

    if (isComponentNameUpdated && !isUpdatingEditorStateInProcess) {
      const components = JSON.parse(JSON.stringify(state.components));
      const _dataQueries = JSON.parse(JSON.stringify(dataQueries));
      const currentAppEvents = JSON.parse(JSON.stringify(state.events));
      const updatedNames = [];

      const referenceManager = useResolveStore.getState().referenceMapper;

      components.forEach((component) => {
        const existingName = referenceManager.get(component.id);

        if (existingName === component.name) {
          return;
        }

        referenceManager.update(component.id, component.name);

        updatedNames.push({
          id: component.id,
          name: existingName,
          newName: component.name,
          type: 'components',
        });
      });

      handleReferenceTransactions(
        components,
        _dataQueries,
        currentAppEvents,
        appDefinition,
        currentPageId,
        state.currentVersionId,
        updatedNames
      );
    }
  },
  (state) => [state[itemToObserve]]
);

export const useEditingVersion = () => useAppDataStore((state) => state.editingVersion, shallow);
export const useIsSaving = () => useAppDataStore((state) => state.isSaving, shallow);
export const useUpdateEditingVersion = () => useAppDataStore((state) => state.actions, shallow);
export const useCurrentUser = () => useAppDataStore((state) => state.currentUser, shallow);
export const useAppInfo = () => useAppDataStore((state) => state);
export const useAppDataActions = () => useAppDataStore((state) => state.actions, shallow);
