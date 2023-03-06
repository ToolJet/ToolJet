import React, { useReducer, useEffect, useMemo } from 'react';
import { appService, datasourceService, appVersionService, workflowExecutionsService } from '@/_services';
import { LeftSidebar } from './LeftSidebar';
import { reducer, initialState } from './reducer/reducer';
import FlowBuilder from './FlowBuilder';
import { ReactFlowProvider } from 'reactflow';
import { EditorContextWrapper } from '@/Editor/Context/EditorContextWrapper';
import generateActions from './actions';
import WorkflowEditorContext from './context';
import { debounce, find, merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { generateQueryName } from './utils';

import './style.scss';
import { dataqueryService } from '../_services/dataquery.service';

// Wherever this file uses the term 'app', it means 'workflow'
export default function WorkflowEditor(props) {
  const { id: appId, versionId: appVersionId } = props.match.params;

  const [editorSession, dispatch] = useReducer(reducer, initialState({ appId, appVersionId }));

  const editorSessionActions = generateActions(dispatch);

  // This useEffect fetches the app, and then the corresponding datasources
  useEffect(() => {
    appService
      .getApp(editorSession.app.id)
      .then((appData) => {
        const versionId = appData.editing_version.id;
        editorSessionActions.setAppVersionId(versionId);
        if (appData.definition) {
          editorSessionActions.updateFlow({ edges: appData.definition.edges, nodes: appData.definition.nodes });
          // editorSessionActions.setQueries(appData.definition.queries);
        }
        console.log({ appData });
        return { definition: appData.definition, queriesData: appData.data_queries, versionId };
      })
      .then(({ definition, queriesData, versionId }) => {
        datasourceService.getAll(versionId).then((dataSourceData) => {
          editorSessionActions.setDataSources(dataSourceData.data_sources);
        });
        return { definition, queriesData, versionId };
      })
      .then(({ definition, queriesData }) => {
        console.log({ definition, queriesData });
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
    console.log({ savingSession: editorSession });
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
  }, [JSON.stringify({ flow: editorSession.app.flow, queries: editorSession.queries })]);

  const updateQuery = (idOnDefinition, queryChanges) => {
    const query = find(editorSession.queries, { idOnDefinition });

    const newDataSource = find(editorSession.dataSources, { id: queryChanges.dataSourceId });

    const name =
      queryChanges.dataSourceId === query.data_source_id || !newDataSource
        ? query.name
        : generateQueryName(newDataSource.kind, editorSession.queries);

    console.log({ name, queryChanges, query });

    editorSessionActions.updateQuery(idOnDefinition, { ...queryChanges, name });
    editorSessionActions.setAppSavingStatus(true);
    dataqueryService
      .update(query.id, name, merge(query.options, queryChanges.options), queryChanges.dataSourceId)
      .then(() => editorSessionActions.setAppSavingStatus(false));
  };

  const executeWorkflow = () => {
    workflowExecutionsService.create(editorSession.app.versionId).then((workflowExecution) => {
      console.log({ workflowExecution });
    });
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
        <p>{editorSession.appSavingStatus.status ? 'Saving..' : 'All changes saved'}</p>
        <p>
          <button onClick={executeWorkflow}>Run</button>
        </p>
      </div>
      <div className="body">
        <div className="left-sidebar-column">
          <LeftSidebar
            appId={editorSession.app.id}
            appVersionsId={editorSession.app.versionId}
            queryPanelHeight={200}
            dataSources={editorSession.dataSources}
            dataSourcesChanged={() => {
              datasourceService.getAll(editorSession.app.versionId).then((dataSourceData) => {
                editorSessionActions.setDataSources(dataSourceData.data_sources);
              });
            }}
          ></LeftSidebar>
        </div>
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
