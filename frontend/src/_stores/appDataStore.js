import { appVersionService } from '@/_services';
import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';
import { useResolveStore } from './resolverStore';
import { useEditorStore } from './editorStore';

function dfs(node, oldRef, newRef) {
  if (typeof node === 'object') {
    for (let key in node) {
      const value = node[key];
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const referenceExists = value.includes(oldRef);

        if (referenceExists) {
          node[key] = value.replace(oldRef, newRef);
        }
      } else if (typeof value === 'object') {
        dfs(value, oldRef, newRef); // Recursive exploration
      }
    }
  }

  return node;
}

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

            appVersionService
              .autoSaveApp(
                appId,
                versionId,
                appDefinitionDiff.updateDiff,
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
        updateAppVersionEventHandlers: async (events, updateType = 'update') => {
          useAppDataStore.getState().actions.setIsSaving(true);
          const appId = get().appId;
          const versionId = get().currentVersionId;

          const response = await appVersionService.saveAppVersionEventHandlers(appId, versionId, events, updateType);

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
        autoUpdateEventStore: async (versionId) => {
          const appId = get().appId;
          const response = await appVersionService.findAllEventsWithSourceId(appId, versionId);

          set(() => ({ events: response }));
        },
        setIsSaving: (isSaving) => set(() => ({ isSaving })),
        setAppId: (appId) => set(() => ({ appId })),
        setAppPreviewLink: (appVersionPreviewLink) => set(() => ({ appVersionPreviewLink })),
        setComponents: (components) => set(() => ({ components })),
      },
    }),
    { name: 'App Data Store' }
  )
);

const itemToObserve = 'appDiffOptions';

useAppDataStore.subscribe(
  (state) => {
    const isComponentNameUpdated = state[itemToObserve]?.componentNameUpdated;

    if (isComponentNameUpdated) {
      const components = JSON.parse(JSON.stringify(state.components));
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
        });
      });

      updatedNames.forEach((component) => {
        components.forEach((c) => {
          c.definition = dfs(c.definition, component.name, component.newName);
        });
      });

      const { appDefinition, currentPageId } = useEditorStore.getState();

      const newAppDefinition = JSON.parse(JSON.stringify(appDefinition));

      const componentsFromAppDef = newAppDefinition.pages[currentPageId].components;

      components.forEach((component) => {
        componentsFromAppDef[component.id].component.definition = component.definition;
      });

      newAppDefinition.pages[currentPageId].components = componentsFromAppDef;

      useEditorStore.getState().actions.updateEditorState({
        appDefinition: newAppDefinition,
      });
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
