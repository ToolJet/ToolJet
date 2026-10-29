import { dataqueryService, appPermissionService, libraryQueryService, authenticationService } from '@/_services';
import { getDefaultOptions } from '@/_stores/storeHelper';
import { v4 as uuidv4 } from 'uuid';
import _, { isEmpty, throttle } from 'lodash';
import { toast } from 'react-hot-toast';
import { isQueryRunnable } from '@/_helpers/utils';
import { replaceQueryOptionsEntityReferencesWithIds } from '@/AppBuilder/_stores/utils';
import { normalizeQueryTransformationOptions } from '@/AppBuilder/_stores/utils/appDataCaseConversion';
import { clearQueryRerunTimer } from '@/AppBuilder/_stores/slices/componentsSlice';
import {
  isQueryLibraryMode,
  isLibraryQueryLocked,
  viewedLibraryDraft,
  viewedLibraryVersionId,
} from '@/AppBuilder/_stores/slices/queryLibrarySlice';

const initialState = {
  sortBy: 'custom',
  sortOrder: 'desc',
  isDeletingQueryInProcess: false,
  dependencyWarning: null,
  creatingQueryInProcessId: null,
  queryConfirmationList: [],
  queuedActions: {},
  queryUpdates: {},
  queries: {
    modules: {
      canvas: [],
    },
  },
};

