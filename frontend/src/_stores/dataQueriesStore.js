import { create, zustandDevTools } from './utils';
import { getDefaultOptions } from './storeHelper';
import { dataqueryService } from '@/_services';
// import debounce from 'lodash/debounce';
import { useAppDataStore } from '@/_stores/appDataStore';
import { useQueryPanelStore } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { runQueries } from '@/_helpers/appUtils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import _, { isEmpty, throttle } from 'lodash';
import { useEditorStore } from './editorStore';
import { shallow } from 'zustand/shallow';
import { getCurrentState, useCurrentStateStore } from './currentStateStore';

const initialState = {
  dataQueries: [],
  sortBy: 'updated_at',
  sortOrder: 'desc',
  loadingDataQueries: true,
  isDeletingQueryInProcess: false,
  /** TODO: Below two params are primarily used only for websocket invocation post update. Can be removed onece websocket logic is revamped */
  // isCreatingQueryInProcess: false,
  creatingQueryInProcessId: null,
  isUpdatingQueryInProcess: false,
  /** When a 'Create Data Query' operation is in progress, rename/update API calls are cached in the variable. */
  queuedActions: {},
};

export const useDataQueriesStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        // TODO: Remove editor state while changing currentState
        fetchDataQueries: async (appVersionId, selectFirstQuery = false, runQueriesOnAppLoad = false, ref) => {
          set({ loadingDataQueries: true });
          const data = await dataqueryService.getAll(appVersionId);
          set((state) => ({
            dataQueries: sortByAttribute(data.data_queries, state.sortBy, state.sortOrder),
            loadingDataQueries: false,
          }));

          if (data.data_queries.length !== 0) {
            const queryConfirmationList = [];
            const updatedQueries = {};
            const currentQueries = useCurrentStateStore.getState().queries;

            data.data_queries.forEach(({ id, name, options }) => {
              updatedQueries[name] = _.merge(currentQueries[name], { id: id, isLoading: false, data: [], rawData: [] });

              if (options && options?.requestConfirmation && options?.runOnPageLoad) {
                queryConfirmationList.push({ queryId: id, queryName: name });
              }
            });

            if (queryConfirmationList.length !== 0) {
              useEditorStore.getState().actions.updateQueryConfirmationList(queryConfirmationList);
            }

            useCurrentStateStore.getState().actions.setCurrentState({
              ...getCurrentState(),
              queries: updatedQueries,
            });
          }

          // Compute query state to be added in the current state
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          if (selectFirstQuery) {
            actions.setSelectedQuery(data.data_queries[0]?.id, data.data_queries[0]);
          } else if (selectedQuery?.id) {
            const query = data.data_queries.find((query) => query.id === selectedQuery?.id);
            actions.setSelectedQuery(query?.id);
          }

          // Runs query on loading application
          if (runQueriesOnAppLoad) runQueries(data.data_queries, ref);
        },
        setDataQueries: (dataQueries) => set({ dataQueries }),
        deleteDataQueries: (queryId) => {
          set({ isDeletingQueryInProcess: true });
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .del(queryId)
            .then(() => {
              const { actions } = useQueryPanelStore.getState();
              const { dataQueries } = useDataQueriesStore.getState();
              const newSelectedQuery = dataQueries.find((query) => query.id !== queryId);
              actions.setSelectedQuery(newSelectedQuery?.id || null);
              if (!newSelectedQuery?.id) {
                actions.setSelectedDataSource(null);
              }
              set((state) => ({
                isDeletingQueryInProcess: false,
                dataQueries: state.dataQueries.filter((query) => query.id !== queryId),
              }));

              const currentQueries = useCurrentStateStore.getState().queries;

              useCurrentStateStore.getState().actions.setCurrentState({
                ...getCurrentState(),
                queries: Object.keys(currentQueries).reduce((acc, key) => {
                  if (currentQueries[key].id !== queryId) {
                    acc[key] = currentQueries[key];
                  }
                  return acc;
                }, {}),
              });
            })
            .catch(() => {
              set({
                isDeletingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        updateDataQuery: (options) => {
          set({ isUpdatingQueryInProcess: true });
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          set((state) => ({
            isUpdatingQueryInProcess: false,
            dataQueries: state.dataQueries.map((query) => {
              if (query.id === selectedQuery.id) {
                return {
                  ...query,
                  options: { ...options },
                };
              }
              return query;
            }),
          }));
          actions.setSelectedQuery(selectedQuery.id);
        },
        // createDataQuery: (appId, appVersionId, options, kind, name, selectedDataSource, shouldRunQuery) => {
        createDataQuery: (selectedDataSource, shouldRunQuery) => {
          const appVersionId = useAppVersionStore.getState().editingVersion?.id;
          const appId = useAppDataStore.getState().appId;
          const { options, name } = getDefaultOptions(selectedDataSource);
          const kind = selectedDataSource.kind;
          const tempId = uuidv4();
          set({ creatingQueryInProcessId: tempId });
          const { actions, selectedQuery } = useQueryPanelStore.getState();
          const dataSourceId = selectedDataSource?.id !== 'null' ? selectedDataSource?.id : null;
          const pluginId = selectedDataSource.pluginId || selectedDataSource.plugin_id;
          useAppDataStore.getState().actions.setIsSaving(true);
          const { dataQueries } = useDataQueriesStore.getState();
          const currDataQueries = [...dataQueries];
          set(() => ({
            dataQueries: [
              {
                ...selectedQuery,
                data_source_id: dataSourceId,
                app_version_id: appVersionId,
                options,
                name,
                kind,
                id: tempId,
                plugin: selectedDataSource.plugin,
              },
              ...currDataQueries,
            ],
          }));
          actions.setSelectedQuery(tempId);
          actions.setNameInputFocussed(true);
          dataqueryService
            .create(appId, appVersionId, name, kind, options, dataSourceId, pluginId)
            .then((data) => {
              set((state) => ({
                creatingQueryInProcessId: null,
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === tempId) {
                    return {
                      ...query,
                      id: data.id,
                      data_source_id: dataSourceId,
                    };
                  }
                  return query;
                }),
              }));
              actions.setSelectedQuery(data.id, data);
              if (shouldRunQuery) actions.setQueryToBeRun(data);

              /** Checks if there is an API call cached. If yes execute it */
              if (!isEmpty(get()?.queuedActions?.renameQuery)) {
                get().actions.renameQuery(data.id, get().queuedActions.renameQuery);
                set({ queuedActions: { ...get().queuedActions, renameQuery: undefined } });
              }

              if (!isEmpty(get()?.queuedActions?.saveData)) {
                get().actions.saveData({ ...get().queuedActions.saveData, id: data.id });
                set({ queuedActions: { ...get().queuedActions, saveData: undefined } });
              }

              const currentQueries = useCurrentStateStore.getState().queries;

              useCurrentStateStore.getState().actions.setCurrentState({
                ...getCurrentState(),
                queries: {
                  ...currentQueries,
                  [data.name]: {
                    id: data.id,
                    isLoading: false,
                    data: [],
                    rawData: [],
                  },
                },
              });
            })
            .catch((error) => {
              set((state) => ({
                creatingQueryInProcessId: null,
                dataQueries: state.dataQueries.filter((query) => query.id !== tempId),
              }));
              actions.setSelectedQuery(null);
              toast.error(`Failed to create query: ${error.message}`);
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        renameQuery: (id, newName) => {
          /** If query creation in progress, skips call and pushes the update to queue */
          if (get().creatingQueryInProcessId === id) {
            set({ queuedActions: { ...get().queuedActions, renameQuery: newName } });
            return;
          }
          useAppDataStore.getState().actions.setIsSaving(true);
          /**
           * Seting name to store before api call for instant UI update and better UX.
           * Name is again set to state post api call to handle if renaming fails in backend.
           * */
          set((state) => ({
            dataQueries: state.dataQueries.map((query) => (query.id === id ? { ...query, name: newName } : query)),
          }));
          dataqueryService
            .update(id, newName)
            .then((data) => {
              set((state) => ({
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === id) {
                    return { ...query, name: newName, updated_at: data.updated_at };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(id);

              const currentQueries = useCurrentStateStore.getState().queries;

              const queryName = Object.keys(currentQueries).find((key) => currentQueries[key].id === id);

              const { [queryName]: _, ...rest } = currentQueries;

              useCurrentStateStore.getState().actions.setCurrentState({
                ...getCurrentState(),
                queries: {
                  ...rest,
                  [newName]: {
                    ...currentQueries[queryName],
                    name: newName,
                  },
                },
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        changeDataQuery: (newDataSource) => {
          const { selectedQuery } = useQueryPanelStore.getState();
          set({
            isUpdatingQueryInProcess: true,
          });
          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .changeQueryDataSource(selectedQuery?.id, newDataSource.id)
            .then(() => {
              set((state) => ({
                isUpdatingQueryInProcess: false,
                dataQueries: state.dataQueries.map((query) => {
                  if (query?.id === selectedQuery?.id) {
                    return { ...query, dataSourceId: newDataSource?.id, data_source_id: newDataSource?.id };
                  }
                  return query;
                }),
              }));
              useQueryPanelStore.getState().actions.setSelectedQuery(selectedQuery.id);
              useQueryPanelStore.getState().actions.setSelectedDataSource(newDataSource);
            })
            .catch(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        duplicateQuery: (id, appId) => {
          set({ creatingQueryInProcessId: uuidv4() });
          const { actions } = useQueryPanelStore.getState();
          const { dataQueries } = useDataQueriesStore.getState();
          const queryToClone = { ...dataQueries.find((query) => query.id === id) };
          let newName = queryToClone.name + '_copy';
          const names = dataQueries.map(({ name }) => name);
          let count = 0;
          while (names.includes(newName)) {
            count++;
            newName = queryToClone.name + '_copy' + count.toString();
          }
          queryToClone.name = newName;

          useAppDataStore.getState().actions.setIsSaving(true);
          dataqueryService
            .create(
              appId,
              queryToClone.app_version_id,
              queryToClone.name,
              queryToClone.kind,
              queryToClone.options,
              queryToClone.data_source_id,
              queryToClone.pluginId
            )
            .then((data) => {
              set((state) => ({
                creatingQueryInProcessId: null,
                dataQueries: [{ ...data, data_source_id: queryToClone.data_source_id }, ...state.dataQueries],
              }));
              actions.setSelectedQuery(data.id, { ...data, data_source_id: queryToClone.data_source_id });

              const dataQueryEvents = useAppDataStore
                .getState()
                .events?.filter((event) => event.target === 'data_query' && event.sourceId === queryToClone.id);

              if (dataQueryEvents?.length === 0) return;

              return Promise.all(
                dataQueryEvents.map((event) => {
                  const newEvent = {
                    event: {
                      ...event?.event,
                    },
                    eventType: event?.target,
                    attachedTo: data.id,
                    index: event?.index,
                  };
                  useAppDataStore.getState().actions?.createAppVersionEventHandlers(newEvent);
                })
              );
            })
            .catch((error) => {
              console.error('error', error);
              set({
                creatingQueryInProcessId: null,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        },
        saveData: throttle((newValues) => {
          /** If query creation in progress, skips call and pushes the update to queue */
          if (get().creatingQueryInProcessId && get().creatingQueryInProcessId === newValues.id) {
            set({ queuedActions: { ...get().queuedActions, saveData: newValues } });
            return;
          }
          useAppDataStore.getState().actions.setIsSaving(true);
          set({ isUpdatingQueryInProcess: true });
          dataqueryService
            .update(newValues?.id, newValues?.name, newValues?.options)
            .then((data) => {
              localStorage.removeItem('transformation');
              set((state) => ({
                dataQueries: state.dataQueries.map((query) => {
                  if (query.id === newValues?.id) {
                    return { ...query, updated_at: data.updated_at };
                  }
                  return query;
                }),
                isUpdatingQueryInProcess: false,
              }));
            })
            .catch(() => {
              set({
                isUpdatingQueryInProcess: false,
              });
            })
            .finally(() => useAppDataStore.getState().actions.setIsSaving(false));
        }, 500),
        sortDataQueries: (sortBy, sortOrder) => {
          set(({ dataQueries, sortOrder: currSortOrder }) => {
            const newSortOrder = sortOrder ? sortOrder : currSortOrder === 'asc' ? 'desc' : 'asc';
            return {
              sortBy,
              sortOrder: newSortOrder,
              dataQueries: sortByAttribute(dataQueries, sortBy, newSortOrder),
            };
          });
        },
      },
    }),
    { name: 'Data Queries Store' }
  )
);

const sortByAttribute = (data, sortBy, order) => {
  if (order === 'asc') {
    if (sortBy === 'kind' || sortBy === 'updated_at') {
      // sort by name first and then by the attribute
      return data.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
    }
    return data.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }
  if (order === 'desc') {
    if (sortBy === 'kind' || sortBy === 'updated_at') {
      // sort by name first and then by the attribute
      return data.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => b[sortBy].localeCompare(a[sortBy]));
    }
    return data.sort((a, b) => b[sortBy].localeCompare(a[sortBy]));
  }
};

export const useDataQueries = () => useDataQueriesStore((state) => state.dataQueries, shallow);
export const useDataQueriesActions = () => useDataQueriesStore((state) => state.actions);
export const useQueryCreationLoading = () => useDataQueriesStore((state) => !!state.creatingQueryInProcessId, shallow);
export const useQueryUpdationLoading = () => useDataQueriesStore((state) => state.isUpdatingQueryInProcess, shallow);
