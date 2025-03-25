import { dataqueryService } from '@/_services';
import { getDefaultOptions } from '@/_stores/storeHelper';
import { v4 as uuidv4 } from 'uuid';
import _, { isEmpty, throttle } from 'lodash';
import { toast } from 'react-hot-toast';
import { isQueryRunnable } from '@/_helpers/utils';
import { replaceQueryOptionsEntityReferencesWithIds } from '@/AppBuilder/_stores/utils';

const initialState = {
  sortBy: 'updated_at',
  sortOrder: 'desc',
  isDeletingQueryInProcess: false,
  creatingQueryInProcessId: null,
  queryConfirmationList: [],
  queuedActions: {},
  queries: {
    modules: {
      canvas: [],
    },
  },
};

export const createDataQuerySlice = (set, get) => ({
  dataQuery: {
    ...initialState,
    checkExistingQueryName: (newName) => get().dataQuery.queries.modules.canvas.some((query) => query.name === newName),
    getCurrentModuleQueries: (moduleId) => get().dataQuery.queries.modules[moduleId],
    setQueries: (queries, moduleId = 'canvas') => {
      set(
        (state) => {
          state.dataQuery.queries.modules[moduleId] = queries;
        },
        false,
        'setQueries'
      );
    },
    sortDataQueries: (sortBy, sortOrder, moduleId = 'canvas') => {
      set((state) => {
        const newSortOrder = sortOrder ? sortOrder : state.sortOrder === 'asc' ? 'desc' : 'asc';
        state.dataQuery.sortBy = sortBy;
        state.dataQuery.sortOrder = newSortOrder;
        state.dataQuery.queries.modules[moduleId] = sortByAttribute(
          state.dataQuery.queries.modules[moduleId],
          sortBy,
          newSortOrder
        );
      });
    },
    createDataQuery: (selectedDataSource, shouldRunQuery, customOptions = {}, moduleId = 'canvas') => {
      const appVersionId = get().currentVersionId;
      const appId = get().app.appId;
      const { options: defaultOptions, name } = getDefaultOptions(selectedDataSource);
      const options = { ...defaultOptions, ...customOptions };
      const kind = selectedDataSource.kind;
      const tempId = uuidv4();
      set((state) => {
        state.dataQuery.creatingQueryInProcessId = tempId;
      });
      const selectedQuery = get().queryPanel.selectedQuery;
      const setSelectedQuery = get().queryPanel.setSelectedQuery;
      const setNameInputFocused = get().queryPanel.setNameInputFocused;
      const setQueryToBeRun = get().queryPanel.setQueryToBeRun;
      const dataSourceId = selectedDataSource?.id !== 'null' ? selectedDataSource?.id : null;
      const pluginId = selectedDataSource.pluginId || selectedDataSource.plugin_id;
      const setIsAppSaving = get().setIsAppSaving;
      setIsAppSaving(true);
      const dataQueries = get().dataQuery.queries.modules[moduleId];
      const currDataQueries = [...dataQueries];
      set((state) => {
        state.dataQuery.queries.modules[moduleId] = [
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
        ];
      });
      setSelectedQuery(tempId);
      setNameInputFocused(true);

      dataqueryService
        .create(appId, appVersionId, name, kind, options, dataSourceId, pluginId)
        .then((data) => {
          set((state) => {
            state.creatingQueryInProcessId = null;
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
              if (query.id === tempId) {
                return {
                  ...query,
                  id: data.id,
                  data_source_id: dataSourceId,
                };
              }
              return query;
            });
          });
          setSelectedQuery(data.id, data);
          if (shouldRunQuery) setQueryToBeRun(data);

          /** Checks if there is an API call cached. If yes execute it */
          if (!isEmpty(get()?.dataQuery?.queuedActions?.renameQuery)) {
            get().dataQuery.renameQuery(data.id, get().dataQuery?.queuedActions.renameQuery);
            set((state) => {
              state.dataQuery.queuedActions = { ...get().dataQuery?.queuedActions, renameQuery: undefined };
            });
          }

          if (!isEmpty(get()?.dataQuery?.queuedActions?.saveData)) {
            get().dataQuery.saveData({ ...get().dataQuery?.queuedActions.saveData, id: data.id });
            set((state) => {
              state.dataQuery.queuedActions = { ...get().dataQuery?.queuedActions, saveData: undefined };
            });
          }

          get().addNewQueryMapping(data.id, data.name, moduleId);
          //! we need default value in store so that query can be resolved if referenced from other entity
          get().setResolvedQuery(data.id, {
            isLoading: false,
            data: [],
            rawData: [],
            id: data.id,
          });
        })
        .catch((error) => {
          set((state) => {
            state.creatingQueryInProcessId = null;
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].filter(
              (query) => query.id !== tempId
            );
          });
          setSelectedQuery(null);
          toast.error(`Failed to create query: ${error.message ?? error.error}`);
        })
        .finally(() => setIsAppSaving(false));
    },
    renameQuery: (id, newName, moduleId = 'canvas') => {
      /** If query creation in progress, skips call and pushes the update to queue */
      if (get().dataQuery.creatingQueryInProcessId === id) {
        set((state) => {
          state.dataQuery.queuedActions = { ...get().dataQuery.queuedActions, renameQuery: newName };
        });
        return;
      }
      const setIsAppSaving = get().setIsAppSaving;
      setIsAppSaving(true);
      /**
       * Seting name to store before api call for instant UI update and better UX.
       * Name is again set to state post api call to handle if renaming fails in backend.
       * */
      set((state) => {
        state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
          query.id === id ? { ...query, name: newName } : query
        );
      });
      const versionId = get().currentVersionId;
      dataqueryService
        .update(id, versionId, newName)
        .then((data) => {
          set((state) => {
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
              query.id === id ? { ...query, name: newName, updated_at: data.updated_at } : query
            );
          });

          const selectedQuery = get().queryPanel.selectedQuery;
          get().renameQueryMapping(selectedQuery?.name, newName, selectedQuery?.id, moduleId);

          const setSelectedQuery = get().queryPanel.setSelectedQuery;
          setSelectedQuery(id);
        })
        .catch((error) => {
          toast.error(`Failed to rename query: ${error.message ?? error.error}`);
        })
        .finally(() => {
          setIsAppSaving(false);
        });
    },
    deleteDataQueries: (queryId, moduleId = 'canvas') => {
      set((state) => {
        state.dataQuery.isDeletingQueryInProcess = true;
      });
      const versionId = get().currentVersionId;
      const setIsAppSaving = get().setIsAppSaving;
      setIsAppSaving(true);
      dataqueryService
        .del(queryId, versionId)
        .then(() => {
          const dataQueries = get().dataQuery.queries.modules[moduleId];
          // const deletedQueryName = dataQueries.find((query) => query.id === queryId).name;
          const newSelectedQuery = dataQueries.find((query) => query.id !== queryId);
          const setSelectedQuery = get().queryPanel.setSelectedQuery;
          const setSelectedDataSource = get().queryPanel.setSelectedDataSource;
          const selectedQuery = get().queryPanel.selectedQuery;
          setSelectedQuery(newSelectedQuery?.id || null);
          get().deleteQueryMapping(selectedQuery?.name, selectedQuery?.id, moduleId);

          if (!newSelectedQuery?.id) {
            setSelectedDataSource(null);
          }
          set((state) => {
            state.dataQuery.isDeletingQueryInProcess = false;
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].filter(
              (query) => query.id !== queryId
            );
            delete state.resolvedStore.modules[moduleId].exposedValues.queries[queryId];
          });
        })
        .catch(() => {
          toast.error('App could not be saved.');
          set((state) => {
            state.dataQuery.isDeletingQueryInProcess = false;
          });
        })
        .finally(() => setIsAppSaving(false));

      get().removeNode(`queries.${queryId}`);
      get().updateDependencyValues(`queries.${queryId}`);
    },
    duplicateQuery: (id, appId, moduleId = 'canvas') => {
      set((state) => {
        state.dataQuery.creatingQueryInProcessId = uuidv4();
      });
      const { eventsSlice } = get();
      const { getEventsByComponentsId, createAppVersionEventHandlers } = eventsSlice;
      const dataQueries = get().dataQuery.queries.modules[moduleId];
      const queryToClone = { ...dataQueries.find((query) => query.id === id) };
      let newName = queryToClone.name + '_copy';
      const names = dataQueries.map(({ name }) => name);
      let count = 0;
      while (names.includes(newName)) {
        count++;
        newName = queryToClone.name + '_copy' + count.toString();
      }
      queryToClone.name = newName;

      const setIsAppSaving = get().setIsAppSaving;
      const setSelectedQuery = get().queryPanel.setSelectedQuery;
      setIsAppSaving(true);

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
          set((state) => {
            state.dataQuery.creatingQueryInProcessId = null;
            state.dataQuery.queries.modules[moduleId] = [
              {
                ...data,
                data_source_id: queryToClone.data_source_id,
                plugin: { iconFile: queryToClone.plugin.iconFile, icon_file: queryToClone.plugin.icon_file },
              },
              ...state.dataQuery.queries.modules[moduleId],
            ];
          });
          setSelectedQuery(data.id, { ...data, data_source_id: queryToClone.data_source_id });

          get().addNewQueryMapping(data.id, data.name, moduleId);
          //! we need default value in store so that query can be resolved if referenced from other entity
          get().setResolvedQuery(data.id, {
            isLoading: false,
            data: [],
            rawData: [],
            id: data.id,
          });

          const events = getEventsByComponentsId(queryToClone.id);

          events.forEach((event) => {
            const newEvent = {
              event: {
                ...event.event,
              },
              eventType: event.target,
              attachedTo: data.id,
              index: event.index,
            };
            createAppVersionEventHandlers(newEvent, moduleId);
          });
        })
        .catch((error) => {
          console.error('error', error);
          toast.error(`Failed to duplicate query: ${error.message ?? error.error}`);
          set((state) => {
            state.dataQuery.creatingQueryInProcessId = null;
          });
        })
        .finally(() => setIsAppSaving(false));
    },
    changeDataQuery: (newDataSource, moduleId = 'canvas') => {
      const appVersionId = get().currentVersionId;
      const { queryPanel, setIsAppSaving } = get();
      const { selectedQuery, setSelectedQuery, setSelectedDataSource } = queryPanel;
      set((state) => {
        state.dataQuery.isUpdatingQueryInProcess = true;
      });
      setIsAppSaving(true);
      dataqueryService
        .changeQueryDataSource(selectedQuery?.id, newDataSource.id, appVersionId)
        .then(() => {
          set((state) => {
            state.dataQuery.isUpdatingQueryInProcess = false;
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
              if (query?.id === selectedQuery?.id) {
                return { ...query, dataSourceId: newDataSource?.id, data_source_id: newDataSource?.id };
              }
              return query;
            });
          });
          setSelectedQuery(selectedQuery.id);
          setSelectedDataSource(newDataSource);
        })
        .catch((error) => {
          toast.error(`Failed to change data query: ${error.message ?? error.error}`);
          set((state) => {
            state.dataQuery.isUpdatingQueryInProcess = false;
          });
        })
        .finally(() => setIsAppSaving(false));
    },
    updateDataQuery: (options, moduleId = 'canvas') => {
      const componentNameIdMapping = get().modules['canvas'].componentNameIdMapping;
      const queryNameIdMapping = get().modules['canvas'].queryNameIdMapping;
      set((state) => {
        state.dataQuery.isUpdatingQueryInProcess = true;
      });
      const selectedQuery = get().queryPanel.selectedQuery;

      const setSelectedQuery = get().queryPanel.setSelectedQuery;

      const newOptions = replaceQueryOptionsEntityReferencesWithIds(
        options,
        componentNameIdMapping,
        queryNameIdMapping
      );

      set((state) => {
        state.dataQuery.isUpdatingQueryInProcess = false;
        state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
          if (query.id === selectedQuery.id) {
            return {
              ...query,
              options: { ...newOptions },
            };
          }
          return query;
        });
      });
      setSelectedQuery(selectedQuery?.id);
    },
    saveData: throttle((newValues, moduleId = 'canvas') => {
      /** If query creation in progress, skips call and pushes the update to queue */
      if (get().dataQuery.creatingQueryInProcessId && get().dataQuery.creatingQueryInProcessId === newValues.id) {
        set((state) => {
          state.dataQuery.queuedActions = { ...get().dataQuery.queuedActions, saveData: newValues };
        });
        return;
      }
      // const entityIdMappedOptions = useResolveStore.getState().actions.findReferences(newValues?.options);

      const setIsAppSaving = get().setIsAppSaving;
      setIsAppSaving(true);
      set((state) => {
        state.dataQuery.isUpdatingQueryInProcess = true;
      });

      // .update(newValues?.id, newValues?.name, entityIdMappedOptions)
      if (!newValues?.id) {
        setIsAppSaving(false);
        set((state) => {
          state.dataQuery.isUpdatingQueryInProcess = true;
        });
        return;
      }
      const versionId = get().currentVersionId;
      dataqueryService
        .update(newValues?.id, versionId, newValues?.name, newValues?.options)
        .then((data) => {
          localStorage.removeItem('transformation');
          set((state) => {
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
              if (query.id === newValues?.id) {
                return { ...query, updated_at: data.updated_at };
              }
              return query;
            });
            state.dataQuery.isUpdatingQueryInProcess = false;
          });
        })
        .catch(() => {
          toast.error('App could not be saved.');
          set((state) => {
            state.dataQuery.isUpdatingQueryInProcess = false;
          });
        })
        .finally(() => setIsAppSaving(false));
    }, 500),
    runOnLoadQueries: async () => {
      const queries = get().dataQuery.queries.modules.canvas;
      try {
        for (const query of queries) {
          if ((query.options.runOnPageLoad || query.options.run_on_page_load) && isQueryRunnable(query)) {
            await get().queryPanel.runQuery(query.id, query.name, undefined, undefined, {}, false, true, 'canvas');
          }
        }
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },
  },
});

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
