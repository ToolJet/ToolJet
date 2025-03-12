import { appVersionService } from '@/_services';
import { create, findAllEntityReferences, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';
import { useResolveStore } from './resolverStore';
import { useEditorStore } from './editorStore';
import { useDataQueriesStore } from './dataQueriesStore';
import _ from 'lodash';
import { dfs, handleReferenceTransactions } from './handleReferenceTransactions';
import { isValidUUID } from '@/_helpers/utils';
import toast from 'react-hot-toast';

const initialState = {
  editingVersion: null,
  currentUser: null,
  apps: [],
  appName: null,
  slug: null,
  creationMode: 'DEFAULT',
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
  isTJDarkMode: localStorage.getItem('darkMode') === 'true',
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
            get().actions.setIsSaving(true);
            const isComponentCutProcess = get().appDiffOptions?.componentCut === true;

            let updateDiff = appDefinitionDiff.updateDiff;

            if (appDefinitionDiff.operation === 'update' || appDefinitionDiff.operation === 'create') {
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
                get().actions.setIsSaving(false);
              })
              .catch((error) => {
                get().actions.setIsSaving(false);
                reject(error);
              })
              .finally(() => resolve());
          });
        },
        updateAppVersionEventHandlers: async (events, updateType = 'update', param) => {
          get().actions.setIsSaving(true);
          if (param === 'actionId') {
            set({ actionsUpdatedLoader: true });
          }
          if (param === 'eventId') {
            set({ eventsUpdatedLoader: true });
          }
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const entityIdMappingData = useResolveStore.getState().actions.findReferences(events);

          const response = await appVersionService.saveAppVersionEventHandlers(
            appId,
            versionId,
            entityIdMappingData,
            updateType
          );

          get().actions.setIsSaving(false);
          set({ eventsUpdatedLoader: false, actionsUpdatedLoader: false });
          const updatedEvents = get().events;

          updatedEvents.forEach((e, index) => {
            const toUpdate = response.find((r) => r.id === e.id);
            if (toUpdate) {
              updatedEvents[index] = toUpdate;
            }
          });

          const entityReferencesInEvents = findAllEntityReferences(updatedEvents, [])?.filter(
            (entity) => entity && isValidUUID(entity)
          );

          const manager = useResolveStore.getState().referenceMapper;
          let newEvents = JSON.parse(JSON.stringify(updatedEvents));

          entityReferencesInEvents.forEach((entity) => {
            const entityrefExists = manager.has(entity);

            if (entityrefExists) {
              const value = manager.get(entity);
              newEvents = dfs(newEvents, entity, value);
            }
          });

          set(() => ({ events: newEvents }));
        },

        createAppVersionEventHandlers: async (event) => {
          get().actions.setIsSaving(true);
          set({ eventsCreatedLoader: true });

          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;
          appVersionService
            .createAppVersionEventHandler(appId, versionId, event)
            .then((response) => {
              get().actions.setIsSaving(false);
              set({ eventsCreatedLoader: false });

              updatedEvents.push(response);

              set(() => ({ events: updatedEvents }));
            })
            .catch((err) => {
              get().actions.setIsSaving(false);
              set({ eventsCreatedLoader: false });

              toast.error(err?.error || 'An error occurred while creating the event handler');
            });
        },

        deleteAppVersionEventHandler: async (eventId) => {
          get().actions.setIsSaving(true);
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const updatedEvents = get().events;

          const response = await appVersionService.deleteAppVersionEventHandler(appId, versionId, eventId);
          get().actions.setIsSaving(false);

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
        updateIsTJDarkMode: (isTJDarkMode) => set({ isTJDarkMode }),
      },
    }),
    { name: 'App Data Store' }
  )
);

const itemToObserve = 'appDiffOptions';

useAppDataStore.subscribe(
  (state) => {
    const isComponentNameUpdated = state[itemToObserve]?.componentNameUpdated;

    if (!isComponentNameUpdated) return;

    const { appDefinition, currentPageId, isUpdatingEditorStateInProcess } = useEditorStore.getState();
    const { dataQueries } = useDataQueriesStore.getState();

    if (isComponentNameUpdated && !isUpdatingEditorStateInProcess) {
      const components = JSON.parse(JSON.stringify(state.components));
      const _dataQueries = JSON.parse(JSON.stringify(dataQueries));
      const currentAppEvents = JSON.parse(JSON.stringify(state.events));
      const updatedNames = [];

      const referenceManager = useResolveStore.getState().referenceMapper;

      Object.entries(state.components).forEach(([id, component]) => {
        const existingName = referenceManager.get(id);

        if (existingName === component.component.name) {
          return;
        }

        referenceManager.update(id, component.component.name);

        updatedNames.push({
          id: id,
          name: existingName,
          newName: component.component.name,
          type: 'components',
        });
      });

      if (updatedNames.length === 0) return;

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