export const createDataQuerySlice = (set, get) => {
  const workspace = () =>
    get().appStore.modules.canvas?.app?.organizationId ??
    authenticationService.currentSessionValue?.current_organization_id;
  const destination = () => ({
    library: isQueryLibraryMode(get()),
    workspaceId: isQueryLibraryMode(get()) ? get().queryLibrary.workspaceId : workspace(),
    sessionId: get().queryLibrary.sessionId,
    versionId: isQueryLibraryMode(get()) ? undefined : get().currentVersionId,
    queryId: get().queryPanel.selectedQuery?.id,
    draftId: isQueryLibraryMode(get()) ? viewedLibraryDraft(get(), get().queryPanel.selectedQuery?.id)?.id : undefined,
  });
  const current = (target) =>
    target.sessionId === get().queryLibrary.sessionId &&
    target.library === isQueryLibraryMode(get()) &&
    (target.library
      ? target.workspaceId === get().queryLibrary.workspaceId
      : target.workspaceId === workspace() && target.versionId === get().currentVersionId);
  const visibleFailure = (failed) =>
    failed.target.library && isQueryLibraryMode(get()) && failed.target.workspaceId === get().queryLibrary.workspaceId;
  const markSaving = (saving) => {
    if (isQueryLibraryMode(get()))
      set((state) => {
        state.queryLibrary.isSaving =
          saving || [...writes.values()].some((record) => current(record.target) && !record.error);
        state.queryLibrary.saveError = Object.values(state.dataQuery.failedSaves).some(visibleFailure);
      });
    else get().setIsAppSaving(saving);
  };
  const creationEdits = new Map();
  const creationRenames = new Map();
  // Each destination/query has one chain. A later PATCH cannot overtake an earlier PATCH.
  const writes = new Map();
  const writeKey = (target, id) => `${target.library ? 'library' : target.versionId}:${target.workspaceId}:${id}`;
  const save = throttle((newValues, moduleId, target) => {
    if (get().dataQuery.creatingQueryInProcessId === newValues.id) {
      creationEdits.set(newValues.id, { values: newValues, moduleId, target });
      set((state) => {
        state.dataQuery.queuedActions.saveData = { values: newValues, moduleId, target };
      });
      return;
    }
    if (!newValues?.id) return;
    const key = writeKey(target, newValues.id);
    const previous = writes.get(key);
    const record = { values: newValues, moduleId, target };
    const request = () =>
      dataqueryService.update(newValues.id, target.versionId, newValues.name, newValues.options, undefined, target);
    const promise = previous ? previous.promise.catch(() => {}).then(request) : request();
    record.promise = promise;
    writes.set(key, record);
    if (current(target)) markSaving(true);
    set((state) => {
      state.dataQuery.queryUpdates[newValues.id] = promise;
    });
    promise
      .then((data) => {
        if (writes.get(key) !== record) return;
        writes.delete(key);
        set((state) => {
          const failed = state.dataQuery.failedSaves[newValues.id];
          if (failed && writeKey(failed.target, newValues.id) === key) delete state.dataQuery.failedSaves[newValues.id];
          if (!current(record.target)) return;
          state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
            query.id === newValues.id ? { ...query, updated_at: data.updated_at } : query
          );
          if (state.dataQuery.queryUpdates[newValues.id] === promise) delete state.dataQuery.queryUpdates[newValues.id];
        });
      })
      .catch((error) => {
        if (writes.get(key) !== record) return;
        record.error = error;
        set((state) => {
          state.dataQuery.failedSaves[newValues.id] = {
            values: newValues,
            moduleId,
            target: record.target,
            error,
            promise,
          };
          if (record.target.library && current(record.target)) {
            state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
              query.id === newValues.id ? { ...query, ...newValues } : query
            );
          }
        });
        const isExplainedClientError = error?.statusCode >= 400 && error?.statusCode < 500 && error?.statusCode !== 422;
        toast.error(
          isExplainedClientError && typeof error?.error === 'string' && error.error
            ? error.error
            : record.target.library
              ? 'Query could not be saved.'
              : 'App could not be saved.'
        );
      })
      .finally(() => {
        if (writes.get(key) !== record && writes.has(key)) return;
        if (current(record.target)) markSaving(false);
      });
    return promise;
  }, 500);
  // Library drafts have independent throttle and write chains. A trailing edit from A can never
  // replace B's queued edit; failed writes stay attached to their original workspace/draft.
  const draftWrites = new Map();
  // Transport tails outlive editor sessions; only retry/display records are session-scoped.
  const draftOperations = new Map();
  const trackDraftOperation = (key, promise) => {
    draftOperations.set(key, promise);
    const clear = () => {
      if (draftOperations.get(key) === promise) draftOperations.delete(key);
    };
    promise.then(clear, clear);
    return promise;
  };
  const draftKey = (target, queryId, draftId = target.draftId) => `${target.workspaceId}:${queryId}:${draftId}`;
  const visibleDraft = (target, queryId) =>
    current(target) &&
    get().queryPanel.selectedQuery?.id === queryId &&
    viewedLibraryVersionId(get(), queryId) === target.draftId;
  const draftSaving = () =>
    set((state) => {
      state.queryLibrary.isSaving = [...draftWrites.values()].some(
        (record) => visibleDraft(record.target, record.queryId) && record.pending
      );
      state.queryLibrary.saveError = [...draftWrites.values()].some(
        (record) => visibleDraft(record.target, record.queryId) && !!record.error
      );
    });
  const saveDraftData = (values, moduleId, target) => {
    if (get().dataQuery.creatingQueryInProcessId === values.id) {
      creationEdits.set(values.id, { values, moduleId, target });
      return;
    }
    if (!target.draftId || target.draftId === 'draft') return Promise.reject(new Error('Select an editable draft'));
    const key = draftKey(target, values.id);
    let record = draftWrites.get(key);
    if (!record || record.target.sessionId !== target.sessionId) {
      const prior = record;
      record = { target, queryId: values.id, values, revision: 0, pending: false, promise: prior?.promise };
      record.send = throttle(() => {
        const sent = record.values;
        const sentRevision = record.revision;
        record.pending = true;
        record.error = null;
        const request = () =>
          libraryQueryService.updateDraft(values.id, target.draftId, { options: sent.options }, target);
        const previous = draftOperations.get(key) ?? record.promise;
        const promise = previous ? previous.catch(() => {}).then(request) : request();
        record.promise = promise;
        // Every source/options request advances the same tail. Subsequent autosaves must
        // wait for this PATCH, rather than all subscribing to the original source PUT.
        trackDraftOperation(key, promise);
        draftSaving();
        promise.then(
          () => {
            if (record.promise !== promise || draftWrites.get(key) !== record) return;
            record.error = null;
            record.pending = record.revision !== sentRevision;
            draftSaving();
          },
          (error) => {
            if (record.promise !== promise || draftWrites.get(key) !== record) return;
            record.pending = record.revision !== sentRevision;
            record.error = record.pending ? null : error;
            if (!record.pending && visibleDraft(target, values.id)) toast.error('Query could not be saved.');
            draftSaving();
          }
        );
        return promise;
      }, 500);
      draftWrites.set(key, record);
    }
    record.values = values;
    record.revision += 1;
    record.pending = true;
    record.error = null;
    if (current(target))
      get().queryLibrary.updateLibraryDraftSnapshot(values.id, target.draftId, { options: values.options });
    const promise = record.send();
    draftSaving();
    return promise;
  };
  const saveData = (values, moduleId = 'canvas', target = destination()) =>
    target.library ? saveDraftData(values, moduleId, target) : save(values, moduleId, target);
  saveData.flush = () => {
    save.flush();
    for (const record of draftWrites.values()) record.send.flush();
  };
  saveData.cancel = () => {
    save.cancel();
    for (const record of draftWrites.values()) record.send.cancel();
  };
  return {
    initializeDataQuerySlice: (moduleId = 'canvas') => {
      set(
        (state) => {
          state.dataQuery.queries.modules[moduleId] = [];
        },
        false,
        'initializeDataQuerySlice'
      );
    },
    dataQuery: {
      ...initialState,
      failedSaves: {},
      clearLibraryDraftWrites: () => {
        for (const record of draftWrites.values()) record.send.cancel();
        draftWrites.clear();
      },
      libraryDraftWrite: (queryId, draftId) => {
        const record = draftWrites.get(draftKey(destination(), queryId, draftId));
        return record && current(record.target) && (record.pending || record.error) ? record : undefined;
      },
      refreshLibrarySaveStatus: draftSaving,
      queueLibraryDraftOperation: (queryId, draftId, request) => {
        const key = draftKey(destination(), queryId, draftId);
        const record = draftWrites.get(key);
        record?.send.flush();
        const previous = draftOperations.get(key) ?? record?.promise;
        const promise = Promise.resolve(previous)
          .catch(() => {})
          .then(request);
        return trackDraftOperation(key, promise);
      },
      flushLibraryDraft: async (queryId, draftId) => {
        if (!draftId || draftId === 'draft') throw new Error('Select an editable draft');
        const sessionId = get().queryLibrary.sessionId;
        const key = draftKey(destination(), queryId, draftId);
        while (true) {
          if (get().queryLibrary.sessionId !== sessionId) throw new Error('Library session changed');
          const record = draftWrites.get(key);
          record?.send.flush();
          const tail = draftOperations.get(key) ?? record?.promise;
          // A previous session's failed transport is an ordering barrier, not this
          // session's retry state. Current-session failures are checked below.
          await Promise.resolve(tail).catch(() => {});
          // An edit may have arrived while this request was pending. Dispatch any trailing
          // edit and wait again until the tail we just awaited is still the latest one.
          record?.send.flush();
          if (tail !== (draftOperations.get(key) ?? record?.promise)) continue;
          if (record?.error) throw record.error;
          return;
        }
      },
      retryLibraryDraftSave: (queryId, draftId) => {
        const record = draftWrites.get(draftKey(destination(), queryId, draftId));
        if (record)
          return saveDraftData(record.values, 'canvas', { ...record.target, sessionId: get().queryLibrary.sessionId });
      },
      retryFailedSave: (id) => {
        const failed = get().dataQuery.failedSaves[id];
        if (failed)
          saveData(
            failed.values,
            failed.moduleId,
            visibleFailure(failed) ? { ...failed.target, sessionId: get().queryLibrary.sessionId } : failed.target
          );
      },
      checkExistingQueryName: (newName, moduleId = 'canvas') =>
        get().dataQuery.queries.modules[moduleId].some((query) => query.name === newName),
      getCurrentModuleQueries: (moduleId = 'canvas') => get().dataQuery.queries.modules[moduleId],
      setQueries: (queries, moduleId = 'canvas') => {
        set(
          (state) => {
            state.dataQuery.queries.modules[moduleId] = queries.map((query) => {
              const pending = writes.get(writeKey(destination(), query.id));
              if (pending && current(pending.target)) return { ...query, ...pending.values };
              const failed = state.dataQuery.failedSaves[query.id];
              return failed && visibleFailure(failed) ? { ...query, ...failed.values } : query;
            });
          },
          false,
          'setQueries'
        );
      },
      sortDataQueries: (sortBy, sortOrder, moduleId = 'canvas') => {
        set((state) => {
          if (sortBy === 'custom') {
            state.dataQuery.sortBy = 'custom';
            return;
          }
          const newSortOrder = sortOrder ? sortOrder : state.dataQuery.sortOrder === 'asc' ? 'desc' : 'asc';
          state.dataQuery.sortBy = sortBy;
          state.dataQuery.sortOrder = newSortOrder;
          state.dataQuery.queries.modules[moduleId] = sortByAttribute(
            state.dataQuery.queries.modules[moduleId],
            sortBy,
            newSortOrder
          );
        });
      },
      createDataQuery: (
        selectedDataSource,
        shouldRunQuery,
        customOptions = {},
        moduleId = 'canvas',
        queryName,
        extraProperties = {}
      ) => {
        let name;
        const target = destination();
        const appVersionId = target.library ? undefined : get().currentVersionId;
        const appId = target.library ? undefined : get().appStore.modules[moduleId].app.appId;
        const { options: defaultOptions, name: nameFromDefaultOptions } = getDefaultOptions(selectedDataSource);
        if (!queryName) name = nameFromDefaultOptions;
        else name = queryName;
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
        const setIsAppSaving = markSaving;
        setIsAppSaving(true);
        const dataQueries = get().dataQuery.queries.modules[moduleId];
        const currDataQueries = [...dataQueries];
        const runOnCreate = options.runOnCreate;
        const callbackFunction = extraProperties?.callbackFunction;
        let cleanSelectedQuery = { ...selectedQuery };
        if (selectedQuery?.permissions) {
          delete cleanSelectedQuery?.permissions; //Remove the permissions array from the selectedQuery before using it if exists
        }

        const folderId = extraProperties?.folderId;

        set((state) => {
          state.dataQuery.queries.modules[moduleId] = [
            {
              ...cleanSelectedQuery,
              plugin_id: selectedDataSource.pluginId || selectedDataSource.plugin_id || null,
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
        const creation = target.library
          ? libraryQueryService.create({ name, kind, options, dataSourceId, folderId }, target)
          : dataqueryService.create(appId, appVersionId, name, kind, options, dataSourceId, pluginId, folderId);
        return creation
          .then((data) => {
            if (target.library && current(target)) {
              get().queryLibrary.updateCreatedLibraryQuery(data, { kind, options, dataSourceId });
              target.draftId = data.draftId;
            }
            const queued = creationEdits.get(tempId);
            creationEdits.delete(tempId);
            const renamed = creationRenames.get(tempId);
            creationRenames.delete(tempId);
            if (renamed && !current(target)) {
              const rename = target.library
                ? libraryQueryService.update(data.id, { name: renamed }, target)
                : dataqueryService.update(data.id, target.versionId, renamed, undefined, undefined, target);
              rename.catch((error) => toast.error(`Failed to rename query: ${error.message ?? error.error}`));
            }
            if (queued?.values?.id === tempId)
              saveData({ ...queued.values, id: data.id }, queued.moduleId, { ...queued.target, draftId: data.draftId });
            if (!current(target)) return;
            set((state) => {
              state.dataQuery.creatingQueryInProcessId = null;
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
            // EE: add the real folder mapping from the backend response
            if (data.folderMapping) {
              get().queryFolders?.addRealQueryMapping?.(data.folderMapping);
            }
            setSelectedQuery(data.id);
            if (shouldRunQuery) setQueryToBeRun(data);

            /** Checks if there is an API call cached. If yes execute it */
            if (!isEmpty(get()?.dataQuery?.queuedActions?.renameQuery)) {
              get().dataQuery.renameQuery(data.id, get().dataQuery?.queuedActions.renameQuery);
              set((state) => {
                state.dataQuery.queuedActions = { ...get().dataQuery?.queuedActions, renameQuery: undefined };
              });
            }

            if (!isEmpty(get()?.dataQuery?.queuedActions?.saveData)) {
              // Captured queued edit was sent above.
              set((state) => {
                state.dataQuery.queuedActions = { ...get().dataQuery?.queuedActions, saveData: undefined };
              });
            }

            get().addNewQueryMapping(data.id, data.name, moduleId);
            //! we need default value in store so that query can be resolved if referenced from other entity
            get().setResolvedQuery(
              data.id,
              {
                isLoading: false,
                data: [],
                rawData: [],
                id: data.id,
                metadata: undefined,
                request: undefined,
                response: undefined,
                responseHeaders: undefined,
                error: undefined,
              },
              moduleId
            );

            if (runOnCreate) {
              get().queryPanel.runQuery(data.id, data.name, undefined, undefined, {}, true, false, moduleId);
            }
            if (callbackFunction) {
              callbackFunction(data);
            }
          })
          .catch((error) => {
            if (!current(target)) return;
            set((state) => {
              state.dataQuery.creatingQueryInProcessId = null;
              state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].filter(
                (query) => query.id !== tempId
              );
            });
            setSelectedQuery(null);
            toast.error(`Failed to create query: ${error.message ?? error.error}`);
          })
          .finally(() => {
            if (typeof target === 'undefined' || current(target)) setIsAppSaving(false);
          });
      },
      renameQuery: (id, newName, moduleId = 'canvas') => {
        if (isLibraryQueryLocked(get(), id)) return false;

        const previousName = get().dataQuery.queries.modules[moduleId].find((query) => query.id === id)?.name;
        /** If query creation in progress, skips call and pushes the update to queue */
        if (get().dataQuery.creatingQueryInProcessId === id) {
          creationRenames.set(id, newName);
          set((state) => {
            state.dataQuery.queuedActions = { ...get().dataQuery.queuedActions, renameQuery: newName };
          });
          return true;
        }
        const setIsAppSaving = markSaving;
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
        const target = destination();
        const request = target.library
          ? libraryQueryService.update(id, { name: newName }, target)
          : dataqueryService.update(id, target.versionId, newName, undefined, undefined, target);
        return request
          .then((data) => {
            if (!current(target)) return;
            set((state) => {
              state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
                query.id === id ? { ...query, name: newName, updated_at: data.updated_at } : query
              );
            });

            get().renameQueryMapping(previousName, newName, id, moduleId);
            if (get().queryPanel.selectedQuery?.id === id) get().queryPanel.setSelectedQuery(id);
            return true;
          })
          .catch((error) => {
            if (current(target)) {
              set((state) => {
                state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) =>
                  query.id === id && query.name === newName ? { ...query, name: previousName } : query
                );
              });
            }
            toast.error(`Failed to rename query: ${error.message ?? error.error}`);
            return false;
          })
          .finally(() => {
            if (current(target)) setIsAppSaving(false);
          });
      },
      closeDependencyWarning: () =>
        set((state) => {
          state.dataQuery.dependencyWarning = null;
        }),
      deleteDataQueries: (queryId, moduleId = 'canvas') => {
        set((state) => {
          state.dataQuery.isDeletingQueryInProcess = true;
        });
        const versionId = isQueryLibraryMode(get()) ? undefined : get().currentVersionId;
        const setIsAppSaving = markSaving;
        setIsAppSaving(true);
        const target = destination();
        const request = target.library
          ? libraryQueryService.del(queryId, target)
          : dataqueryService.del(queryId, versionId);
        return request
          .then(() => {
            if (!current(target)) return;
            // Only once the server accepted: a refused delete (409/403) leaves the query in the graph.
            clearQueryRerunTimer(queryId);
            get().removeNode(`queries.${queryId}`, moduleId);
            get().updateDependencyValues(`queries.${queryId}`, moduleId);

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
            // EE: clean up folder mapping for the deleted query
            get().queryFolders?.removeQueryMapping?.(queryId);
          })
          .catch((e) => {
            if (!current(target)) return;
            if (target.library && e.code === 'LIBRARY_QUERY_IN_USE') {
              set((state) => {
                state.dataQuery.dependencyWarning = {
                  sessionId: target.sessionId,
                  title: 'Dependent apps or modules found!',
                  message: 'Cannot delete this query as it is being used in one or more apps or modules.',
                };
              });
            } else if (e.statusCode === 403) {
              toast.error('You do not have permission to delete this query.');
            } else {
              toast.error(`Failed to delete query: ${e.error}`);
            }
            set((state) => {
              state.dataQuery.isDeletingQueryInProcess = false;
            });
          })
          .finally(() => {
            if (typeof target === 'undefined' || current(target)) setIsAppSaving(false);
          });
      },
      duplicateQuery: (id, appId, moduleId = 'canvas') => {
        if (isQueryLibraryMode(get())) {
          const query = get().dataQuery.queries.modules[moduleId].find((query) => query.id === id);
          let name = query.name + '_copy';
          let suffix = 1;
          while (get().dataQuery.checkExistingQueryName(name, moduleId)) name = query.name + '_copy' + suffix++;
          return get().dataQuery.createDataQuery(
            { kind: query.kind, id: query.data_source_id },
            false,
            query.options,
            moduleId,
            name
          );
        }
        set((state) => {
          state.dataQuery.creatingQueryInProcessId = uuidv4();
        });
        const { eventsSlice } = get();
        const { getEventsByComponentsId, bulkCreateAppVersionEventHandlers } = eventsSlice;
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

        const setIsAppSaving = markSaving;
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
              state.dataQuery.queries.modules[moduleId] = [
                {
                  ...data,
                  data_source_id: queryToClone.data_source_id,
                  plugin: { iconFile: queryToClone.plugin?.iconFile, icon_file: queryToClone.plugin?.icon_file },
                },
                ...state.dataQuery.queries.modules[moduleId],
              ];
            });
            setSelectedQuery(data.id, moduleId);

            get().addNewQueryMapping(data.id, data.name, moduleId);
            //! we need default value in store so that query can be resolved if referenced from other entity
            get().setResolvedQuery(
              data.id,
              {
                isLoading: false,
                data: [],
                rawData: [],
                id: data.id,
                metadata: undefined,
                request: undefined,
                response: undefined,
                responseHeaders: undefined,
                error: undefined,
              },
              moduleId
            );

            const events = getEventsByComponentsId(queryToClone.id) || [];

            // Collect all events for bulk creation, filtering out invalid events
            // Ensure data.id (new query ID) is valid before creating events
            if (data?.id && events.length > 0) {
              const newQueryId = data.id;
              const eventsToCreate = events
                .filter((event) => event?.event && event?.target && event?.index != null)
                .map((event) => ({
                  name: event.name,
                  event: {
                    ...event.event,
                  },
                  eventType: event.target,
                  attachedTo: newQueryId,
                  index: event.index,
                }))
                .filter((event) => event.attachedTo && event.eventType && event.event);

              // Create all events in a single bulk request
              // TODO: Extend query creation API to include events for single history entry
              if (eventsToCreate.length > 0) {
                bulkCreateAppVersionEventHandlers(eventsToCreate, moduleId);
              }
            }

            if (queryToClone.permissions && queryToClone.permissions.length !== 0) {
              const body = {
                type: queryToClone.permissions[0]?.type,
                ...(queryToClone.permissions[0]?.type === 'GROUP'
                  ? {
                      groups: (queryToClone.permissions[0]?.groups || queryToClone.permissions[0]?.users || []).map(
                        (group) => group.permissionGroupsId || group.permission_groups_id
                      ),
                    }
                  : { users: queryToClone.permissions[0]?.users.map((user) => user.userId || user.user_id) }),
              };
              appPermissionService
                .createQueryPermission(appId, data.id, body)
                .then((newQuery) => {
                  const dataQueries = get().dataQuery.queries.modules[moduleId];
                  const updatedDataQueries = dataQueries.map((query) => {
                    if (query.id === data.id) {
                      return {
                        ...query,
                        permissions: newQuery.length === 0 || newQuery.length === undefined ? [] : [newQuery[0]],
                      };
                    }
                    return query;
                  });
                  get().dataQuery.setQueries(updatedDataQueries);
                })
                .catch(() => {
                  toast.error('Permission could not be created. Please try again!', {
                    className: 'text-nowrap w-auto mw-100',
                  });
                });
            }
            set((state) => {
              state.dataQuery.creatingQueryInProcessId = null;
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
        const appVersionId = isQueryLibraryMode(get()) ? undefined : get().currentVersionId;
        const { queryPanel } = get();
        const setIsAppSaving = markSaving;
        const { selectedQuery, setSelectedQuery, setSelectedDataSource } = queryPanel;
        set((state) => {
          state.dataQuery.isUpdatingQueryInProcess = true;
        });
        setIsAppSaving(true);
        const target = destination();
        const request = target.library
          ? get().queryLibrary.changeLibraryDraftDataSource(selectedQuery?.id, target.draftId, newDataSource.id)
          : dataqueryService.changeQueryDataSource(selectedQuery?.id, newDataSource.id, appVersionId);
        return request
          .then(() => {
            if (!current(target) || (target.library && !visibleDraft(target, selectedQuery.id))) return;
            set((state) => {
              state.dataQuery.isUpdatingQueryInProcess = false;
              if (target.library) return;
              state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((query) => {
                if (query?.id === selectedQuery?.id) {
                  return { ...query, dataSourceId: newDataSource?.id, data_source_id: newDataSource?.id };
                }
                return query;
              });
            });
            setSelectedQuery(selectedQuery.id, moduleId, { fromServer: target.library });
            setSelectedDataSource(newDataSource);
          })
          .catch((error) => {
            if (!current(target) || (target.library && !visibleDraft(target, selectedQuery.id))) return;
            toast.error(`Failed to change data query: ${error.message ?? error.error}`);
            set((state) => {
              state.dataQuery.isUpdatingQueryInProcess = false;
            });
          })
          .finally(() => {
            if (current(target) && (!target.library || visibleDraft(target, selectedQuery.id))) setIsAppSaving(false);
          });
      },
      // Converts an app query into a library query in place (same id and name, so `queries.<name>`, events and
      // dependents keep working). The server only accepts `sourceOptions` that deep-equal its stored row, so we
      // first flush pending throttled saves, then persist the store's options with a direct (unthrottled) update:
      // the store copy can differ from the DB (legacy snake_case keys are renamed in memory on load).
      addQueryToLibrary: async (queryId, { name, libraryOptions, inputs }, moduleId = 'canvas') => {
        const findQuery = () => get().dataQuery.queries.modules[moduleId].find((q) => q.id === queryId);
        let flushFailed = false;
        let response;
        try {
          get().dataQuery.saveData.flush?.();
          try {
            await get().dataQuery.queryUpdates[queryId];
          } catch (error) {
            flushFailed = true; // saveData already toasted this one
            throw error;
          }
          const query = findQuery();
          const versionId = get().currentVersionId;
          await dataqueryService.update(queryId, versionId, query.name, query.options);
          response = await dataqueryService.addToLibrary(queryId, versionId, {
            name,
            sourceOptions: query.options,
            libraryOptions,
            inputs,
          });
        } catch (error) {
          if (!flushFailed) {
            toast.error(typeof error?.error === 'string' ? error.error : 'Could not add this query to the library');
          }
          throw error;
        }

        const { data_source_id, options } = response.query;
        const queryName = findQuery().name;
        set((state) => {
          state.dataQuery.queries.modules[moduleId] = state.dataQuery.queries.modules[moduleId].map((q) =>
            q.id === queryId ? { ...q, kind: 'library', data_source_id, dataSourceId: data_source_id, options } : q
          );
        });
        if (get().queryPanel.selectedQuery?.id === queryId) {
          get().queryPanel.setSelectedQuery(queryId, moduleId);
        }
        if (options?.runOnDependencyChange) {
          get().registerQueryDependencies(queryId, queryName, 'library', options, moduleId);
        }
        toast.success('Added to query library');
      },
      updateDataQuery: (options, moduleId = 'canvas', libraryContext) => {
        if (
          libraryContext &&
          (!isQueryLibraryMode(get()) ||
            libraryContext.sessionId !== get().queryLibrary.sessionId ||
            libraryContext.workspaceId !== get().queryLibrary.workspaceId ||
            libraryContext.queryId !== get().queryPanel.selectedQuery?.id ||
            libraryContext.versionId !== viewedLibraryVersionId(get(), libraryContext.queryId))
        )
          return;
        // Library editor: only the draft is editable, so a shown saved version never overwrites it.
        if (isLibraryQueryLocked(get(), get().queryPanel.selectedQuery?.id)) return;
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

        if (isQueryLibraryMode(get())) {
          const draftId = viewedLibraryDraft(get(), selectedQuery.id)?.id;
          get().queryLibrary.updateLibraryDraftSnapshot(selectedQuery.id, draftId, { options: newOptions });
        }
        set((state) => {
          state.dataQuery.isUpdatingQueryInProcess = false;
          if (isQueryLibraryMode(get())) return;
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

        // Update query dependency registrations when options change.
        // Pass `options` (with entity names), not `newOptions` (with IDs), because
        // registerQueryDependencies uses extractAndReplaceReferencesFromString which handles name→ID mapping.
        if (options.runOnDependencyChange) {
          get().registerQueryDependencies(selectedQuery.id, selectedQuery.name, selectedQuery.kind, options, moduleId);
        } else {
          // Toggle turned off — clean up __options__ sentinel node if it exists
          const optionsPath = `queries.${selectedQuery.id}.__options__`;
          const depGraph = get().dependencyGraph.modules[moduleId]?.graph;
          if (depGraph && depGraph.hasNode(optionsPath)) {
            set(
              (state) => {
                state.dependencyGraph.modules[moduleId].graph.removeLeafNode(optionsPath);
                return { ...state };
              },
              false,
              'clearQueryOptionsDeps'
            );
          }
        }

        setSelectedQuery(selectedQuery?.id);
      },
      saveData,
      runOnLoadQueries: async (moduleId = 'canvas', queryList = null) => {
        const queries = Array.isArray(queryList) ? queryList : get().dataQuery.queries.modules[moduleId];

        try {
          for (const query of queries) {
            if (
              (query.options?.runOnPageLoad || query.options?.run_on_page_load) &&
              (query.restricted || isQueryRunnable(query))
            ) {
              await get().queryPanel.runQuery(
                query.id,
                query.name,
                undefined,
                undefined,
                {},
                undefined,
                undefined,
                false,
                true,
                moduleId
              );
            }
          }
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      },
      performDeletionUpdationAndCreationOfQuery: (queriesInfo, moduleId = 'canvas', runLoadQueriesOnCreate = true) => {
        if (!(queriesInfo?.delete?.length || queriesInfo?.update?.length || queriesInfo?.create?.length)) return;

        const queryIdsToDelete = new Set(queriesInfo.delete?.map((query) => query.id) ?? []);
        const queriesToUpdate = new Map(queriesInfo.update?.map((query) => [query.id, query]) ?? []);
        const queriesToCreate = (queriesInfo.create ?? []).map(normalizeQueryTransformationOptions);

        set(
          (state) => {
            const queriesValueInState = state.dataQuery.queries.modules[moduleId];
            const queryNameIdMapping = get().modules[moduleId].queryNameIdMapping;
            const componentNameIdMapping = get().modules[moduleId].componentNameIdMapping;

            const updatedQueriesValue = queriesValueInState
              .filter((query) => {
                const queryToBeDeleted = queryIdsToDelete.has(query.id);

                if (queryToBeDeleted) {
                  delete state.modules[moduleId].queryNameIdMapping[query.name];
                  delete state.modules[moduleId].queryIdNameMapping[query.id];

                  delete state.resolvedStore.modules[moduleId].exposedValues.queries[query.id];

                  get().removeNode(`queries.${query.id}`, moduleId);
                  get().updateDependencyValues(`queries.${query.id}`, moduleId);
                }

                return !queryToBeDeleted;
              })
              .map((query) => {
                if (queriesToUpdate.has(query.id)) {
                  const updatedQuery = normalizeQueryTransformationOptions(queriesToUpdate.get(query.id));

                  const newOptions = replaceQueryOptionsEntityReferencesWithIds(
                    updatedQuery.options,
                    componentNameIdMapping,
                    queryNameIdMapping
                  );

                  state.modules[moduleId].queryIdNameMapping[query.id] = updatedQuery.name;

                  return { ...updatedQuery, options: { ...newOptions } };
                }

                return query;
              });

            queriesToCreate.forEach((query) => {
              updatedQueriesValue.push(query);

              state.modules[moduleId].queryNameIdMapping[query.name] = query.id;
              state.modules[moduleId].queryIdNameMapping[query.id] = query.name;
            });

            state.dataQuery.queries.modules[moduleId] = updatedQueriesValue;

            const currentSelectedQueryId = state.queryPanel.selectedQuery?.id;
            if (currentSelectedQueryId && queriesToUpdate.has(currentSelectedQueryId)) {
              const updatedSelectedQuery = updatedQueriesValue.find((q) => q.id === currentSelectedQueryId);
              if (updatedSelectedQuery) {
                state.queryPanel.selectedQuery = updatedSelectedQuery;
                /** Keep selectedDataSource in sync
                 *  - This path mutates selectedQuery directly (not via setSelectedQuery)
                 *  - so re-resolve the datasource here to avoid rendering against a stale one.
                 */
                state.queryPanel.selectedDataSource = get().queryPanel.resolveDataSourceForQuery(updatedSelectedQuery);
              }
            }
          },
          false,
          'performDeletionUpdationAndCreationOfQuery'
        );

        runLoadQueriesOnCreate && queriesToCreate.length && get().dataQuery.runOnLoadQueries(moduleId, queriesToCreate);

        get().rebuildQueryHints(moduleId);
      },
    },
  };
};

const sortByAttribute = (data, sortBy, order) => {
  if (sortBy === 'updated_at') {
    return data.sort((a, b) => {
      const aTime = new Date(a.updated_at ?? 0).getTime();
      const bTime = new Date(b.updated_at ?? 0).getTime();
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    });
  }
  if (order === 'asc') {
    if (sortBy === 'kind') {
      return data.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
    }
    return data.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }
  if (order === 'desc') {
    if (sortBy === 'kind') {
      return data.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => b[sortBy].localeCompare(a[sortBy]));
    }
    return data.sort((a, b) => b[sortBy].localeCompare(a[sortBy]));
  }
};
