import { toast } from 'react-hot-toast';
import { AsyncQueryHandler } from '@/AppBuilder/_utils/async-query-handler';
import _, { isEmpty } from 'lodash';
import { resolveReferences, loadPyodide, hasCircularDependency } from '@/_helpers/utils';
import { fetchOAuthToken, fetchOauthTokenForSlackAndGSheet } from '@/AppBuilder/_utils/auth';
import { dataqueryService, workflowExecutionsService } from '@/_services';
import moment from 'moment';
import axios from 'axios';
import { validateMultilineCode } from '@/_helpers/utility';
import { convertMapSet, getQueryVariables } from '@/AppBuilder/_utils/queryPanel';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {};

const initialState = {
  isQueryPaneExpanded: queryManagerPreferences?.isExpanded ?? true,
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
  showQueryPermissionModal: false,
  targetBtnForMenu: null,
  showQueryHandlerMenu: false,
  showDeleteConfirmation: false,
  renamingQueryId: null,
  deletingQueryId: null,
  asyncQueryRuns: [],
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
    setSelectedQuery: (queryId, moduleId = 'canvas') => {
      set((state) => {
        if (queryId === null) {
          state.queryPanel.selectedQuery = null;
          return;
        }
        const query = get().dataQuery.queries.modules[moduleId].find((query) => query.id === queryId);
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

    setAsyncQueryRuns: (updater) =>
      set(
        (state) => {
          if (typeof updater === 'function') {
            state.queryPanel.asyncQueryRuns = updater(state.queryPanel.asyncQueryRuns);
          } else {
            state.queryPanel.asyncQueryRuns = updater;
          }
        },
        false,
        'setAsyncQueryRuns'
      ),

    onQueryConfirmOrCancel: (queryConfirmationData, isConfirm = false, mode = 'edit', moduleId = 'canvas') => {
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
          undefined,
          undefined,
          queryConfirmationData.shouldSetPreviewData,
          false,
          moduleId
        );

      !isConfirm &&
        setResolvedQuery(
          queryConfirmationData.queryId,
          {
            isLoading: false,
          },
          moduleId
        );
    },

    createWorkflowAsyncHandler: ({
      executionId,
      queryId,
      processQueryResults,
      handleFailure,
      shouldSetPreviewData,
      setPreviewData,
      setResolvedQuery,
    }) => {
      const asyncHandler = new AsyncQueryHandler({
        streamSSE: (jobId) => {
          return workflowExecutionsService.streamSSE(jobId);
        },
        extractJobId: () => executionId,
        classifyEventStatus: (eventData) => {
          // hardcoded for workflows
          if (eventData.type === 'workflow_connection_close') {
            return { status: 'CLOSE', data: eventData };
          } else if (eventData.type === 'workflow_execution_completed') {
            return { status: 'COMPLETE', result: eventData.result, data: eventData };
          } else if (eventData.type === 'workflow_execution_error') {
            return { status: 'ERROR', data: eventData };
          } else {
            return { status: 'PROGRESS', data: eventData };
          }
        },
        callbacks: {
          onProgress: (progressData) => {
            // Update UI with progress information
            if (shouldSetPreviewData) {
              setPreviewData({ ...progressData });
            }
            setResolvedQuery(queryId, {
              isLoading: true,
              progress: progressData.progress,
              currentData: progressData.partialData || [],
            });
          },
          onComplete: async (result) => {
            await processQueryResults(result);
            // Remove the AsyncQueryHandler instance from asyncQueryRuns on completion
            get().queryPanel.setAsyncQueryRuns((currentRuns) =>
              currentRuns.filter((handler) => handler.jobId !== asyncHandler.jobId)
            );
          },
          onError: (e) => {
            handleFailure({
              status: 'failed',
              message: e?.error?.message || 'Error running workflow',
              description: e?.error?.description || null,
              data: typeof e?.error === 'object' ? { ...e.error } : e?.error,
            });
            // Remove the AsyncQueryHandler instance from asyncQueryRuns on error
            get().queryPanel.setAsyncQueryRuns((currentRuns) =>
              currentRuns.filter((handler) => handler.jobId !== asyncHandler.jobId)
            );
          },
        },
      });

      return asyncHandler;
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
      const {
        eventsSlice,
        dataQuery: dataQuerySlice,
        queryPanel,
        setResolvedQuery,
        appStore,
        selectedEnvironment,
        isPublicAccess,
        currentVersionId,
        modeStore,
      } = get();
      const {
        queryPreviewData,
        setPreviewLoading,
        setPreviewData,
        setPreviewPanelExpanded,
        executeRunPycode,
        runTransformation,
        triggerWorkflow,
        executeMultilineJS,
      } = queryPanel;
      const queryUpdatePromise = dataQuerySlice.queryUpdates[queryId];
      if (queryUpdatePromise) {
        setResolvedQuery(queryId, {
          isLoading: true,
        });
        return queryUpdatePromise.then(() =>
          get().queryPanel.runQuery(
            queryId,
            queryName,
            confirmed,
            mode,
            userSuppliedParameters,
            component,
            eventId,
            shouldSetPreviewData,
            isOnLoad,
            moduleId
          )
        );
      }
      //! TODO get this using get() when migrated into slice

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
      const { currentAppEnvironmentId, environmentId } = appStore.modules[moduleId].app;

      if (shouldSetPreviewData) {
        setPreviewPanelExpanded(true);
        setPreviewLoading(true);
        setResolvedQuery(
          queryId,
          {
            isLoading: true,
          },
          moduleId
        );

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
      const queryState = { ...get().getAllExposedValues(moduleId), parameters };

      const options = getQueryVariables(dataQuery.options, queryState, {
        components: get().getComponentNameIdMapping(moduleId),
        queries: get().getQueryNameIdMapping(moduleId),
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

      // Handler for transformation and completion of query results
      const processQueryResults = async (data, rawData = null) => {
        let finalData = data;
        rawData = rawData || data;

        if (dataQuery.options.enableTransformation) {
          const language = query.options.transformationLanguage;
          finalData = await runTransformation(
            finalData,
            query.options.transformations?.[language] ?? query.options.transformation,
            query.options.transformationLanguage,
            query,
            mode,
            moduleId
          );

          if (finalData.status === 'failed') {
            handleFailure(finalData);
            return finalData;
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

        setResolvedQuery(
          queryId,
          {
            isLoading: false,
            data: finalData,
            rawData,
            metadata: data?.metadata,
            request: data?.metadata?.request,
            response: data?.metadata?.response,
          },
          moduleId
        );

        onEvent('onDataQuerySuccess', queryEvents, mode);
        return { status: 'ok', data: finalData };
      };

      // Handler for query failures
      const handleFailure = (errorData) => {
        if (shouldSetPreviewData) {
          setPreviewLoading(false);
          setPreviewData(errorData);
        }

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
                  request: errorData?.requestObject,
                  response: errorData?.responseObject,
                }
              : errorData,
          isQuerySuccessLog: false,
        });

        setResolvedQuery(
          queryId,
          {
            isLoading: false,
            ...(query.kind === 'restapi' || errorData?.type === 'tj-401'
              ? {
                  metadata: errorData?.metadata,
                  request: errorData?.requestObject,
                  response: errorData?.responseObject,
                  responseHeaders: errorData?.responseHeaders,
                }
              : {}),
          },
          moduleId
        );

        setResolvedQuery(
          queryId,
          {
            isLoading: false,
            error: errorData,
          },
          moduleId
        );

        onEvent('onDataQueryFailure', queryEvents);
        return errorData;
      };

      // eslint-disable-next-line no-unused-vars
      return new Promise(function (resolve, reject) {
        if (shouldSetPreviewData) {
          setPreviewLoading(true);
          queryPreviewData && setPreviewData('');
        }

        setResolvedQuery(
          queryId,
          {
            isLoading: true,
            data: [],
            rawData: [],
            id: queryId,
          },
          moduleId
        );

        let queryExecutionPromise = null;
        if (query.kind === 'runjs') {
          queryExecutionPromise = executeMultilineJS(query.options?.code, query?.id, false, mode, parameters, moduleId);
        } else if (query.kind === 'runpy') {
          queryExecutionPromise = executeRunPycode(query.options?.code, query, false, mode, queryState, moduleId);
        } else if (query.kind === 'workflows') {
          queryExecutionPromise = triggerWorkflow(
            moduleId,
            query.options?.workflowId,
            query.options?.blocking,
            query.options?.params,
            (currentAppEnvironmentId ?? environmentId) || selectedEnvironment?.id //TODO: currentAppEnvironmentId may no longer required. Need to check
          );
        } else {
          const isReleasedApp = appStore.modules.canvas.app?.isReleasedApp;
          let versionId = currentVersionId;
          // IMPORTANT: This logic needs to be changed when we implement the module versioning
          if (moduleId !== 'canvas') {
            versionId = get().resolvedStore.modules.canvas.components[moduleId].properties.moduleVersionId;
          }
          queryExecutionPromise = dataqueryService.run(
            queryId,
            options,
            query?.options,
            versionId,
            (() => {
              // send undefined if Public/Private released app
              if (isPublicAccess || (isReleasedApp && !isPublicAccess)) {
                return undefined;
              }
              return (currentAppEnvironmentId ?? environmentId) || selectedEnvironment?.id; //TODO: currentAppEnvironmentId may no longer required. Need to check
            })(),
            modeStore.modules.canvas.currentMode
          );
        }

        queryExecutionPromise
          .then(async (data) => {
            if (data.status === 'needs_oauth') {
              localStorage.setItem('currentAppEnvironmentIdForOauth', currentAppEnvironmentId);
              const url = data.data.auth_url; // Backend generates and return sthe auth url
              fetchOAuthToken(url, dataQuery['data_source_id'] || dataQuery['dataSourceId']);
            }

            // Asynchronous query execution
            // Currently async query resolution is applicable only to workflows
            // Change this conditional to async query type check for other
            // async queries in the future
            if (query.kind === 'workflows') {
              const { error, completionPromise } = get().queryPanel.setupAsyncWorkflowHandler({
                data,
                queryId,
                processQueryResults,
                handleFailure,
                shouldSetPreviewData,
                setPreviewData,
                setResolvedQuery,
              });

              if (error) {
                resolve({ status: 'failed', message: error });
                return;
              }

              if (!error && completionPromise) {
                // This early resolution pattern is temporary - once the UI fully supports
                // tracking individual async queries through their lifecycle, we can refactor
                // this to rely on the completion promise concurrently
                const result = await completionPromise;
                resolve(result);
              }
              return;
            }

            // Handle synchronous queries (original code)

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

              errorData = query.kind === 'runpy' || query.kind === 'runjs' ? data?.data : data;
              const result = handleFailure(errorData);
              resolve(result);
              return;
            } else {
              const rawData = data.data;
              const result = await processQueryResults(data.data, rawData);
              resolve(result);
            }
          })
          .catch((e) => {
            const { error } = e;
            const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
            if (mode !== 'view') toast.error(errorMessage);
            resolve({ status: 'failed', message: errorMessage });
          });
      });
    },

    previewQuery: (query, calledFromQuery = false, userSuppliedParameters = {}, moduleId = 'canvas') => {
      const { eventsSlice, queryPanel, appStore, currentVersionId, selectedEnvironment } = get();
      const {
        queryPreviewData,
        setPreviewLoading,
        setPreviewData,
        setPreviewPanelExpanded,
        executeRunPycode,
        runTransformation,
        triggerWorkflow,
        executeMultilineJS,
        setIsPreviewQueryLoading,
      } = queryPanel;
      const queryUpdatePromise = get().dataQuery.queryUpdates[query?.id];
      if (queryUpdatePromise) {
        setPreviewLoading(true);
        setIsPreviewQueryLoading(true);
        return queryUpdatePromise.then(() =>
          get().queryPanel.previewQuery(query, calledFromQuery, userSuppliedParameters, moduleId)
        );
      }
      const { onEvent } = eventsSlice;

      let parameters = userSuppliedParameters;

      const app = appStore.modules[moduleId].app;

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
      const queryState = { ...get().getAllExposedValues(moduleId), parameters };
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
          queryExecutionPromise = triggerWorkflow(
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
            // Asynchronous query execution
            // Currently async query resolution is applicable only to workflows
            // Change this conditional to async query type check for other
            // async queries in the future
            if (query.kind === 'workflows') {
              const processQueryResultsPreview = async (result) => {
                let finalData = result;
                if (query.options.enableTransformation) {
                  finalData = await runTransformation(
                    finalData,
                    query.options.transformation,
                    query.options.transformationLanguage,
                    query,
                    'edit',
                    moduleId
                  );
                  if (finalData.status === 'failed') {
                    setPreviewLoading(false);
                    setIsPreviewQueryLoading(false);
                    if (!calledFromQuery) setPreviewData(finalData);
                    return { status: 'failed', data: finalData };
                  }
                }
                setPreviewLoading(false);
                setIsPreviewQueryLoading(false);
                if (!calledFromQuery) setPreviewData(finalData);
                return { status: 'ok', data: finalData };
              };
              const handleFailurePreview = (errorData) => {
                setPreviewLoading(false);
                setIsPreviewQueryLoading(false);
                if (!calledFromQuery) setPreviewData(errorData);
                return { status: 'failed', data: errorData };
              };

              const { error, completionPromise } = get().queryPanel.setupAsyncWorkflowHandler({
                data,
                queryId: query.id,
                processQueryResults: processQueryResultsPreview,
                handleFailure: handleFailurePreview,
                shouldSetPreviewData: true,
                setPreviewData,
                setResolvedQuery: () => {}, // No resolvedQuery for preview
                resolve,
              });

              if (!error && completionPromise) {
                try {
                  // This early resolution pattern is temporary - once the UI fully supports
                  // tracking individual async queries through their lifecycle, we can refactor
                  // this to rely on the completion promise concurrently
                  const result = await completionPromise;
                  resolve(result);
                } catch (error) {
                  toast.error('Async operation failed:', error);
                  setPreviewLoading(false);
                  setIsPreviewQueryLoading(false);
                  resolve({ status: 'failed', message: error?.message || 'Unknown error' });
                }
              }
              return;
            }

            let finalData = data.data;
            let queryStatusCode = data?.status ?? null;
            const queryStatus = query.kind === 'runpy' ? data?.data?.status ?? 'ok' : data.status;
            switch (true) {
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
                  const language = query.options.transformationLanguage;
                  finalData = await runTransformation(
                    finalData,
                    query.options.transformations?.[language] ?? query.options.transformation,
                    query.options.transformationLanguage,
                    query,
                    'edit',
                    moduleId
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

    executeRunPycode: async (code, query, isPreview, mode, currentState, _moduleId = 'canvas') => {
      const {
        queryPanel: { evaluatePythonCode },
      } = get();

      if (query.restricted) {
        return {
          status: 'failed',
          message: 'Query could not be completed',
          description: 'Response code 401 (Unauthorized)',
          data: {
            type: 'tj-401',
            responseObject: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
          metadata: {
            response: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
        };
      }

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
        const resolvedState = get().getResolvedState(moduleId);
        const queriesInCurentState = deepClone(resolvedState.queries);
        const appStateVars = deepClone(resolvedState.variables) ?? {};
        if (!isEmpty(query)) {
          const actions = generateAppActions(query.id, mode, isPreview, moduleId);

          for (const key of Object.keys(queriesInCurentState)) {
            queriesInCurentState[key] = {
              ...queriesInCurentState[key],
              run: () => {
                const query = dataQuery.queries.modules?.[moduleId].find((q) => q.name === key);
                return actions.runQuery(query.name, undefined, moduleId);
              },

              getData: () => {
                const resolvedState = get().getResolvedState(moduleId);
                return resolvedState.queries[key].data;
              },

              getRawData: () => {
                const resolvedState = get().getResolvedState(moduleId);
                return resolvedState.queries[key].rawData;
              },

              getloadingState: () => {
                const resolvedState = get().getResolvedState(moduleId);
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

    runTransformation: async (
      rawData,
      transformation,
      transformationLanguage = 'javascript',
      query,
      mode = 'edit',
      moduleId = 'canvas'
    ) => {
      const data = rawData;
      const {
        queryPanel: { runPythonTransformation, createProxy },
        getResolvedState,
      } = get();
      let result = {};
      const currentState = getResolvedState(moduleId);

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
      return await evaluatePythonCode({
        queryResult,
        code,
        query,
        mode,
        currentState,
      });
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

      const _oldSuggestions = Object.keys(queries[oldName]).map((key) => `queries.${oldName}.${key}`);
      // useResolveStore.getState().actions.removeAppSuggestions(oldSuggestions);

      // useCurrentStateStore.getState().actions.setCurrentState({
      //   ...currentState,
      //   queries: updatedQueries,
      // });
    },
    executeWorkflow: async (moduleId = 'canvas', query, workflowId, _blocking = false, params = {}, appEnvId) => {
      const { getAppId, getAllExposedValues } = get();
      const appId = getAppId('canvas');
      const currentState = getAllExposedValues(moduleId);
      const resolvedParams = get().resolveReferences(moduleId, params, currentState, {}, {});

      if (query.restricted) {
        return {
          status: 'failed',
          message: 'Query could not be completed',
          description: 'Response code 401 (Unauthorized)',
          data: {
            type: 'tj-401',
            responseObject: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
          metadata: {
            response: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
        };
      }

      try {
        const response = await workflowExecutionsService.execute(workflowId, resolvedParams, appId, appEnvId);
        return { data: response.result, status: 'ok' };
      } catch (e) {
        return { data: undefined, status: 'failed' };
      }
    },
    triggerWorkflow: async (moduleId, workflowAppId, _blocking = false, params = {}, appEnvId) => {
      const { getAllExposedValues } = get();
      const currentState = getAllExposedValues();
      const resolvedParams = get().resolveReferences(moduleId, params, currentState, {}, {});

      try {
        const executionResponse = await workflowExecutionsService.trigger(workflowAppId, resolvedParams, appEnvId);
        return { data: executionResponse.result, status: 'ok' };
      } catch (e) {
        return { data: e?.message, status: 'failed' };
      }
    },

    createProxy: (obj, path = '') => {

      return new Proxy(obj, {
        get(target, prop) {
          const fullPath = path ? `${path}.${prop}` : prop;

          if (!(prop in target)) {
            throw new Error(`ReferenceError: ${fullPath} is not defined`);
          }

          const value = target[prop];
          return value;
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

      // const currentState = getAllExposedValues();

      let result = {},
        error = null;

      //if user passes anything other than object, params are reset to empty
      if (typeof parameters !== 'object' || parameters === null) {
        parameters = {};
      }

      const actions = generateAppActions(queryId, mode, isPreview, moduleId);

      const queryDetails = dataQuery.queries.modules?.[moduleId].find((q) => q.id === queryId);

      if (queryDetails.restricted) {
        return {
          status: 'failed',
          message: 'Query could not be completed',
          description: 'Response code 401 (Unauthorized)',
          data: {
            type: 'tj-401',
            responseObject: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
          metadata: {
            response: {
              statusCode: 401,
              responseBody: 'Unauthorized Access',
            },
          },
        };
      }

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
      const resolvedState = get().getResolvedState(moduleId);
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
            return actions.runQuery(query.name, processedParams, moduleId);
          },

          getData: () => {
            const resolvedState = get().getResolvedState(moduleId);
            return resolvedState.queries[key].data;
          },

          getRawData: () => {
            const resolvedState = get().getResolvedState(moduleId);
            return resolvedState.queries[key].rawData;
          },

          getloadingState: () => {
            const resolvedState = get().getResolvedState(moduleId);
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
        const proxiedFormattedParams = createProxy(!_.isEmpty(formattedParams) ? [formattedParams] : [], 'parameters');

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
          ...(!_.isEmpty(formattedParams) ? proxiedFormattedParams : []),
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

    setupAsyncWorkflowHandler: ({
      data,
      queryId,
      processQueryResults,
      handleFailure,
      shouldSetPreviewData,
      setPreviewData,
      setResolvedQuery,
    }) => {
      try {
        const asyncHandler = get().queryPanel.createWorkflowAsyncHandler({
          executionId: data.data.executionId,
          queryId,
          processQueryResults,
          handleFailure,
          shouldSetPreviewData,
          setPreviewData,
          setResolvedQuery,
        });

        // Process initial response and start SSE monitoring
        const { __asyncCompletionPromise } = asyncHandler.processInitialResponse(data.data);

        // Add the AsyncQueryHandler instance to asyncQueryRuns
        get().queryPanel.setAsyncQueryRuns((currentRuns) => [...currentRuns, asyncHandler]);

        if (setResolvedQuery) {
          setResolvedQuery(queryId, {
            isLoading: true,
            jobId: asyncHandler.jobId,
          });
        }

        return {
          handler: asyncHandler,
          completionPromise: __asyncCompletionPromise,
        };
      } catch (error) {
        return { error };
      }
    },
    runQueryOnShortcut: () => {
      const { queryPanel } = get();
      const { runQuery, selectedQuery } = queryPanel;
      runQuery(selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true);
    },
    previewQueryOnShortcut: (moduleId = 'canvas') => {
      const { queryPanel } = get();
      const { previewQuery, selectedQuery, selectedDataSource } = queryPanel;
      const query = {
        data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
        pluginId: selectedDataSource.pluginId,
        options: { ...selectedQuery?.options },
        kind: selectedDataSource.kind,
        name: selectedQuery?.name ?? '',
        id: selectedQuery?.id,
      };
      previewQuery(query, false, undefined, moduleId);
    },
    toggleQueryPermissionModal: (show) => {
      set((state) => {
        state.queryPanel.showQueryPermissionModal = show;
      });
    },
    toggleQueryHandlerMenu: (show, id) => {
      set((state) => {
        if (show) state.queryPanel.targetBtnForMenu = id;
        state.queryPanel.showQueryHandlerMenu = show;
      });
    },
    setRenamingQuery: (queryId) =>
      set((state) => {
        state.queryPanel.renamingQueryId = queryId;
      }),
    deleteDataQuery: (queryId) =>
      set((state) => {
        state.queryPanel.deletingQueryId = queryId;
      }),
    expandQueryPaneIfNeeded: () => {
      const queryManagerPreferences = JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {
        isExpanded: true,
        queryPanelHeight: 100,
      };

      // If query pane is not expanded, expand it
      if (!queryManagerPreferences.isExpanded) {
        const newPreferences = {
          ...queryManagerPreferences,
          isExpanded: true,
          queryPanelHeight: 70, // Default expanded height
        };
        localStorage.setItem('queryManagerPreferences', JSON.stringify(newPreferences));

        // Update the store state
        set((state) => {
          state.queryPanel.isQueryPaneExpanded = true;
        });

        return true; // Indicates that expansion was needed and performed
      }

      return false; // Indicates that expansion was not needed
    },
  },
});
