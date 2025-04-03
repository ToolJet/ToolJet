import _, { isEmpty } from 'lodash';
import { resolveReferences, loadPyodide, hasCircularDependency } from '@/_helpers/utils';
import { fetchOAuthToken, fetchOauthTokenForSlackAndGSheet } from '@/AppBuilder/_utils/auth';
import { dataqueryService, workflowExecutionsService } from '@/_services';
import moment from 'moment';
import axios from 'axios';
import { validateMultilineCode } from '@/_helpers/utility';
import { convertMapSet, getQueryVariables } from '@/AppBuilder/_utils/queryPanel';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import toast from 'react-hot-toast';
const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};

const initialState = {
  isQueryPaneExpanded: false,
  isDraggingQueryPane: false,
  queryPanelHeight: queryManagerPreferences?.isExpanded ? queryManagerPreferences?.queryPanelHeight : 95 ?? 70,
  selectedQuery: null,
  previewPanelHeight: 0,
  selectedDataSource: null,
  queryToBeRun: null,
  previewLoading: false,
  queryPreviewData: '',
  showCreateQuery: false,
  nameInputFocused: false,
  previewPanelExpanded: false,
  loadingDataQueries: false,
  isPreviewQueryLoading: false,
  queryPanelSearchTem: '',
};

export const createQueryPanelSlice = (set, get) => ({
  queryPanel: {
    ...initialState,
    setQueryPanelSearchTerm: (searchTerm) =>
      set(
        (state) => {
          state.queryPanel.queryPanelSearchTem = searchTerm;
        },
        false,
        'setQueryPanelSearchTerm'
      ),
    setIsDraggingQueryPane: (isDraggingQueryPane) =>
      set(
        (state) => {
          state.queryPanel.isDraggingQueryPane = isDraggingQueryPane;
        },
        false,
        'setIsDraggingQueryPane'
      ),
    setIsQueryPaneExpanded: (isQueryPaneExpanded) =>
      set(
        (state) => {
          state.queryPanel.isQueryPaneExpanded = isQueryPaneExpanded;
        },
        false,
        'setIsQueryPaneExpanded'
      ),
    setQueryPanelHeight: (queryPanelHeight) => {
      const currentQueryPanelHeight = get().queryPanel.queryPanelHeight;
      if (currentQueryPanelHeight === queryPanelHeight) return;
      set(
        (state) => {
          state.queryPanel.queryPanelHeight = queryPanelHeight;
        },
        false,
        'setQueryPanelHeight'
      );
    }, // updateQueryPanelHeight
    setSelectedQuery: (queryId) => {
      set((state) => {
        if (queryId === null) {
          state.queryPanel.selectedQuery = null;
          return;
        }
        const query = get().dataQuery.queries.modules.canvas.find((query) => query.id === queryId);
        state.queryPanel.selectedQuery = query;
        return;
      });
    },
    setIsPreviewQueryLoading: (isPreviewQueryLoading) =>
      set(
        (state) => {
          state.queryPanel.isPreviewQueryLoading = isPreviewQueryLoading;
        },
        false,
        'setIsPreviewQueryLoading'
      ),

    setPreviewPanelHeight: (newHeight) => {
      const currentPreviewPanelHeight = get().queryPanel.previewPanelHeight;
      if (currentPreviewPanelHeight === newHeight) return;
      set(
        (state) => {
          state.queryPanel.previewPanelHeight = newHeight;
        },
        false,
        'setPreviewPanelHeight'
      );
    }, // updatePreviewPanelHeight
    setSelectedDataSource: (dataSource = null) =>
      set(
        (state) => {
          state.queryPanel.selectedDataSource = dataSource;
        },
        false,
        'setSelectedDataSource'
      ),
    setQueryToBeRun: (query) =>
      set(
        (state) => {
          state.queryPanel.queryToBeRun = query;
        },
        false,
        'setQueryToBeRun'
      ),
    setPreviewLoading: (status) =>
      set(
        (state) => {
          state.queryPanel.previewLoading = status;
        },
        false,
        'setPreviewLoading'
      ),
    setPreviewData: (data) =>
      set(
        (state) => {
          state.queryPanel.queryPreviewData = data;
        },
        false,
        'setPreviewData'
      ),
    setShowCreateQuery: (showCreateQuery) =>
      set(
        (state) => {
          state.queryPanel.showCreateQuery = showCreateQuery;
        },
        false,
        'setShowCreateQuery'
      ),
    setNameInputFocused: (nameInputFocused) =>
      set(
        (state) => {
          state.queryPanel.nameInputFocused = nameInputFocused;
        },
        false,
        'setNameInputFocused'
      ),
    setPreviewPanelExpanded: (previewPanelExpanded) =>
      set(
        (state) => {
          state.queryPanel.previewPanelExpanded = previewPanelExpanded;
        },
        false,
        'setPreviewPanelExpanded'
      ),
    setLoadingDataQueries: (loadingDataQueries) =>
      set(
        (state) => {
          state.queryPanel.loadingDataQueries = loadingDataQueries;
        },
        false,
        'setLoadingDataQueries'
      ),

    onQueryConfirmOrCancel: (queryConfirmationData, isConfirm = false, mode = 'edit') => {
      const { queryPanel, dataQuery, setResolvedQuery } = get();
      const { runQuery } = queryPanel;
      const { queryConfirmationList } = dataQuery;
      const filtertedQueryConfirmation = queryConfirmationList.filter(
        (query) => query.queryId !== queryConfirmationData.queryId
      );

      set(
        (state) => {
          state.dataQuery.queryConfirmationList = filtertedQueryConfirmation;
        },
        false,
        'removeQueryConfirmationItem'
      );

      isConfirm &&
        runQuery(
          queryConfirmationData.queryId,
          queryConfirmationData.queryName,
          true,
          mode,
          queryConfirmationData.parameters,
          queryConfirmationData.shouldSetPreviewData
        );

      !isConfirm &&
        setResolvedQuery(queryConfirmationData.queryId, {
          isLoading: false,
        });
    },

    runQuery: (
      queryId,
      queryName,
      confirmed = undefined,
      mode = 'edit',
      userSuppliedParameters = {},
      component,
      eventId,
      shouldSetPreviewData = false,
      isOnLoad = false,
      moduleId = 'canvas'
    ) => {
      //! TODO get this using get() when migrated into slice
      const {
        eventsSlice,
        dataQuery: dataQuerySlice,
        queryPanel,
        setResolvedQuery,
        app,
        selectedEnvironment,
        isPublicAccess,
        currentVersionId,
      } = get();
      const {
        queryPreviewData,
        setPreviewLoading,
        setPreviewData,
        setPreviewPanelExpanded,
        executeRunPycode,
        runTransformation,
        executeWorkflow,
        executeMultilineJS,
      } = queryPanel;
      const { onEvent } = eventsSlice;
      const { queryConfirmationList } = dataQuerySlice;

      //for resetting the hints when the query is run for large number of items and also child attributes
      //   const resolveStoreActions = useResolveStore.getState().actions;
      //   resolveStoreActions.resetHintsByKey(`queries.${queryName}`);

      let parameters = userSuppliedParameters;

      const query = dataQuerySlice.queries.modules?.[moduleId].find((query) => query.id === queryId);
      const events = eventsSlice?.module?.[moduleId]?.events || [];
      const queryEvents = events.filter((event) => event.target === 'data_query' && event.sourceId === queryId);
      // const queryEvents = [];

      let dataQuery = {};

      //for viewer we will only get the environment id from the url
      const { currentAppEnvironmentId, environmentId } = app;

      if (shouldSetPreviewData) {
        setPreviewPanelExpanded(true);
        setPreviewLoading(true);
        setResolvedQuery(queryId, {
          isLoading: true,
        });

        queryPreviewData && setPreviewData('');
      }
      if (query) {
        dataQuery = JSON.parse(JSON.stringify(query));
      } else {
        throw new Error('No query selected');
      }

      if (_.isEmpty(parameters)) {
        parameters = dataQuery.options?.parameters?.reduce(
          (parameters, parameter) => ({
            ...parameters,
            [parameter.name]: resolveReferences(parameter.defaultValue, undefined),
          }),
          {}
        );
      }

      //   const queryState = { ...getCurrentState(), parameters };
      const queryState = { ...get().getAllExposedValues('canvas'), parameters };
      const options = getQueryVariables(dataQuery.options, queryState, {
        components: get().getComponentNameIdMapping(),
        queries: get().getQueryNameIdMapping(),
      });
      if (dataQuery.options?.requestConfirmation) {
        const queryConfirmation = {
          queryId,
          queryName,
          shouldSetPreviewData,
          parameters,
        };

        if (!queryConfirmationList.some((query) => queryId === query.queryId) && confirmed === undefined) {
          setPreviewLoading(false);
          set(
            (state) => {
              state.dataQuery.queryConfirmationList = [...queryConfirmationList, queryConfirmation];
            },
            false,
            'setQueryConfirmationList'
          );
          return;
        }
      }

      // eslint-disable-next-line no-unused-vars
      return new Promise(function (resolve, reject) {
        if (shouldSetPreviewData) {
          setPreviewLoading(true);
          queryPreviewData && setPreviewData('');
        }

        setResolvedQuery(queryId, {
          isLoading: true,
          data: [],
          rawData: [],
          id: queryId,
        });

        let queryExecutionPromise = null;
        if (query.kind === 'runjs') {
          queryExecutionPromise = executeMultilineJS(query.options.code, query?.id, false, mode, parameters);
        } else if (query.kind === 'runpy') {
          queryExecutionPromise = executeRunPycode(query.options.code, query, false, mode, queryState);
        } else if (query.kind === 'workflows') {
          queryExecutionPromise = executeWorkflow(
            moduleId,
            query.options.workflowId,
            query.options.blocking,
            query.options?.params,
            (currentAppEnvironmentId ?? environmentId) || selectedEnvironment?.id //TODO: currentAppEnvironmentId may no longer required. Need to check
          );
        } else {
          queryExecutionPromise = dataqueryService.run(
            queryId,
            options,
            query?.options,
            currentVersionId,
            !isPublicAccess ? (currentAppEnvironmentId ?? environmentId) || selectedEnvironment?.id : undefined //TODO: currentAppEnvironmentId may no longer required. Need to check
          );
        }

        queryExecutionPromise
          .then(async (data) => {
            if (data.status === 'needs_oauth') {
              localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);
              const url = data.data.auth_url; // Backend generates and return sthe auth url
              fetchOAuthToken(url, dataQuery['data_source_id'] || dataQuery['dataSourceId']);
            }

            let queryStatusCode = data?.status ?? null;
            const promiseStatus = query.kind === 'runpy' ? data?.data?.status ?? 'ok' : data.status;
            // Note: Need to move away from statusText -> statusCode
            if (
              promiseStatus === 'failed' ||
              promiseStatus === 'Bad Request' ||
              promiseStatus === 'Not Found' ||
              promiseStatus === 'Unprocessable Entity' ||
              queryStatusCode === 400 ||
              queryStatusCode === 404 ||
              queryStatusCode === 422
            ) {
              let errorData = {};
              switch (query.kind) {
                case 'runpy':
                  errorData = data.data;
                  break;
                case 'tooljetdb':
                  if (data?.error) {
                    errorData = {
                      message: data?.error?.message || 'Something went wrong',
                      description: data?.error?.message || 'Something went wrong',
                      status: data?.statusText || 'Failed',
                      data: data?.error || {},
                    };
                  } else {
                    errorData = data;
                    errorData.description = data.errorMessage || 'Something went wrong';
                  }
                  break;
                default:
                  errorData = data;
                  break;
              }
              if (shouldSetPreviewData) {
                setPreviewLoading(false);
                setPreviewData(errorData);
              }
              errorData = query.kind === 'runpy' || query.kind === 'runjs' ? data?.data : data;
              get().debugger.log({
                logLevel: 'error',
                type: 'query',
                kind: query.kind,
                key: query.name,
                message: errorData?.description,
                errorTarget: 'Queries',
                error:
                  query.kind === 'restapi'
                    ? {
                        substitutedVariables: options,
                        request: data?.data?.requestObject,
                        response: data?.data?.responseObject,
                      }
                    : errorData,
                isQuerySuccessLog: false,
              });

              setResolvedQuery(queryId, {
                isLoading: false,
                ...(query.kind === 'restapi'
                  ? {
                      request: data.data.requestObject,
                      response: data.data.responseObject,
                      responseHeaders: data.data.responseHeaders,
                    }
                  : {}),
              });

              resolve(data);
              onEvent('onDataQueryFailure', queryEvents);
              return;
            } else {
              let rawData = data.data;
              let finalData = data.data;
              if (dataQuery.options.enableTransformation) {
                finalData = await runTransformation(
                  finalData,
                  query.options.transformation,
                  query.options.transformationLanguage,
                  query,
                  'edit'
                );
                if (finalData?.status === 'failed') {
                  setResolvedQuery(queryId, {
                    isLoading: false,
                  });

                  resolve(finalData);
                  onEvent('onDataQueryFailure', queryEvents);
                  setPreviewLoading(false);
                  if (shouldSetPreviewData) setPreviewData(finalData);
                  return;
                }
              }

              if (shouldSetPreviewData) {
                setPreviewLoading(false);
                setPreviewData(finalData);
              }

              if (dataQuery.options.showSuccessNotification) {
                const notificationDuration = dataQuery.options.notificationDuration * 1000 || 5000;
                toast.success(dataQuery.options.successMessage, {
                  duration: notificationDuration,
                });
              }

              get().debugger.log({
                logLevel: 'success',
                type: 'query',
                kind: query.kind,
                key: query.name,
                message: 'Query executed successfully',
                isQuerySuccessLog: true,
                errorTarget: 'Queries',
              });

              setResolvedQuery(queryId, {
                isLoading: false,
                data: finalData,
                rawData,
                metadata: data?.metadata,
                request: data?.metadata?.request,
                response: data?.metadata?.response,
              });

              resolve({ status: 'ok', data: finalData });
              onEvent('onDataQuerySuccess', queryEvents, mode);
            }
          })
          .catch((e) => {
            const { error } = e;
            if (mode !== 'view') toast.error(error ?? 'Unknown error');
            resolve({ status: 'failed', message: error });
          });
      });
    },

    previewQuery: (query, calledFromQuery = false, userSuppliedParameters = {}, moduleId = 'canvas') => {
      const { eventsSlice, queryPanel, app, currentVersionId, selectedEnvironment } = get();
      const {
        queryPreviewData,
        setPreviewLoading,
        setPreviewData,
        setPreviewPanelExpanded,
        executeRunPycode,
        runTransformation,
        executeWorkflow,
        executeMultilineJS,
        setIsPreviewQueryLoading,
      } = queryPanel;
      const { onEvent } = eventsSlice;

      let parameters = userSuppliedParameters;

      // passing current env through props only for querymanager
      const { environmentId } = app;
      const currentAppEnvironmentId = selectedEnvironment?.id || '';

      // const queryPanelState = useQueryPanelStore.getState();
      // const { queryPreviewData } = queryPanelState;

      // const queryEvents = useAppDataStore
      //   .getState()
      //   .events.filter((event) => event.target === 'data_query' && event.sourceId === query.id);
      const queryEvents = [];
      setPreviewLoading(true);
      setIsPreviewQueryLoading(true);
      setPreviewPanelExpanded(true);
      if (queryPreviewData) {
        setPreviewData('');
      }

      if (_.isEmpty(parameters)) {
        parameters = query.options?.parameters?.reduce(
          (parameters, parameter) => ({
            ...parameters,
            [parameter.name]: resolveReferences(parameter.defaultValue, undefined),
          }),
          {}
        );
      }

      // const queryState = { ...getCurrentState(), parameters };
      const queryState = { ...get().getAllExposedValues(), parameters };
      const options = getQueryVariables(query.options, queryState, {
        components: get().getComponentNameIdMapping(),
        queries: get().getQueryNameIdMapping(),
      });

      return new Promise(function (resolve, reject) {
        let queryExecutionPromise = null;
        if (query.kind === 'runjs') {
          queryExecutionPromise = executeMultilineJS(query.options.code, query?.id, true, '', parameters);
        } else if (query.kind === 'runpy') {
          queryExecutionPromise = executeRunPycode(query.options.code, query, true, 'edit', queryState);
        } else if (query.kind === 'workflows') {
          queryExecutionPromise = executeWorkflow(
            moduleId,
            query.options.workflowId,
            query.options.blocking,
            query.options?.params,
            (currentAppEnvironmentId ?? environmentId) || selectedEnvironment?.id //TODO: currentAppEnvironmentId may no longer required. Need to check
          );
        } else {
          queryExecutionPromise = dataqueryService.preview(query, options, currentVersionId, currentAppEnvironmentId);
        }

        queryExecutionPromise
          .then(async (data) => {
            let finalData = data.data;
            let queryStatusCode = data?.status ?? null;
            const queryStatus = query.kind === 'runpy' ? data?.data?.status ?? 'ok' : data.status;
            switch (true) {
              // Note: Need to move away from statusText -> statusCode
              case queryStatus === 'Bad Request' ||
                queryStatus === 'Not Found' ||
                queryStatus === 'Unprocessable Entity' ||
                queryStatus === 'failed' ||
                queryStatusCode === 400 ||
                queryStatusCode === 404 ||
                queryStatusCode === 422: {
                let errorData = {};
                switch (query.kind) {
                  case 'runpy':
                    errorData = data.data;
                    break;
                  case 'tooljetdb':
                    if (data?.error) {
                      errorData = {
                        message: data?.error?.message || 'Something went wrong',
                        description: data?.error?.message || 'Something went wrong',
                        status: data?.statusText || 'Failed',
                        data: data?.error || {},
                      };
                    } else {
                      errorData = data;
                      errorData.description = data.errorMessage || 'Something went wrong';
                    }
                    break;
                  default:
                    errorData = data;
                    break;
                }

                onEvent('onDataQueryFailure', queryEvents);

                if (!calledFromQuery) setPreviewData(errorData);

                break;
              }
              case queryStatus === 'needs_oauth': {
                const url = data.data.auth_url; // Backend generates and return sthe auth url
                const kind = data.data?.kind;
                localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);
                if (['slack', 'googlesheets', 'zendesk'].includes(kind)) {
                  fetchOauthTokenForSlackAndGSheet(query.data_source_id, data.data);
                  break;
                }
                fetchOAuthToken(url, query.data_source_id);
                break;
              }
              case queryStatus === 'ok' ||
                queryStatus === 'OK' ||
                queryStatus === 'Created' ||
                queryStatus === 'Accepted' ||
                queryStatus === 'No Content': {
                toast(`Query ${'(' + query.name + ') ' || ''}completed.`, {
                  icon: '🚀',
                });
                if (query.options.enableTransformation) {
                  finalData = await runTransformation(
                    finalData,
                    query.options.transformation,
                    query.options.transformationLanguage,
                    query,
                    'edit'
                  );
                  if (finalData?.status === 'failed') {
                    onEvent('onDataQueryFailure', queryEvents);
                    setPreviewLoading(false);
                    setIsPreviewQueryLoading(false);
                    resolve({ status: data.status, data: finalData });
                    if (!calledFromQuery) setPreviewData(finalData);
                    return;
                  }
                }

                if (!calledFromQuery) setPreviewData(finalData);
                onEvent('onDataQuerySuccess', queryEvents, 'edit');
                break;
              }
            }
            setPreviewLoading(false);
            setIsPreviewQueryLoading(false);

            resolve({ status: data.status, data: finalData });
          })
          .catch((err) => {
            const { error, data } = err;
            console.log(err, error, data);
            setPreviewLoading(false);
            setIsPreviewQueryLoading(false);
            setPreviewData(data);
            toast.error(error);
            reject({ error, data });
          });
      });
    },

    executeRunPycode: async (code, query, isPreview, mode, currentState) => {
      const {
        queryPanel: { evaluatePythonCode },
      } = get();
      return { data: await evaluatePythonCode({ code, query, isPreview, mode, currentState }) };
    },

    evaluatePythonCode: async (options, moduleId = 'canvas') => {
      const { eventsSlice, dataQuery } = get();
      const { generateAppActions } = eventsSlice;
      const { query, mode, isPreview, code, currentState, queryResult } = options;
      let pyodide;
      try {
        pyodide = await loadPyodide();
      } catch (errorMessage) {
        return {
          data: {
            status: 'failed',
            message: errorMessage,
          },
        };
      }
      const log = (line) => console.log({ line });
      let result = {};

      try {
        const resolvedState = get().getResolvedState();
        const queriesInCurentState = deepClone(resolvedState.queries);
        const appStateVars = deepClone(resolvedState.variables) ?? {};
        if (!isEmpty(query)) {
          const actions = generateAppActions(query.id, mode, isPreview);

          for (const key of Object.keys(queriesInCurentState)) {
            queriesInCurentState[key] = {
              ...queriesInCurentState[key],
              run: () => {
                const query = dataQuery.queries.modules?.[moduleId].find((q) => q.name === key);
                return actions.runQuery(query.name);
              },

              getData: () => {
                const resolvedState = get().getResolvedState();
                return resolvedState.queries[key].data;
              },

              getRawData: () => {
                const resolvedState = get().getResolvedState();
                return resolvedState.queries[key].rawData;
              },

              getloadingState: () => {
                const resolvedState = get().getResolvedState();
                return resolvedState.queries[key].isLoading;
              },
            };
          }

          await pyodide.globals.set('actions', actions);
        }
        await pyodide.globals.set('components', resolvedState['components']);
        await pyodide.globals.set('queries', queriesInCurentState);
        await pyodide.globals.set('tj_globals', resolvedState['globals']);
        await pyodide.globals.set('constants', resolvedState['constants']);
        await pyodide.globals.set('page', deepClone(resolvedState['page']));
        await pyodide.globals.set('parameters', currentState['parameters']);
        await pyodide.globals.set('variables', appStateVars);
        if (queryResult) await pyodide.globals.set('data', queryResult);

        await pyodide.loadPackagesFromImports(code);
        await pyodide.loadPackage('micropip', log);

        let pyresult = await pyodide.runPythonAsync(code);
        result = await pyresult;
      } catch (err) {
        console.error(err);

        const errorType = err.message.includes('SyntaxError') ? 'SyntaxError' : 'NameError';
        const error = err.message.split(errorType + ': ')[1];
        const errorMessage = `${errorType} : ${error}`;

        result = {
          status: 'failed',
          message: errorMessage,
          description: {
            code: query?.options?.code,
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
          },
        };
      }

      return pyodide.isPyProxy(result) ? convertMapSet(result.toJs()) : result;
    },

    runTransformation: async (rawData, transformation, transformationLanguage = 'javascript', query, mode = 'edit') => {
      const data = rawData;
      const {
        queryPanel: { runPythonTransformation, createProxy },
        getResolvedState,
      } = get();
      let result = {};
      const currentState = getResolvedState();

      if (transformationLanguage === 'python') {
        result = await runPythonTransformation(currentState, data, transformation, query, mode);
      } else if (transformationLanguage === 'javascript') {
        try {
          const { eventsSlice } = get();
          const { generateAppActions } = eventsSlice;
          const queriesInResolvedState = deepClone(currentState.queries);
          const actions = generateAppActions(query?.id, mode);

          const proxiedComponents = createProxy(currentState?.components, 'components');
          const proxiedGlobals = createProxy(currentState?.globals, 'globals');
          const proxiedConstants = createProxy(currentState?.constants, 'constants');
          const proxiedVariables = createProxy(currentState?.variables, 'variables');
          const proxiedPage = createProxy(deepClone(currentState?.page, 'page'));
          const proxiedQueriesInResolvedState = createProxy(queriesInResolvedState, 'queries');

          const evalFunction = Function(
            ['data', 'moment', '_', 'components', 'queries', 'globals', 'variables', 'page', 'constants', 'actions'],
            transformation
          );

          result = evalFunction(
            data,
            moment,
            _,
            proxiedComponents,
            proxiedQueriesInResolvedState,
            proxiedGlobals,
            proxiedVariables,
            proxiedPage,
            proxiedConstants,
            {
              logError: function (log) {
                return actions.logError.call(actions, log, true);
              },
              logInfo: function (log) {
                return actions.logInfo.call(actions, log, true);
              },
              log: function (log) {
                return actions.log.call(actions, log, true);
              },
            }
          );
        } catch (err) {
          const stackLines = err.stack.split('\n');
          const errorLocation =
            stackLines[2]?.match(/<anonymous>:(\d+):(\d+)/) ?? stackLines[1]?.match(/<anonymous>:(\d+):(\d+)/);

          let lineNumber = null;

          if (errorLocation) {
            lineNumber = errorLocation[1] - 2;
          }

          console.log('JS execution failed: ', err);
          let error = err.message || err.stack.split('\n')[0] || 'JS execution failed';
          result = { status: 'failed', data: { message: error, description: error, lineNumber } };
          get().debugger.log({
            logLevel: result?.status === 'failed' ? 'error' : 'success',
            type: 'transformation',
            kind: query.kind,
            key: `${query.name}, transformation, line ${result?.data?.lineNumber}`,
            message: result?.message,
            error: result?.data,
            isTransformation: true,
            isQuerySuccessLog: result?.status === 'failed' ? false : true,
            errorTarget: 'Queries',
          });
        }
      }
      return result;
    },

    runPythonTransformation: async (currentState, rawData, transformation, query, mode) => {
      const {
        queryPanel: { executePycode },
      } = get();
      const data = rawData;
      try {
        return await executePycode(data, transformation, currentState, query, mode);
      } catch (error) {
        console.log(error);
      }
    },

    executePycode: async (queryResult, code, currentState, query, mode) => {
      const {
        queryPanel: { evaluatePythonCode },
      } = get();
      return await evaluatePythonCode({ queryResult, code, query, mode, currentState });
    },

    updateQuerySuggestions: (oldName, newName) => {
      const { dataQuery } = get();
      const queries = dataQuery.queries.modules.canvas;

      if (!queries[oldName]) {
        return;
      }

      const updatedQueries = {
        ...queries,
        [newName]: {
          ...queries[oldName],
          name: newName,
        },
      };

      delete updatedQueries[oldName];

      const oldSuggestions = Object.keys(queries[oldName]).map((key) => `queries.${oldName}.${key}`);
      // useResolveStore.getState().actions.removeAppSuggestions(oldSuggestions);

      // useCurrentStateStore.getState().actions.setCurrentState({
      //   ...currentState,
      //   queries: updatedQueries,
      // });
    },
    executeWorkflow: async (moduleId, workflowId, _blocking = false, params = {}, appEnvId) => {
      const {
        app: { appId },
        getAllExposedValues,
      } = get();
      const currentState = getAllExposedValues();
      const resolvedParams = get().resolveReferences(moduleId, params, currentState, {}, {});

      try {
        const response = await workflowExecutionsService.execute(workflowId, resolvedParams, appId, appEnvId);
        return { data: response.result, status: 'ok' };
      } catch (e) {
        return { data: undefined, status: 'failed' };
      }
    },

    createProxy: (obj, path = '') => {
      const { queryPanel } = get();
      const { createProxy } = queryPanel;

      return new Proxy(obj, {
        get(target, prop) {
          const fullPath = path ? `${path}.${prop}` : prop;

          if (!(prop in target)) {
            throw new Error(`ReferenceError: ${fullPath} is not defined`);
          }

          const value = target[prop];
          return typeof value === 'object' && value !== null ? createProxy(value, fullPath) : value;
        },
      });
    },

    executeMultilineJS: async (code, queryId, isPreview, mode = '', parameters = {}, moduleId = 'canvas') => {
      const { queryPanel, dataQuery, getAllExposedValues, eventsSlice } = get();
      const { createProxy } = queryPanel;
      const { generateAppActions } = eventsSlice;
      const isValidCode = validateMultilineCode(code, true);

      if (isValidCode.status === 'failed') {
        return isValidCode;
      }

      const currentState = getAllExposedValues();

      let result = {},
        error = null;

      //if user passes anything other than object, params are reset to empty
      if (typeof parameters !== 'object' || parameters === null) {
        parameters = {};
      }

      const actions = generateAppActions(queryId, mode, isPreview);

      const queryDetails = dataQuery.queries.modules?.[moduleId].find((q) => q.id === queryId);

      const defaultParams =
        queryDetails?.options?.parameters?.reduce(
          (paramObj, param) => ({
            ...paramObj,
            [param.name]: resolveReferences(param.defaultValue, undefined), //default values will not be resolved with currentState
          }),
          {}
        ) || {};

      let formattedParams = {};
      if (queryDetails) {
        Object.keys(defaultParams).map((key) => {
          /** The value of param is replaced with defaultValue if its passed undefined */
          formattedParams[key] = parameters[key] === undefined ? defaultParams[key] : parameters[key];
        });
      } else {
        //this will handle the preview case where you cannot find the queryDetails in state.
        formattedParams = { ...parameters };
      }
      const resolvedState = get().getResolvedState();
      const queriesInResolvedState = deepClone(resolvedState.queries);
      for (const key of Object.keys(resolvedState.queries)) {
        queriesInResolvedState[key] = {
          ...queriesInResolvedState[key],
          run: (params) => {
            if (typeof params !== 'object' || params === null) {
              params = {};
            }
            const processedParams = {};
            const query = dataQuery.queries.modules?.[moduleId].find((q) => q.name === key);
            query.options.parameters?.forEach((arg) => (processedParams[arg.name] = params[arg.name]));
            return actions.runQuery(query.name, processedParams);
          },

          getData: () => {
            const resolvedState = get().getResolvedState();
            return resolvedState.queries[key].data;
          },

          getRawData: () => {
            const resolvedState = get().getResolvedState();
            return resolvedState.queries[key].rawData;
          },

          getloadingState: () => {
            const resolvedState = get().getResolvedState();
            return resolvedState.queries[key].isLoading;
          },
        };
      }

      try {
        const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();

        //Proxy Func required to get current execution line number from stack to log in debugger

        const proxiedComponents = createProxy(deepClone(resolvedState?.components), 'components');
        const proxiedGlobals = createProxy(deepClone(resolvedState?.globals), 'globals');
        const proxiedConstants = createProxy(deepClone(resolvedState?.constants), 'constants');
        const proxiedVariables = createProxy(deepClone(resolvedState?.variables), 'variables');
        const proxiedPage = createProxy(deepClone(resolvedState?.page, 'page'));
        const proxiedQueriesInResolvedState = createProxy(deepClone(queriesInResolvedState), 'queries');
        const proxiedFormattedParams = createProxy(
          !_.isEmpty(proxiedFormattedParams) ? [proxiedFormattedParams] : [],
          'params'
        );

        const fnParams = [
          'moment',
          '_',
          'components',
          'queries',
          'globals',
          'page',
          'axios',
          'variables',
          'actions',
          'constants',
          ...(!_.isEmpty(formattedParams) ? ['parameters'] : []),
          code,
        ];
        const evalFn = new AsyncFunction(...fnParams);

        const fnArgs = [
          moment,
          _,
          proxiedComponents,
          proxiedQueriesInResolvedState,
          proxiedGlobals,
          proxiedPage,
          axios,
          proxiedVariables,
          actions,
          proxiedConstants,
          ...proxiedFormattedParams,
        ];

        result = {
          status: 'ok',
          data: await evalFn(...fnArgs),
        };
      } catch (err) {
        const stackLines = err.stack.split('\n');
        const errorLocation =
          stackLines[2]?.match(/<anonymous>:(\d+):(\d+)/) ?? stackLines[1]?.match(/<anonymous>:(\d+):(\d+)/);

        let lineNumber = null;

        if (errorLocation) {
          lineNumber = errorLocation[1] - 2;
        }

        console.log('JS execution failed: ', err);
        error = err.message || err.stack.split('\n')[0] || 'JS execution failed';
        result = { status: 'failed', data: { message: error, description: error, lineNumber } };
      }

      if (hasCircularDependency(result)) {
        return {
          status: 'failed',
          data: {
            message: 'Circular dependency detected',
            description: 'Cannot resolve circular dependency',
          },
        };
      }

      return result;
    },
    isQuerySelected: (queryId) => {
      return get().queryPanel.selectedQuery?.id === queryId;
    },
  },
});
