import React, { useReducer, useEffect, useMemo } from 'react';
import {
  appService,
  datasourceService,
  globalDatasourceService,
  appVersionService,
  workflowExecutionsService,
} from '@/_services';
import { reducer, initialState, Modes } from './reducer/reducer';
import FlowBuilder from './FlowBuilder';
import { ReactFlowProvider } from 'reactflow';
import { EditorContextWrapper } from '@/Editor/Context/EditorContextWrapper';
import generateActions from './actions';
import WorkflowEditorContext from './context';
import { debounce, find, merge, every, map } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { generateQueryName } from './utils';
import { Link } from 'react-router-dom';
import AppLogo from '@/_components/AppLogo';
import { withRouter } from '@/_hoc/withRouter';

import './style.scss';
import { dataqueryService } from '../_services/dataquery.service';

// Wherever this file uses the term 'app', it means 'workflow'
function WorkflowEditor(props) {
  const { id: appId, versionId: appVersionId } = props.params;

  const [editorSession, dispatch] = useReducer(reducer, initialState({ appId, appVersionId }));

  const editorSessionActions = generateActions(dispatch);

  // This useEffect fetches the app, and then the corresponding datasources
  useEffect(() => {
    appService
      .getApp(editorSession.app.id)
      .then((appData) => {
        const versionId = appData.editing_version.id;
        const organizationId = appData.organizationId;
        editorSessionActions.setAppVersionId(versionId);
        if (appData.definition) {
          editorSessionActions.updateFlow({ edges: appData.definition.edges, nodes: appData.definition.nodes });
          // editorSessionActions.setQueries(appData.definition.queries);
        }
        return { definition: appData.definition, queriesData: appData.data_queries, versionId, organizationId };
      })
      .then(({ definition, queriesData, versionId, organizationId }) => {
        datasourceService.getAll(versionId, true).then((dataSourceData) => {
          editorSessionActions.setDataSources(dataSourceData.data_sources);
        });
        return { definition, queriesData, versionId, organizationId };
      })
      .then(({ definition, queriesData, versionId, organizationId }) => {
        globalDatasourceService.getAll(organizationId, true).then((dataSourceData) => {
          editorSessionActions.setDataSources(dataSourceData.data_sources);
        });
        return { definition, queriesData, versionId };
      })
      .then(({ definition, queriesData }) => {
        const queries = queriesData.map((query) => ({
          ...query,
          idOnDefinition: find(definition.queries, { id: query.id }).idOnDefinition,
        }));
        editorSessionActions.setQueries(queries);
        editorSessionActions.setBootupComplete(true);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (editorSession, editorSessionActions) => {
    editorSessionActions.setAppSavingStatus(true);
    appVersionService
      .save(editorSession.app.id, editorSession.app.versionId, {
        definition: {
          ...editorSession.app.flow,
          queries: editorSession.queries.map((query) => ({ idOnDefinition: query.idOnDefinition, id: query.id })),
        },
      })
      .then(() => {
        editorSessionActions.setAppSavingStatus(false);
      });
  };

  const debouncedSave = useMemo(() => debounce(save, 2000, { leading: true }), []);

  useEffect(() => {
    editorSession.bootupComplete && debouncedSave(editorSession, editorSessionActions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify({
      nodeData: editorSession.app.flow.nodes.map((node) => [node.data, node.position]),
      edgeData: editorSession.app.flow.edges.map((edge) => [edge.source, edge.target]),
      queries: editorSession.queries,
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
        queryChanges.dataSourceId
      )
      .then(() => editorSessionActions.setAppSavingStatus(false));
  };

  const executeWorkflow = async () => {
    const execution = await workflowExecutionsService.create(editorSession.app.versionId);
    editorSessionActions.setMode(Modes.Running);
    editorSessionActions.setExecutionId(execution.id);
    const intervalHandle = setInterval(async () => {
      const nodes = await workflowExecutionsService.getStatus(execution.id);
      editorSessionActions.updateExecutionStatus(nodes);
      console.log({ nodes });
      if (every(map(nodes, 'executed'))) {
        clearInterval(intervalHandle);
        editorSessionActions.setMode(Modes.Editing);
      }
    }, 100);
  };

  const addQuery = (kind = 'runjs', options = {}, dataSourceId = undefined, pluginId = undefined) => {
    const idOnDefinition = uuidv4();
    const name = generateQueryName(kind, editorSession.queries);
    editorSessionActions.addQuery({ idOnDefinition, kind, options, dataSourceId, pluginId });

    dataqueryService
      .create(editorSession.app.id, editorSession.app.versionId, name, kind, options, dataSourceId, pluginId)
      .then((query) => {
        console.log('updating query', query);
        editorSessionActions.updateQuery(idOnDefinition, query);
      });

    return idOnDefinition;
  };

  console.log({ editorSession });

  return !editorSession.bootupComplete ? (
    <div>loading</div>
  ) : (
    <div className="workflow-editor">
      <div className="header">
        <div className="grid">
          <div className="row" style={{ height: '40px' }}>
            <div className="col-4 d-flex flex-columns align-items-center">
              <div className="logo-section">
                <Link to="/">
                  <AppLogo isLoadingFromHeader={true} />
                </Link>
              </div>
              <button
                onClick={executeWorkflow}
                type="button"
                className="btn btn-primary"
                style={{ height: '30px', marginRight: 6 }}
                disabled={editorSession.mode === Modes.Running}
              >
                {editorSession.mode === Modes.Running ? 'Running' : 'Run'}
              </button>
              {editorSession.appSavingStatus.status ? 'Saving..' : 'All changes saved'}
            </div>
          </div>
        </div>
      </div>
      <div className="body">
        <EditorContextWrapper>
          <div className="flow-editor-column">
            <ReactFlowProvider>
              <WorkflowEditorContext.Provider value={{ editorSession, editorSessionActions, addQuery, updateQuery }}>
                <FlowBuilder
                  flow={editorSession.app.flow}
                  updateFlow={(flow) => dispatch({ type: 'UPDATE_FLOW', payload: { flow } })}
                  addNode={(node) => dispatch({ type: 'ADD_NEW_NODE', payload: { node } })}
                  addEdge={(edge) => dispatch({ type: 'ADD_NEW_EDGE', payload: { edge } })}
                  setEditingActivity={(editingActivity) =>
                    dispatch({ type: 'SET_FLOW_BUILDER_EDITING_ACTIVITY', payload: { editingActivity } })
                  }
                  editingActivity={editorSession.editingActivity}
                />
              </WorkflowEditorContext.Provider>
            </ReactFlowProvider>
          </div>
        </EditorContextWrapper>
      </div>
    </div>
  );
}

export default withRouter(WorkflowEditor);
