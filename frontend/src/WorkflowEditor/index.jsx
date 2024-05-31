import React, { useReducer, useEffect, useMemo, useCallback } from 'react';
import {
  appsService,
  datasourceService,
  globalDatasourceService,
  appVersionService,
  workflowExecutionsService,
  dataqueryService,
  appEnvironmentService,
} from '@/_services';
import { reducer, initialState, Modes, ServerDataStates } from './reducer/reducer';
import FlowBuilder from './FlowBuilder';
// eslint-disable-next-line import/no-unresolved
import { ReactFlowProvider } from 'reactflow';
import { EditorContextWrapper } from '@/Editor/Context/EditorContextWrapper';
import generateActions from './actions';
import WorkflowEditorContext from './context';
import _, { debounce, find, merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { generateQueryName } from './utils';
import { withRouter } from '@/_hoc/withRouter';
import LeftSideBar from './LeftSidebar';
import { toast } from 'react-hot-toast';

import './style.scss';
import Header from './Header';
import LogsPanel from './LogsPanel';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';

// Wherever this file uses the term 'app', it means 'workflow'
function WorkflowEditor(props) {
  const { versionId: appVersionId } = props.params;
  const { id: appId } = props;

  const [editorSession, dispatch] = useReducer(reducer, initialState({ appId, appVersionId }));

  const editorSessionActions = generateActions(dispatch);

  const fetchEnvironments = () => {
    const appId = editorSession?.app?.id;
    appEnvironmentService.getAllEnvironments(appId).then((data) => {
      const envArray = data?.environments;
      editorSessionActions.setEnvironments(envArray);
    });
  };

  const fetchExecutionHistory = (versionId) => {
    editorSessionActions.setExecutionHistoryLoadingStatus(ServerDataStates.Fetching);
    workflowExecutionsService.all(versionId).then((executions) => {
      editorSessionActions.setExecutionHistoryLoadingStatus(ServerDataStates.Fetched);
      editorSessionActions.setExecutionHistory(executions);
    });
  };

  // This useEffect fetches the app, and then the corresponding datasources
  useEffect(() => {
    appsService
      .getApp(editorSession.app.id)
      .then((appData) => {
        const versionId = appData.editing_version.id;
        const organizationId = appData.organization_id;
        const name = appData.name;
        const isMaintenanceOn = appData.is_maintenance_on;
        const workflowEnabled = appData.workflow_enabled;
        const workflowToken = appData.workflow_api_token;
        // TODO: could we map all app data setup in action/reducer?
        editorSessionActions.setAppVersionId(versionId);
        editorSessionActions.setAppName(name);
        editorSessionActions.setMaintenanceStatus(isMaintenanceOn);
        editorSessionActions.toggleWebhookEnable(workflowEnabled);
        editorSessionActions.setWorkflowApiToken(workflowToken);
        fetchAndSetWindowTitle({ page: pageTitles.WORKFLOW_EDITOR, appName: `${name}` });

        if (appData.definition) {
          const bodyParameters = appData.definition?.webhookParams;
          editorSessionActions.updateFlow({ edges: appData.definition?.edges, nodes: appData.definition?.nodes });
          editorSessionActions.getParameterValue(bodyParameters);
          // editorSessionActions.setQueries(appData.definition.queries);
        }
        return { definition: appData.definition, queriesData: appData.data_queries, versionId, organizationId };
      })
      .then(({ definition, queriesData, versionId, organizationId }) => {
        globalDatasourceService.getAll(organizationId, versionId).then((dataSourceData) => {
          editorSessionActions.setDataSources(dataSourceData.data_sources);
        });
        return { definition, queriesData, versionId };
      })
      .then(({ definition, queriesData, versionId }) => {
        const queries = queriesData.map((query) => ({
          ...query,
          idOnDefinition: find(definition?.queries, { id: query.id })?.idOnDefinition,
        }));
        editorSessionActions.setQueries(queries);
        editorSessionActions.setBootupComplete(true);
        return { versionId };
      })
      .then(({ versionId }) => {
        fetchExecutionHistory(versionId);
      });

    fetchEnvironments();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAppName = async (name) => {
    if (!name.trim()) {
      toast("Workflow name can't be empty or whitespace", {
        icon: '🚨',
      });
      return;
    }
    await appsService
      .saveApp(appId, { name })
      .then(() => {
        editorSessionActions.setAppName(name);
        fetchAndSetWindowTitle({ page: pageTitles.WORKFLOW_EDITOR, appName: `${name}` });
      })
      .catch(() => {
        toast('Something went wrong while editing workflow name', {
          icon: '🚨',
        });
      });
  };

  const save = async (editorSession, editorSessionActions) => {
    editorSessionActions.setAppSavingStatus(true);
    await appVersionService.save(editorSession.app.id, editorSession.app.versionId, {
      definition: {
        ...editorSession.app.flow,
        queries: editorSession.queries.map((query) => ({ idOnDefinition: query.idOnDefinition, id: query.id })),
        webhookParams: [...editorSession.parameters],
      },
    });
    editorSessionActions.setAppSavingStatus(false);
  };

  const debouncedSave = useMemo(() => debounce(save, 2000, { leading: true }), []);

  useEffect(() => {
    editorSession.bootupComplete && debouncedSave(editorSession, editorSessionActions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify({
      nodeData: editorSession?.app?.flow?.nodes?.map((node) => [node?.data, node?.position]),
      edgeData: editorSession?.app?.flow?.edges?.map((edge) => [edge?.source, edge?.target]),
      queries: editorSession.queries,
      webhookParams: editorSession.parameters,
    }),
  ]);

  const updateQuery = (idOnDefinition, queryChanges) => {
    const query = find(editorSession.queries, { idOnDefinition });

    editorSessionActions.updateQuery(idOnDefinition, { ...queryChanges });
    editorSessionActions.setAppSavingStatus(true);
    dataqueryService
      .update(
        query.id,
        queryChanges.name ?? query.name,
        merge(query.options, queryChanges.options),
        queryChanges.data_source_id === 'null' ? null : queryChanges.data_source_id // handle for static init state
      )
      .then(() => editorSessionActions.setAppSavingStatus(false));
  };

  const fillDoubleQuotes =
    editorSession?.testParameters && editorSession?.testParameters.length > 0
      ? editorSession.testParameters.replace(/'/g, '"')
      : null;

  const executeWorkflow = async () => {
    editorSessionActions.clearLogsConsole();
    editorSessionActions.setMode(Modes.Running);
    await save(editorSession, editorSessionActions);
    editorSessionActions.displayLogsConsole(true);

    try {
      const { workflowExecution: execution, _result } = await workflowExecutionsService.create(
        editorSession.app.versionId,
        JSON.parse(fillDoubleQuotes)
      );

      editorSessionActions.setExecutionId(execution.id);
      const intervalHandle = setInterval(async () => {
        const { status, nodes, logs } = await workflowExecutionsService.getStatus(execution.id);
        editorSessionActions.updateExecutionStatus(nodes);
        editorSessionActions.setExecutionLogs(logs);

        if (status) {
          clearInterval(intervalHandle);
          editorSessionActions.setMode(Modes.Editing);
          fetchExecutionHistory(editorSession.app.versionId);
        }
      }, 100);
    } catch (error) {
      editorSessionActions.setMode(Modes.Editing);
      editorSessionActions.setExecutionId(null);
      editorSessionActions.setExecutionLogs([
        {
          error: error.error,
        },
      ]);
    }
  };

  const addQuery = (
    kind = 'runjs',
    options = {},
    dataSourceId = undefined,
    pluginId = undefined,
    isStaticDataSource = false
  ) => {
    const idOnDefinition = uuidv4();
    const type = isStaticDataSource ? 'static' : 'default';
    const name = generateQueryName(kind, editorSession.queries);
    editorSessionActions.addQuery(
      { idOnDefinition, kind, options, dataSourceId, pluginId, type },
      isStaticDataSource,
      editorSession
    );

    dataqueryService
      .create(editorSession.app.id, editorSession.app.versionId, name, kind, options, dataSourceId, pluginId)
      .then((query) => {
        editorSessionActions.updateQuery(idOnDefinition, query);
      });

    return idOnDefinition;
  };

  const updateFlow = useCallback((flow) => dispatch({ type: 'UPDATE_FLOW', payload: { flow } }), [dispatch]);

  return !editorSession.bootupComplete ? (
    <div>loading</div>
  ) : (
    <div className="workflow-editor">
      <Header
        executeWorkflow={executeWorkflow}
        editorSession={editorSession}
        updateFlow={updateFlow}
        editorSessionActions={editorSessionActions}
        reloadQueries={() => {}}
        saveAppName={saveAppName}
      />

      <div className="body">
        <EditorContextWrapper>
          <div className="left-sidebar-column">
            <LeftSideBar editorSession={editorSession} editorSessionActions={editorSessionActions} />
          </div>
          <div className="flow-editor-column">
            <ReactFlowProvider>
              <WorkflowEditorContext.Provider
                value={{ editorSession, editorSessionActions, addQuery, updateQuery, save }}
              >
                <FlowBuilder
                  flow={editorSession.app.flow}
                  updateFlow={updateFlow}
                  addNode={(node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node } })}
                  addEdge={(edge) => dispatch({ type: 'ADD_NEW_EDGE', payload: { edge } })}
                  setEditingActivity={(editingActivity) =>
                    dispatch({ type: 'SET_FLOW_BUILDER_EDITING_ACTIVITY', payload: { editingActivity } })
                  }
                  editingActivity={editorSession.editingActivity}
                  executeWorkflow={executeWorkflow}
                  debouncedSave={debouncedSave}
                />
              </WorkflowEditorContext.Provider>
            </ReactFlowProvider>
          </div>
        </EditorContextWrapper>
      </div>
      {/* <LogsPanel editorSession={editorSession} editorSessionActions={editorSessionActions} /> */}
    </div>
  );
}

export default withRouter(WorkflowEditor);
